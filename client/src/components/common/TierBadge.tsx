import React from 'react';
import { Crown, Sparkles } from 'lucide-react';
import { PackageTier } from '../../types';

export interface TierBadgeProps {
  tier?: PackageTier | string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const TierBadge: React.FC<TierBadgeProps> = ({
  tier,
  className = '',
  size = 'md',
}) => {
  const isExtraPremium = tier === 'extra_premium' || tier === 'extra premium';

  const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
    sm: 'text-xs px-2.5 py-0.5 gap-1',
    md: 'text-xs px-3 py-1 gap-1.5',
    lg: 'text-sm px-4 py-1.5 gap-2',
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  if (isExtraPremium) {
    return (
      <span
        className={`inline-flex items-center font-semibold rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-stone-900 shadow-sm border border-yellow-200/50 ${selectedSize} ${className}`}
      >
        <Crown className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5 text-amber-950'} />
        <span>Extra Premium</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full bg-primary-light text-primary-dark border border-primary/20 ${selectedSize} ${className}`}
    >
      <Sparkles className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5 text-primary'} />
      <span>Premium</span>
    </span>
  );
};

export default TierBadge;
