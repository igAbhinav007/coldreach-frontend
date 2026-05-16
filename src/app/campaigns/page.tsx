'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignsApi, contactsApi, templatesApi, authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Plus, Send, X, Users, Mail, Clock, Calendar, ChevronRight,
  CheckCircle, XCircle, RotateCw, Hourglass, ArrowRight, Play, AlertCircle
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: any }> = {
  draft: { label: 'Draft', className: 'badge-draft', icon: Mail },
  scheduled: { label: 'Scheduled', className: 'badge-scheduled', icon: Clock },
  running: { label: 'Running', className: 'badge-running', icon: Play },
  completed: { label: 'Completed', className: 'badge-completed', icon: CheckCircle },
  failed: { label: 'Failed', className: 'badge-failed', icon: XCircle },
};

function CampaignModal({ onClose }: any) {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { sendMode: 'immediate', timezone: 'UTC' },
  });
  const sendMode = watch('sendMode');

  const { data: templatesData } = useQuery({ queryKey: ['templates'], queryFn: () => templatesApi.list() });
  const { data: contactsData } = useQuery({ queryKey: ['contacts', 'all'], queryFn: () => contactsApi.list({ limit: 500 }) });
  const templates = (templatesData as any)?.data?.templates || [];
  const contacts = (contactsData as any)?.data?.contacts || [];
  const gmailAccounts = user?.gmailAccounts || [];

  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [contactSearch, setContactSearch] = useState('');

  const filteredContacts = contacts.filter((c: any) =>
    `${c.first_name} ${c.last_name} ${c.email}`.toLowerCase().includes(contactSearch.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: (d: any) => campaignsApi.create({ ...d, contactIds: selectedContacts }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign created!');
      onClose();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleContact = (id: string) => {
    setSelectedContacts(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  const selectAll = () => setSelectedContacts(filteredContacts.map((c: any) => c.id));
  const clearAll = () => setSelectedContacts([]);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card-elevated w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-[#252535] sticky top-0 bg-[#1a1a26] z-10">
          <h2 className="text-lg font-semibold">Create Campaign</h2>
          <button onClick={onClose} className="btn-ghost p-1"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="p-6 space-y-5">
          <div>
            <label className="input-label">Campaign Name *</label>
            <input className="input" placeholder="e.g. Q1 SaaS Outreach" {...register('name', { required: true })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Email Template *</label>
              <select className="input" {...register('templateId', { required: true })}>
                <option value="">Select template...</option>
                {templates.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Gmail Account *</label>
              <select className="input" {...register('gmailConnectionId', { required: true })}>
                <option value="">Select Gmail...</option>
                {gmailAccounts.map((g: any) => <option key={g.id} value={g.id}>{g.gmail_address}</option>)}
              </select>
              {gmailAccounts.length === 0 && (
                <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> No Gmail connected
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="input-label">Default Subject Override</label>
            <input className="input" placeholder="Leave blank to use template subject" {...register('defaultSubject')} />
          </div>

          <div>
            <label className="input-label">Send Mode *</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'immediate', icon: Send, label: 'Send Now' },
                { value: 'scheduled', icon: Clock, label: 'Schedule' },
                { value: 'batched', icon: Calendar, label: 'Batch' },
              ].map(({ value, icon: Icon, label }) => (
                <label key={value} className={`flex flex-col items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${sendMode === value ? 'border-brand-500 bg-brand-500/10' : 'border-[#252535] hover:border-[#3a3a50]'}`}>
                  <input type="radio" value={value} className="sr-only" {...register('sendMode')} />
                  <Icon className={`w-4 h-4 ${sendMode === value ? 'text-brand-400' : 'text-[#5a5a72]'}`} />
                  <span className={`text-xs font-medium ${sendMode === value ? 'text-brand-400' : 'text-[#8b8baa]'}`}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {sendMode === 'scheduled' && (
            <div>
              <label className="input-label">Schedule Date & Time *</label>
              <input type="datetime-local" className="input" {...register('scheduledAt')} />
            </div>
          )}

          {sendMode === 'batched' && (
            <div className="p-4 rounded-xl bg-brand-950/30 border border-brand-800/30">
              <p className="text-sm text-brand-300 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                After creating, go to <strong>Batch Planner</strong> to configure day/hour distribution.
              </p>
            </div>
          )}

          {/* Contact selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="input-label">Recipients * ({selectedContacts.length} selected)</label>
              <div className="flex gap-2">
                <button type="button" onClick={selectAll} className="text-xs text-brand-400 hover:text-brand-300">All</button>
                <span className="text-[#252535]">|</span>
                <button type="button" onClick={clearAll} className="text-xs text-[#5a5a72] hover:text-[#8b8baa]">None</button>
              </div>
            </div>
            <div className="border border-[#252535] rounded-xl overflow-hidden">
              <div className="p-2 border-b border-[#252535]">
                <input
                  className="input text-xs py-1.5"
                  placeholder="Search contacts..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredContacts.slice(0, 100).map((c: any) => (
                  <label key={c.id} className="flex items-center gap-3 px-3 py-2 hover:bg-[#1a1a26] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedContacts.includes(c.id)}
                      onChange={() => toggleContact(c.id)}
                      className="rounded border-[#252535] bg-[#0c0c12] accent-brand-500"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-white">{c.first_name} {c.last_name}</span>
                      <span className="text-xs text-[#5a5a72] ml-2">{c.email}</span>
                    </div>
                    {c.company_name && <span className="text-xs text-[#5a5a72]">{c.company_name}</span>}
                  </label>
                ))}
                {filteredContacts.length === 0 && (
                  <div className="py-6 text-center text-xs text-[#5a5a72]">No contacts found</div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button
              type="submit"
              disabled={createMutation.isPending || selectedContacts.length === 0}
              className="btn-primary flex-1"
            >
              {createMutation.isPending ? 'Creating...' : `Create Campaign (${selectedContacts.length} recipients)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns', statusFilter],
    queryFn: () => campaignsApi.list({ status: statusFilter || undefined, limit: 30 }),
  });

  const campaigns = (data as any)?.data?.campaigns || [];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-[#8b8baa] text-sm mt-0.5">{campaigns.length} campaigns</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5">
        {['', 'draft', 'scheduled', 'running', 'completed', 'failed'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? 'bg-brand-600 text-white' : 'bg-[#14141d] text-[#8b8baa] border border-[#252535] hover:border-[#3a3a50]'}`}
          >
            {s === '' ? 'All' : STATUS_CONFIG[s]?.label || s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Status</th>
              <th>Recipients</th>
              <th>Sent</th>
              <th>Failed</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(7)].map((_, j) => (
                    <td key={j}><div className="h-4 bg-[#1a1a26] rounded animate-pulse w-3/4" /></td>
                  ))}
                </tr>
              ))
            ) : campaigns.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16">
                  <Send className="w-10 h-10 text-[#2a2a3a] mx-auto mb-3" />
                  <div className="text-sm text-[#5a5a72]">No campaigns yet</div>
                  <button onClick={() => setShowModal(true)} className="mt-3 btn-primary btn-sm">
                    Create First Campaign
                  </button>
                </td>
              </tr>
            ) : campaigns.map((c: any) => {
              const config = STATUS_CONFIG[c.status] || STATUS_CONFIG.draft;
              const StatusIcon = config.icon;
              const sentPct = c.total_recipients > 0 ? (c.sent_count / c.total_recipients) * 100 : 0;

              return (
                <tr key={c.id}>
                  <td>
                    <div className="font-medium text-white">{c.name}</div>
                    {c.template_name && <div className="text-xs text-[#5a5a72]">{c.template_name}</div>}
                  </td>
                  <td>
                    <span className={config.className}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {config.label}
                    </span>
                  </td>
                  <td>{c.total_recipients}</td>
                  <td>
                    <div>
                      <span className="text-green-400 font-medium">{c.sent_count}</span>
                      {c.total_recipients > 0 && (
                        <div className="progress-bar mt-1 w-16">
                          <div className="progress-fill" style={{ width: `${sentPct}%` }} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={c.failed_count > 0 ? 'text-red-400' : 'text-[#5a5a72]'}>
                      {c.failed_count}
                    </span>
                  </td>
                  <td className="text-[#8b8baa] text-xs">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </td>
                  <td>
                    <Link href={`/campaigns/${c.id}`} className="btn-ghost btn-sm">
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && <CampaignModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
