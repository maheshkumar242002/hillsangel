import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';

export interface PackageGalleryProps {
  images?: string[];
  title?: string;
}

export const PackageGallery: React.FC<PackageGalleryProps> = ({
  images = [],
  title = 'Tour',
}) => {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);

  const fallbackImages: string[] = [
    'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
  ];

  const galleryList = images.length > 0 ? images : fallbackImages;

  const nextImage = () => {
    setActiveIdx((prev) => (prev + 1) % galleryList.length);
  };

  const prevImage = () => {
    setActiveIdx((prev) => (prev - 1 + galleryList.length) % galleryList.length);
  };

  return (
    <div className="space-y-3">
      {/* Main Image Showcase with Aspect Ratio */}
      <div className="relative aspect-[16/10] sm:aspect-[16/9] rounded-3xl overflow-hidden bg-gray-100 shadow-elaichi group">
        <img
          src={galleryList[activeIdx]}
          alt={`${title} view ${activeIdx + 1}`}
          className="w-full h-full object-cover transition-transform duration-500 ease-out"
        />

        {/* Expand / Lightbox Button */}
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="absolute top-4 right-4 p-2.5 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="View photo in fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Carousel Prev/Next Buttons */}
        {galleryList.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-md active:scale-95 transition-all"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={nextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-md active:scale-95 transition-all"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Mobile Image Counter Pill */}
            <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-full">
              {activeIdx + 1} / {galleryList.length}
            </div>
          </>
        )}
      </div>

      {/* Desktop / Tablet Thumbnails Row */}
      {galleryList.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {galleryList.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIdx(i)}
              className={`relative aspect-[16/10] w-20 sm:w-24 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                activeIdx === i
                  ? 'border-primary ring-2 ring-primary/30 scale-105'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="flex justify-between items-center text-white">
            <span className="text-sm font-medium">
              {title} ({activeIdx + 1} of {galleryList.length})
            </span>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
              aria-label="Close fullscreen view"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center py-4">
            <img
              src={galleryList[activeIdx]}
              alt={title}
              className="max-h-[80vh] max-w-full object-contain rounded-xl"
            />

            {galleryList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-2 sm:left-4 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-2 sm:right-4 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white"
                  aria-label="Next"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Lightbox thumbnail bar */}
          <div className="flex justify-center gap-2 overflow-x-auto py-2">
            {galleryList.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveIdx(i)}
                className={`w-14 h-10 rounded-lg overflow-hidden border-2 ${
                  activeIdx === i ? 'border-primary' : 'border-transparent opacity-60'
                }`}
              >
                <img src={img} alt="Thumb" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageGallery;
