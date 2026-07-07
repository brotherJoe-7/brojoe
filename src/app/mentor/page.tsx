'use client';
// src/app/mentor/page.tsx
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Users, CheckSquare, Wallet, Plus, X, Loader, Shield, Check, FileText } from 'lucide-react';
import styles from './mentor.module.css';

interface MenteeStats {
  user: { _id: string; name: string; email: string; totalBudget: number; mentorBudget: number };
  totalSpent: number;
  mentorFundsSpent: number;
  totalTasks: number;
  completedTasks: number;
  verifiedReceipts: number;
}

export default function MentorConsole() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mentees, setMentees] = useState<MenteeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', deadline: '' });
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if ((session?.user as any)?.role !== 'mentor') {
        router.push('/dashboard');
      } else {
        fetchMentees();
      }
    }
  }, [status, session, router]);

  const fetchMentees = async () => {
    try {
      const res = await fetch('/api/mentor/users');
      const data = await res.json();
      setMentees(data.mentees || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAssignTask = (userId: string) => {
    setSelectedUserId(userId);
    setTaskForm({ title: '', description: '', priority: 'medium', deadline: '' });
    setShowTaskModal(true);
  };

  const handleAssignTask = async () => {
    setAssigning(true);
    try {
      await fetch('/api/mentor/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, ...taskForm })
      });
      setShowTaskModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setAssigning(false);
    }
  };

  const exportConsolidatedReport = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Mentor Consolidated Report', 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.setTextColor(0);

    let yOffset = 40;
    
    mentees.forEach((m, idx) => {
      if (yOffset > 250) {
        doc.addPage();
        yOffset = 20;
      }
      doc.setFontSize(14);
      doc.text(`${idx + 1}. ${m.user.name} (${m.user.email})`, 14, yOffset);
      doc.setFontSize(11);
      doc.text(`Total Spend: Le ${m.totalSpent.toFixed(2)} | Mentor Funds: Le ${m.mentorFundsSpent.toFixed(2)}`, 14, yOffset + 8);
      doc.text(`Tasks Completed: ${m.completedTasks}/${m.totalTasks} | Verified Receipts: ${m.verifiedReceipts}`, 14, yOffset + 14);
      yOffset += 25;
    });

    doc.save('Consolidated_Mentor_Report.pdf');
  };

  if (loading) {
    return (
      <div className="page-layout">
        <Sidebar />
        <main className="main-content flex items-center justify-center">
          <Loader size={32} className="animate-spin text-muted" />
        </main>
      </div>
    );
  }

  return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-content animate-fadeIn">
          {/* Header */}
          <div className="page-header flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Shield size={24} color="var(--primary-light)" />
                <h1>Mentor Console</h1>
              </div>
              <p className="text-secondary">Supervise mentees, review aggregated reports, and assign tasks</p>
            </div>
            <button className="btn btn-primary" onClick={exportConsolidatedReport} disabled={mentees.length === 0}>
              <FileText size={16} /> Export Consolidated PDF
            </button>
          </div>

          {/* Mentee List */}
          <div className="grid-2">
            {mentees.length === 0 ? (
              <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px' }}>
                <Users size={48} className="mx-auto mb-4 text-muted" style={{ opacity: 0.3 }} />
                <h3>No Mentees Found</h3>
                <p className="text-secondary mt-2">Users must add your email ({session?.user?.email}) in their settings to appear here.</p>
              </div>
            ) : (
              mentees.map(m => (
                <div key={m.user._id} className={styles.menteeCard}>
                  <div className={styles.menteeHeader}>
                    <div className={styles.menteeAvatar}>{m.user.name.charAt(0).toUpperCase()}</div>
                    <div>
                      <h3 style={{ margin: 0 }}>{m.user.name}</h3>
                      <p className="text-xs text-muted" style={{ margin: 0 }}>{m.user.email}</p>
                    </div>
                  </div>

                  <div className={styles.statsGrid}>
                    <div className={styles.statBox}>
                      <Wallet size={16} color="var(--primary-light)" />
                      <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Total Spend</span>
                        <span className={styles.statVal}>Le {m.totalSpent.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className={styles.statBox}>
                      <Wallet size={16} color="var(--secondary)" />
                      <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Mentor Funds</span>
                        <span className={styles.statVal}>Le {m.mentorFundsSpent.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className={styles.statBox}>
                      <CheckSquare size={16} color="var(--accent-info)" />
                      <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Tasks Done</span>
                        <span className={styles.statVal}>{m.completedTasks} / {m.totalTasks}</span>
                      </div>
                    </div>
                    <div className={styles.statBox}>
                      <Shield size={16} color="var(--accent-warning)" />
                      <div className={styles.statInfo}>
                        <span className={styles.statLabel}>Verified Receipts</span>
                        <span className={styles.statVal}>{m.verifiedReceipts}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.menteeActions}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openAssignTask(m.user._id)}>
                      <Plus size={14} /> Assign Task
                    </button>
                    <button className="btn btn-ghost btn-sm">
                      View Report
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Assign Task Modal */}
        {showTaskModal && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowTaskModal(false); }}>
            <div className="modal-box animate-slideUp">
              <div className="modal-header">
                <h3>Assign Task to Mentee</h3>
                <button onClick={() => setShowTaskModal(false)} className="btn btn-ghost btn-icon btn-sm"><X size={18} /></button>
              </div>

              <div className="form-group mb-4">
                <label className="form-label">Task Title *</label>
                <input className="form-control" placeholder="e.g. Purchase field supplies"
                  value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} />
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Description</label>
                <textarea className="form-control" placeholder="Details..."
                  value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
              </div>
              <div className="flex gap-4 mb-4">
                <div className="form-group flex-1">
                  <label className="form-label">Priority</label>
                  <select className="form-control" value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Deadline</label>
                  <input type="date" className="form-control"
                    value={taskForm.deadline} onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })} />
                </div>
              </div>

              <div className="modal-footer mt-6">
                <button onClick={() => setShowTaskModal(false)} className="btn btn-secondary">Cancel</button>
                <button onClick={handleAssignTask} className="btn btn-primary" disabled={assigning || !taskForm.title}>
                  {assigning ? <Loader size={16} className="animate-spin" /> : <Check size={16} />}
                  {assigning ? 'Assigning...' : 'Assign Task'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
