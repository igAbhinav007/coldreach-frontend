'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignsApi, contactsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { format, addDays, parseISO, eachDayOfInterval, getDay } from 'date-fns';
import {
  Calendar, Clock, Plus, Trash2, Zap, Info,
  Users, ChevronDown, ChevronUp, CheckSquare, X
} from 'lucide-react';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_FULL = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

interface SendSlot {
  time: string;
  subjectOverride: string;
  manualContactIds: string[];
}

interface ContactInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company_name?: string;
}

function SlotContactModal({ slot, slotIndex, allContacts, assignedElsewhere, onClose, onSave }: {
  slot: SendSlot;
  slotIndex: number;
  allContacts: ContactInfo[];
  assignedElsewhere: Set<string>;
  onClose: () => void;
  onSave: (ids: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(slot.manualContactIds));
  const [search, setSearch] = useState('');

  const available = allContacts.filter(c => !assignedElsewhere.has(c.id) || selected.has(c.id));
  const filtered = available.filter(c =>
    `${c.first_name} ${c.last_name} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) => {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card-elevated w-full max-w-lg max-h-[80vh] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#252535]">
          <div>
            <h3 className="font-semibold">Assign Contacts — Slot {slotIndex + 1}</h3>
            <p className="text-xs text-[#5a5a72] mt-0.5">{slot.time} · {selected.size} selected</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-4 py-3 border-b border-[#252535] flex gap-2 items-center">
          <input className="input flex-1 text-sm py-1.5" placeholder="Search contacts..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <button onClick={() => setSelected(new Set(filtered.map(c => c.id)))}
            className="text-xs text-brand-400 hover:text-brand-300 whitespace-nowrap">All</button>
          <span className="text-[#252535]">|</span>
          <button onClick={() => setSelected(new Set())}
            className="text-xs text-[#5a5a72] hover:text-[#8b8baa] whitespace-nowrap">None</button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#5a5a72]">No available contacts</div>
          ) : filtered.map(c => (
            <label key={c.id}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#1a1a26] cursor-pointer border-b border-[#1e1e2a] last:border-0">
              <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${selected.has(c.id) ? 'bg-brand-600 border-brand-600' : 'border-[#3a3a50]'}`}
                onClick={() => toggle(c.id)}>
                {selected.has(c.id) && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0" onClick={() => toggle(c.id)}>
                <div className="text-sm text-white">{c.first_name} {c.last_name || ''}</div>
                <div className="text-xs text-[#5a5a72] truncate">{c.email}</div>
              </div>
              {c.company_name && <span className="text-xs text-[#5a5a72] flex-shrink-0">{c.company_name}</span>}
            </label>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-[#252535] flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => { onSave(Array.from(selected)); onClose(); }} className="btn-primary flex-1">
            Assign {selected.size} Contacts
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BatchPlannerPage() {
  const qc = useQueryClient();
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 13), 'yyyy-MM-dd'));
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [sendSlots, setSendSlots] = useState<SendSlot[]>([{ time: '09:00', subjectOverride: '', manualContactIds: [] }]);
  const [daySubjects, setDaySubjects] = useState<Record<string, string>>({});
  const [showDaySubjects, setShowDaySubjects] = useState(false);
  const [distributionMode, setDistributionMode] = useState<'equal' | 'manual'>('equal');
  const [activeSlotModal, setActiveSlotModal] = useState<number | null>(null);
  const [expandedSlots, setExpandedSlots] = useState<Set<number>>(new Set());

  const { data: campaignsData } = useQuery({
    queryKey: ['campaigns', 'batchable'],
    queryFn: () => campaignsApi.list({ limit: 50 }),
  });

  const campaigns = ((campaignsData as any)?.data?.campaigns || []).filter(
    (c: any) => ['draft', 'scheduled'].includes(c.status)
  );
  const selectedCampaign = campaigns.find((c: any) => c.id === selectedCampaignId);

  const { data: contactsData } = useQuery({
    queryKey: ['contacts', 'all-batch'],
    queryFn: () => contactsApi.list({ limit: 500 }),
    enabled: distributionMode === 'manual',
  });
  const allContacts: ContactInfo[] = (contactsData as any)?.data?.contacts || [];

  const scheduledDays = useMemo(() => {
    if (!startDate || !endDate) return [];
    try {
      return eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) })
        .filter(d => selectedWeekdays.includes(getDay(d)));
    } catch { return []; }
  }, [startDate, endDate, selectedWeekdays]);

  const totalSlots = scheduledDays.length * sendSlots.length;
  const recipientsPerSlot = selectedCampaign && totalSlots > 0
    ? Math.ceil(selectedCampaign.total_recipients / totalSlots) : 0;
  const totalManuallyAssigned = sendSlots.reduce((s, sl) => s + sl.manualContactIds.length, 0);

  const getAssignedElsewhere = (excludeIdx: number) => {
    const ids = new Set<string>();
    sendSlots.forEach((s, i) => { if (i !== excludeIdx) s.manualContactIds.forEach(id => ids.add(id)); });
    return ids;
  };

  const scheduleMutation = useMutation({
    mutationFn: () => campaignsApi.batchSchedule(selectedCampaignId, {
      startDate, endDate, weekdays: selectedWeekdays,
      sendTimes: sendSlots.map(s => ({
        time: s.time,
        subjectOverride: s.subjectOverride,
        ...(distributionMode === 'manual' ? { contactIds: s.manualContactIds } : {}),
      })),
      daySubjects, distributionMode,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Batch schedule created!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleWeekday = (day: number) =>
    setSelectedWeekdays(s => s.includes(day) ? s.filter(d => d !== day) : [...s, day].sort());
  const addSlot = () => setSendSlots(s => [...s, { time: '14:00', subjectOverride: '', manualContactIds: [] }]);
  const removeSlot = (i: number) => setSendSlots(s => s.filter((_, idx) => idx !== i));
  const updateSlot = (i: number, field: keyof SendSlot, value: any) =>
    setSendSlots(s => s.map((sl, idx) => idx === i ? { ...sl, [field]: value } : sl));
  const toggleExpand = (i: number) =>
    setExpandedSlots(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });

  const handleSchedule = () => {
    if (!selectedCampaignId) return toast.error('Select a campaign');
    if (scheduledDays.length === 0) return toast.error('No valid days in range');
    if (distributionMode === 'manual' && totalManuallyAssigned === 0) return toast.error('Assign contacts to slots first');
    if (!confirm(`Schedule ${selectedCampaign?.total_recipients} emails across ${scheduledDays.length} days?`)) return;
    scheduleMutation.mutate();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="w-6 h-6 text-brand-400" /> Batch Planner
        </h1>
        <p className="text-[#8b8baa] text-sm mt-1">Distribute emails intelligently across days and time slots</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">

          {/* Campaign */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand-400" /> Select Campaign
            </h3>
            <select className="input" value={selectedCampaignId} onChange={e => setSelectedCampaignId(e.target.value)}>
              <option value="">Choose a campaign...</option>
              {campaigns.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name} ({c.total_recipients} recipients)</option>
              ))}
            </select>
            {campaigns.length === 0 && (
              <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                <Info className="w-3 h-3" /> Create a campaign with "Batch" send mode first.
              </p>
            )}
          </div>

          {/* Distribution mode */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-3">Distribution Mode</h3>
            <div className="grid grid-cols-2 gap-3">
              {([
                { mode: 'equal', icon: CheckSquare, label: 'Equal Distribution', desc: 'Auto-split evenly across all slots', color: 'brand' },
                { mode: 'manual', icon: Users, label: 'Manual Assignment', desc: 'Pick contacts per slot yourself', color: 'purple' },
              ] as const).map(({ mode, icon: Icon, label, desc, color }) => (
                <button key={mode} onClick={() => setDistributionMode(mode)}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${distributionMode === mode
                    ? color === 'brand' ? 'border-brand-500 bg-brand-500/10' : 'border-purple-500 bg-purple-500/10'
                    : 'border-[#252535] hover:border-[#3a3a50]'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${distributionMode === mode
                    ? color === 'brand' ? 'bg-brand-600/20' : 'bg-purple-600/20'
                    : 'bg-[#1a1a26]'}`}>
                    <Icon className={`w-4 h-4 ${distributionMode === mode
                      ? color === 'brand' ? 'text-brand-400' : 'text-purple-400'
                      : 'text-[#5a5a72]'}`} />
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${distributionMode === mode
                      ? color === 'brand' ? 'text-brand-300' : 'text-purple-300'
                      : 'text-[#8b8baa]'}`}>{label}</div>
                    <div className="text-xs text-[#5a5a72] mt-0.5">{desc}</div>
                  </div>
                </button>
              ))}
            </div>

            {distributionMode === 'equal' && selectedCampaign && totalSlots > 0 && (
              <div className="mt-3 p-3 rounded-lg bg-brand-950/30 border border-brand-800/20 text-xs text-brand-300 flex items-center gap-2">
                <CheckSquare className="w-3.5 h-3.5 flex-shrink-0" />
                {selectedCampaign.total_recipients} contacts split ~{recipientsPerSlot} per slot across {totalSlots} batches
              </div>
            )}
            {distributionMode === 'manual' && (
              <div className="mt-3 p-3 rounded-lg bg-purple-950/30 border border-purple-800/20 text-xs text-purple-300 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 flex-shrink-0" />
                {totalManuallyAssigned} contacts assigned — use "Assign" button on each slot
              </div>
            )}
          </div>

          {/* Date range */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-3">Date Range</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">Start Date</label>
                <input type="date" className="input" value={startDate}
                  min={format(new Date(), 'yyyy-MM-dd')} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="input-label">End Date</label>
                <input type="date" className="input" value={endDate} min={startDate}
                  onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Weekdays */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-3">Send Days</h3>
            <div className="flex gap-2">
              {WEEKDAYS.map((day, i) => (
                <button key={day} onClick={() => toggleWeekday(i)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${selectedWeekdays.includes(i)
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/30'
                    : 'bg-[#1a1a26] text-[#8b8baa] border border-[#252535] hover:border-[#3a3a50]'}`}>
                  {day}
                </button>
              ))}
            </div>
            <p className="text-xs text-[#5a5a72] mt-2">{scheduledDays.length} send days in range</p>
          </div>

          {/* Time slots */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-400" /> Send Time Slots
              </h3>
              <button onClick={addSlot} className="btn-secondary btn-sm">
                <Plus className="w-3 h-3" /> Add Slot
              </button>
            </div>

            <div className="space-y-3">
              {sendSlots.map((slot, i) => {
                const isExpanded = expandedSlots.has(i);
                const assignedCount = slot.manualContactIds.length;

                return (
                  <div key={i} className="border border-[#252535] rounded-xl overflow-hidden">
                    <div className="flex items-center gap-3 p-3 bg-[#0f0f17]">
                      <div className="w-7 h-7 rounded-lg bg-brand-600/20 flex items-center justify-center text-xs font-bold text-brand-400 flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <div>
                          <label className="input-label">Time</label>
                          <input type="time" className="input text-sm" value={slot.time}
                            onChange={e => updateSlot(i, 'time', e.target.value)} />
                        </div>
                        <div>
                          <label className="input-label">Subject Override</label>
                          <input className="input text-sm" placeholder="Optional..."
                            value={slot.subjectOverride}
                            onChange={e => updateSlot(i, 'subjectOverride', e.target.value)} />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {distributionMode === 'equal' && (
                          <span className="text-xs text-[#5a5a72] px-2">~{recipientsPerSlot} contacts</span>
                        )}
                        {distributionMode === 'manual' && (
                          <button onClick={() => setActiveSlotModal(i)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${assignedCount > 0
                              ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                              : 'bg-[#1a1a26] border-[#252535] text-[#5a5a72] hover:border-[#3a3a50] hover:text-white'}`}>
                            <Users className="w-3 h-3" />
                            {assignedCount > 0 ? `${assignedCount} assigned` : 'Assign'}
                          </button>
                        )}
                        {sendSlots.length > 1 && (
                          <button onClick={() => removeSlot(i)}
                            className="p-1.5 hover:text-red-400 text-[#5a5a72] transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Assigned contacts preview */}
                    {distributionMode === 'manual' && assignedCount > 0 && (
                      <div className="border-t border-[#1e1e2a]">
                        <button onClick={() => toggleExpand(i)}
                          className="w-full flex items-center justify-between px-4 py-2 text-xs text-[#5a5a72] hover:text-[#8b8baa] transition-colors">
                          <span>{assignedCount} contacts assigned to this slot</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        {isExpanded && (
                          <div className="px-4 pb-3 max-h-36 overflow-y-auto space-y-1">
                            {slot.manualContactIds.map(id => {
                              const c = allContacts.find(x => x.id === id);
                              if (!c) return null;
                              return (
                                <div key={id} className="flex items-center gap-2 py-1">
                                  <div className="w-5 h-5 rounded-full bg-brand-600/20 flex items-center justify-center text-xs text-brand-400 font-bold flex-shrink-0">
                                    {c.first_name[0]}
                                  </div>
                                  <span className="text-xs text-[#c8c8e0]">{c.first_name} {c.last_name || ''}</span>
                                  <span className="text-xs text-[#5a5a72] ml-auto truncate max-w-[120px]">{c.email}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day subjects */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Day-wise Subject Customization</h3>
              <button onClick={() => setShowDaySubjects(s => !s)} className="text-xs text-brand-400 hover:text-brand-300">
                {showDaySubjects ? 'Hide' : 'Configure'}
              </button>
            </div>
            {!showDaySubjects ? (
              <p className="text-xs text-[#5a5a72]">Set different subjects per weekday. Hour overrides take precedence.</p>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-[#5a5a72] mb-3 p-3 bg-[#0f0f17] rounded-lg border border-[#252535]">
                  <strong className="text-[#8b8baa]">Precedence:</strong> Hour override → Day override → Default subject
                </div>
                {WEEKDAY_FULL.map((day, i) => (
                  <div key={day} className={`flex gap-3 items-center ${!selectedWeekdays.includes(i) ? 'opacity-40' : ''}`}>
                    <span className="w-10 text-xs text-[#5a5a72] capitalize font-medium">{WEEKDAYS[i]}</span>
                    <input className="input flex-1 text-sm" placeholder={`${WEEKDAYS[i]} subject (optional)`}
                      value={daySubjects[day] || ''}
                      onChange={e => setDaySubjects(s => ({ ...s, [day]: e.target.value }))}
                      disabled={!selectedWeekdays.includes(i)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          <div className="card p-5 border-brand-800/30 bg-brand-950/20">
            <h3 className="text-sm font-semibold mb-4 text-brand-300">Distribution Preview</h3>
            <div className="space-y-3">
              {[
                ['Total Recipients', selectedCampaign?.total_recipients || 0],
                ['Send Days', scheduledDays.length],
                ['Slots/Day', sendSlots.length],
                ['Total Batches', totalSlots],
              ].map(([label, val]) => (
                <div key={String(label)} className="flex justify-between text-sm">
                  <span className="text-[#8b8baa]">{label}</span>
                  <span className="font-semibold">{val}</span>
                </div>
              ))}
              <div className="pt-3 border-t border-[#252535]">
                {distributionMode === 'equal' ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8b8baa]">Per Batch</span>
                    <span className="font-bold text-brand-400">~{recipientsPerSlot}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8b8baa]">Assigned</span>
                    <span className={`font-bold ${totalManuallyAssigned === (selectedCampaign?.total_recipients || 0) ? 'text-green-400' : 'text-amber-400'}`}>
                      {totalManuallyAssigned} / {selectedCampaign?.total_recipients || 0}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {scheduledDays.length > 0 && (
            <div className="card p-5">
              <h3 className="text-xs font-medium text-[#5a5a72] uppercase tracking-wide mb-3">
                Scheduled Days ({scheduledDays.length})
              </h3>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {scheduledDays.slice(0, 20).map(day => (
                  <div key={day.toISOString()} className="flex items-center justify-between py-1.5 text-xs border-b border-[#1e1e2a] last:border-0">
                    <span className="text-[#c8c8e0]">{format(day, 'EEE, MMM d')}</span>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {sendSlots.map((slot, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-brand-500/10 text-brand-400 rounded">{slot.time}</span>
                      ))}
                    </div>
                  </div>
                ))}
                {scheduledDays.length > 20 && (
                  <div className="text-xs text-[#5a5a72] text-center py-2">+{scheduledDays.length - 20} more days</div>
                )}
              </div>
            </div>
          )}

          <button onClick={handleSchedule}
            disabled={!selectedCampaignId || scheduledDays.length === 0 || scheduleMutation.isPending}
            className="btn-primary w-full justify-center">
            {scheduleMutation.isPending ? (
              <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Scheduling...</>
            ) : (
              <><Calendar className="w-4 h-4" /> Apply Batch Schedule</>
            )}
          </button>
        </div>
      </div>

      {activeSlotModal !== null && (
        <SlotContactModal
          slot={sendSlots[activeSlotModal]}
          slotIndex={activeSlotModal}
          allContacts={allContacts}
          assignedElsewhere={getAssignedElsewhere(activeSlotModal)}
          onClose={() => setActiveSlotModal(null)}
          onSave={ids => updateSlot(activeSlotModal, 'manualContactIds', ids)}
        />
      )}
    </div>
  );
}