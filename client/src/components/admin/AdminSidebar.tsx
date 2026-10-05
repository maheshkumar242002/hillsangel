import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  CalendarCheck,
  MessageSquare,
  Boxes,
  Film,
  Settings,
  ExternalLink,
  LogOut,
  X,
  LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface AdminSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  exact?: boolean;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const { logout, admin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navItems: NavItem[] = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'Packages', path: '/admin/packages', icon: Compass },
    { name: 'Bookings', path: '/admin/bookings', icon: CalendarCheck },
    { name: 'Assets & Fleet', path: '/admin/assets', icon: Boxes },
    { name: 'Gallery Media', path: '/admin/gallery', icon: Film },
    { name: 'Enquiries', path: '/admin/enquiries', icon: MessageSquare },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between bg-[#192D20] text-white p-5 border-r border-[#2C4834]">
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-emerald-500 to-primary flex items-center justify-center text-white shadow-sm">
              <Compass className="w-5 h-5 text-accent-light" />
            </div>
            <div>
              <span className="font-serif font-bold text-base block leading-tight">
                Hills Angel
              </span>
              <span className="text-[10px] uppercase tracking-wider text-accent block">
                Admin Console
              </span>
            </div>
          </div>

          {/* Close button on mobile */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white"
              aria-label="Close admin menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="mt-6 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-elaichi font-semibold'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0 text-accent-light" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      <div className="pt-6 border-t border-white/10 space-y-3 pb-safe">
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-accent" />
            <span>View Public Site</span>
          </span>
          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-accent">Live</span>
        </Link>

        <div className="px-3.5 py-2">
          <p className="text-xs font-semibold text-white truncate">{admin?.name || 'Administrator'}</p>
          <p className="text-[11px] text-gray-400 truncate">{admin?.email}</p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition-colors min-h-[44px]"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-xs h-full bg-[#192D20] shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;
