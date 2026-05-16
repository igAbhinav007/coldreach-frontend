'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import { Mail, Zap, BarChart3, Calendar, ArrowRight, Shield } from 'lucide-react';

export default function AuthPage() {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading && user) router.push('/dashboard');
    const error = searchParams.get('error');
    if (error === 'oauth_failed') toast.error('Authentication failed. Please try again.');
  }, [user, loading, router, searchParams]);

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const features = [
    { icon: Mail, title: 'Smart Personalization', desc: 'Auto-fill {name}, {company} and custom variables per contact' },
    { icon: Calendar, title: 'Intelligent Scheduling', desc: 'Spread emails across days with per-day subject control' },
    { icon: BarChart3, title: 'Delivery Analytics', desc: 'Track every send, failure, and retry in real-time' },
    { icon: Zap, title: 'Async Bulk Sending', desc: 'Queue-powered sending that scales to thousands of emails' },
  ];

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-mesh opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-950/80 via-surface to-surface" />

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-16">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">ColdReach</span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Cold outreach that
            <span className="block text-brand-400">actually converts</span>
          </h1>
          <p className="text-[#8b8baa] text-lg mb-12 leading-relaxed">
            Schedule, personalize, and send thousands of targeted cold emails — 
            with intelligent batching across days and hours.
          </p>

          <div className="grid gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-3 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="w-9 h-9 rounded-lg bg-brand-600/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-brand-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{title}</div>
                  <div className="text-xs text-[#8b8baa] mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs text-[#5a5a72]">
          <Shield className="w-3.5 h-3.5" />
          <span>OAuth-secured · No passwords stored · GDPR compliant</span>
        </div>
      </div>

      {/* Right panel - login */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold">ColdReach</span>
          </div>

          <div className="card p-8 animate-slide-up">
            <h2 className="text-2xl font-bold mb-2">Welcome back</h2>
            <p className="text-[#8b8baa] text-sm mb-8">
              Sign in with your Google account to continue
            </p>

            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-50 transition-all active:scale-95 shadow-lg"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="mt-6 p-4 rounded-lg bg-brand-950/50 border border-brand-800/30">
              <p className="text-xs text-[#8b8baa] leading-relaxed">
                <span className="text-brand-400 font-medium">After signing in</span>, you'll connect your 
                Gmail account to enable email sending. We use OAuth 2.0 — 
                your credentials are never stored.
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-[#5a5a72] mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
