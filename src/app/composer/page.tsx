'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templatesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Save, Eye, Trash2, ChevronDown, Tag, X, FileText, Edit2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const PLACEHOLDERS = [
  { label: '{name}', desc: 'First name' },
  { label: '{firstName}', desc: 'First name' },
  { label: '{lastName}', desc: 'Last name' },
  { label: '{fullName}', desc: 'Full name' },
  { label: '{company}', desc: 'Company name' },
  { label: '{jobTitle}', desc: 'Job title' },
  { label: '{email}', desc: 'Email address' },
];

const QUILL_MODULES = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
};

function TemplateList({ templates, activeId, onSelect, onNew, onDelete }: any) {
  return (
    <div className="w-64 flex-shrink-0 border-r border-[#252535] flex flex-col">
      <div className="px-4 py-4 border-b border-[#252535] flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#8b8baa] uppercase tracking-wide">Templates</h2>
        <button onClick={onNew} className="btn-primary btn-sm p-1.5" title="New template">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {templates.length === 0 && (
          <div className="px-4 py-8 text-center text-xs text-[#5a5a72]">
            No templates yet.<br />Create your first one.
          </div>
        )}
        {templates.map((t: any) => (
          <div
            key={t.id}
            onClick={() => onSelect(t)}
            className={`group flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-[#1a1a26] transition-colors ${activeId === t.id ? 'bg-[#1a1a26] border-r-2 border-brand-500' : ''}`}
          >
            <FileText className="w-3.5 h-3.5 text-[#5a5a72] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{t.name}</div>
              <div className="text-xs text-[#5a5a72] truncate">{t.subject}</div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-[#5a5a72] transition-all"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewModal({ subject, body, onClose }: any) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card-elevated w-full max-w-2xl p-0 overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#252535]">
          <h3 className="font-semibold">Email Preview</h3>
          <button onClick={onClose} className="btn-ghost p-1"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6">
          <div className="mb-4 p-3 bg-[#0c0c12] rounded-lg border border-[#252535]">
            <span className="text-xs text-[#5a5a72] uppercase tracking-wide">Subject</span>
            <div className="text-sm text-white mt-1 font-medium">{subject || '(no subject)'}</div>
          </div>
          <div className="p-4 bg-white rounded-lg min-h-[200px]">
            <div
              className="text-gray-900 text-sm leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: body || '<em style="color:#aaa">Empty body</em>' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ComposerPage() {
  const qc = useQueryClient();
  const [activeTemplate, setActiveTemplate] = useState<any>(null);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewVars, setPreviewVars] = useState({ name: 'John', company: 'Acme Corp', jobTitle: 'CEO' });

  const { data } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.list(),
  });

  const templates = (data as any)?.data?.templates || [];

  const saveMutation = useMutation({
    mutationFn: (d: any) =>
      activeTemplate?.id ? templatesApi.update(activeTemplate.id, d) : templatesApi.create(d),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      setActiveTemplate(res.data?.template);
      setIsDirty(false);
      toast.success('Template saved!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => templatesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      handleNew();
      toast.success('Template deleted');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleSelect = (t: any) => {
    if (isDirty && !confirm('Discard unsaved changes?')) return;
    setActiveTemplate(t);
    setName(t.name);
    setSubject(t.subject);
    setBody(t.body);
    setIsDirty(false);
  };

  const handleNew = () => {
    if (isDirty && !confirm('Discard unsaved changes?')) return;
    setActiveTemplate(null);
    setName('');
    setSubject('');
    setBody('');
    setIsDirty(false);
  };

  const handleSave = () => {
    if (!name.trim()) return toast.error('Template name is required');
    if (!subject.trim()) return toast.error('Subject is required');
    if (!body.trim()) return toast.error('Body is required');
    saveMutation.mutate({ name, subject, body });
  };

  const insertPlaceholder = (placeholder: string) => {
    setSubject(s => s + placeholder);
    setIsDirty(true);
  };

  const getPreviewContent = () => {
    const vars: Record<string, string> = {
      name: previewVars.name,
      firstName: previewVars.name,
      company: previewVars.company,
      jobTitle: previewVars.jobTitle,
    };
    let s = subject;
    let b = body;
    for (const [k, v] of Object.entries(vars)) {
      const re = new RegExp(`\\{\\{?${k}\\}?\\}`, 'gi');
      s = s.replace(re, v);
      b = b.replace(re, v);
    }
    return { subject: s, body: b };
  };

  return (
    <div className="flex h-screen">
      <TemplateList
        templates={templates}
        activeId={activeTemplate?.id}
        onSelect={handleSelect}
        onNew={handleNew}
        onDelete={(id: string) => { if (confirm('Delete this template?')) deleteMutation.mutate(id); }}
      />

      {/* Editor */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-6 py-3.5 border-b border-[#252535] bg-[#0f0f17]">
          <div className="flex-1">
            <input
              className="input text-base font-medium bg-transparent border-none p-0 focus:ring-0 focus:outline-none"
              placeholder="Template name..."
              value={name}
              onChange={(e) => { setName(e.target.value); setIsDirty(true); }}
            />
          </div>
          <div className="flex items-center gap-2">
            {isDirty && <span className="text-xs text-amber-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />Unsaved</span>}
            <button onClick={() => setShowPreview(true)} className="btn-secondary btn-sm">
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
            <button onClick={handleSave} disabled={saveMutation.isPending} className="btn-primary btn-sm">
              <Save className="w-3.5 h-3.5" />
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Main editor */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Subject */}
            <div className="mb-5">
              <label className="input-label">Subject Line</label>
              <input
                className="input text-base"
                placeholder="e.g. Quick question about {company}'s growth..."
                value={subject}
                onChange={(e) => { setSubject(e.target.value); setIsDirty(true); }}
              />
            </div>

            {/* Body */}
            <div>
              <label className="input-label">Email Body</label>
              <ReactQuill
                theme="snow"
                value={body}
                onChange={(v) => { setBody(v); setIsDirty(true); }}
                modules={QUILL_MODULES}
                placeholder="Write your cold email here. Use {name}, {company} as placeholders..."
              />
            </div>

            {/* Variables found */}
            {(subject + body).match(/\{[^}]+\}/g) && (
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-[#5a5a72]">Variables detected:</span>
                {[...new Set((subject + body).match(/\{[^}]+\}/g))].map((v: any) => (
                  <span key={v} className="badge bg-brand-500/10 text-brand-400 border border-brand-500/20">{v}</span>
                ))}
              </div>
            )}
          </div>

          {/* Right panel: placeholders + preview vars */}
          <div className="w-64 border-l border-[#252535] flex flex-col bg-[#0f0f17] overflow-y-auto">
            <div className="p-4 border-b border-[#252535]">
              <div className="text-xs font-medium text-[#5a5a72] uppercase tracking-wide mb-3">Insert Placeholder</div>
              <div className="space-y-1">
                {PLACEHOLDERS.map(({ label, desc }) => (
                  <button
                    key={label}
                    onClick={() => insertPlaceholder(label)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#1a1a26] transition-colors text-left"
                  >
                    <span className="text-xs font-mono text-brand-400">{label}</span>
                    <span className="text-xs text-[#5a5a72]">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4">
              <div className="text-xs font-medium text-[#5a5a72] uppercase tracking-wide mb-3">Preview Values</div>
              <div className="space-y-2">
                {Object.entries(previewVars).map(([key, val]) => (
                  <div key={key}>
                    <label className="text-xs text-[#5a5a72] capitalize mb-1 block">{key}</label>
                    <input
                      className="input text-xs py-1.5"
                      value={val}
                      onChange={(e) => setPreviewVars(p => ({ ...p, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPreview && (
        <PreviewModal
          {...getPreviewContent()}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
