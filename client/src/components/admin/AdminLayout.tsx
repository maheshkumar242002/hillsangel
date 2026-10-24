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
    if (pathname.includes('/tracking')) return 'Live Vehicle GPS Fleet Tracking';
    if (pathname.includes('/drivers')) return 'Mountain Chauffeur & Driver Master';
    if (pathname.includes('/vehicles')) return 'Vehicle Master & Fleet Management';
    if (pathname.includes('/cottages')) return 'Cottage & Resort Master';
    if (pathname.includes('/restaurants')) return 'Restaurant & Dining Master';
    if (pathname.includes('/packages')) return 'Packages Management';
    if (pathname.includes('/bookings')) return 'Bookings Management';
    if (pathname.includes('/enquiries')) return 'Customer Enquiries';
    if (pathname.includes('/assets')) return 'Assets & Fleet Management';
    if (pathname.includes('/partners')) return 'Partner Tie-ups & Settlements';
    if (pathname.includes('/company-partners')) return 'Company Partners & Profit Sharing';
    if (pathname.includes('/gallery')) return 'Gallery Management';
    if (pathname.includes('/settings')) return 'Platform Settings';
    return 'Executive Dashboard';
  };


  return (
    <div className="h-screen w-screen bg-[#F6FAF6] flex overflow-hidden">
      {/* Sidebar (Desktop persistent + Mobile drawer) */}
      <AdminSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Workspace (Independent Scroll, Zero Overlap) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
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

