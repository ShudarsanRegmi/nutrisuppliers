const { Client, Storage, ID } = require('node-appwrite');
const admin = require('firebase-admin');
const { Readable } = require('stream');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

// Initialize Appwrite Client
const client = new Client();
client
  .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const storage = new Storage(client);

/**
 * Upload Image Function
 * Verifies Firebase token and uploads image to Appwrite storage
 */
module.exports = async ({ req, res, log, error }) => {
  try {
    log('🔄 Upload image function started');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
      return res.text('', 200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-File-Name, X-File-Type, X-File-Size',
        'Access-Control-Max-Age': '86400'
      });
    }

    // Check if it's a POST request
    if (req.method !== 'POST') {
      return res.json({ 
        success: false, 
        error: 'Method not allowed. Use POST.' 
      }, 405, {
        'Access-Control-Allow-Origin': '*'
      });
    }

    // Get Firebase token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.json({ 
        success: false, 
        error: 'Missing or invalid Authorization header' 
      }, 401, {
        'Access-Control-Allow-Origin': '*'
      });
    }

    const firebaseToken = authHeader.substring(7);
    log('🔑 Firebase token received');

    // Verify Firebase token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(firebaseToken);
      log('✅ Firebase token verified for user:', decodedToken.uid);
    } catch (tokenError) {
      error('❌ Firebase token verification failed:', tokenError);
      return res.json({ 
        success: false, 
        error: 'Invalid Firebase token' 
      }, 401, {
        'Access-Control-Allow-Origin': '*'
      });
    }

    // Get file from request
    const fileBuffer = req.bodyBinary;
    if (!fileBuffer || fileBuffer.length === 0) {
      return res.json({ 
        success: false, 
        error: 'No file provided' 
      }, 400, {
        'Access-Control-Allow-Origin': '*'
      });
    }

    // Get file metadata from headers
    const fileName = req.headers['x-file-name'] || 'uploaded-image';
    const fileType = req.headers['x-file-type'] || 'image/jpeg';
    const fileSize = parseInt(req.headers['x-file-size']) || fileBuffer.length;

    log('📁 File details:', { fileName, fileType, fileSize, bufferLength: fileBuffer.length });

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(fileType)) {
      return res.json({ 
        success: false, 
        error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' 
      }, 400, {
        'Access-Control-Allow-Origin': '*'
      });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (fileSize > maxSize) {
      return res.json({ 
        success: false, 
        error: 'File too large. Maximum size is 10MB.' 
      }, 400, {
        'Access-Control-Allow-Origin': '*'
      });
    }

    // Generate unique file ID with user prefix
    const fileId = `${decodedToken.uid}_${ID.unique()}`;
    const bucketId = process.env.APPWRITE_BUCKET_ID;

    log('☁️ Uploading to Appwrite storage...');

    try {
      // Create a readable stream from the buffer
      const fileStream = Readable.from(fileBuffer);
      
      // Set required properties for Appwrite SDK
      fileStream.size = fileSize;
      fileStream.type = fileType;
      fileStream.name = fileName;

      // Upload file to Appwrite storage
      const uploadedFile = await storage.createFile(
        bucketId,
        fileId,
        fileStream,
        [
          `read("user:${decodedToken.uid}")`,
          `delete("user:${decodedToken.uid}")`
        ]
      );

      log('✅ File uploaded successfully:', uploadedFile.$id);

      // Get file URLs
      const downloadUrl = storage.getFileDownload(bucketId, uploadedFile.$id);
      const previewUrl = storage.getFilePreview(bucketId, uploadedFile.$id, 400, 300);

      // Return success response
      const response = {
        success: true,
        data: {
          id: uploadedFile.$id,
          url: downloadUrl.toString(),
          previewUrl: previewUrl.toString(),
          name: fileName,
          size: fileSize,
          type: fileType,
          uploadedAt: new Date().toISOString(),
          userId: decodedToken.uid
        }
      };

      log('📦 Returning response:', response);
      return res.json(response, 200, {
        'Access-Control-Allow-Origin': '*'
      });

    } catch (uploadError) {
      error('❌ Upload error:', uploadError);
      return res.json({ 
        success: false, 
        error: 'Failed to upload file: ' + uploadError.message 
      }, 500, {
        'Access-Control-Allow-Origin': '*'
      });
    }

  } catch (err) {
    error('❌ Function error:', err);
    return res.json({ 
      success: false, 
      error: 'Internal server error: ' + err.message 
    }, 500, {
      'Access-Control-Allow-Origin': '*'
    });
  }
};
