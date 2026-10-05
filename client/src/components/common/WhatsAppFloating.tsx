import React from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { getWhatsAppUrl } from '../../utils/whatsapp';

export const WhatsAppFloating: React.FC = () => {
  const { settings } = useSettings();
  const location = useLocation();

  // If on package details page (/packages/:slug), elevate the floating button
  // so it floats above the sticky bottom action bar (which is ~76px high)
  const isPackageDetailsPage =
    location.pathname.startsWith('/packages/') && location.pathname !== '/packages';

  // Do not show on admin pages to keep the admin workspace clean
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const defaultMessage =
    '🌿 Hello Hills Angel Tours! I would like to enquire about your hill-station tour packages.';
  const whatsappUrl = getWhatsAppUrl(settings.whatsappNumber, defaultMessage);

  return (
    <aside
      aria-label="Direct WhatsApp assistance"
      className={`fixed right-4 z-40 transition-all duration-300 ${
        isPackageDetailsPage
          ? 'bottom-24 md:bottom-6' // Raised above sticky bottom action bar on mobile package pages
          : 'bottom-6'
      }`}
      style={{
        marginBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white p-3.5 md:px-5 md:py-3 rounded-full shadow-lg hover:shadow-2xl active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#25D366]/40 min-h-[48px] min-w-[48px]"
        aria-label="Chat with Hills Angel Tours on WhatsApp"
      >
        <MessageCircle className="w-6 h-6 fill-current text-white shrink-0 group-hover:scale-110 transition-transform" />
        <span className="hidden md:inline-block text-sm font-semibold tracking-wide">
          Chat with Us
        </span>
      </a>
    </aside>
  );
};

export default WhatsAppFloating;
