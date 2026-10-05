import React from 'react';

export const PackageCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm animate-pulse flex flex-col h-full">
      <div className="aspect-[4/3] bg-gray-200 w-full" />
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          <div className="flex gap-2">
            <div className="h-5 w-20 bg-gray-200 rounded-full" />
            <div className="h-5 w-24 bg-gray-200 rounded-full" />
          </div>
          <div className="h-6 w-3/4 bg-gray-200 rounded-md" />
          <div className="h-4 w-1/2 bg-gray-200 rounded-md" />
        </div>
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-3 w-12 bg-gray-200 rounded" />
            <div className="h-6 w-24 bg-gray-200 rounded" />
          </div>
          <div className="h-9 w-24 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export const PackageGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <PackageCardSkeleton key={i} />
      ))}
    </div>
  );
};

export const StatCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm animate-pulse space-y-3">
      <div className="flex justify-between items-center">
        <div className="h-4 w-24 bg-gray-200 rounded" />
        <div className="w-10 h-10 bg-gray-200 rounded-xl" />
      </div>
      <div className="h-8 w-32 bg-gray-200 rounded" />
      <div className="h-3 w-20 bg-gray-200 rounded" />
    </div>
  );
};
