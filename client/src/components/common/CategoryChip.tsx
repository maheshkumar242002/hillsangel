import React from 'react';
import { Users, Compass, Heart } from 'lucide-react';
import { PackageCategory } from '../../types';

export interface CategoryChipProps {
  category?: PackageCategory | string;
  className?: string;
  showLabel?: boolean;
}

export const CategoryChip: React.FC<CategoryChipProps> = ({
  category,
  className = '',
  showLabel = true,
}) => {
  const cat = category?.toLowerCase() || '';

  if (cat === 'family' || cat === 'couple') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 ${className}`}
      >
        <Users className="w-3.5 h-3.5 text-emerald-600" />
        {showLabel && <span>Family Trip</span>}
      </span>
    );
  }

  // Friends Trip
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 ${className}`}
    >
      <Compass className="w-3.5 h-3.5 text-amber-700" />
      {showLabel && <span>Friends Trip</span>}
    </span>
  );
};

export default CategoryChip;
