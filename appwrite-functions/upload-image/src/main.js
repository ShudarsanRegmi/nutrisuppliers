const { Client, Storage, ID } = require('node-appwrite');
const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to set this up with your service account)
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
  .setKey(process.env.APPWRITE_API_KEY); // Server API key

const storage = new Storage(client);

/**
 * Upload Image Function
 * Verifies Firebase token and uploads image to Appwrite storage
 */
module.exports = async ({ req, res, log, error }) => {
  try {
    log('🔄 Upload image function started');

    if (req.method !== 'POST') {
      return res.json({ success: false, error: 'Method not allowed.' }, 405);
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.json({ success: false, error: 'Missing or invalid Authorization header' }, 401);
    }
    const firebaseToken = authHeader.substring(7);

    const { file: base64File, name: fileName, type: fileMime } = req.bodyJson;
    if (!base64File || !fileName || !fileMime) {
      return res.json({ success: false, error: 'Invalid request body. Required fields: file, name, type.' }, 400);
    }

    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    const uid = decodedToken.uid;
    log(`✅ Firebase user verified: ${uid}`);

    const buffer = Buffer.from(base64File.split(',')[1], 'base64');

    const userPrefix = uid.substring(0, 8);
    const uniqueSuffix = ID.unique().substring(0, 6);
    const fileId = `${userPrefix}_${uniqueSuffix}`;

    const { InputFile } = require('node-appwrite');
    const uploadedFile = await storage.createFile(
      process.env.APPWRITE_BUCKET_ID,
      fileId,
      InputFile.fromBuffer(buffer, fileName, fileMime),
      [`read("user:${uid}")`, `delete("user:${uid}")`]
    );

    const downloadUrl = `https://fra.cloud.appwrite.io/v1/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${uploadedFile.$id}/view?project=${process.env.APPWRITE_FUNCTION_PROJECT_ID}`;
    const previewUrl = `https://fra.cloud.appwrite.io/v1/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${uploadedFile.$id}/preview?project=${process.env.APPWRITE_FUNCTION_PROJECT_ID}`;

    return res.json({
      success: true,
      data: {
        id: uploadedFile.$id,
        url: downloadUrl,
        previewUrl: previewUrl,
      },
    });
  } catch (e) {
    error('❌ Error in upload function:', e);
    return res.json({ success: false, error: e.message || 'An unknown error occurred' }, 500);
  }
};

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
      }, 401);
    }

    // Get file from request
    const file = req.bodyBinary;
    if (!file) {
      return res.json({ 
        success: false, 
        error: 'No file provided' 
      }, 400);
    }

    // Get file metadata from headers
    const fileName = req.headers['x-file-name'] || 'uploaded-image';
    const fileType = req.headers['x-file-type'] || 'image/jpeg';
    const fileSize = parseInt(req.headers['x-file-size'] || '0');

    log('📁 File details:', { fileName, fileType, fileSize });

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(fileType)) {
      return res.json({ 
        success: false, 
        error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' 
      }, 400);
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (fileSize > maxSize) {
      return res.json({ 
        success: false, 
        error: 'File too large. Maximum size is 10MB.' 
      }, 400);
    }

    // Generate unique file ID with user prefix
    const fileId = `${decodedToken.uid}_${ID.unique()}`;
    const bucketId = process.env.APPWRITE_BUCKET_ID;

    log('☁️ Uploading to Appwrite storage...');

    // Upload file to Appwrite storage
    const uploadedFile = await storage.createFile(
      bucketId,
      fileId,
      file,
      [
        `read("user:${decodedToken.uid}")`, // Only the user can read
        `delete("user:${decodedToken.uid}")` // Only the user can delete
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
    return res.json(response);

  } catch (err) {
    error('❌ Function error:', err);
    return res.json({ 
      success: false, 
      error: 'Internal server error: ' + err.message 
    }, 500);
  }
};
