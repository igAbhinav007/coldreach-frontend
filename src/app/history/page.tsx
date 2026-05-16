'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { logsApi, campaignsApi } from '@/lib/api';
import { format } from 'date-fns';
import {
  CheckCircle, XCircle, Clock, BarChart3,
  ChevronLeft, ChevronRight, X, Mail, AlertTriangle,
  ExternalLink, Copy, Check
} from 'lucide-react';

const EVENT_CONFIG: Record<string, { label: string; className: string; icon: any }> = {
  sent: { label: 'Sent', className: 'badge-sent', icon: CheckCircle },
  failed: { label: 'Failed', className: 'badge-failed', icon: XCircle },
  queued: { label: 'Queued', className: 'badge-queued', icon: Clock },
  scheduled: { label: 'Scheduled', className: 'badge-scheduled', icon: Clock },
  bounced: { label: 'Bounced', className: 'badge-failed', icon: AlertTriangle },
};

function LogDetailModal({ log, onClose }: { log: any; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const config = EVENT_CONFIG[log.event_type] || EVENT_CONFIG.queued;
  const Icon = config.icon;

  const copyError = () => {
    navigator.clipboard.writeText(log.error_message || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card-elevated w-full max-w-lg animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#252535]">
          <div className="flex items-center gap-2">
            <span className={config.className}><Icon className="w-3 h-3 mr-1" />{config.label}</span>
            <h3 className="font-semibold text-sm">Email Log Detail</h3>
          </div>
          <button onClick={onClose} className="btn-ghost p-1"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Recipient */}
          <div className="p-3 rounded-lg bg-[#0f0f17] border border-[#252535]">
            <div className="text-xs text-[#5a5a72] uppercase tracking-wide mb-1">Recipient</div>
            <div className="text-sm font-medium text-white flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-brand-400" />
              {log.recipient_email}
            </div>
          </div>

          {/* Subject */}
          {log.subject && (
            <div className="p-3 rounded-lg bg-[#0f0f17] border border-[#252535]">
              <div className="text-xs text-[#5a5a72] uppercase tracking-wide mb-1">Subject</div>
              <div className="text-sm text-[#c8c8e0]">{log.subject}</div>
            </div>
          )}

          {/* Campaign */}
          <div className="p-3 rounded-lg bg-[#0f0f17] border border-[#252535]">
            <div className="text-xs text-[#5a5a72] uppercase tracking-wide mb-1">Campaign</div>
            <div className="text-sm text-[#c8c8e0]">{log.campaign_name || '—'}</div>
          </div>

          {/* Message ID (if sent) */}
          {log.message_id && (
            <div className="p-3 rounded-lg bg-[#0f0f17] border border-[#252535]">
              <div className="text-xs text-[#5a5a72] uppercase tracking-wide mb-1">Gmail Message ID</div>
              <div className="text-xs font-mono text-green-400 break-all">{log.message_id}</div>
            </div>
          )}

          {/* Error message (if failed) */}
          {log.error_message && (
            <div className="p-3 rounded-lg bg-red-950/20 border border-red-500/20">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-red-400 uppercase tracking-wide font-medium">Error Details</div>
                <button onClick={copyError}
                  className="flex items-center gap-1 text-xs text-[#5a5a72] hover:text-white transition-colors">
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="text-xs text-red-300 leading-relaxed break-words whitespace-pre-wrap max-h-48 overflow-y-auto">
                {log.error_message}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-center justify-between text-xs text-[#5a5a72]">
            <span>Event Time</span>
            <span className="text-[#8b8baa]">{format(new Date(log.created_at), 'MMM d, yyyy h:mm:ss a')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const [eventType, setEventType] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['logs', page, eventType, campaignId],
    queryFn: () => logsApi.list({
      page, limit: 50,
      eventType: eventType || undefined,
      campaignId: campaignId || undefined,
    }),
  });

  const { data: summaryData } = useQuery({
    queryKey: ['logs', 'summary'],
    queryFn: () => logsApi.summary(),
  });

  const { data: campaignsData } = useQuery({
    queryKey: ['campaigns', 'all'],
    queryFn: () => campaignsApi.list({ limit: 100 }),
  });

  const logs = (data as any)?.data?.logs || [];
  const total = (data as any)?.data?.total || 0;
  const totalPages = Math.ceil(total / 50);
  const summary = (summaryData as any)?.data?.summary || [];
  const campaigns = (campaignsData as any)?.data?.campaigns || [];

  const allSent = summary.reduce((a: number, c: any) => a + parseInt(c.delivered || 0), 0);
  const allFailed = summary.reduce((a: number, c: any) => a + parseInt(c.failed || 0), 0);
  const deliveryRate = allSent + allFailed > 0 ? ((allSent / (allSent + allFailed)) * 100).toFixed(1) : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-brand-400" /> Delivery Logs
        </h1>
        <p className="text-[#8b8baa] text-sm mt-1">Complete audit trail of every email event</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Sent', value: allSent.toLocaleString(), color: 'text-green-400' },
          { label: 'Failed', value: allFailed.toLocaleString(), color: 'text-red-400' },
          { label: 'Delivery Rate', value: `${deliveryRate}%`, color: 'text-brand-400' },
          { label: 'Campaigns Run', value: summary.length, color: 'text-white' },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card">
            <div className="text-xs text-[#5a5a72] uppercase tracking-wide">{label}</div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Campaign summary */}
      {summary.length > 0 && (
        <div className="card mb-8">
          <div className="px-5 py-4 border-b border-[#252535]">
            <h2 className="font-semibold text-sm">Campaign Summary</h2>
          </div>
          <div className="divide-y divide-[#1e1e2a]">
            {summary.map((s: any) => {
              const sent = parseInt(s.delivered || 0);
              const failed = parseInt(s.failed || 0);
              const total = sent + failed;
              const rate = total > 0 ? (sent / total * 100).toFixed(0) : 0;
              return (
                <div key={s.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#16161f] transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{s.name}</div>
                    <div className="text-xs text-[#5a5a72]">
                      {s.last_activity && `Last: ${format(new Date(s.last_activity), 'MMM d, h:mm a')}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="text-green-400 font-semibold">{sent}</div>
                      <div className="text-xs text-[#5a5a72]">sent</div>
                    </div>
                    <div className="text-center">
                      <div className={`font-semibold ${failed > 0 ? 'text-red-400' : 'text-[#5a5a72]'}`}>{failed}</div>
                      <div className="text-xs text-[#5a5a72]">failed</div>
                    </div>
                    <div className="w-20">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#5a5a72]">Rate</span>
                        <span className="text-brand-400">{rate}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${rate}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select className="input max-w-xs" value={campaignId}
          onChange={e => { setCampaignId(e.target.value); setPage(1); }}>
          <option value="">All campaigns</option>
          {campaigns.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input max-w-[180px]" value={eventType}
          onChange={e => { setEventType(e.target.value); setPage(1); }}>
          <option value="">All events</option>
          {Object.entries(EVENT_CONFIG).map(([v, { label }]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
      </div>

      {/* Logs table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Recipient</th>
              <th>Subject</th>
              <th>Campaign</th>
              <th>Time</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(10)].map((_, i) => (
                <tr key={i}>
                  {[...Array(6)].map((_, j) => (
                    <td key={j}><div className="h-3.5 bg-[#1a1a26] rounded animate-pulse w-4/5" /></td>
                  ))}
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-[#5a5a72]">No log entries found</td>
              </tr>
            ) : logs.map((log: any) => {
              const config = EVENT_CONFIG[log.event_type] || EVENT_CONFIG.queued;
              const Icon = config.icon;
              return (
                <tr key={log.id} className="cursor-pointer" onClick={() => setSelectedLog(log)}>
                  <td>
                    <span className={config.className}>
                      <Icon className="w-3 h-3 mr-1" />{config.label}
                    </span>
                  </td>
                  <td className="font-mono text-xs text-brand-400">{log.recipient_email}</td>
                  <td className="max-w-[160px]">
                    <div className="truncate text-xs text-[#c8c8e0]" title={log.subject}>
                      {log.subject || '—'}
                    </div>
                  </td>
                  <td className="text-xs text-[#8b8baa] max-w-[120px]">
                    <div className="truncate">{log.campaign_name}</div>
                  </td>
                  <td className="text-xs text-[#5a5a72] whitespace-nowrap">
                    {format(new Date(log.created_at), 'MMM d, h:mm a')}
                  </td>
                  <td>
                    {log.error_message ? (
                      // Show truncated error with tooltip indicator
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-red-400 truncate max-w-[140px]" title={log.error_message}>
                          {log.error_message.length > 40
                            ? log.error_message.slice(0, 40) + '…'
                            : log.error_message}
                        </span>
                        <span className="text-xs text-red-500 flex-shrink-0 underline">view</span>
                      </div>
                    ) : log.message_id ? (
                      <span className="text-xs font-mono text-green-400 truncate max-w-[120px] block" title={log.message_id}>
                        {log.message_id.slice(0, 12)}…
                      </span>
                    ) : (
                      <span className="text-xs text-[#3a3a50]">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[#5a5a72] mt-2">Click any row to view full details</p>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-[#8b8baa]">
          <span>{total.toLocaleString()} total · Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary btn-sm">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary btn-sm">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {selectedLog && <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  );
}