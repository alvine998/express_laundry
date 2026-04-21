# R2 Upload API - Quick Reference

## Setup Complete ✅

Your Express Laundry app now has full Cloudflare R2 file upload integration!

---

## What Was Created

### 1. **Dedicated Upload Routes** 
📁 `src/routes/uploadRoutes.js`
- All file upload logic organized in one place
- 6 endpoints for different upload scenarios
- Built-in error handling and validation

### 2. **R2 Storage Utility**
📁 `src/utils/cloudflareStorage.js`
- Reusable functions for R2 operations
- Upload, delete, and signed URL generation
- Easy to extend

### 3. **Database Updates**
- Updated `User` model with `profile_photo` field
- Updated `Service` model with `photo` field
- Updated database initialization script

### 4. **Documentation**
- `UPLOAD_API.md` - Complete API reference with examples
- `CLOUDFLARE_R2_SETUP.md` - R2 setup guide
- `README_UPLOADS.md` - Quick reference (this file)

---

## Available Endpoints

```
POST   /api/upload/shop            → Upload shop photo (partners only)
POST   /api/upload/profile         → Upload profile photo (all users)
POST   /api/upload/service         → Upload service photo (partners only)
POST   /api/upload/multiple        → Upload multiple files (up to 5)
DELETE /api/upload/:fileKey        → Delete a file
GET    /api/upload/health          → Health check
```

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Cloudflare R2
Follow the guide in `CLOUDFLARE_R2_SETUP.md`

### 3. Configure Environment Variables
Create `.env` file:
```env
CLOUDFLARE_R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=your_key_id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret
CLOUDFLARE_R2_BUCKET_NAME=your_bucket
CLOUDFLARE_R2_PUBLIC_URL=https://your-bucket.r2.../
```

### 4. Start Server
```bash
npm run dev
```

### 5. Test Upload
```bash
curl -X POST http://localhost:5000/api/upload/shop \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "shop_photo=@image.jpg"
```

---

## API Response Examples

### Successful Upload (200)
```json
{
  "message": "Shop photo uploaded successfully",
  "path": "https://your-bucket.r2.../shops/shop-123-1708937843.jpg",
  "fileName": "shop-123-1708937843.jpg",
  "shopId": 123
}
```

### Error Response (400)
```json
{
  "error": "No file uploaded"
}
```

---

## Key Features

✅ **Cloudflare R2 Integration** - Enterprise-grade cloud storage  
✅ **Automatic Cleanup** - Old files deleted when uploading new ones  
✅ **Role-Based Access** - Partners vs customers have different permissions  
✅ **File Validation** - Only images allowed (JPEG, PNG, WebP, GIF)  
✅ **Size Limits** - 10MB per file, 5 files max for bulk  
✅ **Public URLs** - Files immediately accessible via CDN  
✅ **Error Handling** - Comprehensive error messages  
✅ **Database Integration** - URLs stored in models  

---

## File Storage Structure in R2

```
your-bucket/
├── shops/
│   └── shop-123-1708937843.jpg
├── profiles/
│   └── profile-456-1708937843.jpg
├── services/
│   └── service-789-1708937843.jpg
└── general/
    └── user-1-1708937845-xyz.jpg
```

---

## Common Use Cases

### Upload Shop Photo (Partner)
```javascript
const formData = new FormData();
formData.append('shop_photo', fileInput.files[0]);

const response = await fetch('/api/upload/shop', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

const data = await response.json();
// data.path = public URL of uploaded photo
```

### Upload Profile Photo (Any User)
```javascript
const formData = new FormData();
formData.append('profile_photo', fileInput.files[0]);

const response = await fetch('/api/upload/profile', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

### Upload Service Photo (Partner)
```javascript
const formData = new FormData();
formData.append('service_photo', fileInput.files[0]);

const response = await fetch(`/api/upload/service?serviceId=789`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

### Delete File
```javascript
const fileKey = 'shops/shop-123-1708937843.jpg';
const encodedKey = encodeURIComponent(fileKey);

await fetch(`/api/upload/${encodedKey}`, {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## Database Fields

### Users Table
```sql
ALTER TABLE users ADD COLUMN profile_photo VARCHAR(255);
```

### Services Table
```sql
ALTER TABLE services ADD COLUMN photo VARCHAR(255);
```

### Shops Table (Already has shop_photo)
```sql
-- No changes needed, already configured
```

---

## File Size & Limits

| Limit | Value |
|-------|-------|
| Max single file | 10 MB |
| Max bulk upload | 5 files |
| Accepted types | JPEG, PNG, WebP, GIF |
| Auto-delete old | Yes (when new uploaded) |

---

## Troubleshooting

### ❌ "403 Forbidden"
- Check R2 credentials in `.env`
- Verify bucket permissions
- Ensure API token is valid

### ❌ "Only partners can upload shop photos"
- Verify user role is 'partner'
- Check JWT token claims

### ❌ "File not found after upload"
- Check R2 bucket public access is enabled
- Verify `CLOUDFLARE_R2_PUBLIC_URL` is correct
- Files should be accessible at returned URL

### ❌ "File size exceeds 10MB"
- Reduce file size before uploading
- Compress images using image optimization tools

---

## Next Steps

1. ✅ Follow the R2 setup guide
2. ✅ Configure environment variables  
3. ✅ Test upload endpoints with Postman
4. ✅ Integrate into your frontend
5. ✅ Monitor R2 usage in Cloudflare dashboard

---

## Files Modified/Created

### Created
- `src/routes/uploadRoutes.js` - Complete upload router
- `src/utils/cloudflareStorage.js` - R2 utility functions
- `.env.example` - Environment template
- `CLOUDFLARE_R2_SETUP.md` - Setup guide
- `UPLOAD_API.md` - Full API documentation
- `README_UPLOADS.md` - This file

### Modified
- `package.json` - Added AWS SDK dependencies
- `index.js` - Updated to use upload routes
- `src/models/User.js` - Added profile_photo field
- `src/models/Service.js` - Added photo field
- `scripts/init_db.sql` - Updated schema comments

---

## Performance Tips

1. **Image Compression**: Compress images before upload
2. **Lazy Loading**: Load images only when needed
3. **CDN Caching**: Leverage Cloudflare's CDN for fast delivery
4. **Thumbnails**: Generate thumbnails in R2 (future enhancement)
5. **Batch Operations**: Use bulk upload endpoint when possible

---

## Pricing Estimate

Cloudflare R2 is very affordable:
- **Storage**: $0.015/GB/month
- **Upload Operations**: $4.50/million (PUT/POST)
- **Download Operations**: $0.36/million (GET)

Example: 100GB storage + 1M uploads/month = ~$6.50/month

---

## Support & References

- 📖 [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- 📖 [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/sdk-for-javascript/v3/)
- 📖 [S3 API Reference](https://docs.aws.amazon.com/AmazonS3/latest/API/)
- 📖 [Upload API Documentation](./UPLOAD_API.md)

---

## Status

- ✅ Upload routes created
- ✅ R2 utility functions created
- ✅ Database models updated
- ✅ Environment configuration ready
- ⏳ Next: Setup Cloudflare R2 bucket

Start with `CLOUDFLARE_R2_SETUP.md` to get your R2 bucket running!
