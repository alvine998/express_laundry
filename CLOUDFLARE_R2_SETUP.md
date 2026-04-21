# Cloudflare R2 Storage Setup Guide

This project now uses **Cloudflare R2** for file storage instead of local file uploads. R2 is a cloud object storage service that's S3-compatible and cost-effective.

## Prerequisites

1. A Cloudflare account (https://dash.cloudflare.com)
2. AWS SDK CLI or basic understanding of S3-compatible storage

## Step-by-Step Setup

### 1. Create an R2 Bucket

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **R2** in the left sidebar
3. Click **Create Bucket**
4. Choose a bucket name (e.g., `laundry-app-files`)
5. Keep other settings as default
6. Click **Create Bucket**

### 2. Create R2 API Token

1. In R2, click on your bucket name
2. Go to **Settings** tab
3. Under **R2 API tokens**, click **Create API token**
4. Choose **Edit (All permissions)** for development, or **Object-level permissions** for production
5. Set expiration (recommended: no expiration for service accounts)
6. Click **Create API Token**
7. Copy these credentials:
   - **Access Key ID**
   - **Secret Access Key**
   - **Account ID** (visible in bucket URL)

### 3. Set Up Public Access (Optional but Recommended)

1. In your bucket settings, go to **Settings**
2. Scroll to **Public access**
3. Click **Allow access** to make files publicly readable (required for serving images)
4. You can optionally set up a **Custom Domain** for prettier URLs

### 4. Configure Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```bash
# Cloudflare R2 Configuration
CLOUDFLARE_R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key_id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_access_key
CLOUDFLARE_R2_BUCKET_NAME=your_bucket_name
CLOUDFLARE_R2_PUBLIC_URL=https://your-bucket-name.YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
```

**Note:** If you set up a custom domain, use that URL instead of the R2 domain for `CLOUDFLARE_R2_PUBLIC_URL`.

### 5. Install Dependencies

```bash
npm install
```

## File Upload Endpoints

The application now provides these upload endpoints:

### Upload Shop Photo
```
POST /api/upload/shop
Headers: Authorization: Bearer {token}
Body: form-data with key "shop_photo" and file value
```

### Upload Profile Photo
```
POST /api/upload/profile
Headers: Authorization: Bearer {token}
Body: form-data with key "profile_photo" and file value
```

### Upload Service Photo
```
POST /api/upload/service
Headers: Authorization: Bearer {token}
Body: form-data with key "service_photo" and file value
```

All endpoints return:
```json
{
  "message": "File uploaded successfully",
  "path": "https://your-bucket.r2.../shops/1-1234567890.jpg",
  "fileName": "1-1234567890.jpg"
}
```

## How It Works

1. **File Buffering**: Files are uploaded via multer and stored in memory (not on disk)
2. **Cloud Upload**: The file is immediately uploaded to Cloudflare R2
3. **Public URL**: A public URL is returned for accessing the file
4. **Database Storage**: The public URL is stored in the database (not the local path)

## Benefits

✅ **No Server Storage**: Files aren't stored on your server  
✅ **Scalability**: Can handle unlimited files  
✅ **Cost-Effective**: R2 has competitive pricing  
✅ **CDN Integration**: Serve files from Cloudflare's edge network  
✅ **Automatic Deletion**: You can delete R2 files without server cleanup  

## File Management

### Migrating Existing Files

If you have existing local files, you'll need to migrate them:

```javascript
// Example migration script (add to scripts/ folder if needed)
const fs = require('fs');
const path = require('path');
const { uploadToR2 } = require('./src/utils/cloudflareStorage');

async function migrateFiles(localDir, r2Folder) {
  const files = fs.readdirSync(localDir);
  for (const file of files) {
    const filePath = path.join(localDir, file);
    const fileBuffer = fs.readFileSync(filePath);
    await uploadToR2(fileBuffer, file, r2Folder);
    console.log(`Migrated: ${file}`);
  }
}
```

### Deleting Files

To delete a file from R2:

```javascript
const { deleteFromR2, getFileKeyFromUrl } = require('./src/utils/cloudflareStorage');

// If you have the public URL
const fileKey = getFileKeyFromUrl(publicUrl);
await deleteFromR2(fileKey);

// Or if you have the key directly
await deleteFromR2('shops/1-1234567890.jpg');
```

## Troubleshooting

### Issue: 403 Forbidden when uploading
- Check R2 API credentials in `.env`
- Verify bucket name is correct
- Ensure API token has appropriate permissions

### Issue: Files not accessible after upload
- Verify bucket has public access enabled
- Check CLOUDFLARE_R2_PUBLIC_URL is correct
- Files should be accessible at the returned URL immediately

### Issue: CORS errors
- Add CORS headers in bucket settings if accessing from browser
- Or configure a custom domain with proper headers

## API Documentation Reference

- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/)
- [S3 API Reference](https://docs.aws.amazon.com/AmazonS3/latest/API/Welcome.html)

## Pricing

Cloudflare R2:
- **Storage**: $0.015/GB/month
- **Class A Operations** (PUT/POST): $4.50 per million
- **Class B Operations** (GET): $0.36 per million

[R2 Pricing Details](https://www.cloudflare.com/products/r2/pricing/)
