import { Op } from 'sequelize';
import Gallery from '../models/Gallery.js';
import { processUploadedFile } from '../middleware/upload.js';

// @desc    Get all gallery items (supports ?type=photo|video & ?tag=...)
// @route   GET /api/gallery
// @access  Public
export const getGalleryItems = async (req, res, next) => {
  try {
    const { type, tag, featured } = req.query;
    const where = {};

    if (type && ['photo', 'video'].includes(type)) {
      where.type = type;
    }
    if (tag && tag !== 'all') {
      where.tag = { [Op.like]: tag };
    }
    if (featured === 'true') {
      where.featured = true;
    }

    const items = await Gallery.findAll({
      where,
      order: [
        ['sortOrder', 'ASC'],
        ['createdAt', 'DESC'],
      ],
    });

    res.status(200).json({
      success: true,
      count: items.length,
      items,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload media file (photo or video) for gallery
// @route   POST /api/gallery/upload
// @access  Admin Protected
export const uploadGalleryMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please provide a file to upload' });
    }

    const fileUrl = await processUploadedFile(req.file, req);
    const isVideo =
      req.file.mimetype.startsWith('video/') ||
      /\.(mp4|webm|mov|mkv)$/i.test(req.file.originalname);

    res.status(200).json({
      success: true,
      fileUrl,
      type: isVideo ? 'video' : 'photo',
      originalName: req.file.originalname,
      message: 'Media uploaded successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new gallery item
// @route   POST /api/gallery
// @access  Admin Protected
export const createGalleryItem = async (req, res, next) => {
  try {
    const { title, type, url, thumbnailUrl, tag, caption, featured, sortOrder } = req.body;

    if (!title || !url) {
      return res.status(400).json({ success: false, message: 'Title and Media URL are required' });
    }

    const item = await Gallery.create({
      title,
      type: type || 'photo',
      url,
      thumbnailUrl: thumbnailUrl || (type === 'photo' ? url : null),
      tag: tag || 'Hill Station',
      caption,
      featured: Boolean(featured),
      sortOrder: Number(sortOrder) || 0,
    });

    res.status(201).json({
      success: true,
      message: 'Gallery item added successfully',
      item,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a gallery item
// @route   PUT /api/gallery/:id
// @access  Admin Protected
export const updateGalleryItem = async (req, res, next) => {
  try {
    const item = await Gallery.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Gallery item not found' });
    }

    await item.update(req.body);

    res.status(200).json({
      success: true,
      message: 'Gallery item updated successfully',
      item,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a gallery item
// @route   DELETE /api/gallery/:id
// @access  Admin Protected
export const deleteGalleryItem = async (req, res, next) => {
  try {
    const item = await Gallery.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Gallery item not found' });
    }

    await item.destroy();

    res.status(200).json({
      success: true,
      message: 'Gallery item deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
