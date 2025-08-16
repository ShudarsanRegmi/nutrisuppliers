# Appwrite Setup for NutriSuppliers Image Upload

## 🔧 Required Configuration

You need to update the Appwrite configuration in `client/src/lib/appwrite.ts` with your actual project details.

### 1. Update Configuration Constants

Replace these placeholders in `client/src/lib/appwrite.ts`:

```typescript
// TODO: Replace these with your actual Appwrite project details
const APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1'; // Your Appwrite endpoint
const APPWRITE_PROJECT_ID = 'YOUR_PROJECT_ID'; // Your project ID
const APPWRITE_BUCKET_ID = 'YOUR_BUCKET_ID'; // Your storage bucket ID
```

### 2. Get Your Project Details

#### Project ID:
1. Go to your Appwrite Console
2. Select your project
3. Copy the Project ID from the project overview

#### Bucket ID:
1. In your Appwrite project, go to "Storage"
2. Select your storage bucket
3. Copy the Bucket ID from the bucket settings

#### Endpoint:
- If using Appwrite Cloud: `https://cloud.appwrite.io/v1`
- If self-hosted: Your custom Appwrite server URL + `/v1`

### 3. Configure Storage Bucket Permissions

In your Appwrite Console:

1. Go to **Storage** → Your Bucket
2. Click on **Settings** tab
3. Configure **Permissions**:
   - **Create**: `users` (authenticated users can upload)
   - **Read**: `users` (authenticated users can view)
   - **Update**: `users` (authenticated users can modify)
   - **Delete**: `users` (authenticated users can delete)

### 4. File Upload Settings

In your bucket settings, configure:

- **Maximum File Size**: 10MB (or your preferred limit)
- **Allowed File Extensions**: `jpg, jpeg, png, webp, gif`
- **Antivirus**: Enable if available
- **Encryption**: Enable for security

### 5. CORS Configuration (if needed)

If you encounter CORS issues:

1. Go to **Settings** → **Domains**
2. Add your domain (e.g., `localhost:5173` for development)
3. Or configure in your Appwrite server settings

## 🔐 Security Considerations

### Authentication
- Images are only accessible to authenticated users
- Each user can only access images from their own transactions
- Implement proper user session management

### File Validation
- Client-side validation for file type and size
- Server-side validation in Appwrite functions (optional)
- Antivirus scanning for uploaded files

### Storage Optimization
- Images are automatically compressed before upload
- Preview images are generated at different sizes
- Consider implementing image cleanup for deleted transactions

## 📱 Features Implemented

### Image Upload
- ✅ Drag & drop file upload
- ✅ Multiple file selection
- ✅ File type validation (PNG, JPG, WebP, GIF)
- ✅ File size validation (max 10MB per file)
- ✅ Image compression before upload
- ✅ Upload progress indication
- ✅ Maximum 10 images per transaction

### Image Display
- ✅ Thumbnail previews in transaction cards
- ✅ Image count indicator
- ✅ Full-size image gallery in transaction details
- ✅ Click to view/download images
- ✅ Hover effects and smooth transitions

### Image Management
- ✅ Delete individual images
- ✅ Automatic cleanup when transaction is deleted
- ✅ Error handling for failed uploads/deletions
- ✅ Toast notifications for user feedback

## 🚀 Usage Instructions

### For Users:
1. **Adding Images**: When creating/editing a transaction, scroll to "Bill Images" section
2. **Upload Methods**: 
   - Click "Choose Files" button
   - Drag and drop files onto the upload area
3. **View Images**: Click on transaction cards to see image thumbnails, click images to view full size
4. **Remove Images**: In edit mode, hover over images and click the trash icon

### For Developers:
1. **Update Configuration**: Replace placeholders in `appwrite.ts`
2. **Test Upload**: Create a test transaction with images
3. **Verify Storage**: Check Appwrite console to see uploaded files
4. **Monitor Usage**: Track storage usage in Appwrite dashboard

## 🔧 Troubleshooting

### Common Issues:

#### "Failed to upload image" Error:
- Check Appwrite project ID and bucket ID
- Verify bucket permissions allow file creation
- Ensure file size is under limit
- Check network connectivity

#### Images Not Displaying:
- Verify bucket read permissions
- Check if image URLs are accessible
- Ensure proper authentication

#### CORS Errors:
- Add your domain to Appwrite CORS settings
- Check browser console for specific CORS errors

#### Storage Quota Exceeded:
- Monitor storage usage in Appwrite console
- Implement image cleanup for old transactions
- Consider image compression settings

## 📊 Storage Management

### Monitoring:
- Track storage usage in Appwrite dashboard
- Monitor file upload/download metrics
- Set up alerts for storage limits

### Cleanup:
- Implement automatic cleanup for deleted transactions
- Consider retention policies for old images
- Regular maintenance of unused files

### Optimization:
- Use appropriate image compression settings
- Generate multiple image sizes for different use cases
- Implement lazy loading for image galleries

## 🔄 Next Steps

After configuration:
1. Test image upload functionality
2. Verify images display correctly
3. Test image deletion
4. Monitor storage usage
5. Implement any additional security measures
6. Consider backup strategies for important images

## 📞 Support

If you encounter issues:
1. Check Appwrite documentation
2. Verify all configuration settings
3. Test with simple image uploads first
4. Check browser console for errors
5. Review Appwrite server logs if self-hosted
