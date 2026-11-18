import { BaseService } from './BaseService.js';
import enquiryRepository from '../repository/enquiryRepository.js';
import { generateWhatsAppLink } from '../utils/whatsapp.js';
import { EnquiryStatus } from '../enums/index.js';

export class EnquiryService extends BaseService {
  constructor() {
    super(enquiryRepository);
  }

  /**
   * Filtered enquiries
   */
  async getEnquiries(filters) {
    return enquiryRepository.findEnquiriesFiltered(filters);
  }

  /**
   * Create new enquiry
   */
  async createEnquiry(payload) {
    const enquiry = await enquiryRepository.create({
      name: payload.name.trim(),
      phone: payload.phone.trim(),
      email: payload.email ? payload.email.trim() : null,
      subject: payload.subject ? payload.subject.trim() : 'Tour Enquiry',
      message: payload.message.trim(),
      status: EnquiryStatus.UNREAD,
    });
    return enquiry;
  }

  /**
   * Update enquiry status
   */
  async updateStatus(id, status) {
    const enquiry = await enquiryRepository.findById(id);
    if (!enquiry) {
      const err = new Error('Enquiry not found.');
      err.statusCode = 404;
      throw err;
    }
    await enquiry.update({ status });
    return enquiry;
  }

  /**
   * Generate WhatsApp reply link
   */
  async getWhatsAppLink(id) {
    const enquiry = await enquiryRepository.findById(id);
    if (!enquiry) {
      const err = new Error('Enquiry not found.');
      err.statusCode = 404;
      throw err;
    }

    const replyText = `Hello ${enquiry.name}! This is Hills Angel Tours and Travels responding to your enquiry: "${enquiry.message}". How can we help you plan your hill-station holiday?`;
    const whatsappUrl = generateWhatsAppLink(enquiry.phone, replyText);

    return {
      whatsappUrl,
      replyText,
    };
  }
}

export default new EnquiryService();
