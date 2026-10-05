import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Compass, Heart, Users, ShieldCheck, ArrowRight, Award } from 'lucide-react';

export default function AboutUs(): React.ReactElement {
  return (
    <>
      <Helmet>
        <title>About Us | Hills Angel Tours and Travels</title>
        <meta
          name="description"
          content="Learn about Hills Angel Tours and Travels, our Elaichi green philosophy, ethical hill-station tourism, and our passionate team in the Nilgiris."
        />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16">
        {/* Intro Banner */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <Compass className="w-4 h-4" />
            <span>Rooted in the Nilgiris</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-text">
            Crafting Unhurried Hill Holidays Since 2018
          </h1>
          <p className="text-xs sm:text-base text-muted leading-relaxed">
            Hills Angel Tours and Travels was born from a simple belief: the high mountains should be experienced with quiet elegance, warm local hospitality, and thoughtful comfort.
          </p>
        </div>

        {/* Story Section with Image */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-elaichi">
            <img
              src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80"
              alt="Nilgiri Tea Slopes"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
            <h3 className="font-serif text-2xl font-bold text-text">
              The "Elaichi Green" Philosophy
            </h3>
            <p>
              Cardamom (Elaichi) grows in the shaded, cool microclimates of the Western Ghats. Like the spice, our journeys are fresh, calming, and deeply aromatic. We don't rush you through ten tourist traps in a day.
            </p>
            <p>
              Instead, we craft days that let couples enjoy unhurried tea terrace views and let solo strangers bond around roaring night campfires under unpolluted starry skies.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <Link
                to="/packages"
                className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold shadow-elaichi"
              >
                <span>Browse Hill Retreats</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Four Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
            <Heart className="w-6 h-6 text-rose-500" />
            <h4 className="font-serif font-bold text-base text-text">Couple Privacy</h4>
            <p className="text-xs text-muted leading-relaxed">
              Discreet chauffeurs, romantic valley decks, and zero intrusions for honeymoons.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
            <Users className="w-6 h-6 text-emerald-600" />
            <h4 className="font-serif font-bold text-base text-text">Safe Solo Socials</h4>
            <p className="text-xs text-muted leading-relaxed">
              Curated group trails designed to welcome solo travelers into a supportive travel family.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
            <Award className="w-6 h-6 text-gold" />
            <h4 className="font-serif font-bold text-base text-text">Curated Luxury</h4>
            <p className="text-xs text-muted leading-relaxed">
              Hand-picked 4/5-star villas with private fire pits and plunge pools for Extra Premium tiers.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <h4 className="font-serif font-bold text-base text-text">Local Guardians</h4>
            <p className="text-xs text-muted leading-relaxed">
              Experienced indigenous drivers who know every mountain turn in heavy fog or rain.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
