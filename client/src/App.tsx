import React, { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import WhatsAppFloating from './components/common/WhatsAppFloating';

// Code-split routes with React.lazy
const Home = lazy(() => import('./pages/Home'));
const Packages = lazy(() => import('./pages/Packages'));
const PackageDetails = lazy(() => import('./pages/PackageDetails'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const Contact = lazy(() => import('./pages/Contact'));
const BookingSuccess = lazy(() => import('./pages/BookingSuccess'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Admin Routes
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminPackages = lazy(() => import('./pages/admin/AdminPackages'));
const AdminBookings = lazy(() => import('./pages/admin/AdminBookings'));
const AdminEnquiries = lazy(() => import('./pages/admin/AdminEnquiries'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminAssets = lazy(() => import('./pages/admin/AdminAssets'));
const AdminGallery = lazy(() => import('./pages/admin/AdminGallery'));

function RouteLoader(): React.ReactElement {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-3">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-muted font-medium">Loading experience...</span>
    </div>
  );
}

export default function App(): React.ReactElement {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-[100dvh] flex flex-col bg-white text-text">
      {/* Toast notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: '16px',
            background: '#1F2D24',
            color: '#FFFFFF',
            fontSize: '13px',
          },
        }}
      />

      {/* Public Navbar (Hidden on admin portal) */}
      {!isAdminRoute && <Navbar />}

      {/* Main Routes */}
      <div className="flex-1 flex flex-col">
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/packages" element={<Packages />} />
            <Route path="/packages/:slug" element={<PackageDetails />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/booking-success" element={<BookingSuccess />} />

            {/* Admin Authentication */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Admin Protected Console */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="packages" element={<AdminPackages />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="assets" element={<AdminAssets />} />
              <Route path="gallery" element={<AdminGallery />} />
              <Route path="enquiries" element={<AdminEnquiries />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>

      {/* Public Floating WhatsApp Button & Footer */}
      {!isAdminRoute && (
        <>
          <WhatsAppFloating />
          <Footer />
        </>
      )}
    </div>
  );
}
