# Upload API Documentation

All file uploads are handled through Cloudflare R2 object storage. Files are uploaded to the edge and served via Cloudflare's CDN.

## Base URL
```
/api/upload
```

## Authentication
All upload endpoints require authentication via JWT token in the `Authorization` header:
```
Authorization: Bearer {jwt_token}
```

---

## Endpoints

### 1. Upload Shop Photo
Upload or update a shop's profile photo.

**Endpoint:** `POST /api/upload/shop`

**Authentication:** Required (Partner role)

**Request:**
```
Content-Type: multipart/form-data

Parameters:
- shop_photo (file): Image file (JPEG, PNG, WebP, GIF)
```

**Response (Success - 200):**
```json
{
  "message": "Shop photo uploaded successfully",
  "path": "https://your-bucket.r2.../shops/shop-123-1708937843.jpg",
  "fileName": "shop-123-1708937843.jpg",
  "shopId": 123
}
```

**Response (Error):**
```json
{
  "error": "Only partners can upload shop photos"
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:5000/api/upload/shop \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "shop_photo=@/path/to/image.jpg"
```

**Example JavaScript (Fetch):**
```javascript
const formData = new FormData();
formData.append('shop_photo', fileInput.files[0]);

const response = await fetch('/api/upload/shop', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const data = await response.json();
console.log(data.path); // Use this URL in your app
```

---

### 2. Upload Profile Photo
Upload or update a user's profile photo.

**Endpoint:** `POST /api/upload/profile`

**Authentication:** Required (Any authenticated user)

**Request:**
```
Content-Type: multipart/form-data

Parameters:
- profile_photo (file): Image file (JPEG, PNG, WebP, GIF)
```

**Response (Success - 200):**
```json
{
  "message": "Profile photo uploaded successfully",
  "path": "https://your-bucket.r2.../profiles/profile-456-1708937843.jpg",
  "fileName": "profile-456-1708937843.jpg",
  "userId": 456
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:5000/api/upload/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "profile_photo=@/path/to/image.jpg"
```

---

### 3. Upload Service Photo
Upload or update a service's photo.

**Endpoint:** `POST /api/upload/service`

**Authentication:** Required (Partner role)

**Request:**
```
Content-Type: multipart/form-data

Parameters:
- service_photo (file): Image file (JPEG, PNG, WebP, GIF)
- serviceId (query, optional): ID of the service to associate with

Query Parameters:
- ?serviceId=123 (optional) - Associate photo with specific service
```

**Response (Success - 200):**
```json
{
  "message": "Service photo uploaded successfully",
  "path": "https://your-bucket.r2.../services/service-789-1708937843.jpg",
  "fileName": "service-789-1708937843.jpg",
  "serviceId": 789
}
```

**Response (Without serviceId):**
```json
{
  "message": "Service photo uploaded successfully",
  "path": "https://your-bucket.r2.../services/service-456-1708937843.jpg",
  "fileName": "service-456-1708937843.jpg"
}
```

**Example cURL:**
```bash
# Associate with a specific service
curl -X POST "http://localhost:5000/api/upload/service?serviceId=789" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "service_photo=@/path/to/image.jpg"
```

---

### 4. Upload Multiple Files
Upload multiple files at once.

**Endpoint:** `POST /api/upload/multiple`

**Authentication:** Required

**Request:**
```
Content-Type: multipart/form-data

Parameters:
- files (files): Multiple image files (up to 5)
- folder (query): Target folder name (default: 'general')

Query Parameters:
- ?folder=my_folder (optional) - Specify folder in R2
```

**Response (Success - 200):**
```json
{
  "message": "Successfully uploaded 3 file(s)",
  "files": [
    {
      "originalName": "image1.jpg",
      "path": "https://your-bucket.r2.../general/user-1-1708937843-abc.jpg",
      "fileName": "user-1-1708937843-abc.jpg",
      "size": 2048576
    },
    {
      "originalName": "image2.jpg",
      "path": "https://your-bucket.r2.../general/user-1-1708937844-def.jpg",
      "fileName": "user-1-1708937844-def.jpg",
      "size": 3145728
    },
    {
      "originalName": "image3.jpg",
      "path": "https://your-bucket.r2.../general/user-1-1708937845-ghi.jpg",
      "fileName": "user-1-1708937845-ghi.jpg",
      "size": 1572864
    }
  ],
  "totalFiles": 3
}
```

**Example cURL:**
```bash
curl -X POST "http://localhost:5000/api/upload/multiple?folder=galleries" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "files=@/path/to/image1.jpg" \
  -F "files=@/path/to/image2.jpg" \
  -F "files=@/path/to/image3.jpg"
```

**Example JavaScript:**
```javascript
const formData = new FormData();
formData.append('files', fileInput.files[0]);
formData.append('files', fileInput.files[1]);

const response = await fetch('/api/upload/multiple?folder=galleries', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const data = await response.json();
data.files.forEach(file => console.log(file.path));
```

---

### 5. Delete File
Delete a file from R2 storage.

**Endpoint:** `DELETE /api/upload/:fileKey`

**Authentication:** Required

**Request:**
```
Parameters:
- fileKey (URL encoded): File key/path in R2 storage

Example: shops/shop-123-1708937843.jpg → shops%2Fshop-123-1708937843.jpg
```

**Response (Success - 200):**
```json
{
  "message": "File deleted successfully",
  "fileKey": "shops/shop-123-1708937843.jpg"
}
```

**Example cURL:**
```bash
# URL encode the file key
curl -X DELETE "http://localhost:5000/api/upload/shops%2Fshop-123-1708937843.jpg" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example JavaScript:**
```javascript
const fileKey = 'shops/shop-123-1708937843.jpg';
const encodedKey = encodeURIComponent(fileKey);

const response = await fetch(`/api/upload/${encodedKey}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log(data.message);
```

---

### 6. Upload Health Check
Check if the upload service is running.

**Endpoint:** `GET /api/upload/health`

**Authentication:** Not required

**Response (Success - 200):**
```json
{
  "status": "Upload service is healthy"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "No file uploaded"
}
```

### 403 Forbidden
```json
{
  "error": "Only partners can upload shop photos"
}
```

### 404 Not Found
```json
{
  "error": "Shop not found"
}
```

### 413 Payload Too Large
```json
{
  "error": "File size exceeds 10MB limit"
}
```

### 415 Unsupported Media Type
```json
{
  "error": "Only image files are allowed"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to upload file: [error details]"
}
```

---

## File Limits & Rules

| Aspect | Limit |
|--------|-------|
| **Max File Size** | 10 MB |
| **Max Files (Multiple)** | 5 files |
| **Allowed Types** | JPEG, PNG, WebP, GIF |
| **Auto Cleanup** | Old files are deleted when new ones are uploaded |

---

## Usage Examples

### React Component Example
```javascript
import React, { useState } from 'react';

function UploadShopPhoto({ token }) {
  const [loading, setLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('shop_photo', file);

    setLoading(true);
    try {
      const response = await fetch('/api/upload/shop', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setPhotoUrl(data.path);
        console.log('Upload successful:', data);
      } else {
        const error = await response.json();
        console.error('Upload failed:', error);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleUpload} accept="image/*" />
      {loading && <p>Uploading...</p>}
      {photoUrl && <img src={photoUrl} alt="Shop" style={{ maxWidth: '200px' }} />}
    </div>
  );
}

export default UploadShopPhoto;
```

---

## Best Practices

1. **Validate File Type on Frontend**: Check file type before uploading
2. **Show Progress**: Use XMLHttpRequest or fetch with progress events
3. **Handle Errors**: Always handle upload failures gracefully
4. **Cache URLs**: Store returned URLs in your database
5. **Secure Deletion**: Only allow users to delete their own files
6. **Monitor Quota**: Track R2 storage usage in Cloudflare dashboard

---

## Troubleshooting

### Upload returns 403 Forbidden
- Ensure user has the correct role (e.g., 'partner' for shop photos)
- Verify JWT token is valid and not expired

### Upload returns 500 Internal Server Error
- Check Cloudflare R2 credentials in `.env`
- Verify bucket name and endpoint are correct
- Check R2 bucket permissions

### Images not loading after upload
- Verify R2 bucket has public access enabled
- Check that `CLOUDFLARE_R2_PUBLIC_URL` environment variable is correct
- Files should be publicly accessible at the returned URL

---

## Integration with Models

### Update Shop with Photo
```javascript
const shop = await Shop.findByPk(shopId);
await shop.update({ shop_photo: publicUrl });
```

### Update User Profile Photo
```javascript
const user = await User.findByPk(userId);
await user.update({ profile_photo: publicUrl });
```

### Update Service Photo
```javascript
const service = await Service.findByPk(serviceId);
await service.update({ photo: publicUrl });
```

---

## API Base Response Structure

All successful responses follow this structure:
```json
{
  "message": "Operation description",
  "path": "https://r2-public-url",
  "fileName": "stored-filename",
  "userId|shopId|serviceId": 123
}
```

All error responses follow this structure:
```json
{
  "error": "Error message"
}
```
