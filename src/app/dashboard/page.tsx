'use client';

import { useQuery } from '@tanstack/react-query';
import { campaignsApi, contactsApi, logsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import { Users, Send, CheckCircle, XCircle, Clock, ArrowRight, Mail, TrendingUp, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function StatCard({ label, value, sub, icon: Icon, color }: any) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-[#5a5a72] uppercase tracking-wide mb-1">{label}</div>
          <div className="text-2xl font-bold text-white">{value}</div>
          {sub && <div className="text-xs text-[#8b8baa] mt-0.5">{sub}</div>}
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    sent: 'bg-green-400', queued: 'bg-blue-400', scheduled: 'bg-yellow-400',
    failed: 'bg-red-400', draft: 'bg-gray-400', running: 'bg-purple-400',
    completed: 'bg-green-400',
  };
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${colors[status] || 'bg-gray-400'}`} />;
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: campaignData } = useQuery({
    queryKey: ['campaigns', 'recent'],
    queryFn: () => campaignsApi.list({ limit: 5 }),
  });

  const { data: contactData } = useQuery({
    queryKey: ['contacts', 'count'],
    queryFn: () => contactsApi.list({ limit: 1 }),
  });

  const { data: summaryData } = useQuery({
    queryKey: ['delivery-logs', 'summary'],
    queryFn: () => logsApi.summary(),
  });

  const campaigns = (campaignData as any)?.data?.campaigns || [];
  const totalContacts = (contactData as any)?.data?.total || 0;
  const summary = (summaryData as any)?.data?.summary || [];

  const totalSent = summary.reduce((a: number, c: any) => a + parseInt(c.delivered || 0), 0);
  const totalFailed = summary.reduce((a: number, c: any) => a + parseInt(c.failed || 0), 0);
  const activeCampaigns = campaigns.filter((c: any) => ['running', 'scheduled'].includes(c.status)).length;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Good morning, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-[#8b8baa] mt-1">Here's what's happening with your outreach</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Contacts" value={totalContacts.toLocaleString()} icon={Users} color="bg-blue-500/10 text-blue-400" />
        <StatCard label="Emails Sent" value={totalSent.toLocaleString()} sub="all time" icon={Send} color="bg-green-500/10 text-green-400" />
        <StatCard label="Active Campaigns" value={activeCampaigns} icon={Zap} color="bg-purple-500/10 text-purple-400" />
        <StatCard label="Failed Sends" value={totalFailed} icon={XCircle} color="bg-red-500/10 text-red-400" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent campaigns */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#252535]">
            <h2 className="font-semibold">Recent Campaigns</h2>
            <Link href="/campaigns" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Mail className="w-10 h-10 text-[#2a2a3a] mb-3" />
              <div className="text-sm text-[#5a5a72]">No campaigns yet</div>
              <Link href="/campaigns" className="mt-3 btn-primary btn-sm">
                Create Campaign
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#1e1e2a]">
              {campaigns.map((c: any) => (
                <Link key={c.id} href={`/campaigns/${c.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#16161f] transition-colors">
                  <StatusDot status={c.status} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{c.name}</div>
                    <div className="text-xs text-[#5a5a72]">
                      {c.total_recipients} recipients · {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="text-green-400">{c.sent_count} sent</div>
                    {c.failed_count > 0 && <div className="text-red-400">{c.failed_count} failed</div>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { href: '/contacts', icon: Users, label: 'Add Contacts', color: 'text-blue-400' },
                { href: '/composer', icon: Mail, label: 'Create Template', color: 'text-purple-400' },
                { href: '/campaigns', icon: Send, label: 'New Campaign', color: 'text-green-400' },
                { href: '/batch-planner', icon: TrendingUp, label: 'Batch Planner', color: 'text-orange-400' },
              ].map(({ href, icon: Icon, label, color }) => (
                <Link key={href} href={href} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#1a1a26] transition-colors">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="text-sm">{label}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto text-[#3a3a50]" />
                </Link>
              ))}
            </div>
          </div>

          {/* Subscription card */}
          <div className="card p-5 bg-gradient-to-br from-brand-950/50 to-surface border-brand-800/30">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-brand-400" />
              <span className="text-sm font-semibold capitalize">{user?.subscriptionTier} Plan</span>
            </div>
            {user?.subscriptionTier === 'free' && (
              <>
                <p className="text-xs text-[#8b8baa] mb-3">Upgrade to unlock unlimited contacts, advanced scheduling, and bulk sending.</p>
                <Link href="/payment" className="btn-primary btn-sm w-full justify-center">
                  Upgrade Plan
                </Link>
              </>
            )}
            {user?.subscriptionTier !== 'free' && (
              <p className="text-xs text-[#8b8baa]">You're on the {user?.subscriptionTier} plan. Access all features.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
