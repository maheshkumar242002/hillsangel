import { IEnquiry } from '../types';
import { getWhatsAppUrl, DEFAULT_WHATSAPP_NUMBER } from '../utils/whatsapp';

export interface CreateEnquiryInput {
  name: string;
  phone: string;
  email?: string;
  subject?: string;
  message: string;
}

export interface EnquiriesApiResponse {
  success: boolean;
  count: number;
  total: number;
  totalPages: number;
  currentPage: number;
  enquiries: IEnquiry[];
}

const STORAGE_KEY = 'ha_mock_enquiries';

const initialEnquiries: IEnquiry[] = [
  {
    _id: 'enq-1',
    name: 'Rohit Verma',
    phone: '9876543210',
    email: 'rohit@example.com',
    subject: 'Couple Trip to Munnar in December',
    message: 'We are planning our honeymoon in Munnar for 3 days. Can you provide custom candlelight dinner details?',
    status: 'unread',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    _id: 'enq-2',
    name: 'Sneha Patel',
    phone: '9823456789',
    email: 'sneha.p@gmail.com',
    subject: 'Stranger Solo Trip to Ooty',
    message: 'Hi, are solo female travelers safe in your stranger group trails? Looking to join the upcoming weekend.',
    status: 'read',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

function getStoredEnquiries(): IEnquiry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return [...initialEnquiries];
}

function saveEnquiries(list: IEnquiry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {}
}

export const createEnquiry = async (
  enquiryData: CreateEnquiryInput
): Promise<{ success: boolean; message: string; enquiryId: string }> => {
  await new Promise((resolve) => setTimeout(resolve, 100));

  const list = getStoredEnquiries();
  const newEnquiry: IEnquiry = {
    _id: `enq-${Date.now()}`,
    name: enquiryData.name,
    phone: enquiryData.phone,
    email: enquiryData.email,
    subject: enquiryData.subject || 'General Enquiry',
    message: enquiryData.message,
    status: 'unread',
    createdAt: new Date().toISOString(),
  };

  list.unshift(newEnquiry);
  saveEnquiries(list);

  return {
    success: true,
    message: 'Thank you! Your enquiry has been received. Our team will contact you shortly.',
    enquiryId: newEnquiry._id || 'enq-1',
  };
};

export const getEnquiries = async (
  params: { status?: string; page?: number; limit?: number } = {}
): Promise<EnquiriesApiResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 80));

  let list = getStoredEnquiries();
  if (params.status && params.status !== 'all') {
    list = list.filter((e) => e.status === params.status);
  }

  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startIndex = (page - 1) * limit;
  const paginated = list.slice(startIndex, startIndex + limit);

  return {
    success: true,
    count: paginated.length,
    total,
    totalPages,
    currentPage: page,
    enquiries: paginated,
  };
};

export const updateEnquiryStatus = async (
  id: string,
  status: 'unread' | 'read' | 'replied'
): Promise<{ success: boolean; message: string; enquiry: IEnquiry }> => {
  const list = getStoredEnquiries();
  const index = list.findIndex((e) => e._id === id);
  if (index === -1) throw new Error('Enquiry not found');
  list[index].status = status;
  saveEnquiries(list);
  return {
    success: true,
    message: `Enquiry status changed to ${status}`,
    enquiry: list[index],
  };
};

export const deleteEnquiry = async (id: string): Promise<{ success: boolean; message: string }> => {
  let list = getStoredEnquiries();
  list = list.filter((e) => e._id !== id);
  saveEnquiries(list);
  return {
    success: true,
    message: 'Enquiry deleted successfully',
  };
};

export const getEnquiryWhatsAppLink = async (
  id: string
): Promise<{ success: boolean; whatsappUrl: string }> => {
  const list = getStoredEnquiries();
  const enquiry = list.find((e) => e._id === id);
  const text = enquiry
    ? `🌿 Hello ${enquiry.name}! Regarding your Hills Angel enquiry: "${enquiry.subject}" - How can we assist you today?`
    : 'Hello from Hills Angel Tours!';
  const whatsappUrl = getWhatsAppUrl(enquiry?.phone || DEFAULT_WHATSAPP_NUMBER, text);

  return {
    success: true,
    whatsappUrl,
  };
};
