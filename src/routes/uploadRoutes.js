const express = require('express');
const multer = require('multer');
const { uploadToR2, deleteFromR2, getFileKeyFromUrl } = require('../utils/cloudflareStorage');
const { authenticate, basicAuth } = require('../middleware/authMiddleware');
const { Shop, User, Service } = require('../models');

const router = express.Router();

// Memory storage for multer (files buffered in memory before uploading to R2)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Validate file types
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

/**
 * POST /api/upload/shop
 * Upload shop photo
 * Requires: authenticated user with 'partner' role
 */
router.post('/shop', authenticate, upload.single('shop_photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Verify user is a partner
    if (req.user.role !== 'partner') {
      return res.status(403).json({ error: 'Only partners can upload shop photos' });
    }

    // Check if shop exists for this partner
    const shop = await Shop.findOne({ where: { user_id: req.user.id } });
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // Delete old photo from R2 if it exists
    if (shop.shop_photo) {
      try {
        const oldKey = getFileKeyFromUrl(shop.shop_photo);
        await deleteFromR2(oldKey);
      } catch (err) {
        console.warn('Failed to delete old shop photo:', err);
      }
    }

    // Upload new photo to R2
    const fileName = `shop-${shop.id}-${Date.now()}.${req.file.originalname.split('.').pop()}`;
    const publicUrl = await uploadToR2(
      req.file.buffer,
      fileName,
      'shops',
      req.file.mimetype
    );

    // Update shop record with new photo URL
    await shop.update({ shop_photo: publicUrl });

    res.json({
      message: 'Shop photo uploaded successfully',
      path: publicUrl,
      fileName,
      shopId: shop.id
    });
  } catch (error) {
    console.error('Shop photo upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/upload/profile
 * Upload user profile photo
 * Requires: authenticated user
 */
router.post('/profile', authenticate, upload.single('profile_photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Delete old profile photo if it exists
    const user = await User.findByPk(req.user.id);
    if (user.profile_photo) {
      try {
        const oldKey = getFileKeyFromUrl(user.profile_photo);
        await deleteFromR2(oldKey);
      } catch (err) {
        console.warn('Failed to delete old profile photo:', err);
      }
    }

    // Upload new profile photo to R2
    const fileName = `profile-${req.user.id}-${Date.now()}.${req.file.originalname.split('.').pop()}`;
    const publicUrl = await uploadToR2(
      req.file.buffer,
      fileName,
      'profiles',
      req.file.mimetype
    );

    // Update user record with new photo URL
    await user.update({ profile_photo: publicUrl });

    res.json({
      message: 'Profile photo uploaded successfully',
      path: publicUrl,
      fileName,
      userId: req.user.id
    });
  } catch (error) {
    console.error('Profile photo upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/upload/service
 * Upload service photo
 * Requires: authenticated user with 'partner' role
 * Query params: serviceId (optional) - to associate with specific service
 */
router.post('/service', authenticate, upload.single('service_photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Verify user is a partner
    if (req.user.role !== 'partner') {
      return res.status(403).json({ error: 'Only partners can upload service photos' });
    }

    const { serviceId } = req.query;

    // If serviceId provided, verify ownership
    if (serviceId) {
      const service = await Service.findOne({
        where: { id: serviceId },
        include: [{
          model: Shop,
          where: { user_id: req.user.id }
        }]
      });

      if (!service) {
        return res.status(404).json({ error: 'Service not found or access denied' });
      }

      // Delete old service photo if it exists
      if (service.photo) {
        try {
          const oldKey = getFileKeyFromUrl(service.photo);
          await deleteFromR2(oldKey);
        } catch (err) {
          console.warn('Failed to delete old service photo:', err);
        }
      }

      // Upload new service photo to R2
      const fileName = `service-${service.id}-${Date.now()}.${req.file.originalname.split('.').pop()}`;
      const publicUrl = await uploadToR2(
        req.file.buffer,
        fileName,
        'services',
        req.file.mimetype
      );

      // Update service record
      await service.update({ photo: publicUrl });

      return res.json({
        message: 'Service photo uploaded successfully',
        path: publicUrl,
        fileName,
        serviceId: service.id
      });
    }

    // If no serviceId, just upload without associating
    const fileName = `service-${req.user.id}-${Date.now()}.${req.file.originalname.split('.').pop()}`;
    const publicUrl = await uploadToR2(
      req.file.buffer,
      fileName,
      'services',
      req.file.mimetype
    );

    res.json({
      message: 'Service photo uploaded successfully',
      path: publicUrl,
      fileName
    });
  } catch (error) {
    console.error('Service photo upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/upload/multiple
 * Upload multiple files at once
 * Requires: authenticated user
 */
router.post('/multiple', basicAuth, upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedFiles = [];
    const { folder = 'general' } = req.query;

    for (const file of req.files) {
      try {
        const fileName = `${req.user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${file.originalname.split('.').pop()}`;
        const publicUrl = await uploadToR2(
          file.buffer,
          fileName,
          folder,
          file.mimetype
        );

        uploadedFiles.push({
          originalName: file.originalname,
          path: publicUrl,
          fileName,
          size: file.size
        });
      } catch (err) {
        console.error(`Failed to upload ${file.originalname}:`, err);
      }
    }

    if (uploadedFiles.length === 0) {
      return res.status(500).json({ error: 'Failed to upload any files' });
    }

    res.json({
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
      files: uploadedFiles,
      totalFiles: req.files.length
    });
  } catch (error) {
    console.error('Multiple file upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/upload/:fileKey
 * Delete a file from R2 storage
 * Requires: authenticated user
 * Params: fileKey (encoded file key/path)
 */
router.delete('/:fileKey', authenticate, async (req, res) => {
  try {
    const { fileKey } = req.params;
    
    if (!fileKey) {
      return res.status(400).json({ error: 'File key is required' });
    }

    // Decode the file key
    const decodedKey = decodeURIComponent(fileKey);

    // Optional: Verify ownership by checking if file belongs to user's uploads
    // (This is a basic check - enhance based on your needs)
    if (!decodedKey.includes(req.user.id.toString())) {
      return res.status(403).json({ error: 'Cannot delete files uploaded by other users' });
    }

    await deleteFromR2(decodedKey);

    res.json({
      message: 'File deleted successfully',
      fileKey: decodedKey
    });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/upload/health
 * Health check for upload service
 */
router.get('/health', (req, res) => {
  res.json({ status: 'Upload service is healthy' });
});

module.exports = router;
