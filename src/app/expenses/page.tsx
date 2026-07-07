'use client';
// src/app/expenses/page.tsx
import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Plus, Trash2, Edit2, Search, Wallet, X, Check, Loader, Camera, Upload, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import styles from './expenses.module.css';

const CATEGORIES = ['transport', 'food', 'supplies', 'accommodation', 'communication', 'miscellaneous'];
const FUND_SOURCES = ['personal', 'mentor'];

interface Expense {
  _id: string;
  description: string;
  amount: number;
  category: string;
  fundSource: string;
  date: string;
  notes: string;
  vendor?: string;
  receiptUrl?: string;
}

const emptyForm = {
  description: '', amount: '', category: 'miscellaneous',
  fundSource: 'personal', date: new Date().toISOString().split('T')[0],
  notes: '', tags: '', vendor: '', receiptUrl: '',
};

export default function ExpensesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterSrc, setFilterSrc] = useState('');
  const [totalBudget, setTotalBudget] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (status === 'unauthenticated') router.push('/login'); }, [status, router]);

  const fetchExpenses = async () => {
    const params = new URLSearchParams({ limit: '200' });
    if (filterCat) params.set('category', filterCat);
    if (filterSrc) params.set('fundSource', filterSrc);
    const res = await fetch(`/api/expenses?${params}`);
    const data = await res.json();
    setExpenses(data.expenses || []);
    setLoading(false);
  };

  useEffect(() => { if (status === 'authenticated') fetchExpenses(); }, [status, filterCat, filterSrc]);

  const openAdd = () => { setEditId(null); setForm({ ...emptyForm }); setShowModal(true); };
  const openEdit = (e: Expense) => {
    setEditId(e._id);
    setForm({ description: e.description, amount: String(e.amount), category: e.category,
      fundSource: e.fundSource, date: e.date.split('T')[0], notes: e.notes, tags: '', vendor: e.vendor || '', receiptUrl: e.receiptUrl || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...form, amount: parseFloat(form.amount), tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) };
    const url = editId ? `/api/expenses/${editId}` : '/api/expenses';
    const method = editId ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setShowModal(false);
    setSaving(false);
    fetchExpenses();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    fetchExpenses();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Compress image using canvas
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const base64Image = canvas.toDataURL('image/jpeg', 0.7);
        setForm(prev => ({ ...prev, receiptUrl: base64Image }));
        
        // Call OCR API
        setOcrLoading(true);
        try {
          const res = await fetch('/api/expenses/ocr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64Image })
          });
          const { data } = await res.json();
          if (data) {
            setForm(prev => ({
              ...prev,
              amount: data.amount ? String(data.amount) : prev.amount,
              vendor: data.vendor || prev.vendor,
              date: data.date || prev.date,
              category: data.category && CATEGORIES.includes(data.category) ? data.category : prev.category,
              description: data.vendor ? `Purchase at ${data.vendor}` : prev.description
            }));
          }
        } catch (error) {
          console.error("OCR Failed", error);
        }
        setOcrLoading(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const filtered = expenses.filter(e =>
    e.description.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase()) ||
    (e.vendor && e.vendor.toLowerCase().includes(search.toLowerCase()))
  );

  const totalSpent = filtered.reduce((s, e) => s + e.amount, 0);
  const personalTotal = filtered.filter(e => e.fundSource === 'personal').reduce((s, e) => s + e.amount, 0);
  const mentorTotal = filtered.filter(e => e.fundSource === 'mentor').reduce((s, e) => s + e.amount, 0);

  return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-content animate-fadeIn">
          {/* Header */}
          <div className="page-header flex items-center justify-between">
            <div>
              <h1>Expense Tracker</h1>
              <p className="text-secondary">Log and manage all your expenses by category and fund source</p>
            </div>
            <button id="add-expense-btn" onClick={openAdd} className="btn btn-primary">
              <Plus size={18} /> Add Expense
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid-3 mb-6">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(108,99,255,0.2)' }}>
                <Wallet size={18} color="var(--primary-light)" />
              </div>
              <span className="stat-label">Total Spent</span>
              <span className="stat-value">Le {totalSpent.toFixed(2)}</span>
              <div className="progress-bar mt-2">
                <div className="progress-fill" style={{ width: totalBudget ? `${Math.min((totalSpent/totalBudget)*100,100)}%` : '0%' }} />
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(108,99,255,0.15)' }}>
                <Wallet size={18} color="var(--primary-light)" />
              </div>
              <span className="stat-label">Personal Funds</span>
              <span className="stat-value text-primary-color">Le {personalTotal.toFixed(2)}</span>
              <span className="stat-sub">{filtered.filter(e => e.fundSource === 'personal').length} transactions</span>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(0,217,165,0.2)' }}>
                <Wallet size={18} color="var(--secondary)" />
              </div>
              <span className="stat-label">Mentor Funds</span>
              <span className="stat-value text-success">Le {mentorTotal.toFixed(2)}</span>
              <span className="stat-sub">{filtered.filter(e => e.fundSource === 'mentor').length} transactions</span>
            </div>
          </div>

          {/* Filters */}
          <div className={styles.filterBar}>
            <div className={styles.searchWrap}>
              <Search size={16} className={styles.searchIcon} />
              <input id="search-expenses" className="form-control" placeholder="Search expenses..."
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: '36px' }} />
            </div>
            <select id="filter-category" className="form-control" value={filterCat}
              onChange={e => setFilterCat(e.target.value)} style={{ width: '160px' }}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
            <select id="filter-source" className="form-control" value={filterSrc}
              onChange={e => setFilterSrc(e.target.value)} style={{ width: '150px' }}>
              <option value="">All Sources</option>
              {FUND_SOURCES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            {(filterCat || filterSrc || search) && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setFilterCat(''); setFilterSrc(''); setSearch(''); }}>
                <X size={14} /> Clear
              </button>
            )}
          </div>

          {/* Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                <Loader size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
                <Wallet size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p>No expenses found. {!search && !filterCat && !filterSrc && 'Add your first expense!'}</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Source</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Receipt</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(e => (
                      <tr key={e._id}>
                        <td>
                          <div className="font-semibold">{e.description}</div>
                          {e.vendor && <div className="text-xs text-muted">{e.vendor}</div>}
                        </td>
                        <td><span className={`chip cat-${e.category}`}>{e.category}</span></td>
                        <td>
                          <span className={`chip ${e.fundSource === 'mentor' ? 'chip-success' : 'chip-primary'}`}>
                            {e.fundSource}
                          </span>
                        </td>
                        <td className="text-secondary">{format(new Date(e.date), 'MMM d, yyyy')}</td>
                        <td className="font-bold" style={{ color: e.fundSource === 'mentor' ? 'var(--secondary)' : 'var(--primary-light)' }}>
                          Le {e.amount.toFixed(2)}
                        </td>
                        <td>
                          {e.receiptUrl ? (
                            <div title="Has receipt" style={{ color: 'var(--primary-light)' }}><ImageIcon size={18} /></div>
                          ) : (
                            <span className="text-muted text-xs">—</span>
                          )}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button id={`edit-${e._id}`} onClick={() => openEdit(e)} className="btn btn-ghost btn-icon btn-sm">
                              <Edit2 size={14} />
                            </button>
                            <button id={`delete-${e._id}`} onClick={() => handleDelete(e._id)} className="btn btn-danger btn-icon btn-sm">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <div className="modal-box animate-slideUp">
              <div className="modal-header">
                <h3>{editId ? 'Edit Expense' : 'Add New Expense'}</h3>
                <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-icon btn-sm">
                  <X size={18} />
                </button>
              </div>

              <div className={styles.formGrid}>
                {/* Image Upload Row */}
                <div className="form-group" style={{ gridColumn: '1/-1', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-input)', padding: '16px', borderRadius: '8px', border: '1px dashed var(--border-focus)' }}>
                    {form.receiptUrl ? (
                      <div style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden' }}>
                        <img src={form.receiptUrl} alt="Receipt" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" onClick={() => setForm(p => ({ ...p, receiptUrl: '' }))} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', padding: 4, cursor: 'pointer' }}>
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ width: 80, height: 80, borderRadius: 8, background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <Camera size={24} />
                      </div>
                    )}
                    
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: 4 }}>Receipt Upload</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                        Upload a receipt to automatically extract details using AI.
                      </p>
                      <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment"
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        style={{ display: 'none' }} 
                      />
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()} disabled={ocrLoading}>
                        {ocrLoading ? <Loader size={14} className="animate-spin" /> : <Upload size={14} />}
                        {ocrLoading ? 'Processing AI...' : 'Select Photo'}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted mt-2">By uploading, you consent to secure processing per GDPR policies.</p>
                </div>

                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Description *</label>
                  <input id="expense-description" className="form-control" placeholder="e.g. Trotro to Accra Mall"
                    value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (Le) *</label>
                  <input id="expense-amount" type="number" step="0.01" className="form-control" placeholder="0.00"
                    value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Vendor / Store</label>
                  <input id="expense-vendor" className="form-control" placeholder="e.g. Melcom"
                    value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input id="expense-date" type="date" className="form-control"
                    value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select id="expense-category" className="form-control"
                    value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Fund Source</label>
                  <select id="expense-fund-source" className="form-control"
                    value={form.fundSource} onChange={e => setForm({ ...form, fundSource: e.target.value })}>
                    {FUND_SOURCES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Notes (optional)</label>
                  <textarea id="expense-notes" className="form-control" placeholder="Additional details..."
                    value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>

              <div className="modal-footer">
                <button onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button id="save-expense-btn" onClick={handleSave} className="btn btn-primary" disabled={saving || !form.description || !form.amount}>
                  {saving ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} />}
                  {saving ? 'Saving...' : editId ? 'Update' : 'Add Expense'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
