'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { campaignsApi, logsApi } from '@/lib/api';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Mail, CheckCircle, XCircle, Clock, Calendar,
  ChevronLeft, ChevronRight, X, Search, Filter,
  Send, User, Building2, Tag, AlertCircle, MessageSquare,
  Copy, Check, ExternalLink
} from 'lucide-react';

const STATUS_CONFIG: Record<string, {
  label: string; bg: string; text: string; border: string; icon: any; dot: string;
}> = {
  sent: { label: 'Sent', bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', icon: CheckCircle, dot: 'bg-green-400' },
  failed: { label: 'Failed', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: XCircle, dot: 'bg-red-400' },
  queued: { label: 'Queued', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', icon: Clock, dot: 'bg-blue-400' },
  scheduled: { label: 'Scheduled', bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', icon: Calendar, dot: 'bg-yellow-400' },
  bounced: { label: 'Bounced', bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', icon: AlertCircle, dot: 'bg-orange-400' },
};

function EmailDetailPanel({ log, onClose }: { log: any; onClose: () => void }) {
  const [copied, setCopied] = useState('');
  const config = STATUS_CONFIG[log.event_type] || STATUS_CONFIG.queued;
  const Icon = config.icon;

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#0f0f17] border-l border-[#252535] shadow-2xl z-50 flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#252535]">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg ${config.bg} ${config.border} border flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${config.text}`} />
          </div>
          <div>
            <div className="font-semibold text-sm">Email Detail</div>
            <div className={`text-xs ${config.text}`}>{config.label}</div>
          </div>
        </div>
        <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Recipient */}
        <div>
          <div className="text-xs text-[#5a5a72] uppercase tracking-wide mb-2">Recipient</div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#14141d] border border-[#252535]">
            <div className="w-8 h-8 rounded-full bg-brand-600/20 flex items-center justify-center text-sm font-bold text-brand-400 flex-shrink-0">
              {log.recipient_email?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{log.recipient_email}</div>
              {log.campaign_name && <div className="text-xs text-[#5a5a72]">{log.campaign_name}</div>}
            </div>
            <button onClick={() => copy(log.recipient_email, 'email')}
              className="p-1.5 hover:text-white text-[#5a5a72] transition-colors flex-shrink-0">
              {copied === 'email' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Subject */}
        {log.subject && (
          <div>
            <div className="text-xs text-[#5a5a72] uppercase tracking-wide mb-2">Subject Line</div>
            <div className="p-3 rounded-xl bg-[#14141d] border border-[#252535] flex items-start gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-brand-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-[#c8c8e0] flex-1">{log.subject}</div>
              <button onClick={() => copy(log.subject, 'subject')} className="p-1 hover:text-white text-[#5a5a72] flex-shrink-0">
                {copied === 'subject' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        )}

        {/* Timing */}
        <div>
          <div className="text-xs text-[#5a5a72] uppercase tracking-wide mb-2">Timing</div>
          <div className="p-3 rounded-xl bg-[#14141d] border border-[#252535] space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#5a5a72]">Event Time</span>
              <span className="text-white font-medium">
                {format(new Date(log.created_at), 'MMM d, yyyy h:mm:ss a')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#5a5a72]">Relative</span>
              <span className="text-[#8b8baa]">
                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>

        {/* Success details */}
        {log.message_id && (
          <div>
            <div className="text-xs text-[#5a5a72] uppercase tracking-wide mb-2">Delivery Confirmation</div>
            <div className="p-3 rounded-xl bg-green-950/20 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs text-green-400 font-medium">Successfully delivered via Gmail API</span>
              </div>
              <div className="text-xs text-[#5a5a72] mb-1">Message ID</div>
              <div className="flex items-center gap-2">
                <div className="text-xs font-mono text-green-300 flex-1 break-all">{log.message_id}</div>
                <button onClick={() => copy(log.message_id, 'msgid')} className="p-1 hover:text-white text-[#5a5a72] flex-shrink-0">
                  {copied === 'msgid' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error details */}
        {log.error_message && (
          <div>
            <div className="text-xs text-[#5a5a72] uppercase tracking-wide mb-2">Error Details</div>
            <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-xs text-red-400 font-medium">Send Failed</span>
                </div>
                <button onClick={() => copy(log.error_message, 'error')}
                  className="flex items-center gap-1 text-xs text-[#5a5a72] hover:text-white transition-colors">
                  {copied === 'error' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {copied === 'error' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="text-xs text-red-300 leading-relaxed break-words whitespace-pre-wrap max-h-52 overflow-y-auto bg-red-950/30 rounded-lg p-2.5">
                {log.error_message}
              </div>
              {log.error_code && (
                <div className="mt-2 text-xs text-[#5a5a72]">
                  Code: <span className="text-red-400 font-mono">{log.error_code}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* IDs */}
        <div>
          <div className="text-xs text-[#5a5a72] uppercase tracking-wide mb-2">References</div>
          <div className="p-3 rounded-xl bg-[#14141d] border border-[#252535] space-y-2">
            {[
              { label: 'Log ID', value: log.id },
              { label: 'Campaign ID', value: log.campaign_id },
            ].map(({ label, value }) => value && (
              <div key={label} className="flex justify-between gap-2">
                <span className="text-xs text-[#5a5a72] flex-shrink-0">{label}</span>
                <span className="text-xs font-mono text-[#5a5a72] truncate">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrackerPage() {
  const [page, setPage] = useState(1);
  const [eventType, setEventType] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['logs', 'tracker', page, eventType, campaignId],
    queryFn: () => logsApi.list({
      page, limit: 30,
      eventType: eventType || undefined,
      campaignId: campaignId || undefined,
    }),
    refetchInterval: 10000,
  });

  const { data: campaignsData } = useQuery({
    queryKey: ['campaigns', 'for-tracker'],
    queryFn: () => campaignsApi.list({ limit: 100 }),
  });

  const logs = (data as any)?.data?.logs || [];
  const total = (data as any)?.data?.total || 0;
  const totalPages = Math.ceil(total / 30);
  const campaigns = (campaignsData as any)?.data?.campaigns || [];

  const filteredLogs = search
    ? logs.filter((l: any) => l.recipient_email?.toLowerCase().includes(search.toLowerCase()) ||
        l.subject?.toLowerCase().includes(search.toLowerCase()))
    : logs;

  const statusCounts = logs.reduce((acc: any, l: any) => {
    acc[l.event_type] = (acc[l.event_type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className={`p-8 max-w-7xl mx-auto transition-all ${selectedLog ? 'pr-[440px]' : ''}`}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Send className="w-6 h-6 text-brand-400" /> Email Tracker
        </h1>
        <p className="text-[#8b8baa] text-sm mt-1">
          Track every individual email — status, timing, subject, recipient. Click any row to inspect.
        </p>
      </div>

      {/* Status bar */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const count = statusCounts[key] || 0;
          if (count === 0 && key !== 'sent' && key !== 'failed') return null;
          const Icon = cfg.icon;
          return (
            <button key={key}
              onClick={() => setEventType(eventType === key ? '' : key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${eventType === key ? `${cfg.bg} ${cfg.border} ${cfg.text}` : 'bg-[#14141d] border-[#252535] text-[#8b8baa] hover:border-[#3a3a50]'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
              {count > 0 && <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${eventType === key ? 'bg-white/10' : 'bg-[#1a1a26]'}`}>{count}</span>}
            </button>
          );
        })}
        <button onClick={() => setEventType('')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ml-auto ${!eventType ? 'bg-brand-600 border-brand-600 text-white' : 'bg-[#14141d] border-[#252535] text-[#8b8baa] hover:border-[#3a3a50]'}`}>
          All Events
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5a5a72]" />
          <input className="input pl-9 text-sm" placeholder="Search by email or subject..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input max-w-[220px]" value={campaignId}
          onChange={e => { setCampaignId(e.target.value); setPage(1); }}>
          <option value="">All campaigns</option>
          {campaigns.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Email cards */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 bg-[#14141d] rounded-xl animate-pulse border border-[#252535]" />
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-20">
          <Mail className="w-12 h-12 text-[#2a2a3a] mx-auto mb-3" />
          <div className="text-sm text-[#5a5a72]">No emails found</div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map((log: any) => {
            const config = STATUS_CONFIG[log.event_type] || STATUS_CONFIG.queued;
            const Icon = config.icon;
            const isSelected = selectedLog?.id === log.id;

            return (
              <div key={log.id}
                onClick={() => setSelectedLog(isSelected ? null : log)}
                className={`group flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${isSelected
                  ? `${config.bg} ${config.border}`
                  : 'bg-[#14141d] border-[#252535] hover:border-[#3a3a50] hover:bg-[#1a1a26]'}`}>

                {/* Status dot */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bg} ${config.border} border`}>
                  <Icon className={`w-4 h-4 ${config.text}`} />
                </div>

                {/* Recipient + subject */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-white truncate">{log.recipient_email}</span>
                    {log.campaign_name && (
                      <span className="text-xs text-[#5a5a72] flex-shrink-0 hidden sm:block">· {log.campaign_name}</span>
                    )}
                  </div>
                  {log.subject ? (
                    <div className="text-xs text-[#8b8baa] truncate">{log.subject}</div>
                  ) : (
                    <div className="text-xs text-[#3a3a50] italic">No subject</div>
                  )}
                </div>

                {/* Error preview */}
                {log.error_message && (
                  <div className="hidden md:block max-w-[200px] flex-shrink-0">
                    <div className="text-xs text-red-400 truncate" title={log.error_message}>
                      {log.error_message.slice(0, 50)}{log.error_message.length > 50 ? '…' : ''}
                    </div>
                  </div>
                )}

                {/* Time + status badge */}
                <div className="flex-shrink-0 text-right">
                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text} border ${config.border} mb-1`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                    {config.label}
                  </div>
                  <div className="text-xs text-[#5a5a72] block">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 text-sm text-[#8b8baa]">
          <span>{total.toLocaleString()} total emails · Page {page} of {totalPages}</span>
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

      {/* Detail panel */}
      {selectedLog && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setSelectedLog(null)} />
          <EmailDetailPanel log={selectedLog} onClose={() => setSelectedLog(null)} />
        </>
      )}
    </div>
  );
}