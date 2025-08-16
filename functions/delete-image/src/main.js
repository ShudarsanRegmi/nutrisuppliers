const { Client, Storage } = require('node-appwrite');
const admin = require('firebase-admin');

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
 * Delete Image Function
 * Verifies Firebase token and deletes image from Appwrite storage
 */
module.exports = async ({ req, res, log, error }) => {
  try {
    log('🔄 Delete image function started');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
      return res.text('', 200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      });
    }

    // Check if it's a DELETE request
    if (req.method !== 'DELETE') {
      return res.json({ 
        success: false, 
        error: 'Method not allowed. Use DELETE.' 
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

    // Get image ID from request body or query params
    let imageId;
    if (req.body && typeof req.body === 'string') {
      try {
        const body = JSON.parse(req.body);
        imageId = body.imageId;
      } catch (parseError) {
        imageId = req.query.imageId;
      }
    } else if (req.body && req.body.imageId) {
      imageId = req.body.imageId;
    } else {
      imageId = req.query.imageId;
    }

    if (!imageId) {
      return res.json({ 
        success: false, 
        error: 'Image ID is required' 
      }, 400, {
        'Access-Control-Allow-Origin': '*'
      });
    }

    log('🗑️ Deleting image:', imageId);

    // Verify that the image belongs to the user (security check)
    if (!imageId.startsWith(`${decodedToken.uid}_`)) {
      return res.json({ 
        success: false, 
        error: 'Unauthorized: You can only delete your own images' 
      }, 403, {
        'Access-Control-Allow-Origin': '*'
      });
    }

    const bucketId = process.env.APPWRITE_BUCKET_ID;

    // Delete file from Appwrite storage
    await storage.deleteFile(bucketId, imageId);

    log('✅ Image deleted successfully:', imageId);

    // Return success response
    return res.json({
      success: true,
      message: 'Image deleted successfully',
      imageId: imageId
    }, 200, {
      'Access-Control-Allow-Origin': '*'
    });

  } catch (err) {
    error('❌ Function error:', err);
    
    // Handle specific Appwrite errors
    if (err.code === 404) {
      return res.json({ 
        success: false, 
        error: 'Image not found' 
      }, 404, {
        'Access-Control-Allow-Origin': '*'
      });
    }

    return res.json({ 
      success: false, 
      error: 'Internal server error: ' + err.message 
    }, 500, {
      'Access-Control-Allow-Origin': '*'
    });
  }
};
