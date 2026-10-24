import Enquiry from '../models/Enquiry.js';
import { generateWhatsAppLink } from '../utils/whatsapp.js';

// @desc    Submit public contact enquiry
// @route   POST /api/enquiries
// @access  Public (Rate limited)
export const createEnquiry = async (req, res, next) => {
  try {
    const { name, phone, email, subject, message } = req.body;

    if (!name || !phone || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone number, and message are required.',
      });
    }

    const enquiry = await Enquiry.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : null,
      subject: subject ? subject.trim() : 'Tour Enquiry',
      message: message.trim(),
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for reaching out! Our travel specialist will contact you shortly.',
      enquiryId: enquiry.id,
      _id: String(enquiry.id),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all enquiries
// @route   GET /api/enquiries
// @access  Private (Admin)
export const getEnquiries = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const { rows: enquiries, count: total } = await Enquiry.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      offset: skip,
      limit: limitNum,
    });

    res.status(200).json({
      success: true,
      count: enquiries.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      enquiries,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update enquiry status
// @route   PATCH /api/enquiries/:id/status
// @access  Private (Admin)
export const updateEnquiryStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const enquiry = await Enquiry.findByPk(req.params.id);
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found.',
      });
    }

    if (status) {
      enquiry.status = status;
      await enquiry.save();
    }

    res.status(200).json({
      success: true,
      message: `Enquiry status updated to ${enquiry.status}.`,
      enquiry,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete enquiry
// @route   DELETE /api/enquiries/:id
// @access  Private (Admin)
export const deleteEnquiry = async (req, res, next) => {
  try {
    const enquiry = await Enquiry.findByPk(req.params.id);
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found.',
      });
    }

    await enquiry.destroy();

    res.status(200).json({
      success: true,
      message: 'Enquiry deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get WhatsApp reply link for enquiry
// @route   GET /api/enquiries/:id/whatsapp-link
// @access  Private (Admin)
export const getEnquiryWhatsAppLink = async (req, res, next) => {
  try {
    const enquiry = await Enquiry.findByPk(req.params.id);
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found.',
      });
    }

    const replyText = `Hello ${enquiry.name}! This is Hills Angel Tours and Travels responding to your enquiry: "${enquiry.message}". How can we help you plan your hill-station holiday?`;
    const link = generateWhatsAppLink(enquiry.phone, replyText);

    res.status(200).json({
      success: true,
      whatsappUrl: link,
    });
  } catch (err) {
    next(err);
  }
};
