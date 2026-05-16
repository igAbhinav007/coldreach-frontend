'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignsApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Send, Clock, CheckCircle, XCircle,
  Users, Mail, Calendar, BarChart3, Ban, RefreshCw
} from 'lucide-react';

const STATUS_BADGE: Record<string, string> = {
  sent: 'badge-sent',
  queued: 'badge-queued',
  scheduled: 'badge-scheduled',
  failed: 'badge-failed',
  draft: 'badge-draft',
  running: 'badge-running',
  completed: 'badge-completed',
};

const STATUS_ICON: Record<string, any> = {
  sent: CheckCircle,
  queued: Clock,
  scheduled: Calendar,
  failed: XCircle,
  draft: Mail,
  running: Send,
  completed: CheckCircle,
};

export default function CampaignDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignsApi.get(id as string),
  });

  const { data: statsData } = useQuery({
    queryKey: ['campaign-stats', id],
    queryFn: () => campaignsApi.stats(id as string),
    refetchInterval: 5000, // poll every 5s if running
  });

  const cancelMutation = useMutation({
    mutationFn: () => campaignsApi.cancel(id as string),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaign', id] });
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign cancelled');
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#1a1a26] rounded w-1/3" />
          <div className="h-4 bg-[#1a1a26] rounded w-1/4" />
          <div className="grid grid-cols-4 gap-4 mt-6">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-[#1a1a26] rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-6xl mx-auto text-center py-20">
        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <div className="text-lg font-semibold mb-2">Campaign not found</div>
        <Link href="/campaigns" className="btn-secondary btn-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Campaigns
        </Link>
      </div>
    );
  }

  const campaign = (data as any).data.campaign;
  const recipients = (data as any).data.recipients || [];
  const batches = (data as any).data.batches || [];
  const stats = (statsData as any)?.data?.stats;

  const StatusIcon = STATUS_ICON[campaign.status] || Mail;
  const sentPct = campaign.total_recipients > 0
    ? Math.round((campaign.sent_count / campaign.total_recipients) * 100)
    : 0;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link
            href="/campaigns"
            className="flex items-center gap-2 text-sm text-[#8b8baa] hover:text-white mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Campaigns
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            {campaign.name}
            <span className={STATUS_BADGE[campaign.status] || 'badge-draft'}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {campaign.status}
            </span>
          </h1>
          <p className="text-[#8b8baa] text-sm mt-1">
            Created {format(new Date(campaign.created_at), 'MMM d, yyyy h:mm a')}
            {campaign.template_name && ` · Template: ${campaign.template_name}`}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ['campaign', id] })}
            className="btn-secondary btn-sm"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          {['draft', 'scheduled', 'running'].includes(campaign.status) && (
            <button
              onClick={() => { if (confirm('Cancel this campaign?')) cancelMutation.mutate(); }}
              disabled={cancelMutation.isPending}
              className="btn-danger btn-sm"
            >
              <Ban className="w-3.5 h-3.5" />
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Campaign'}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="text-xs text-[#5a5a72] uppercase tracking-wide">Total Recipients</div>
          <div className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            {campaign.total_recipients}
          </div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-[#5a5a72] uppercase tracking-wide">Sent</div>
          <div className="text-2xl font-bold text-green-400">
            {stats?.sent ?? campaign.sent_count}
          </div>
          <div className="progress-bar mt-2">
            <div className="progress-fill" style={{ width: `${sentPct}%` }} />
          </div>
          <div className="text-xs text-[#5a5a72] mt-1">{sentPct}% complete</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-[#5a5a72] uppercase tracking-wide">Failed</div>
          <div className="text-2xl font-bold text-red-400">
            {stats?.failed ?? campaign.failed_count}
          </div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-[#5a5a72] uppercase tracking-wide">Queued / Scheduled</div>
          <div className="text-2xl font-bold text-yellow-400">
            {(parseInt(stats?.queued || 0) + parseInt(stats?.scheduled || 0))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recipients table */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="px-5 py-4 border-b border-[#252535] flex items-center justify-between">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-400" />
                Recipients ({recipients.length})
              </h2>
              {recipients.length === 100 && (
                <span className="text-xs text-[#5a5a72]">Showing first 100</span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Contact</th>
                    <th>Email</th>
                    <th>Company</th>
                    <th>Status</th>
                    <th>Sent At</th>
                  </tr>
                </thead>
                <tbody>
                  {recipients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-[#5a5a72]">
                        No recipients
                      </td>
                    </tr>
                  ) : recipients.map((r: any) => {
                    const Icon = STATUS_ICON[r.status] || Clock;
                    return (
                      <tr key={r.id}>
                        <td className="font-medium text-white">
                          {r.first_name} {r.last_name || ''}
                        </td>
                        <td className="font-mono text-xs text-brand-400">
                          {r.contact_email}
                        </td>
                        <td className="text-[#8b8baa] text-xs">
                          {r.company_name || '—'}
                        </td>
                        <td>
                          <span className={STATUS_BADGE[r.status] || 'badge-draft'}>
                            <Icon className="w-3 h-3 mr-1" />
                            {r.status}
                          </span>
                        </td>
                        <td className="text-xs text-[#5a5a72]">
                          {r.sent_at
                            ? format(new Date(r.sent_at), 'MMM d, h:mm a')
                            : r.scheduled_at
                              ? format(new Date(r.scheduled_at), 'MMM d, h:mm a')
                              : '—'
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Campaign info */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-brand-400" /> Campaign Info
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#5a5a72]">Send Mode</span>
                <span className="capitalize font-medium">{campaign.send_mode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5a5a72]">Timezone</span>
                <span className="font-medium">{campaign.timezone || 'UTC'}</span>
              </div>
              {campaign.scheduled_at && (
                <div className="flex justify-between">
                  <span className="text-[#5a5a72]">Scheduled At</span>
                  <span className="font-medium text-yellow-400">
                    {format(new Date(campaign.scheduled_at), 'MMM d, h:mm a')}
                  </span>
                </div>
              )}
              {campaign.default_subject && (
                <div>
                  <span className="text-[#5a5a72] block mb-1">Default Subject</span>
                  <span className="text-xs text-[#c8c8e0] bg-[#0f0f17] px-2 py-1 rounded block">
                    {campaign.default_subject}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Batches */}
          {batches.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-400" />
                Batches ({batches.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {batches.map((b: any) => (
                  <div key={b.id} className="p-2.5 rounded-lg bg-[#0f0f17] border border-[#252535]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-white">
                        {format(new Date(b.scheduled_datetime), 'MMM d, h:mm a')}
                      </span>
                      <span className={STATUS_BADGE[b.status] || 'badge-draft'} style={{ fontSize: '10px' }}>
                        {b.status}
                      </span>
                    </div>
                    <div className="text-xs text-[#5a5a72]">
                      {b.recipient_count} recipients
                      {b.subject_override && (
                        <span className="block text-brand-400 truncate mt-0.5">
                          "{b.subject_override}"
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-3">Quick Links</h3>
            <div className="space-y-2">
              <Link
                href={`/history?campaignId=${campaign.id}`}
                className="flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                View Delivery Logs
              </Link>
              {campaign.send_mode === 'batched' && campaign.status === 'draft' && (
                <Link
                  href="/batch-planner"
                  className="flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Configure Batch Schedule
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}