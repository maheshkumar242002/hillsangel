import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFound(): React.ReactElement {
  return (
    <>
      <Helmet>
        <title>404 - Page Not Found | Hills Angel Tours</title>
      </Helmet>

      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-primary-light text-primary-dark flex items-center justify-center mx-auto shadow-sm">
          <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: '8s' }} />
        </div>
        <h1 className="font-serif text-3xl font-bold text-text">Lost in the Hill Mist?</h1>
        <p className="text-xs sm:text-sm text-muted leading-relaxed">
          The trail or page you're searching for seems to have wandered off into the clouds. Let's guide you back to safety.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 min-h-[46px] px-6 py-2.5 rounded-xl bg-gradient-elaichi text-white text-xs font-semibold shadow-elaichi active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Homepage</span>
        </Link>
      </div>
    </>
  );
}
