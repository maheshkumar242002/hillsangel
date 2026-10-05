import React from 'react';
import { Heart, Users } from 'lucide-react';
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
  const isCouple = category?.toLowerCase() === 'couple';

  if (isCouple) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/80 ${className}`}
      >
        <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
        {showLabel && <span>Couple Package</span>}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80 ${className}`}
    >
      <Users className="w-3.5 h-3.5 text-emerald-700" />
      {showLabel && <span>Stranger Package</span>}
    </span>
  );
};

export default CategoryChip;
