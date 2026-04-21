const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Initialize Cloudflare R2 client
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload file to Cloudflare R2
 * @param {Buffer} fileBuffer - File content
 * @param {string} fileName - Unique file name
 * @param {string} folder - Folder path (e.g., 'shops', 'profiles', 'services')
 * @param {string} mimeType - File MIME type
 * @returns {Promise<string>} - Public URL of uploaded file
 */
async function uploadToR2(fileBuffer, fileName, folder, mimeType = 'application/octet-stream') {
  const key = `${folder}/${fileName}`;
  
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    });

    await s3Client.send(command);
    
    // Return public URL
    const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`;
    return publicUrl;
  } catch (error) {
    console.error('Error uploading to R2:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

/**
 * Delete file from Cloudflare R2
 * @param {string} fileKey - File key (path) in R2
 * @returns {Promise<void>}
 */
async function deleteFromR2(fileKey) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: fileKey,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('Error deleting from R2:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Generate a signed URL for temporary access (optional)
 * @param {string} fileKey - File key in R2
 * @param {number} expiresIn - Expiration time in seconds
 * @returns {Promise<string>} - Signed URL
 */
async function getSignedDownloadUrl(fileKey, expiresIn = 3600) {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: fileKey,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
}

/**
 * Extract file key from public URL
 * @param {string} publicUrl - Public URL of the file
 * @returns {string} - File key
 */
function getFileKeyFromUrl(publicUrl) {
  if (!publicUrl) return null;
  const baseUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;
  return publicUrl.replace(`${baseUrl}/`, '');
}

module.exports = {
  uploadToR2,
  deleteFromR2,
  getSignedDownloadUrl,
  getFileKeyFromUrl,
  s3Client,
};
