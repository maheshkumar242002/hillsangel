import React from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface AdminTopBarProps {
  onMenuClick: () => void;
  title?: string;
}

export const AdminTopBar: React.FC<AdminTopBarProps> = ({ onMenuClick, title = 'Dashboard' }) => {
  const { admin } = useAuth();

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Button (Min 44x44px) */}
        <button
          type="button"
          onClick={onMenuClick}
          className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-gray-700 hover:bg-gray-100 active:scale-95 transition-all"
          aria-label="Open navigation sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>

        <h1 className="text-lg sm:text-xl font-bold font-serif text-text tracking-tight">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 bg-surface px-3 py-1.5 rounded-full border border-gray-200">
          <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
            {admin?.name?.charAt(0) || 'A'}
          </div>
          <span className="hidden sm:inline text-xs font-semibold text-text">
            {admin?.name || 'Admin'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default AdminTopBar;
