import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Phone, Mail, MapPin, Heart, ShieldCheck, Clock, Award, Lock } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { getWhatsAppUrl } from '../../utils/whatsapp';

export const Footer: React.FC = () => {
  const { settings } = useSettings();

  const whatsappLink = getWhatsAppUrl(
    settings.whatsappNumber,
    '🌿 Hello Hills Angel Tours! I would like to enquire about your packages.'
  );

  return (
    <footer className="bg-[#19261E] text-white pt-14 pb-20 md:pb-12 border-t border-primary-dark/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value Trust Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-12 border-b border-white/10">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <ShieldCheck className="w-6 h-6 text-accent shrink-0" />
            <div>
              <p className="text-xs font-semibold">100% Verified Stays</p>
              <p className="text-[11px] text-gray-400">Inspected hill resorts</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <Clock className="w-6 h-6 text-accent shrink-0" />
            <div>
              <p className="text-xs font-semibold">24/7 Trip Support</p>
              <p className="text-[11px] text-gray-400">Dedicated tour guide</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <Award className="w-6 h-6 text-gold-light shrink-0" />
            <div>
              <p className="text-xs font-semibold">Curated Tiers</p>
              <p className="text-[11px] text-gray-400">Premium & Extra-Premium</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <Heart className="w-6 h-6 text-rose-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold">Honeymoon & Solos</p>
              <p className="text-[11px] text-gray-400">Tailored experiences</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-10">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-elaichi flex items-center justify-center text-white shadow-elaichi">
                <Compass className="w-5 h-5 text-accent-light" />
              </div>
              <div>
                <span className="font-serif text-lg font-bold text-white block leading-tight">
                  Hills Angel
                </span>
                <span className="text-[10px] tracking-widest uppercase font-medium text-accent block">
                  Tours & Travels
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Your gateway to the Western Ghats & Nilgiris. We specialize in intimate couple getaways and vibrant social group trails for solo explorers.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href={settings.socialLinks?.instagram || '#'}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-primary transition-colors text-xs text-white"
                aria-label="Instagram"
              >
                IG
              </a>
              <a
                href={settings.socialLinks?.facebook || '#'}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-primary transition-colors text-xs text-white"
                aria-label="Facebook"
              >
                FB
              </a>
              <a
                href={settings.socialLinks?.youtube || '#'}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-primary transition-colors text-xs text-white"
                aria-label="YouTube"
              >
                YT
              </a>
            </div>
          </div>

          {/* Popular Destinations */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Hill Destinations
            </h4>
            <ul className="space-y-2.5 text-xs text-gray-300">
              <li>
                <Link to="/packages?destination=Ooty" className="hover:text-accent transition-colors block py-1">
                  Ooty Packages (Queen of Hills)
                </Link>
              </li>
              <li>
                <Link to="/packages?destination=Munnar" className="hover:text-accent transition-colors block py-1">
                  Munnar Packages (Tea Hills & Mist)
                </Link>
              </li>
              <li>
                <Link to="/packages?destination=Kodaikanal" className="hover:text-accent transition-colors block py-1">
                  Kodaikanal Packages (Princess of Hills)
                </Link>
              </li>
              <li>
                <Link to="/packages?category=couple" className="hover:text-accent transition-colors block py-1">
                  Couple Honeymoon Packages
                </Link>
              </li>
              <li>
                <Link to="/packages?category=stranger" className="hover:text-accent transition-colors block py-1">
                  Stranger Solo Group Trails
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-xs text-gray-300">
              <li>
                <Link to="/about" className="hover:text-accent transition-colors block py-1">
                  About Hills Angel
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="hover:text-accent transition-colors block py-1">
                  Traveler Gallery
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-accent transition-colors block py-1">
                  Contact & Enquiries
                </Link>
              </li>
              <li>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline block py-1 font-medium"
                >
                  Direct WhatsApp Support
                </a>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-accent transition-colors block py-1 text-gray-400">
                  Admin Dashboard Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Get in Touch
            </h4>
            <div className="flex items-start gap-2.5 text-xs text-gray-300">
              <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span>{settings.address}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-gray-300">
              <Phone className="w-4 h-4 text-accent shrink-0" />
              <a href={`tel:${settings.contactPhone?.replace(/\s+/g, '')}`} className="hover:underline">
                {settings.contactPhone}
              </a>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-gray-300">
              <Mail className="w-4 h-4 text-accent shrink-0" />
              <a href={`mailto:${settings.contactEmail}`} className="hover:underline">
                {settings.contactEmail}
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 mt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-4">
          <p>© {new Date().getFullYear()} Hills Angel Tours and Travels. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-white transition-colors">
              Terms & Conditions
            </Link>
            <span>•</span>
            <Link to="/admin/login" className="hover:text-accent text-gray-300 transition-colors inline-flex items-center gap-1.5 font-medium">
              <Lock className="w-3.5 h-3.5 text-accent" />
              <span>Admin</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
