'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companiesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { Plus, Search, Trash2, Edit2, Building2, Globe, X, ChevronLeft, ChevronRight, Users } from 'lucide-react';

const INDUSTRIES = ['SaaS', 'FinTech', 'AI/ML', 'Marketing', 'E-Commerce', 'Healthcare', 'EdTech', 'Cloud Infrastructure', 'Other'];
const SIZES = ['startup', 'smb', 'enterprise'];

function CompanyModal({ company, onClose, onSave }: any) {
  const { register, handleSubmit } = useForm({ defaultValues: company || {} });
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{company ? 'Edit Company' : 'Add Company'}</h2>
          <button onClick={onClose} className="btn-ghost p-1"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div>
            <label className="input-label">Company Name *</label>
            <input className="input" {...register('name', { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Domain</label>
              <input className="input" placeholder="acme.com" {...register('domain')} />
            </div>
            <div>
              <label className="input-label">Website URL</label>
              <input className="input" placeholder="https://..." {...register('websiteUrl')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Industry</label>
              <select className="input" {...register('industry')}>
                <option value="">Select...</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Company Size</label>
              <select className="input" {...register('size')}>
                <option value="">Select...</option>
                {SIZES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="input-label">Location</label>
            <input className="input" placeholder="San Francisco, CA" {...register('location')} />
          </div>
          <div>
            <label className="input-label">Notes</label>
            <textarea className="input resize-none" rows={2} {...register('notes')} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Save Company</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CompaniesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editCompany, setEditCompany] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['companies', search, page],
    queryFn: () => companiesApi.list({ search, page, limit: 25 }),
  });

  const companies = (data as any)?.data?.companies || [];
  const total = (data as any)?.data?.total || 0;

  const saveMutation = useMutation({
    mutationFn: (d: any) => editCompany ? companiesApi.update(editCompany.id, d) : companiesApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      toast.success(editCompany ? 'Company updated' : 'Company created');
      setShowModal(false);
      setEditCompany(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => companiesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company deleted');
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Companies</h1>
          <p className="text-[#8b8baa] text-sm mt-0.5">{total} companies</p>
        </div>
        <button onClick={() => { setEditCompany(null); setShowModal(true); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Company
        </button>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a72]" />
        <input className="input pl-9 max-w-sm" placeholder="Search companies..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? [...Array(6)].map((_, i) => (
          <div key={i} className="card p-5 space-y-2 animate-pulse">
            <div className="h-5 bg-[#1a1a26] rounded w-3/4" />
            <div className="h-4 bg-[#1a1a26] rounded w-1/2" />
          </div>
        )) : companies.length === 0 ? (
          <div className="col-span-3 text-center py-16">
            <Building2 className="w-10 h-10 text-[#2a2a3a] mx-auto mb-3" />
            <div className="text-sm text-[#5a5a72]">No companies yet</div>
            <button onClick={() => setShowModal(true)} className="mt-3 btn-primary btn-sm">Add Company</button>
          </div>
        ) : companies.map((c: any) => (
          <div key={c.id} className="card p-5 hover:border-[#3a3a50] transition-colors group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#1a1a26] border border-[#252535] flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-brand-400" />
                </div>
                <div>
                  <div className="font-semibold text-white">{c.name}</div>
                  {c.domain && <div className="text-xs text-[#5a5a72]">{c.domain}</div>}
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditCompany(c); setShowModal(true); }} className="btn-ghost p-1.5">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(c.id); }} className="btn-ghost p-1.5 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {c.industry && <span className="badge bg-blue-500/10 text-blue-400 border-blue-500/20">{c.industry}</span>}
              {c.size && <span className="badge bg-purple-500/10 text-purple-400 border-purple-500/20 capitalize">{c.size}</span>}
              {c.location && <span className="text-xs text-[#5a5a72]">{c.location}</span>}
            </div>
            {parseInt(c.contact_count) > 0 && (
              <div className="mt-3 pt-3 border-t border-[#1e1e2a] flex items-center gap-1.5 text-xs text-[#5a5a72]">
                <Users className="w-3.5 h-3.5" />
                {c.contact_count} contact{c.contact_count !== '1' ? 's' : ''}
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <CompanyModal
          company={editCompany}
          onClose={() => { setShowModal(false); setEditCompany(null); }}
          onSave={(d: any) => saveMutation.mutate(d)}
        />
      )}
    </div>
  );
}
