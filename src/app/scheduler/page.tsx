'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { format, addHours, addDays } from 'date-fns';
import { Clock, Calendar, Send, CheckCircle, AlertCircle, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const QUICK_TIMES = [
  { label: 'In 1 hour', value: () => format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm") },
  { label: 'Tomorrow 9am', value: () => { const d = addDays(new Date(), 1); d.setHours(9, 0); return format(d, "yyyy-MM-dd'T'HH:mm"); } },
  { label: 'Tomorrow 2pm', value: () => { const d = addDays(new Date(), 1); d.setHours(14, 0); return format(d, "yyyy-MM-dd'T'HH:mm"); } },
  { label: 'Next Monday 9am', value: () => { const d = new Date(); d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7)); d.setHours(9, 0); return format(d, "yyyy-MM-dd'T'HH:mm"); } },
];

export default function SchedulerPage() {
  const qc = useQueryClient();
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  const { data } = useQuery({
    queryKey: ['campaigns', 'all'],
    queryFn: () => campaignsApi.list({ limit: 50 }),
  });

  const campaigns = ((data as any)?.data?.campaigns || []).filter(
    (c: any) => ['draft'].includes(c.status)
  );

  const selectedCampaign = campaigns.find((c: any) => c.id === selectedCampaignId);

  // Note: for scheduling existing draft campaigns we'd need a dedicated endpoint.
  // This demo shows the concept and links to campaign creation.

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="w-6 h-6 text-brand-400" /> Campaign Scheduler
        </h1>
        <p className="text-[#8b8baa] text-sm mt-1">
          Schedule a campaign to send at a specific date and time
        </p>
      </div>

      {/* How it works */}
      <div className="card p-5 mb-6 border-brand-800/30 bg-brand-950/10">
        <h3 className="text-sm font-semibold text-brand-300 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4" /> How Scheduling Works
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { step: '1', label: 'Create Campaign', desc: 'Choose "Schedule" send mode when creating' },
            { step: '2', label: 'Pick Date & Time', desc: 'Set the exact moment your emails go out' },
            { step: '3', label: 'Auto-Processing', desc: 'Background workers handle delivery reliably' },
          ].map(({ step, label, desc }) => (
            <div key={step} className="space-y-1">
              <div className="w-8 h-8 rounded-full bg-brand-600/20 border border-brand-600/30 flex items-center justify-center text-brand-400 font-bold text-sm mx-auto">
                {step}
              </div>
              <div className="text-xs font-semibold text-white">{label}</div>
              <div className="text-xs text-[#5a5a72]">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold mb-5">Quick Schedule Setup</h2>

        <div className="mb-5">
          <label className="input-label">Select Campaign</label>
          <select className="input" value={selectedCampaignId} onChange={(e) => setSelectedCampaignId(e.target.value)}>
            <option value="">Choose a campaign in draft...</option>
            {campaigns.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name} ({c.total_recipients} recipients)</option>
            ))}
          </select>
          {campaigns.length === 0 && (
            <p className="text-xs text-[#8b8baa] mt-2">
              No draft campaigns. <Link href="/campaigns" className="text-brand-400 hover:underline">Create one with "Schedule" mode →</Link>
            </p>
          )}
        </div>

        {selectedCampaign && (
          <div className="mb-5 p-4 rounded-xl bg-[#0f0f17] border border-[#252535]">
            <div className="text-xs text-[#5a5a72] uppercase tracking-wide mb-2">Selected Campaign</div>
            <div className="font-medium">{selectedCampaign.name}</div>
            <div className="text-sm text-[#8b8baa] mt-1">{selectedCampaign.total_recipients} recipients</div>
          </div>
        )}

        <div className="mb-5">
          <label className="input-label">Scheduled Date & Time</label>
          <input
            type="datetime-local"
            className="input"
            value={scheduledAt}
            min={format(addHours(new Date(), 0.5), "yyyy-MM-dd'T'HH:mm")}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </div>

        {/* Quick time picks */}
        <div className="mb-6">
          <div className="text-xs text-[#5a5a72] mb-2 uppercase tracking-wide">Quick Pick</div>
          <div className="flex flex-wrap gap-2">
            {QUICK_TIMES.map(({ label, value }) => (
              <button
                key={label}
                onClick={() => setScheduledAt(value())}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${scheduledAt === value() ? 'border-brand-500 bg-brand-500/10 text-brand-400' : 'border-[#252535] text-[#8b8baa] hover:border-[#3a3a50] hover:text-white'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        {scheduledAt && (
          <div className="mb-5 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>
                Campaign will send on{' '}
                <strong>{format(new Date(scheduledAt), 'EEEE, MMMM d, yyyy')}</strong>
                {' '}at{' '}
                <strong>{format(new Date(scheduledAt), 'h:mm a')}</strong>
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Link href="/campaigns" className="btn-secondary flex-1 justify-center">
            <ArrowRight className="w-4 h-4" /> Create Scheduled Campaign
          </Link>
        </div>

        <p className="text-xs text-[#5a5a72] mt-3 text-center">
          To create a scheduled campaign, click "New Campaign" and choose "Schedule" mode
        </p>
      </div>

      {/* Upcoming scheduled campaigns */}
      <div className="mt-6 card">
        <div className="px-5 py-4 border-b border-[#252535]">
          <h2 className="font-semibold text-sm">Upcoming Scheduled</h2>
        </div>
        {((data as any)?.data?.campaigns || []).filter((c: any) => c.status === 'scheduled').length === 0 ? (
          <div className="py-10 text-center text-sm text-[#5a5a72]">
            No scheduled campaigns
          </div>
        ) : (
          <div className="divide-y divide-[#1e1e2a]">
            {((data as any)?.data?.campaigns || [])
              .filter((c: any) => c.status === 'scheduled')
              .map((c: any) => (
                <div key={c.id} className="flex items-center gap-3 px-5 py-3.5">
                  <Clock className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="text-xs text-[#5a5a72]">{c.total_recipients} recipients</div>
                  </div>
                  {c.scheduled_at && (
                    <div className="text-xs text-yellow-400">
                      {format(new Date(c.scheduled_at), 'MMM d, h:mm a')}
                    </div>
                  )}
                  <Link href={`/campaigns/${c.id}`} className="btn-ghost btn-sm">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
