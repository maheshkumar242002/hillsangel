import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Compass, PhoneCall, Sparkles } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { getWhatsAppUrl } from '../../utils/whatsapp';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [scrolled, setScrolled] = useState<boolean>(false);
  const { settings } = useSettings();
  const location = useLocation();

  // Close drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle scroll blur effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock background scroll when drawer is open on mobile
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Tour Packages', path: '/packages' },
    { name: 'About Us', path: '/about' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Contact', path: '/contact' },
  ];

  const whatsappDirect = getWhatsAppUrl(
    settings.whatsappNumber,
    '🌿 Hello Hills Angel Tours! I would like to enquire about your hill station holiday packages.'
  );

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-primary-light/40 py-2.5'
            : 'bg-white/90 backdrop-blur-sm border-b border-gray-100 py-3.5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-primary rounded-xl p-1"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-elaichi flex items-center justify-center text-white shadow-elaichi group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5 text-accent-light" />
              </div>
              <div>
                <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-primary-dark block leading-tight">
                  Hills Angel
                </span>
                <span className="text-[10px] tracking-widest uppercase font-medium text-muted block">
                  Tours & Travels
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-primary-dark bg-primary-light/60 font-semibold'
                        : 'text-text/80 hover:text-primary-dark hover:bg-surface'
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              ))}
            </nav>

            {/* Desktop Right Actions */}
            <div className="hidden md:flex items-center gap-3">
              <a
                href={`tel:${settings.contactPhone?.replace(/\s+/g, '')}`}
                className="inline-flex items-center gap-1.5 text-xs text-text/80 hover:text-primary transition-colors py-2 px-2.5"
                aria-label="Call Hills Angel Tours"
              >
                <PhoneCall className="w-3.5 h-3.5 text-primary" />
                <span>{settings.contactPhone}</span>
              </a>

              <Link
                to="/packages"
                className="inline-flex items-center gap-2 bg-gradient-elaichi text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-elaichi hover:opacity-95 hover:shadow-elaichi-lg active:scale-95 transition-all"
              >
                <Sparkles className="w-4 h-4 text-accent-light" />
                <span>Book Your Trip</span>
              </Link>
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-2">
              <Link
                to="/packages"
                className="bg-primary text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm"
              >
                Book
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-text hover:bg-surface active:scale-95 transition-transform focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Open navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                <Menu className="w-6 h-6 text-primary-dark" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Off-Canvas Drawer (Rendered via Portal to document.body) */}
      {mobileMenuOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-50 md:hidden flex justify-end">
            {/* Full-screen Dark Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Off-canvas Drawer Panel */}
            <div className="relative w-[300px] max-w-[85vw] bg-white h-full shadow-2xl flex flex-col justify-between p-6 overflow-y-auto z-10 animate-in slide-in-from-right duration-300">
              <div>
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-5 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-elaichi flex items-center justify-center text-white shadow-elaichi">
                      <Compass className="w-5 h-5 text-accent-light" />
                    </div>
                    <div>
                      <span className="font-serif font-bold text-primary-dark block leading-tight text-base">
                        Hills Angel
                      </span>
                      <span className="text-[9px] tracking-widest uppercase font-medium text-muted block">
                        Tours & Travels
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-surface active:scale-95 transition-transform"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5 text-text" />
                  </button>
                </div>

                {/* Navigation Links */}
                <nav className="mt-6 flex flex-col space-y-1.5">
                  {navLinks.map((link) => (
                    <NavLink
                      key={link.path}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center min-h-[48px] px-4 rounded-xl text-sm font-semibold transition-colors ${
                          isActive
                            ? 'bg-primary-light text-primary-dark shadow-xs'
                            : 'text-text hover:bg-surface'
                        }`
                      }
                    >
                      {link.name}
                    </NavLink>
                  ))}
                </nav>
              </div>

              {/* Drawer Footer CTA */}
              <div className="pt-6 border-t border-gray-100 space-y-3 pb-safe">
                <Link
                  to="/packages"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full min-h-[48px] flex items-center justify-center gap-2 bg-gradient-elaichi text-white rounded-xl font-semibold shadow-elaichi active:scale-95 transition-transform text-sm"
                >
                  <Sparkles className="w-4 h-4 text-accent-light" />
                  <span>Book Your Trip Now</span>
                </Link>

                <a
                  href={whatsappDirect}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 border border-primary/30 text-primary-dark rounded-xl text-xs font-semibold hover:bg-primary-light/40 transition-colors"
                >
                  <span>Chat on WhatsApp</span>
                </a>

                <div className="text-center pt-2">
                  <Link
                    to="/admin/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xs text-muted hover:text-primary transition-colors underline"
                  >
                    Admin Portal
                  </Link>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default Navbar;
