import React, { useState } from 'react';
import { SlidersHorizontal, X, Search, RotateCcw } from 'lucide-react';

export interface FilterState {
  category: string;
  tier: string;
  destination: string;
  search: string;
  sort: string;
}

export interface FilterSheetProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onResetFilters: () => void;
  totalResults?: number;
}

export const FilterSheet: React.FC<FilterSheetProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalResults = 0,
}) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);

  const categories = [
    { id: 'all', label: 'All Packages' },
    { id: 'couple', label: 'Couple (Private 2P)' },
    { id: 'stranger', label: 'Stranger (Solo Group)' },
  ];

  const tiers = [
    { id: 'all', label: 'All Tiers' },
    { id: 'premium', label: 'Premium (3★ Resort)' },
    { id: 'extra_premium', label: 'Extra Premium (5★ Luxury / Villa)' },
  ];

  const destinations = ['all', 'Ooty', 'Munnar', 'Kodaikanal'];

  const sortOptions = [
    { id: 'featured', label: 'Recommended / Featured' },
    { id: 'price-asc', label: 'Price: Low to High' },
    { id: 'price-desc', label: 'Price: High to Low' },
    { id: 'duration-asc', label: 'Duration: Short to Long' },
  ];

  // Count active filters
  const activeCount = [
    filters.category !== 'all' ? filters.category : null,
    filters.tier !== 'all' ? filters.tier : null,
    filters.destination !== 'all' ? filters.destination : null,
    filters.search ? 'search' : null,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Top Search & Mobile Filter Trigger Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search input with tap target */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
            placeholder="Search by destination, hill peak, or experience..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all min-h-[44px]"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mobile Filter Button (opens bottom sheet) */}
        <div className="flex items-center gap-2 sm:hidden">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="flex-1 min-h-[44px] flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-text shadow-sm active:scale-95 transition-all"
            aria-label="Open filter options"
          >
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            <span>Filters</span>
            {activeCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
                {activeCount}
              </span>
            )}
          </button>

          {/* Quick mobile sort dropdown */}
          <select
            value={filters.sort || 'featured'}
            onChange={(e) => onFilterChange('sort', e.target.value)}
            className="min-h-[44px] bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Sort packages"
          >
            {sortOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Desktop Quick Sort */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs text-muted font-medium whitespace-nowrap">Sort by:</span>
          <select
            value={filters.sort || 'featured'}
            onChange={(e) => onFilterChange('sort', e.target.value)}
            className="min-h-[44px] bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            {sortOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Desktop Filter Pills Row */}
      <div className="hidden sm:flex flex-wrap items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
        {/* Destination tabs */}
        <div className="flex items-center gap-1.5 border-r border-gray-200 pr-4">
          <span className="text-xs font-semibold text-muted mr-1">Destination:</span>
          {destinations.map((dest) => (
            <button
              key={dest}
              type="button"
              onClick={() => onFilterChange('destination', dest)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filters.destination === dest
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface text-text hover:bg-gray-200'
              }`}
            >
              {dest === 'all' ? 'All Hills' : dest}
            </button>
          ))}
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-1.5 border-r border-gray-200 pr-4">
          <span className="text-xs font-semibold text-muted mr-1">Traveller:</span>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onFilterChange('category', cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filters.category === cat.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface text-text hover:bg-gray-200'
              }`}
            >
              {cat.id === 'all' ? 'All' : cat.id === 'couple' ? 'Couple' : 'Stranger'}
            </button>
          ))}
        </div>

        {/* Tier tabs */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-muted mr-1">Comfort Tier:</span>
          {tiers.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onFilterChange('tier', t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filters.tier === t.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface text-text hover:bg-gray-200'
              }`}
            >
              {t.id === 'all' ? 'All' : t.id === 'premium' ? 'Premium' : 'Extra Premium'}
            </button>
          ))}
        </div>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={onResetFilters}
            className="ml-auto inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium py-1.5 px-2.5 rounded-lg hover:bg-rose-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Active Filter Chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-muted font-medium">Active filters:</span>

          {filters.destination !== 'all' && (
            <span className="inline-flex items-center gap-1 text-xs bg-primary-light text-primary-dark font-medium px-2.5 py-1 rounded-full">
              <span>{filters.destination}</span>
              <button
                type="button"
                onClick={() => onFilterChange('destination', 'all')}
                className="hover:text-red-600"
                aria-label={`Remove ${filters.destination} filter`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.category !== 'all' && (
            <span className="inline-flex items-center gap-1 text-xs bg-rose-50 text-rose-700 font-medium px-2.5 py-1 rounded-full border border-rose-200">
              <span>{filters.category === 'couple' ? 'Couple' : 'Stranger'}</span>
              <button
                type="button"
                onClick={() => onFilterChange('category', 'all')}
                className="hover:text-red-600"
                aria-label="Remove category filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.tier !== 'all' && (
            <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-800 font-medium px-2.5 py-1 rounded-full border border-amber-200">
              <span>{filters.tier === 'extra_premium' ? 'Extra Premium' : 'Premium'}</span>
              <button
                type="button"
                onClick={() => onFilterChange('tier', 'all')}
                className="hover:text-red-600"
                aria-label="Remove tier filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.search && (
            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 font-medium px-2.5 py-1 rounded-full">
              <span>"{filters.search}"</span>
              <button
                type="button"
                onClick={() => onFilterChange('search', '')}
                className="hover:text-red-600"
                aria-label="Clear search keyword"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs text-primary font-semibold hover:underline ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* MOBILE BOTTOM SHEET MODAL */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 sm:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Bottom Sheet Drawer */}
          <div className="relative bg-white rounded-t-3xl shadow-2xl max-h-[85dvh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Sheet Handle */}
            <div className="pt-3 pb-1 flex justify-center">
              <div className="w-12 h-1.5 rounded-full bg-gray-300" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-primary" />
                <h3 className="font-serif text-lg font-bold text-text">Filter Tours</h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-full"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sheet Body (Scrollable) */}
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Destination */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2.5">
                  Hill Destination
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {destinations.map((dest) => (
                    <button
                      key={dest}
                      type="button"
                      onClick={() => onFilterChange('destination', dest)}
                      className={`min-h-[44px] px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                        filters.destination === dest
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-surface text-text border-gray-200'
                      }`}
                    >
                      {dest === 'all' ? 'All Destinations' : dest}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2.5">
                  Traveller Type
                </label>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => onFilterChange('category', cat.id)}
                      className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold border text-left flex items-center justify-between transition-all ${
                        filters.category === cat.id
                          ? 'bg-primary-light text-primary-dark border-primary'
                          : 'bg-surface text-text border-gray-200'
                      }`}
                    >
                      <span>{cat.label}</span>
                      {filters.category === cat.id && <span className="text-primary font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tier */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2.5">
                  Comfort Tier
                </label>
                <div className="space-y-2">
                  {tiers.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onFilterChange('tier', t.id)}
                      className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold border text-left flex items-center justify-between transition-all ${
                        filters.tier === t.id
                          ? 'bg-primary-light text-primary-dark border-primary'
                          : 'bg-surface text-text border-gray-200'
                      }`}
                    >
                      <span>{t.label}</span>
                      {filters.tier === t.id && <span className="text-primary font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center gap-3 pb-safe">
              <button
                type="button"
                onClick={onResetFilters}
                className="flex-1 min-h-[48px] px-4 rounded-xl text-xs font-semibold text-gray-700 bg-white border border-gray-200 active:scale-95 transition-transform"
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex-1 min-h-[48px] px-4 rounded-xl text-xs font-semibold text-white bg-primary shadow-elaichi active:scale-95 transition-transform"
              >
                Apply Filters ({totalResults})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterSheet;
