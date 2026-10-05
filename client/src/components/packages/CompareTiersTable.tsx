import React from 'react';
import { Check } from 'lucide-react';
import { IPackage } from '../../types';
import TierBadge from '../common/TierBadge';
import { formatINR } from '../../utils/formatters';

export interface CompareTiersTableProps {
  currentPackage: IPackage;
  counterpartPackage?: IPackage | null;
  onSelectPackage?: (pkg: IPackage) => void;
}

export const CompareTiersTable: React.FC<CompareTiersTableProps> = ({
  currentPackage,
  counterpartPackage,
  onSelectPackage,
}) => {
  if (!currentPackage) return null;

  const isCurrentPremium = currentPackage.tier === 'premium';
  const premiumPkg = isCurrentPremium ? currentPackage : counterpartPackage;
  const extraPremiumPkg = isCurrentPremium ? counterpartPackage : currentPackage;

  // Comparison Matrix features
  const comparisonItems = [
    {
      feature: 'Resort / Stay Standard',
      premium: '3-Star Quality Heritage Resort / Swiss Valley Cottage',
      extra: '5-Star Luxury Private Villa / Jacuzzi Suite with Fireplace',
    },
    {
      feature: 'Transportation & Sightseeing',
      premium: currentPackage.category === 'couple' ? 'Private Dedicated AC Sedan' : 'AC Push-Back Tempo Traveller',
      extra: currentPackage.category === 'couple' ? 'Private Luxury SUV (Innova Crysta)' : 'Executive Luxury Force Urbania Coach',
    },
    {
      feature: 'Meal Plan Included',
      premium: 'Daily Breakfast & 4-Course Dinner',
      extra: 'All Gourmet Meals (Breakfast, Chef Lunch, Curated Dinners)',
    },
    {
      feature: 'Romantic / Social Special',
      premium: currentPackage.category === 'couple' ? 'Complimentary Bed Floral Decor & Cake' : 'Evening Campfire & Icebreaker Games',
      extra: currentPackage.category === 'couple' ? 'Private Candlelight Dinner & 45-Min Photoshoot' : 'Live BBQ Grill, Telescope Stargazing & Drone Reel',
    },
    {
      feature: 'Exclusivity & Support',
      premium: 'Dedicated Trip Coordinator & Sightseeing Passes',
      extra: 'VIP Concierge, Priority Access, High-Speed Boating / 4x4 Safari',
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-elaichi">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          Side-By-Side Comparison
        </span>
        <h3 className="font-serif text-2xl font-bold text-text mt-1">
          Premium vs. Extra Premium
        </h3>
        <p className="text-xs sm:text-sm text-muted mt-2">
          Compare accommodations, private transport, and exclusive mountain privileges for {currentPackage.destination}.
        </p>
      </div>

      {/* MOBILE STACKED CARDS VIEW (Under 768px) */}
      <div className="grid grid-cols-1 gap-6 md:hidden">
        {/* Premium Card */}
        <div
          className={`rounded-2xl border p-5 ${
            currentPackage.tier === 'premium'
              ? 'border-primary/40 bg-primary-light/10 ring-2 ring-primary/20'
              : 'border-gray-200 bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <TierBadge tier="premium" />
            {currentPackage.tier === 'premium' && (
              <span className="text-[11px] font-semibold text-primary">Viewing Now</span>
            )}
          </div>
          <div className="text-xl font-bold text-primary-dark">
            {premiumPkg ? formatINR(premiumPkg.price) : 'Contact for Price'}
            <span className="text-xs text-muted font-normal block">
              {currentPackage.priceUnit || 'per package'}
            </span>
          </div>

          <div className="mt-4 space-y-3 text-xs border-t border-gray-100 pt-4">
            {comparisonItems.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <span className="font-semibold text-gray-500 block">{item.feature}:</span>
                <span className="text-text font-medium flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span>{item.premium}</span>
                </span>
              </div>
            ))}
          </div>

          {counterpartPackage && currentPackage.tier !== 'premium' && (
            <button
              type="button"
              onClick={() => onSelectPackage && onSelectPackage(counterpartPackage)}
              className="mt-5 w-full min-h-[44px] py-2.5 rounded-xl border border-primary text-primary font-semibold text-xs hover:bg-primary-light/40 transition-colors"
            >
              Switch to Premium
            </button>
          )}
        </div>

        {/* Extra Premium Card */}
        <div
          className={`rounded-2xl border p-5 ${
            currentPackage.tier === 'extra_premium'
              ? 'border-amber-400/80 bg-amber-50/40 ring-2 ring-amber-400/30'
              : 'border-gray-200 bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <TierBadge tier="extra_premium" />
            {currentPackage.tier === 'extra_premium' && (
              <span className="text-[11px] font-semibold text-amber-800">Viewing Now</span>
            )}
          </div>
          <div className="text-xl font-bold text-amber-900">
            {extraPremiumPkg ? formatINR(extraPremiumPkg.price) : 'Contact for Price'}
            <span className="text-xs text-muted font-normal block">
              {currentPackage.priceUnit || 'per package'}
            </span>
          </div>

          <div className="mt-4 space-y-3 text-xs border-t border-gray-100 pt-4">
            {comparisonItems.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <span className="font-semibold text-gray-500 block">{item.feature}:</span>
                <span className="text-text font-medium flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{item.extra}</span>
                </span>
              </div>
            ))}
          </div>

          {counterpartPackage && currentPackage.tier !== 'extra_premium' && (
            <button
              type="button"
              onClick={() => onSelectPackage && onSelectPackage(counterpartPackage)}
              className="mt-5 w-full min-h-[44px] py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-900 font-semibold text-xs shadow-sm hover:opacity-95 transition-opacity"
            >
              Upgrade to Extra Premium
            </button>
          )}
        </div>
      </div>

      {/* DESKTOP SIDE-BY-SIDE TABLE VIEW (768px+) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-4 px-4 text-xs font-semibold text-muted uppercase tracking-wider w-1/4">
                Experience Feature
              </th>
              <th className="py-4 px-4 w-3/8 bg-surface/50 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <TierBadge tier="premium" />
                  {premiumPkg && (
                    <span className="text-sm font-bold text-primary-dark">
                      {formatINR(premiumPkg.price)}
                    </span>
                  )}
                </div>
              </th>
              <th className="py-4 px-4 w-3/8 bg-amber-50/40 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <TierBadge tier="extra_premium" />
                  {extraPremiumPkg && (
                    <span className="text-sm font-bold text-amber-900">
                      {formatINR(extraPremiumPkg.price)}
                    </span>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs">
            {comparisonItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-4 px-4 font-semibold text-gray-700">{item.feature}</td>
                <td className="py-4 px-4 text-text bg-surface/30">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{item.premium}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-text bg-amber-50/20">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span className="font-medium text-amber-950">{item.extra}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompareTiersTable;
