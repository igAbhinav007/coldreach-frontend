'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Users, Building2, Mail, Send, Calendar,
  CalendarDays, CreditCard, BarChart3, LogOut, Zap, ChevronRight,
  AlertCircle, X, Radio
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/contacts', icon: Users, label: 'Contacts' },
  { href: '/companies', icon: Building2, label: 'Companies' },
  { href: '/composer', icon: Mail, label: 'Email Composer' },
  { href: '/campaigns', icon: Send, label: 'Campaigns' },
  { href: '/scheduler', icon: Calendar, label: 'Scheduler' },
  { href: '/batch-planner', icon: CalendarDays, label: 'Batch Planner' },
  { href: '/tracker', icon: Radio, label: 'Email Tracker' },
  { href: '/history', icon: BarChart3, label: 'Delivery Logs' },
  { href: '/payment', icon: CreditCard, label: 'Billing' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, setUser } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [gmailBannerDismissed, setGmailBannerDismissed] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/auth');
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      setUser(null);
      router.push('/auth');
    } catch {
      toast.error('Logout failed');
    }
  };

  const handleConnectGmail = async () => {
    try {
      const res: any = await authApi.connectGmail();
      window.location.href = res.data.authUrl;
    } catch {
      toast.error('Failed to initiate Gmail connection');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 border-r border-[#252535] flex flex-col bg-[#0f0f17]">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-[#252535]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">ColdReach</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link key={href} href={href} className={active ? 'sidebar-link-active' : 'sidebar-link'}>
                <Icon className="w-4 h-4" />
                {label}
                {active && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-50" />}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-[#252535]">
          {/* Subscription badge */}
          <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg bg-brand-950/50 border border-brand-800/30">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            <span className="text-xs text-brand-400 font-medium capitalize">{user.subscriptionTier} Plan</span>
            {user.subscriptionTier === 'free' && (
              <Link href="/payment" className="ml-auto text-xs text-brand-400 hover:text-brand-300">
                Upgrade
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2.5 px-2 py-2">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-7 h-7 rounded-full" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold">
                {user.name[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white truncate">{user.name}</div>
              <div className="text-xs text-[#5a5a72] truncate">{user.email}</div>
            </div>
            <button onClick={handleLogout} className="p-1 hover:text-white text-[#5a5a72] transition-colors" title="Logout">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Gmail connection banner */}
        {!user.hasGmailConnection && !gmailBannerDismissed && (
          <div className="flex items-center gap-3 px-6 py-3 bg-amber-500/10 border-b border-amber-500/20 text-sm">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="text-amber-200 flex-1">
              Connect your Gmail account to start sending emails
            </span>
            <button
              onClick={handleConnectGmail}
              className="text-xs px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg transition-colors border border-amber-500/30"
            >
              Connect Gmail
            </button>
            <button onClick={() => setGmailBannerDismissed(true)} className="text-amber-500 hover:text-amber-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}