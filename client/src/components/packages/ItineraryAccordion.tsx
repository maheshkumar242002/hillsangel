import React, { useState } from 'react';
import { ChevronDown, Utensils, Hotel } from 'lucide-react';
import { IItineraryDay } from '../../types';

export interface ItineraryAccordionProps {
  itinerary?: IItineraryDay[];
}

export const ItineraryAccordion: React.FC<ItineraryAccordionProps> = ({ itinerary = [] }) => {
  // Open Day 1 by default
  const [openDays, setOpenDays] = useState<Record<number, boolean>>({ 1: true });

  const toggleDay = (day: number) => {
    setOpenDays((prev) => ({
      ...prev,
      [day]: !prev[day],
    }));
  };

  const expandAll = () => {
    const all: Record<number, boolean> = {};
    itinerary.forEach((item) => {
      all[item.day] = true;
    });
    setOpenDays(all);
  };

  const collapseAll = () => {
    setOpenDays({});
  };

  if (!itinerary || itinerary.length === 0) {
    return <p className="text-xs text-muted">Detailed itinerary being updated.</p>;
  }

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center justify-between pb-2">
        <span className="text-xs font-semibold text-muted uppercase tracking-wider">
          {itinerary.length} Days Schedule
        </span>
        <div className="flex items-center gap-3 text-xs text-primary font-medium">
          <button type="button" onClick={expandAll} className="hover:underline">
            Expand all
          </button>
          <span>•</span>
          <button type="button" onClick={collapseAll} className="hover:underline">
            Collapse all
          </button>
        </div>
      </div>

      {/* Accordion list */}
      {itinerary.map((item) => {
        const isOpen = Boolean(openDays[item.day]);

        return (
          <div
            key={item.day}
            className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
              isOpen ? 'border-primary/40 bg-surface shadow-sm' : 'border-gray-200 bg-white'
            }`}
          >
            {/* Header Accordion Button (Min 48px tap target) */}
            <button
              type="button"
              onClick={() => toggleDay(item.day)}
              className="w-full min-h-[52px] p-4 text-left flex items-center justify-between gap-3 focus:outline-none focus:ring-2 focus:ring-primary rounded-2xl"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
                  D{item.day}
                </span>
                <span className="font-serif font-bold text-sm sm:text-base text-text">
                  {item.title}
                </span>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-gray-500 transition-transform duration-300 shrink-0 ${
                  isOpen ? 'rotate-180 text-primary' : ''
                }`}
              />
            </button>

            {/* Accordion Content */}
            {isOpen && (
              <div className="px-4 pb-5 pt-1 space-y-3.5 text-xs text-gray-700 border-t border-gray-100/60">
                <p className="leading-relaxed text-muted sm:text-sm">{item.description}</p>

                {/* Stay & Meals Badges */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {item.stay && (
                    <span className="inline-flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1 rounded-xl text-gray-700">
                      <Hotel className="w-3.5 h-3.5 text-primary" />
                      <span>{item.stay}</span>
                    </span>
                  )}
                  {item.meals && (
                    <span className="inline-flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1 rounded-xl text-gray-700">
                      <Utensils className="w-3.5 h-3.5 text-amber-600" />
                      <span>Meals: {item.meals}</span>
                    </span>
                  )}
                </div>

                {/* Activities tags */}
                {item.activities && item.activities.length > 0 && (
                  <div className="pt-2">
                    <span className="font-semibold text-gray-800 block mb-1.5">
                      Highlights & Activities:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.activities.map((act, idx) => (
                        <span
                          key={idx}
                          className="bg-primary-light/70 text-primary-dark font-medium px-2.5 py-1 rounded-lg text-[11px]"
                        >
                          {act}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ItineraryAccordion;
