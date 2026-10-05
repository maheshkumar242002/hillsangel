import React, { useState, useEffect } from 'react';
import { Trash2, MessageCircle, Phone, Mail } from 'lucide-react';
import { getEnquiries, updateEnquiryStatus, deleteEnquiry, getEnquiryWhatsAppLink } from '../../api/enquiries';
import { formatDate } from '../../utils/formatters';
import { openWhatsAppSafely } from '../../utils/whatsapp';
import toast from 'react-hot-toast';
import { IEnquiry } from '../../types';

export default function AdminEnquiries(): React.ReactElement {
  const [enquiries, setEnquiries] = useState<IEnquiry[]>([]);
  const [, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchEnquiryList = async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await getEnquiries({ status: filterStatus, limit: 100 });
      if (res.success) {
        setEnquiries(res.enquiries || []);
      }
    } catch (err) {
      toast.error('Failed to load enquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiryList();
  }, [filterStatus]);

  const handleStatusChange = async (id: string, status: string): Promise<void> => {
    try {
      const res = await updateEnquiryStatus(id, status as 'read' | 'replied' | 'unread');
      if (res.success) {
        toast.success(`Enquiry marked as ${status}`);
        setEnquiries((prev) =>
          prev.map((e) => (e._id === id ? { ...e, status: status as IEnquiry['status'] } : e))
        );
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!window.confirm('Delete this customer enquiry?')) return;
    try {
      const res = await deleteEnquiry(id);
      if (res.success) {
        toast.success('Enquiry deleted');
        setEnquiries((prev) => prev.filter((e) => e._id !== id));
      }
    } catch (err) {
      toast.error('Failed to delete enquiry');
    }
  };

  const handleWhatsAppReply = async (id: string): Promise<void> => {
    try {
      const res = await getEnquiryWhatsAppLink(id);
      if (res.success && res.whatsappUrl) {
        openWhatsAppSafely(res.whatsappUrl);
        handleStatusChange(id, 'replied');
      }
    } catch (err) {
      toast.error('Failed to generate WhatsApp reply');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-text">
            Customer Inquiries & Messages
          </h2>
          <p className="text-xs text-muted">
            Respond to traveler questions and initiate WhatsApp chats directly.
          </p>
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-text focus:outline-none min-h-[40px] shadow-sm self-start sm:self-auto"
        >
          <option value="all">All Enquiries</option>
          <option value="unread">Unread Only</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
        </select>
      </div>

      {enquiries.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-muted text-xs border border-gray-100">
          No customer enquiries found in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enquiries.map((enq) => (
            <div
              key={enq._id}
              className={`bg-white rounded-2xl border p-5 shadow-sm space-y-3 flex flex-col justify-between ${
                enq.status === 'unread' ? 'border-primary/50 bg-primary-light/10' : 'border-gray-100'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      enq.status === 'unread'
                        ? 'bg-amber-100 text-amber-800'
                        : enq.status === 'replied'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {enq.status}
                  </span>
                  <span className="text-[11px] text-muted">{formatDate(enq.createdAt)}</span>
                </div>

                <div>
                  <h4 className="font-bold text-text text-sm">{enq.name}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted mt-0.5">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-primary" />
                      <span>{enq.phone}</span>
                    </span>
                    {enq.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-primary" />
                        <span>{enq.email}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-surface rounded-xl text-xs space-y-1">
                  <span className="font-semibold text-text block">{enq.subject}</span>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{enq.message}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() =>
                    handleStatusChange(enq._id, enq.status === 'unread' ? 'read' : 'unread')
                  }
                  className="text-xs text-muted hover:text-text font-medium min-h-[36px]"
                >
                  Mark as {enq.status === 'unread' ? 'Read' : 'Unread'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDelete(enq._id)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Delete message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleWhatsAppReply(enq._id)}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#25D366] text-white text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-current" />
                    <span>Reply on WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
