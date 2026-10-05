import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from './AdminSidebar';
import AdminTopBar from './AdminTopBar';

export default function AdminLayout(): React.ReactElement {
  const { isAuthenticated, loading } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Derive title from current path
  const getPageTitle = (pathname: string): string => {
    if (pathname.includes('/packages')) return 'Packages Management';
    if (pathname.includes('/bookings')) return 'Bookings Management';
    if (pathname.includes('/enquiries')) return 'Customer Enquiries';
    if (pathname.includes('/settings')) return 'Platform Settings';
    return 'Executive Dashboard';
  };

  return (
    <div className="min-h-screen bg-[#F6FAF6] flex">
      {/* Sidebar (Desktop persistent + Mobile drawer) */}
      <AdminSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Workspace (md:pl-64) */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        <AdminTopBar
          onMenuClick={() => setMobileSidebarOpen(true)}
          title={getPageTitle(location.pathname)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-safe">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
