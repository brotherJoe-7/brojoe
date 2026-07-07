'use client';
// src/app/tasks/page.tsx
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import {
  Plus, X, Check, Loader, ChevronDown, ChevronRight,
  Calendar, AlertTriangle, Circle, CheckCircle2, Clock,
  Trash2, Edit2
} from 'lucide-react';
import { format } from 'date-fns';
import styles from './tasks.module.css';

const STATUSES = ['pending', 'in-progress', 'completed'];
const PRIORITIES = ['low', 'medium', 'high'];

interface SubTask { _id?: string; title: string; status: string; }
interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  deadline?: string;
  subTasks: SubTask[];
  tags: string[];
  completedAt?: string;
  createdAt: string;
}

const emptyForm = {
  title: '', description: '', status: 'pending', priority: 'medium',
  deadline: '', tags: '', subTasks: [{ title: '', status: 'pending' }] as SubTask[],
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'completed') return <CheckCircle2 size={16} color="var(--secondary)" />;
  if (status === 'in-progress') return <Clock size={16} color="var(--accent-info)" />;
  return <Circle size={16} color="var(--text-muted)" />;
};

export default function TasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  useEffect(() => { if (status === 'unauthenticated') router.push('/login'); }, [status, router]);

  const fetchTasks = async () => {
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    if (filterPriority) params.set('priority', filterPriority);
    const res = await fetch(`/api/tasks?${params}`);
    const data = await res.json();
    setTasks(data || []);
    setLoading(false);
  };

  useEffect(() => { if (status === 'authenticated') fetchTasks(); }, [status, filterStatus, filterPriority]);

  const openAdd = () => {
    setEditId(null);
    setForm({ ...emptyForm, subTasks: [{ title: '', status: 'pending' }] });
    setShowModal(true);
  };

  const openEdit = (t: Task) => {
    setEditId(t._id);
    setForm({
      title: t.title, description: t.description, status: t.status,
      priority: t.priority, deadline: t.deadline ? t.deadline.split('T')[0] : '',
      tags: t.tags?.join(', ') || '',
      subTasks: t.subTasks?.length ? t.subTasks : [{ title: '', status: 'pending' }],
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      subTasks: form.subTasks.filter(s => s.title.trim()),
      deadline: form.deadline || undefined,
    };
    const url = editId ? `/api/tasks/${editId}` : '/api/tasks';
    const method = editId ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setShowModal(false);
    setSaving(false);
    fetchTasks();
  };

  const quickStatus = async (task: Task, newStatus: string) => {
    await fetch(`/api/tasks/${task._id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...task, status: newStatus }),
    });
    fetchTasks();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    fetchTasks();
  };

  const toggleExpand = (id: string) => {
    const next = new Set(expandedTasks);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedTasks(next);
  };

  const addSubTask = () => setForm({ ...form, subTasks: [...form.subTasks, { title: '', status: 'pending' }] });
  const updateSubTask = (i: number, val: string) => {
    const st = [...form.subTasks];
    st[i] = { ...st[i], title: val };
    setForm({ ...form, subTasks: st });
  };
  const removeSubTask = (i: number) => setForm({ ...form, subTasks: form.subTasks.filter((_, idx) => idx !== i) });

  const pending = tasks.filter(t => t.status === 'pending');
  const inProgress = tasks.filter(t => t.status === 'in-progress');
  const completed = tasks.filter(t => t.status === 'completed');

  return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-content animate-fadeIn">
          {/* Header */}
          <div className="page-header flex items-center justify-between">
            <div>
              <h1>Tasks & Errands</h1>
              <p className="text-secondary">Manage your errands, sub-tasks, priorities and deadlines</p>
            </div>
            <button id="add-task-btn" onClick={openAdd} className="btn btn-primary">
              <Plus size={18} /> Add Task
            </button>
          </div>

          {/* Stats */}
          <div className="grid-3 mb-6">
            <div className="stat-card">
              <span className="stat-label" style={{ color: 'var(--accent-warning)' }}>⏳ Pending</span>
              <span className="stat-value">{pending.length}</span>
              <span className="stat-sub">Awaiting action</span>
            </div>
            <div className="stat-card">
              <span className="stat-label" style={{ color: 'var(--accent-info)' }}>🔄 In Progress</span>
              <span className="stat-value">{inProgress.length}</span>
              <span className="stat-sub">Currently active</span>
            </div>
            <div className="stat-card">
              <span className="stat-label" style={{ color: 'var(--secondary)' }}>✅ Completed</span>
              <span className="stat-value">{completed.length}</span>
              <span className="stat-sub">Done & dusted</span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3 mb-5" style={{ flexWrap: 'wrap' }}>
            <select className="form-control" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 160 }}>
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <select className="form-control" value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ width: 160 }}>
              <option value="">All Priorities</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
            {(filterStatus || filterPriority) && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setFilterStatus(''); setFilterPriority(''); }}>
                <X size={14} /> Clear
              </button>
            )}
          </div>

          {/* Kanban-style columns */}
          {loading ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
              <Loader size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            </div>
          ) : (
            <div className={styles.kanban}>
              {/* Pending */}
              <div className={styles.column}>
                <div className={`${styles.colHeader} ${styles.pendingHeader}`}>
                  <Circle size={16} /> Pending <span className={styles.count}>{pending.length}</span>
                </div>
                {pending.map(t => <TaskCard key={t._id} task={t} expanded={expandedTasks.has(t._id)}
                  onToggle={() => toggleExpand(t._id)} onEdit={() => openEdit(t)}
                  onDelete={() => handleDelete(t._id)} onStatus={s => quickStatus(t, s)} />)}
                {!pending.length && <EmptyColumn label="No pending tasks" />}
              </div>

              {/* In Progress */}
              <div className={styles.column}>
                <div className={`${styles.colHeader} ${styles.progressHeader}`}>
                  <Clock size={16} /> In Progress <span className={styles.count}>{inProgress.length}</span>
                </div>
                {inProgress.map(t => <TaskCard key={t._id} task={t} expanded={expandedTasks.has(t._id)}
                  onToggle={() => toggleExpand(t._id)} onEdit={() => openEdit(t)}
                  onDelete={() => handleDelete(t._id)} onStatus={s => quickStatus(t, s)} />)}
                {!inProgress.length && <EmptyColumn label="Nothing in progress" />}
              </div>

              {/* Completed */}
              <div className={styles.column}>
                <div className={`${styles.colHeader} ${styles.doneHeader}`}>
                  <CheckCircle2 size={16} /> Completed <span className={styles.count}>{completed.length}</span>
                </div>
                {completed.map(t => <TaskCard key={t._id} task={t} expanded={expandedTasks.has(t._id)}
                  onToggle={() => toggleExpand(t._id)} onEdit={() => openEdit(t)}
                  onDelete={() => handleDelete(t._id)} onStatus={s => quickStatus(t, s)} />)}
                {!completed.length && <EmptyColumn label="No completed tasks yet" />}
              </div>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <div className="modal-box animate-slideUp" style={{ maxWidth: 580 }}>
              <div className="modal-header">
                <h3>{editId ? 'Edit Task' : 'New Task / Errand'}</h3>
                <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-icon btn-sm"><X size={18} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Task Title *</label>
                  <input id="task-title" className="form-control" placeholder="e.g. Collect documents from office"
                    value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea id="task-description" className="form-control" placeholder="What needs to be done?"
                    value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select id="task-status" className="form-control"
                      value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select id="task-priority" className="form-control"
                      value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                      {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Deadline</label>
                    <input id="task-deadline" type="date" className="form-control"
                      value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
                  </div>
                </div>

                {/* Sub-Tasks */}
                <div className="form-group">
                  <div className="flex items-center justify-between mb-2">
                    <label className="form-label">Sub-Tasks / Breakdown</label>
                    <button type="button" onClick={addSubTask} className="btn btn-ghost btn-sm"><Plus size={12} /> Add Step</button>
                  </div>
                  {form.subTasks.map((st, i) => (
                    <div key={i} className={styles.subTaskInput}>
                      <span className={styles.subNum}>{i + 1}</span>
                      <input className="form-control" placeholder={`Step ${i + 1}...`}
                        value={st.title} onChange={e => updateSubTask(i, e.target.value)} />
                      <button type="button" onClick={() => removeSubTask(i)} className="btn btn-danger btn-icon btn-sm"><X size={12} /></button>
                    </div>
                  ))}
                </div>

                <div className="form-group">
                  <label className="form-label">Tags (comma-separated)</label>
                  <input id="task-tags" className="form-control" placeholder="e.g. errand, urgent, mentor"
                    value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
                </div>
              </div>

              <div className="modal-footer">
                <button onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button id="save-task-btn" onClick={handleSave} className="btn btn-primary" disabled={saving || !form.title}>
                  {saving ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} />}
                  {saving ? 'Saving...' : editId ? 'Update Task' : 'Add Task'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function TaskCard({ task, expanded, onToggle, onEdit, onDelete, onStatus }: {
  task: Task; expanded: boolean;
  onToggle: () => void; onEdit: () => void;
  onDelete: () => void; onStatus: (s: string) => void;
}) {
  const completedSubs = task.subTasks?.filter(s => s.status === 'completed').length || 0;
  const progress = task.subTasks?.length ? Math.round((completedSubs / task.subTasks.length) * 100) : 0;
  const isOverdue = task.deadline && task.status !== 'completed' && new Date(task.deadline) < new Date();

  return (
    <div className={`${styles.taskCard} ${task.status === 'completed' ? styles.taskDone : ''}`}>
      <div className={styles.taskCardTop} onClick={onToggle}>
        <div className={styles.taskCardLeft}>
          <span className={`chip ${task.priority === 'high' ? 'chip-danger' : task.priority === 'medium' ? 'chip-warning' : 'chip-info'}`}>
            {task.priority}
          </span>
          <span className={styles.taskCardTitle}>{task.title}</span>
        </div>
        {expanded ? <ChevronDown size={16} color="var(--text-muted)" /> : <ChevronRight size={16} color="var(--text-muted)" />}
      </div>

      {task.description && !expanded && (
        <p className={styles.taskCardDesc}>{task.description}</p>
      )}

      {expanded && (
        <div className={styles.taskCardExpanded}>
          {task.description && <p className={styles.taskCardDesc}>{task.description}</p>}

          {task.subTasks?.length > 0 && (
            <div className={styles.subTaskList}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted">Sub-tasks ({completedSubs}/{task.subTasks.length})</span>
                <span className="text-xs text-muted">{progress}%</span>
              </div>
              <div className="progress-bar mb-3">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              {task.subTasks.map((st, i) => (
                <div key={i} className={styles.subTaskRow}>
                  <CheckCircle2 size={14} color={st.status === 'completed' ? 'var(--secondary)' : 'var(--text-muted)'} />
                  <span className={st.status === 'completed' ? styles.subTaskDone : ''}>{st.title}</span>
                </div>
              ))}
            </div>
          )}

          {task.tags?.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-2">
              {task.tags.map((tag, i) => <span key={i} className="chip chip-primary text-xs">{tag}</span>)}
            </div>
          )}
        </div>
      )}

      <div className={styles.taskCardFooter}>
        <div className="flex items-center gap-2">
          {task.deadline && (
            <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-danger' : 'text-muted'}`}>
              {isOverdue && <AlertTriangle size={10} />}
              <Calendar size={10} /> {format(new Date(task.deadline), 'MMM d')}
            </span>
          )}
          {task.subTasks?.length > 0 && (
            <span className="text-xs text-muted">{task.subTasks.length} steps</span>
          )}
        </div>
        <div className="flex gap-1">
          {task.status !== 'in-progress' && (
            <button className="btn btn-ghost btn-sm" onClick={() => onStatus('in-progress')}>▶ Start</button>
          )}
          {task.status !== 'completed' && (
            <button className="btn btn-success btn-sm" onClick={() => onStatus('completed')}>✓ Done</button>
          )}
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onEdit}><Edit2 size={12} /></button>
          <button className="btn btn-danger btn-icon btn-sm" onClick={onDelete}><Trash2 size={12} /></button>
        </div>
      </div>
    </div>
  );
}

function EmptyColumn({ label }: { label: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
      {label}
    </div>
  );
}
