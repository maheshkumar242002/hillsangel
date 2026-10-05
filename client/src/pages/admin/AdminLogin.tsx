import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Compass, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin(): React.ReactElement {
  const [email, setEmail] = useState<string>('admin@hillsangels.com');
  const [password, setPassword] = useState<string>('Admin@12345');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (isAuthenticated) {
    navigate('/admin', { replace: true });
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await login({ email, password });
      if (res.success) {
        const from = (location.state as any)?.from?.pathname || '/admin';
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid administrator credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin Portal Login | Hills Angel Tours</title>
      </Helmet>

      <div className="min-h-screen bg-[#142318] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-elaichi flex items-center justify-center text-white mx-auto shadow-elaichi">
              <Compass className="w-6 h-6 text-accent-light" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-text">Hills Angel Admin</h2>
            <p className="text-xs text-muted">
              Sign in with your administrative account to manage packages, bookings, and customer enquiries.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium text-center">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text mb-1" htmlFor="adminEmail">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="adminEmail"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@hillsangels.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[46px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1" htmlFor="adminPassword">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="adminPassword"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[46px]"
                />
              </div>
            </div>

            {/* Quick Demo Credentials Reminder Box */}
            <div className="p-3 bg-surface rounded-xl border border-primary/20 text-[11px] text-muted space-y-1">
              <span className="font-semibold text-primary-dark block">Default Admin Credentials:</span>
              <p>Email: <span className="font-mono text-text">admin@hillsangels.com</span></p>
              <p>Password: <span className="font-mono text-text">Admin@12345</span></p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[48px] py-3 rounded-xl bg-gradient-elaichi text-white font-semibold text-sm shadow-elaichi active:scale-95 disabled:opacity-70 transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Session...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <Link to="/" className="text-xs text-primary font-medium hover:underline">
              ← Return to Public Website
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
