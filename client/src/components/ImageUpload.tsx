import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  FileImage, 
  AlertCircle,
  Eye,
  Download,
  Trash2
} from 'lucide-react';
import { imageService, compressImage } from '@/lib/appwrite';
import { TransactionImage } from '@/lib/firebaseTypes';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  images: TransactionImage[];
  onImagesChange: (images: TransactionImage[]) => void;
  maxImages?: number;
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({ 
  images, 
  onImagesChange, 
  maxImages = 10, 
  disabled = false,
  className = ""
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    console.log('📁 Files selected:', fileArray.length, fileArray.map(f => f.name));

    // Check if adding these files would exceed the limit
    if (images.length + fileArray.length > maxImages) {
      toast({
        title: "Too many images",
        description: `Maximum ${maxImages} images allowed. You can add ${maxImages - images.length} more.`,
        variant: "destructive"
      });
      return;
    }

    // Validate files
    const validation = imageService.validateImageFiles(fileArray);
    if (!validation.valid) {
      console.error('❌ File validation failed:', validation.errors);
      toast({
        title: "Invalid files",
        description: validation.errors.join('\n'),
        variant: "destructive"
      });
      return;
    }

    console.log('✅ Files validated successfully');
    setUploading(true);
    setUploadProgress(0);

    try {
      console.log('🔄 Starting image compression...');
      // Compress images before upload
      const compressedFiles = await Promise.all(
        fileArray.map(file => compressImage(file, 1200, 0.8))
      );
      console.log('✅ Images compressed successfully');

      console.log('☁️ Starting upload to Appwrite...');
      // Upload images
      const uploadedImages = await imageService.uploadImages(compressedFiles);
      console.log('✅ Images uploaded to Appwrite:', uploadedImages);

      // Update progress
      setUploadProgress(100);

      // Add to existing images
      onImagesChange([...images, ...uploadedImages]);

      toast({
        title: "Images uploaded",
        description: `Successfully uploaded ${uploadedImages.length} image(s)`,
      });
    } catch (error) {
      console.error('❌ Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload images",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async (imageId: string) => {
    try {
      // Remove from Appwrite storage
      await imageService.deleteImage(imageId);
      
      // Remove from local state
      onImagesChange(images.filter(img => img.id !== imageId));
      
      toast({
        title: "Image removed",
        description: "Image has been deleted successfully",
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete image",
        variant: "destructive"
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragOver ? 'border-primary bg-primary/5' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary hover:bg-gray-50'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled}
        />
        
        {uploading ? (
          <div className="space-y-3">
            <div className="animate-spin mx-auto">
              <Upload size={32} className="text-primary" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Uploading images...</p>
              <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <ImageIcon size={24} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, WebP up to 10MB each (max {maxImages} images)
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <Upload size={16} className="mr-2" />
              Choose Files
            </Button>
          </div>
        )}
      </div>

      {/* Image Counter */}
      {images.length > 0 && (
        <div className="flex items-center justify-between">
          <Badge variant="outline">
            {images.length} / {maxImages} images
          </Badge>
          <p className="text-xs text-gray-500">
            Total size: {formatFileSize(images.reduce((sum, img) => sum + img.size, 0))}
          </p>
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <ImagePreview
              key={image.id}
              image={image}
              onRemove={() => handleRemoveImage(image.id)}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Image Preview Component
interface ImagePreviewProps {
  image: TransactionImage;
  onRemove: () => void;
  disabled?: boolean;
}

function ImagePreview({ image, onRemove, disabled = false }: ImagePreviewProps) {
  const [imageError, setImageError] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  const previewUrl = imageService.getImagePreview(image.id, 200, 200);

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative group">
            {/* Image */}
            <div className="aspect-square bg-gray-100 flex items-center justify-center">
              {imageError ? (
                <div className="text-center p-4">
                  <AlertCircle size={24} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Failed to load</p>
                </div>
              ) : (
                <img
                  src={previewUrl}
                  alt={image.name}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              )}
            </div>

            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowFullImage(true)}
                  className="h-8 w-8 p-0"
                >
                  <Eye size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => window.open(image.url, '_blank')}
                  className="h-8 w-8 p-0"
                >
                  <Download size={14} />
                </Button>
                {!disabled && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={onRemove}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Image info */}
          <div className="p-3">
            <p className="text-xs font-medium truncate" title={image.name}>
              {image.name}
            </p>
            <p className="text-xs text-gray-500">
              {(image.size / 1024).toFixed(1)} KB
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Full Image Modal */}
      {showFullImage && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
          onClick={() => setShowFullImage(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={image.url}
              alt={image.name}
              className="max-w-full max-h-full object-contain"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFullImage(false)}
              className="absolute top-4 right-4"
            >
              <X size={16} />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
