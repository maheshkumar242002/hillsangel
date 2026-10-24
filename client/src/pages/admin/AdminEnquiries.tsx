import React, { useState, useEffect } from 'react';
import { Trash2, MessageCircle, Phone, Mail } from 'lucide-react';
import { getEnquiries, updateEnquiryStatus, deleteEnquiry, getEnquiryWhatsAppLink } from '../../api/enquiries';
import { formatDate } from '../../utils/formatters';
import { openWhatsAppSafely } from '../../utils/whatsapp';
import { Card, Badge, Button, Select } from '../../components/common';
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unread':
        return <Badge variant="warning" dot pulse>Unread</Badge>;
      case 'replied':
        return <Badge variant="success" dot>Replied</Badge>;
      default:
        return <Badge variant="neutral">Read</Badge>;
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

        <div className="w-full sm:w-48">
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Enquiries</option>
            <option value="unread">Unread Only</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
          </Select>
        </div>
      </div>

      {enquiries.length === 0 ? (
        <Card className="p-12 text-center text-muted text-xs">
          No customer enquiries found in this category.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enquiries.map((enq) => (
            <Card
              key={enq._id}
              className={`flex flex-col justify-between ${
                enq.status === 'unread' ? 'ring-2 ring-primary/30 border-primary/40' : ''
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  {getStatusBadge(enq.status)}
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
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() =>
                    handleStatusChange(enq._id, enq.status === 'unread' ? 'read' : 'unread')
                  }
                >
                  Mark as {enq.status === 'unread' ? 'Read' : 'Unread'}
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                    onClick={() => handleDelete(enq._id)}
                    title="Delete message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="success"
                    size="sm"
                    leftIcon={<MessageCircle className="w-3.5 h-3.5 fill-current" />}
                    onClick={() => handleWhatsAppReply(enq._id)}
                  >
                    WhatsApp
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
