import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, Users, ArrowRight } from 'lucide-react';
import { IPackage } from '../../types';
import TierBadge from '../common/TierBadge';
import CategoryChip from '../common/CategoryChip';
import { formatINR } from '../../utils/formatters';

export interface PackageCardProps {
  pkg: IPackage;
  onBookNow?: (pkg: IPackage) => void;
}

export const PackageCard: React.FC<PackageCardProps> = ({ pkg, onBookNow }) => {
  if (!pkg) return null;

  const isStranger = pkg.category === 'stranger';
  const seatsLeft =
    pkg.seatsLeft !== undefined
      ? pkg.seatsLeft
      : Math.max(0, (pkg.maxSeats || 14) - (pkg.seatsBooked || 0));

  const coverImage =
    pkg.images?.[0] ||
    'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="group bg-white rounded-2xl border border-gray-100/80 shadow-elaichi hover:shadow-elaichi-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden">
      {/* Image Container with Aspect Ratio box to prevent layout shift */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
        <img
          src={coverImage}
          alt={pkg.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Gradient Overlay for badge contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
          <CategoryChip category={pkg.category} className="shadow-sm backdrop-blur-md bg-white/95" />
          <TierBadge tier={pkg.tier} className="shadow-sm backdrop-blur-md" />
        </div>

        {/* Bottom Destination & Duration Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-medium">
          <span className="inline-flex items-center gap-1 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg">
            <MapPin className="w-3.5 h-3.5 text-accent" />
            {pkg.destination}
          </span>
          <span className="inline-flex items-center gap-1 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-accent" />
            {pkg.duration?.days || 3}D / {pkg.duration?.nights || 2}N
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          <Link
            to={`/packages/${pkg.slug}`}
            className="block focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
          >
            <h3 className="font-serif text-lg font-bold text-text group-hover:text-primary transition-colors line-clamp-1">
              {pkg.title}
            </h3>
          </Link>

          {/* Stranger Seat Counter Alert */}
          {isStranger && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg w-fit">
              <Users className="w-3.5 h-3.5" />
              <span>
                {seatsLeft > 0 ? `${seatsLeft} seats left for next trail` : 'Batch Full'}
              </span>
            </div>
          )}

          {/* Highlights summary */}
          {pkg.highlights && pkg.highlights.length > 0 && (
            <ul className="text-xs text-muted space-y-1">
              {pkg.highlights.slice(0, 2).map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5 line-clamp-1">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pricing & CTA */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-bold text-primary-dark">
                {formatINR(pkg.price)}
              </span>
              {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                <span className="text-xs text-gray-400 line-through">
                  {formatINR(pkg.originalPrice)}
                </span>
              )}
            </div>
            <span className="text-[11px] text-muted block capitalize">
              {pkg.priceUnit || (isStranger ? 'per person' : 'per couple')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/packages/${pkg.slug}`}
              className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold text-primary hover:bg-primary-light/50 transition-colors flex items-center gap-1"
            >
              <span>Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => (onBookNow ? onBookNow(pkg) : null)}
              className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-dark active:scale-95 transition-all shadow-sm flex items-center justify-center"
            >
              Book
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageCard;
