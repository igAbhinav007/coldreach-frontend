'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsApi, companiesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { Plus, Search, Trash2, Edit2, Mail, Building2, Tag, X, Upload, ChevronLeft, ChevronRight } from 'lucide-react';

function ContactModal({ contact, companies, onClose, onSave }: any) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: contact || {},
  });

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{contact ? 'Edit Contact' : 'Add Contact'}</h2>
          <button onClick={onClose} className="btn-ghost p-1"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">First Name *</label>
              <input className="input" {...register('firstName', { required: true })} />
            </div>
            <div>
              <label className="input-label">Last Name</label>
              <input className="input" {...register('lastName')} />
            </div>
          </div>
          <div>
            <label className="input-label">Email *</label>
            <input className="input" type="email" {...register('email', { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Job Title</label>
              <input className="input" {...register('jobTitle')} />
            </div>
            <div>
              <label className="input-label">Phone</label>
              <input className="input" {...register('phone')} />
            </div>
          </div>
          <div>
            <label className="input-label">Company</label>
            <select className="input" {...register('companyId')}>
              <option value="">No company</option>
              {companies?.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">LinkedIn URL</label>
            <input className="input" {...register('linkedinUrl')} placeholder="https://linkedin.com/in/..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Save Contact</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ContactsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editContact, setEditContact] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', search, page],
    queryFn: () => contactsApi.list({ search, page, limit: 25 }),
  });

  const { data: companiesData } = useQuery({
    queryKey: ['companies', 'all'],
    queryFn: () => companiesApi.list({ limit: 100 }),
  });

  const contacts = (data as any)?.data?.contacts || [];
  const total = (data as any)?.data?.total || 0;
  const totalPages = (data as any)?.data?.totalPages || 1;
  const companies = (companiesData as any)?.data?.companies || [];

  const createMutation = useMutation({
    mutationFn: (d: any) => editContact ? contactsApi.update(editContact.id, d) : contactsApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      toast.success(editContact ? 'Contact updated' : 'Contact created');
      setShowModal(false);
      setEditContact(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contactsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact deleted');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleEdit = (contact: any) => {
    setEditContact(contact);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this contact?')) deleteMutation.mutate(id);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-[#8b8baa] text-sm mt-0.5">{total.toLocaleString()} total contacts</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary btn-sm">
            <Upload className="w-3.5 h-3.5" /> Import CSV
          </button>
          <button onClick={() => { setEditContact(null); setShowModal(true); }} className="btn-primary btn-sm">
            <Plus className="w-3.5 h-3.5" /> Add Contact
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a72]" />
        <input
          className="input pl-9 max-w-sm"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Company</th>
              <th>Job Title</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(5)].map((_, j) => (
                    <td key={j}><div className="h-4 bg-[#1a1a26] rounded animate-pulse w-3/4" /></td>
                  ))}
                </tr>
              ))
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-[#5a5a72]">
                  No contacts found. <button onClick={() => setShowModal(true)} className="text-brand-400 hover:underline">Add one?</button>
                </td>
              </tr>
            ) : contacts.map((c: any) => (
              <tr key={c.id}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-brand-600/20 flex items-center justify-center text-xs text-brand-400 font-bold">
                      {c.first_name[0]}
                    </div>
                    <span className="font-medium text-white">
                      {c.first_name} {c.last_name || ''}
                    </span>
                  </div>
                </td>
                <td>
                  <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-brand-400 hover:text-brand-300">
                    <Mail className="w-3 h-3" />
                    {c.email}
                  </a>
                </td>
                <td>
                  {c.company_name && (
                    <div className="flex items-center gap-1.5 text-[#c8c8e0]">
                      <Building2 className="w-3 h-3 text-[#5a5a72]" />
                      {c.company_name}
                    </div>
                  )}
                </td>
                <td className="text-[#8b8baa]">{c.job_title || '—'}</td>
                <td>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEdit(c)} className="btn-ghost p-1.5" title="Edit">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="btn-ghost p-1.5 hover:text-red-400" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-[#8b8baa]">
          <span>Page {page} of {totalPages}</span>
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

      {showModal && (
        <ContactModal
          contact={editContact}
          companies={companies}
          onClose={() => { setShowModal(false); setEditContact(null); }}
          onSave={(data: any) => createMutation.mutate(data)}
        />
      )}
    </div>
  );
}
