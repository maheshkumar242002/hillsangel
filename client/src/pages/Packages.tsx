import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Compass, RotateCcw, AlertCircle } from 'lucide-react';
import { getPackages } from '../api/packages';
import PackageCard from '../components/packages/PackageCard';
import FilterSheet, { FilterState } from '../components/packages/FilterSheet';
import BookingModal from '../components/booking/BookingModal';
import { PackageGridSkeleton } from '../components/common/Skeleton';
import { IPackage } from '../types';

export default function Packages(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filters from query params
  const [filters, setFilters] = useState<FilterState>({
    category: searchParams.get('category') || 'all',
    tier: searchParams.get('tier') || 'all',
    destination: searchParams.get('destination') || 'all',
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || 'featured',
  });

  const [packages, setPackages] = useState<IPackage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [selectedBookingPkg, setSelectedBookingPkg] = useState<IPackage | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState<boolean>(false);

  // Sync state changes with URL query parameters
  useEffect(() => {
    const params: Record<string, string> = {};
    if (filters.category !== 'all') params.category = filters.category;
    if (filters.tier !== 'all') params.tier = filters.tier;
    if (filters.destination !== 'all') params.destination = filters.destination;
    if (filters.search) params.search = filters.search;
    if (filters.sort !== 'featured') params.sort = filters.sort;
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Fetch packages whenever filters or page changes
  useEffect(() => {
    const fetchPackageList = async (): Promise<void> => {
      setLoading(true);
      try {
        const queryParams = {
          category: filters.category,
          tier: filters.tier,
          destination: filters.destination,
          search: filters.search,
          sort: filters.sort,
          page,
          limit: 12,
        };

        const res = await getPackages(queryParams);
        if (res.success) {
          setPackages(res.packages || []);
          setTotalCount(res.total || 0);
          setTotalPages(res.totalPages || 1);
        }
      } catch (err) {
        console.error('Failed to load packages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPackageList();
  }, [filters, page]);

  const handleFilterChange = (key: keyof FilterState, value: string): void => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setPage(1); // Reset to first page
  };

  const handleResetFilters = (): void => {
    setFilters({
      category: 'all',
      tier: 'all',
      destination: 'all',
      search: '',
      sort: 'featured',
    });
    setPage(1);
  };

  const openBooking = (pkg: IPackage): void => {
    setSelectedBookingPkg(pkg);
    setBookingModalOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>Tour Packages | Hills Angel Tours and Travels</title>
        <meta
          name="description"
          content="Explore Ooty, Munnar, and Kodaikanal packages. Choose between Couple and Stranger categories, and Premium or Extra-Premium luxury."
        />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Page Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <Compass className="w-4 h-4" />
            <span>Hill-Station Catalog</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-text">
            Explore Hill Station Packages
          </h1>
          <p className="text-xs sm:text-sm text-muted max-w-2xl">
            Choose by traveler type (romantic Couple retreat or social Stranger group trail) and comfort tier (Premium 3★ or Extra Premium 5★ luxury villa).
          </p>
        </div>

        {/* Filter Controls (Desktop Pills + Mobile Bottom Sheet Drawer) */}
        <FilterSheet
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          totalResults={totalCount}
        />

        {/* Packages Grid or Empty State */}
        {loading ? (
          <PackageGridSkeleton count={6} />
        ) : packages.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-xl font-bold text-text">
              No matching packages found
            </h3>
            <p className="text-xs sm:text-sm text-muted">
              We couldn't find any packages matching your current filter criteria. Try adjusting the destination, category, or tier.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold shadow-elaichi active:scale-95 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset All Filters</span>
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {packages.map((pkg) => (
                <PackageCard key={pkg._id || pkg.id} pkg={pkg} onBookNow={openBooking} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-text disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface"
                >
                  Previous
                </button>
                <span className="text-xs font-medium text-muted px-3">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-text disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global Booking Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        selectedPackage={selectedBookingPkg}
      />
    </>
  );
}
