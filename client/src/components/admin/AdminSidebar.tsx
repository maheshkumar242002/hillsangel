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
  Navigation,
  Building2,
  Users,
  ExternalLink,
  LogOut,
  X,
  LucideIcon,
  Car,
  Home,
  UtensilsCrossed,
  Calculator,
  MapPin,
  Receipt,
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
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'OPERATIONS',
    items: [
      { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
      { name: 'Destination Master', path: '/admin/destinations', icon: MapPin },
      { name: 'Package Master', path: '/admin/packages', icon: Compass },
      { name: 'Bookings', path: '/admin/bookings', icon: CalendarCheck },
      { name: 'Enquiries', path: '/admin/enquiries', icon: MessageSquare },
    ],
  },
  {
    title: 'FLEET & SAFARI',
    items: [
      { name: 'Vehicle Master', path: '/admin/vehicles', icon: Car },
      { name: 'Driver Master', path: '/admin/drivers', icon: Users },
      {
        name: 'Live GPS Fleet',
        path: '/admin/tracking',
        icon: Navigation,
        badge: 'LIVE',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      },
      { name: 'Assets & Gear', path: '/admin/assets', icon: Boxes },
      { name: 'Asset & Vehicle Expenses', path: '/admin/company-partners?tab=expenses', icon: Receipt },
    ],
  },
  {
    title: 'STAYS & DINING',
    items: [
      { name: 'Cottages & Stays', path: '/admin/cottages', icon: Home },
      { name: 'Restaurants & Food', path: '/admin/restaurants', icon: UtensilsCrossed },
      { name: 'Tie-up Settlements', path: '/admin/partners', icon: Calculator },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      { name: 'Company Partners', path: '/admin/company-partners', icon: Building2 },
      { name: 'Gallery Media', path: '/admin/gallery', icon: Film },
      { name: 'Platform Settings', path: '/admin/settings', icon: Settings },
    ],
  },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const { logout, admin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#142318] text-white border-r border-[#223928] overflow-hidden select-none">
      {/* Brand Header */}
      <div className="p-4 px-5 border-b border-white/8 shrink-0 bg-[#111e15]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-sm ring-1 ring-white/10 shrink-0">
              <Compass className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <span className="font-serif font-bold text-base block leading-tight text-white tracking-wide">
                Hills Angel
              </span>
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold block mt-0.5">
                Admin Console
              </span>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              aria-label="Close admin menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Grouped Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto min-h-0 px-3 py-3 sidebar-scroll space-y-4">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold text-emerald-400/70 tracking-widest uppercase">
              {section.title}
            </div>

            <nav className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.exact}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                        isActive
                          ? 'bg-emerald-600 text-white font-semibold shadow-xs ring-1 ring-emerald-400/40'
                          : 'text-gray-300 hover:bg-white/6 hover:text-white'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className="w-4 h-4 shrink-0 text-emerald-300 group-hover:scale-105 transition-transform" />
                      <span className="truncate">{item.name}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider flex items-center gap-1 ${
                          item.badgeColor || 'bg-white/10 text-white'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Pinned Sticky Bottom Profile */}
      <div className="p-3.5 border-t border-white/8 shrink-0 bg-[#0f1b13] space-y-2 pb-safe">
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-gray-300 hover:bg-white/6 hover:text-white transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            <span>View Public Site</span>
          </span>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-semibold">
            Live
          </span>
        </Link>

        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/4 border border-white/6">
          <div className="min-w-0 flex-1 pr-2">
            <p className="text-xs font-semibold text-white truncate">{admin?.name || 'Administrator'}</p>
            <p className="text-[10px] text-gray-400 truncate">{admin?.email || 'admin@hillsangels.com'}</p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-rose-300 hover:text-rose-200 hover:bg-rose-500/20 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar - Natural Flex Sibling */}
      <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col h-full z-30">
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
          <div className="relative w-72 max-w-xs h-full bg-[#142318] shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;
