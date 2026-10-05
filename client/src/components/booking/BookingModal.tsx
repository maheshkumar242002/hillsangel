import React, { useEffect } from 'react';
import { X, Compass } from 'lucide-react';
import BookingForm from './BookingForm';
import { IPackage, IBooking } from '../../types';

export interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackage: IPackage | null;
  onSuccess?: (booking: IBooking, whatsappUrl?: string) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  selectedPackage,
  onSuccess,
}) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container: Full-screen sheet on mobile, rounded modal on desktop */}
      <div
        className="relative w-full max-w-xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-surface/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-elaichi flex items-center justify-center text-white">
              <Compass className="w-4 h-4 text-accent-light" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-text">Reserve Your Trip</h3>
              <p className="text-xs text-muted">Direct booking with instant WhatsApp confirmation</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close booking modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 sm:p-6 overflow-y-auto pb-safe">
          <BookingForm
            selectedPackage={selectedPackage}
            onCancel={onClose}
            onSuccess={(booking, whatsappUrl) => {
              if (onSuccess) onSuccess(booking, whatsappUrl);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
