import React from 'react';
import {
  HeartPulse,
  Wind,
  ShieldCheck,
  Camera,
  Umbrella,
  Compass,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export interface FeatureItem {
  id: string;
  icon: React.ReactNode;
  tag: string;
  tagColor: string;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
}

export const SPECIAL_FEATURES_LIST: FeatureItem[] = [
  {
    id: 'medikit',
    icon: <HeartPulse className="w-6 h-6 text-rose-500" />,
    tag: 'Emergency First-Aid',
    tagColor: 'bg-rose-50 text-rose-700 border-rose-200',
    title: 'Comprehensive Medikit Onboard',
    subtitle: 'Always Equipped in Every 4x4 Jeep',
    description:
      'Fully equipped travel medicine kit specifically curated for Western Ghats mountain trails. Kept within arm’s reach on every trip.',
    highlights: [
      'Motion sickness & nausea tablets',
      'Antiseptic sprays, bandages & cotton',
      'Instant pain relief spray & balms',
      'Hydration electrolyte ORS sachets',
    ],
  },
  {
    id: 'oxygen',
    icon: <Wind className="w-6 h-6 text-cyan-600" />,
    tag: 'High Altitude Care',
    tagColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    title: 'Emergency Oxygen (O2) Support',
    subtitle: 'Medical-Grade Portable O2 Cylinder',
    description:
      'High-altitude Munnar peaks (Top Station, Kanthaloor ridge & Ponmudi) reach up to 6,000+ ft. Our jeeps carry portable oxygen canisters for rapid altitude relief.',
    highlights: [
      'Instant inhalation mask & canister',
      'Safeguards elderly family members & kids',
      'Assistance for sudden shortness of breath',
      'Peace of mind on steep summit drives',
    ],
  },
  {
    id: 'offroad-rig',
    icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />,
    tag: 'Vehicle Capability',
    tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    title: 'Heavy-Duty 4x4 Commander Rig',
    subtitle: 'Mahindra Commander (KL 68 C 3024)',
    description:
      'Custom-engineered safari jeep purpose-built for extreme rocky trails, deep muddy slopes, and Viriparai river wading without slipping.',
    highlights: [
      'High ground clearance 4x4 drivetrain',
      'Heavy-duty safety roll cage chassis',
      'Waterproof deep-river crossing setup',
      'Comfortable cushioned bench seating for 6',
    ],
  },
  {
    id: 'gopro-media',
    icon: <Camera className="w-6 h-6 text-indigo-600" />,
    tag: 'Action Media Support',
    tagColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    title: 'GoPro 4K Mounts & Drone Halts',
    subtitle: 'Capture Every River Splash & Drift',
    description:
      'Professional camera mounting clamps on the vehicle frame. Driver stops at panoramic cinematic spots for drone fly-bys and squad reels.',
    highlights: [
      'Pre-fixed roll-bar GoPro mounts',
      'Scenic halts at Chathurangapara & Viripara',
      'Driver assists with cinematic angles',
      'Complimentary photo stops at every spot',
    ],
  },
  {
    id: 'all-weather',
    icon: <Umbrella className="w-6 h-6 text-amber-600" />,
    tag: 'Weather Protection',
    tagColor: 'bg-amber-50 text-amber-700 border-amber-200',
    title: 'All-Weather Storm & Cold Shield',
    subtitle: 'Stay Dry in Heavy Mist & Rainfall',
    description:
      'Munnar mountain weather can shift quickly from sunshine to chilly rain. Our jeeps are equipped to keep your family warm and protected.',
    highlights: [
      'Heavy-duty roll-down clear rain covers',
      'Windbreak side curtains for misty passes',
      'Clean fleece blankets for chilly viewpoints',
      'Emergency umbrellas for photo halts',
    ],
  },
  {
    id: 'expert-driver',
    icon: <Compass className="w-6 h-6 text-emerald-700" />,
    tag: 'Certified Crew',
    tagColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    title: 'Certified Hill Driver-Guides',
    subtitle: '10+ Years Munnar Off-Road Masters',
    description:
      'Our local drivers are native to Munnar’s hills, trained in first aid, defensive off-road driving, and respectful wild elephant zone safety.',
    highlights: [
      'Native knowledge of hidden waterfalls',
      'Responsible elephant corridor tracking',
      'Fluent in Tamil, Malayalam & English',
      'Official forest checkpoint clearance help',
    ],
  },
];

export const SpecialFeatures: React.FC = () => {
  return (
    <section id="special-features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold tracking-wide uppercase">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Exclusive Onboard Amenities</span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-bold text-text">
          Special Features & Safety Gear
        </h2>

        <p className="text-xs sm:text-sm text-muted leading-relaxed">
          Your safety and comfort come first. Every El Shaddai Munnar 4x4 Jeep Safari vehicle is
          inspected and outfitted with emergency medical equipment, altitude support, and all-weather gear.
        </p>
      </div>

      {/* Grid of 6 Special Features Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {SPECIAL_FEATURES_LIST.map((feature) => (
          <div
            key={feature.id}
            className="group relative bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-sm hover:shadow-elaichi hover:border-primary/30 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              {/* Top Row: Icon + Tag */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-surface border border-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  {feature.icon}
                </div>
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${feature.tagColor}`}
                >
                  {feature.tag}
                </span>
              </div>

              {/* Title & Subtitle */}
              <h3 className="font-serif text-lg sm:text-xl font-bold text-text group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <span className="text-[11px] text-muted font-medium block mt-0.5 mb-2.5">
                {feature.subtitle}
              </span>

              {/* Description */}
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                {feature.description}
              </p>
            </div>

            {/* Checklist items */}
            <div className="border-t border-gray-100 pt-3.5 space-y-2">
              {feature.highlights.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-[11px] sm:text-xs text-gray-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Trust Highlight Banner */}
      <div className="mt-8 sm:mt-10 rounded-2xl bg-gradient-to-r from-emerald-900 via-primary-dark to-[#132317] text-white p-5 sm:p-6 shadow-elaichi flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 text-center sm:text-left">
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <HeartPulse className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm sm:text-base">
              100% Emergency-Ready Hill Station Fleet
            </h4>
            <p className="text-xs text-emerald-100/80">
              Traveling with elders or young children? Medikit & Oxygen Cylinder are verified before every single departure.
            </p>
          </div>
        </div>

        <a
          href="#packages"
          className="shrink-0 min-h-[44px] px-6 py-2.5 rounded-xl bg-white text-primary-dark font-bold text-xs hover:bg-emerald-50 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
        >
          <span>Explore Safari Circuits</span>
        </a>
      </div>
    </section>
  );
};

export default SpecialFeatures;
