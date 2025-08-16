# Appwrite Functions Setup for Firebase Auth Integration

## 🎯 Overview

This setup allows you to use Appwrite storage with Firebase authentication by creating Appwrite Functions that verify Firebase tokens and handle storage operations.

## 📋 Prerequisites

1. **Appwrite Project** with storage bucket created
2. **Firebase Project** with authentication enabled
3. **Firebase Service Account** JSON file

## 🚀 Step-by-Step Setup

### Step 1: Get Firebase Service Account

1. Go to **Firebase Console** → Your Project
2. Click **Settings** (gear icon) → **Project Settings**
3. Go to **Service Accounts** tab
4. Click **Generate New Private Key**
5. Download the JSON file (keep it secure!)

### Step 2: Create Appwrite Functions

#### 2.1 Create Upload Function

1. Go to **Appwrite Console** → Your Project → **Functions**
2. Click **Create Function**
3. Configure:
   - **Name**: `upload-image`
   - **Runtime**: `Node.js 18.0`
   - **Entry Point**: `src/main.js`
   - **Execute Access**: `Users` (authenticated users)

#### 2.2 Create Delete Function

1. Click **Create Function** again
2. Configure:
   - **Name**: `delete-image`
   - **Runtime**: `Node.js 18.0`
   - **Entry Point**: `src/main.js`
   - **Execute Access**: `Users` (authenticated users)

### Step 3: Set Environment Variables

For **both functions**, add these environment variables:

#### Required Variables:
```
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY=your-service-account-private-key
APPWRITE_BUCKET_ID=68a03b2600160922b23d
APPWRITE_API_KEY=your-appwrite-api-key
```

#### How to get these values:

**From Firebase Service Account JSON:**
- `FIREBASE_PROJECT_ID`: `project_id` field
- `FIREBASE_CLIENT_EMAIL`: `client_email` field  
- `FIREBASE_PRIVATE_KEY`: `private_key` field (include the full key with `-----BEGIN PRIVATE KEY-----` etc.)

**From Appwrite:**
- `APPWRITE_BUCKET_ID`: Your storage bucket ID (already set: `68a03b2600160922b23d`)
- `APPWRITE_API_KEY`: Create in Appwrite Console → API Keys → Create API Key with Storage permissions

### Step 4: Deploy Function Code

#### 4.1 Upload Function

1. In Appwrite Console → Functions → `upload-image`
2. Go to **Deployments** tab
3. Click **Create Deployment**
4. Upload the files:
   - `src/main.js` (from `appwrite-functions/upload-image/src/main.js`)
   - `package.json` (from `appwrite-functions/upload-image/package.json`)
5. Click **Deploy**

#### 4.2 Delete Function

1. In Appwrite Console → Functions → `delete-image`
2. Go to **Deployments** tab  
3. Click **Create Deployment**
4. Upload the files:
   - `src/main.js` (from `appwrite-functions/delete-image/src/main.js`)
   - `package.json` (from `appwrite-functions/delete-image/package.json`)
5. Click **Deploy**

### Step 5: Update Client Code

#### 5.1 Update Function IDs

In `client/src/lib/appwrite.ts`, update the function IDs:

```typescript
// Replace these with your actual function IDs from Appwrite Console
const UPLOAD_FUNCTION_ID = 'your-upload-function-id'; 
const DELETE_FUNCTION_ID = 'your-delete-function-id';
```

#### 5.2 Test the Integration

1. **Remove the test component** from TransactionForm
2. **Try uploading an image** in a transaction
3. **Check browser console** for detailed logs
4. **Verify in Appwrite Console** that files are uploaded

## 🔧 Function Details

### Upload Function Features:
- ✅ **Verifies Firebase JWT** tokens
- ✅ **Validates file type** and size
- ✅ **Uploads to Appwrite storage** with user-specific permissions
- ✅ **Returns image metadata** (ID, URLs, etc.)
- ✅ **Handles errors** gracefully

### Delete Function Features:
- ✅ **Verifies Firebase JWT** tokens
- ✅ **Checks ownership** (users can only delete their own images)
- ✅ **Deletes from Appwrite storage**
- ✅ **Returns success/failure** status

## 🔐 Security Features

### Authentication:
- **Firebase JWT verification** on every request
- **User-specific file permissions** in Appwrite
- **Ownership validation** for delete operations

### File Validation:
- **File type restrictions** (images only)
- **File size limits** (10MB max)
- **Malicious file detection** (basic)

### Access Control:
- **User can only access their own files**
- **Proper error handling** without information leakage
- **Rate limiting** via Appwrite Functions

## 🧪 Testing

### Test Upload Function:
```bash
curl -X POST \
  https://fra.cloud.appwrite.io/v1/functions/YOUR_UPLOAD_FUNCTION_ID/executions \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "X-Appwrite-Project: 68a03ad10030ac53cb92" \
  -H "X-File-Name: test.jpg" \
  -H "X-File-Type: image/jpeg" \
  -H "X-File-Size: 12345" \
  --data-binary @test-image.jpg
```

### Test Delete Function:
```bash
curl -X DELETE \
  https://fra.cloud.appwrite.io/v1/functions/YOUR_DELETE_FUNCTION_ID/executions \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "X-Appwrite-Project: 68a03ad10030ac53cb92" \
  -d '{"imageId": "your-image-id"}'
```

## 🔍 Troubleshooting

### Common Issues:

#### Function Deployment Fails:
- Check that `package.json` and `src/main.js` are uploaded
- Verify Node.js runtime is selected
- Check function logs in Appwrite Console

#### Firebase Token Verification Fails:
- Verify Firebase service account credentials
- Check that private key includes newlines (`\n`)
- Ensure Firebase project ID is correct

#### File Upload Fails:
- Check Appwrite API key permissions
- Verify bucket ID is correct
- Check file size and type restrictions

#### Permission Denied:
- Verify user is authenticated in Firebase
- Check that function execute access is set to "Users"
- Ensure bucket permissions allow file creation

### Debug Steps:

1. **Check Function Logs** in Appwrite Console
2. **Verify Environment Variables** are set correctly
3. **Test Firebase Token** manually
4. **Check Network Requests** in browser DevTools
5. **Verify File Permissions** in Appwrite storage

## 📊 Monitoring

### Function Metrics:
- **Execution count** and **success rate**
- **Average execution time**
- **Error rates** and **common errors**

### Storage Metrics:
- **File upload/download** statistics
- **Storage usage** and **bandwidth**
- **User activity** patterns

## 🔄 Maintenance

### Regular Tasks:
- **Monitor function logs** for errors
- **Update dependencies** in package.json
- **Review storage usage** and cleanup old files
- **Rotate API keys** periodically

### Scaling Considerations:
- **Function timeout** limits (15 minutes max)
- **Concurrent execution** limits
- **Storage bandwidth** limits
- **Cost optimization** strategies

## 🎉 Success!

Once setup is complete, you'll have:
- ✅ **Secure image uploads** with Firebase auth
- ✅ **Appwrite storage** integration
- ✅ **User-specific file access**
- ✅ **Proper error handling**
- ✅ **Scalable architecture**

Your NutriSuppliers app can now handle bill image uploads securely! 🏥📸
