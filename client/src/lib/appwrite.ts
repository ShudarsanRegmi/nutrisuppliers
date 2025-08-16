import { Client, Functions, AppwriteException, ExecutionMethod } from 'appwrite';
import { auth } from './firebase';

// Appwrite configuration
const APPWRITE_ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '68a03ad10030ac53cb92';
const APPWRITE_UPLOAD_FUNCTION_ID = 'uploadimagefunc';
const APPWRITE_DELETE_FUNCTION_ID = 'deleteimagefunc';

// Initialize Appwrite Client
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

const functions = new Functions(client);

// Image upload utilities
export interface UploadedImage {
  id: string;
  url: string;
  previewUrl?: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

// Get Firebase auth token
async function getFirebaseToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return await user.getIdToken();
}

// Helper to convert file to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

// Helper for image compression
export function compressImage(file: File, maxWidth: number, quality: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return reject(new Error('Failed to get canvas context'));
      }

      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxWidth) {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return reject(new Error('Canvas to Blob conversion failed'));
          }
          const newFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });
          resolve(newFile);
        },
        file.type,
        quality
      );
    };
    img.onerror = (error) => {
      reject(error);
    };
  });
}

export class AppwriteImageService {
  // Validate image files
  validateImageFiles(files: File[]): { valid: boolean; errors: string[] } {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const errors: string[] = [];

    files.forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`Invalid file type for ${file.name}. Only JPEG, PNG, WebP, and GIF are allowed.`);
      }
      if (file.size > maxSize) {
        errors.push(`File ${file.name} is too large. Maximum size is 10MB.`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
  
  // Upload a single image by calling an Appwrite Function
  async uploadImage(file: File): Promise<UploadedImage> {
    try {
      console.log('🔄 Uploading image via Appwrite Function:', {
        name: file.name,
        size: file.size,
        type: file.type,
      });

      // Get Firebase auth token for user identification
      const firebaseToken = await getFirebaseToken();
      const base64File = await fileToBase64(file);

            // Execute the Appwrite function
      const execution = await functions.createExecution(
        APPWRITE_UPLOAD_FUNCTION_ID,
        JSON.stringify({
          file: base64File,
          name: file.name,
          type: file.type,
        }),
        false, // Not async
        {
          Authorization: `Bearer ${firebaseToken}`,
          'Content-Type': 'application/json',
        }
      );

      if (execution.status === 'failed') {
        throw new Error(execution.responseBody);
      }

      const response = JSON.parse(execution.responseBody);

      if (!response.success) {
        throw new Error(response.error || 'Function execution failed');
      }

      // The function returns the details of the uploaded image
      const uploadedImage: UploadedImage = {
        id: response.data.id,
        url: response.data.url,
        previewUrl: response.data.previewUrl,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date(),
      };

      console.log('✅ Image uploaded successfully via function:', uploadedImage);
      return uploadedImage;
    } catch (error) {
      console.error('❌ Error uploading image via function:', error);
      if (error instanceof AppwriteException) {
        throw new Error(`Failed to upload image: ${error.message}`);
      }
      throw new Error(
        `Failed to upload image: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  // Upload multiple images
  async uploadImages(files: File[]): Promise<UploadedImage[]> {
    try {
      console.log(`🔄 Uploading ${files.length} images via Appwrite Functions...`);

      const uploadPromises = files.map((file) => this.uploadImage(file));
      const results = await Promise.allSettled(uploadPromises);

      const successful: UploadedImage[] = [];
      const failed: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successful.push(result.value);
        } else {
          failed.push(`${files[index].name}: ${result.reason.message}`);
        }
      });

      if (failed.length > 0) {
        console.warn('Some images failed to upload:', failed);
      }

      console.log(`✅ Successfully uploaded ${successful.length} out of ${files.length} images`);
      return successful;
    } catch (error) {
      console.error('❌ Error uploading images:', error);
      throw new Error(`Failed to upload images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Delete an image by calling an Appwrite Function
  async deleteImage(imageId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting image via Appwrite Function:', imageId);

      const firebaseToken = await getFirebaseToken();

      const execution = await functions.createExecution(
        APPWRITE_DELETE_FUNCTION_ID,
        JSON.stringify({ imageId }),
        false,
        {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${firebaseToken}`,
        }
      );

      if (execution.status === 'failed') {
        throw new Error(execution.responseBody);
      }

      const response = JSON.parse(execution.responseBody);

      if (!response.success) {
        throw new Error(response.error || 'Function execution failed');
      }

      console.log('✅ Image deleted successfully via function.');
    } catch (error) {
      console.error('❌ Error deleting image via function:', error);
      if (error instanceof AppwriteException) {
        throw new Error(`Failed to delete image: ${error.message}`);
      }
      throw new Error(
        `Failed to delete image: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }
}

// Create default instance
export const imageService = new AppwriteImageService();

// Configuration helper (kept for backward compatibility)
export function configureAppwrite(_endpoint?: string, _projectId?: string) {
  // Configuration is now handled via environment variables in functions
  return new AppwriteImageService();
}
