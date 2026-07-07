'use client';
// src/app/dashboard/page.tsx
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Onboarding from '@/components/Onboarding';
import {
  Wallet, CheckSquare, TrendingUp, Sparkles, ArrowUpRight,
  Clock, AlertCircle, Plus, Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import styles from './dashboard.module.css';

interface Stats {
  totalExpenses: number;
  personalSpent: number;
  mentorSpent: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  recentExpenses: any[];
  urgentTasks: any[];
  chartData: any[];
  categoryData: any[];
}

const COLORS = ['#6c63ff', '#00d9a5', '#ffd166', '#ff6b6b', '#4cc9f0', '#a0a0c0'];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    Promise.all([
      fetch('/api/expenses?limit=100').then(r => r.json()),
      fetch('/api/tasks').then(r => r.json()),
    ]).then(([expData, taskData]) => {
      const expenses: any[] = expData.expenses || [];
      const tasks: any[] = taskData || [];

      const totalExpenses = expenses.reduce((s: number, e: any) => s + e.amount, 0);
      const personalSpent = expenses.filter((e: any) => e.fundSource === 'personal').reduce((s: number, e: any) => s + e.amount, 0);
      const mentorSpent = expenses.filter((e: any) => e.fundSource === 'mentor').reduce((s: number, e: any) => s + e.amount, 0);

      // Category pie data
      const catMap: Record<string, number> = {};
      expenses.forEach((e: any) => {
        catMap[e.category] = (catMap[e.category] || 0) + e.amount;
      });
      const categoryData = Object.entries(catMap).map(([name, value]) => ({ name, value }));

      // Weekly chart data (last 7 days)
      const chartData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dayStr = format(d, 'MMM d');
        const dayTotal = expenses
          .filter((e: any) => format(new Date(e.date), 'MMM d') === dayStr)
          .reduce((s: number, e: any) => s + e.amount, 0);
        return { day: dayStr, amount: dayTotal };
      });

      setStats({
        totalExpenses, personalSpent, mentorSpent,
        totalTasks: tasks.length,
        completedTasks: tasks.filter((t: any) => t.status === 'completed').length,
        pendingTasks: tasks.filter((t: any) => t.status === 'pending').length,
        recentExpenses: expenses.slice(0, 5),
        urgentTasks: tasks.filter((t: any) => t.priority === 'high' && t.status !== 'completed').slice(0, 3),
        chartData,
        categoryData,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <div className="page-layout">
        <Sidebar />
        <main className="main-content">
          <div className="page-content">
            <div className={styles.loadingGrid}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`skeleton ${styles.skeletonCard}`} />
              ))}
            </div>
          </div>
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
          <div className={styles.dashHeader}>
            <div>
              <h1>
                Good {getGreeting()},{' '}
                <span className="gradient-text">{session?.user?.name?.split(' ')[0]}</span> 👋
              </h1>
              <p className="text-secondary">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
            </div>
            <div className="flex gap-2">
              <Link href="/expenses" className="btn btn-primary">
                <Plus size={16} /> Log Expense
              </Link>
              <Link href="/tasks" className="btn btn-secondary">
                <CheckSquare size={16} /> Add Task
              </Link>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid-stats mb-6">
            <div className={`stat-card ${styles.statPrimary}`}>
              <div className="stat-icon" style={{ background: 'rgba(108,99,255,0.2)' }}>
                <Wallet size={20} color="var(--primary-light)" />
              </div>
              <span className="stat-label">Total Spent</span>
              <span className="stat-value">Le {stats?.totalExpenses.toFixed(2)}</span>
              <span className="stat-sub">All fund sources</span>
            </div>
            <div className={`stat-card ${styles.statSecondary}`}>
              <div className="stat-icon" style={{ background: 'rgba(0,217,165,0.2)' }}>
                <TrendingUp size={20} color="var(--secondary)" />
              </div>
              <span className="stat-label">Mentor Funds</span>
              <span className="stat-value">Le {stats?.mentorSpent.toFixed(2)}</span>
              <span className="stat-sub">Provided by mentor</span>
            </div>
            <div className={`stat-card ${styles.statWarning}`}>
              <div className="stat-icon" style={{ background: 'rgba(255,209,102,0.2)' }}>
                <CheckSquare size={20} color="var(--accent-warning)" />
              </div>
              <span className="stat-label">Tasks Active</span>
              <span className="stat-value">{stats?.totalTasks}</span>
              <span className="stat-sub">{stats?.completedTasks} completed</span>
            </div>
            <div className={`stat-card ${styles.statDanger}`}>
              <div className="stat-icon" style={{ background: 'rgba(255,107,107,0.2)' }}>
                <AlertCircle size={20} color="var(--accent)" />
              </div>
              <span className="stat-label">Pending</span>
              <span className="stat-value">{stats?.pendingTasks}</span>
              <span className="stat-sub">Needs attention</span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid-2 mb-6">
            {/* Spending Chart */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3>7-Day Spending</h3>
                <span className="chip chip-primary">This Week</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={stats?.chartData || []}>
                  <defs>
                    <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }}
                    formatter={(v: any) => [`Le ${v.toFixed(2)}`, 'Spent']} />
                  <Area type="monotone" dataKey="amount" stroke="#6c63ff" strokeWidth={2} fill="url(#colorAmt)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Category Pie */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3>By Category</h3>
                <span className="chip chip-info">Breakdown</span>
              </div>
              {stats?.categoryData && stats.categoryData.length > 0 ? (
                <div className={styles.pieWrap}>
                  <ResponsiveContainer width="50%" height={180}>
                    <PieChart>
                      <Pie data={stats.categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                        dataKey="value" paddingAngle={3}>
                        {stats.categoryData.map((_, idx) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => [`Le ${v.toFixed(2)}`]} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className={styles.pieLegend}>
                    {stats.categoryData.map((d, idx) => (
                      <div key={idx} className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ background: COLORS[idx % COLORS.length] }} />
                        <span className="text-sm text-secondary capitalize">{d.name}</span>
                        <span className="text-sm font-semibold">Le {d.value.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={styles.emptyChart}>
                  <Wallet size={40} color="var(--text-muted)" />
                  <p>No expense data yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid-2">
            {/* Recent Expenses */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3>Recent Expenses</h3>
                <Link href="/expenses" className="btn btn-ghost btn-sm">
                  View all <ArrowUpRight size={14} />
                </Link>
              </div>
              {stats?.recentExpenses?.length ? (
                <div className={styles.expenseList}>
                  {stats.recentExpenses.map((e: any) => (
                    <div key={e._id} className={styles.expenseRow}>
                      <div className={styles.expenseDot}>
                        <span className={`chip cat-${e.category}`}>{e.category.slice(0, 1).toUpperCase()}</span>
                      </div>
                      <div className={styles.expenseInfo}>
                        <span className={styles.expenseDesc}>{e.description}</span>
                        <span className="text-xs text-muted">{format(new Date(e.date), 'MMM d')} · {e.fundSource}</span>
                      </div>
                      <span className={`${styles.expenseAmount} ${e.fundSource === 'mentor' ? 'text-success' : 'text-primary-color'}`}>
                        Le {e.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <Wallet size={32} color="var(--text-muted)" />
                  <p>No expenses logged yet</p>
                  <Link href="/expenses" className="btn btn-primary btn-sm">Log first expense</Link>
                </div>
              )}
            </div>

            {/* Urgent Tasks */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3>High Priority Tasks</h3>
                <Link href="/tasks" className="btn btn-ghost btn-sm">
                  View all <ArrowUpRight size={14} />
                </Link>
              </div>
              {stats?.urgentTasks?.length ? (
                <div className={styles.taskList}>
                  {stats.urgentTasks.map((t: any) => (
                    <div key={t._id} className={styles.taskRow}>
                      <div className={`${styles.priorityDot} ${styles.high}`} />
                      <div className={styles.taskInfo}>
                        <span className={styles.taskTitle}>{t.title}</span>
                        <div className="flex gap-2 mt-1">
                          <span className="chip chip-danger">High</span>
                          <span className={`chip ${t.status === 'in-progress' ? 'chip-info' : 'chip-warning'}`}>{t.status}</span>
                          {t.deadline && (
                            <span className="flex items-center gap-1 text-xs text-muted">
                              <Calendar size={10} /> {format(new Date(t.deadline), 'MMM d')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <CheckSquare size={32} color="var(--text-muted)" />
                  <p>No high-priority tasks</p>
                  <Link href="/tasks" className="btn btn-primary btn-sm">Create a task</Link>
                </div>
              )}
            </div>
          </div>

          {/* AI Enterprise Forecast (New Feature) */}
          <div className="card-glass mb-6" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'var(--primary)', filter: 'blur(80px)', opacity: 0.3 }} />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={20} color="var(--primary)" />
                <h3 style={{ margin: 0 }}>AI Enterprise Forecast</h3>
              </div>
              <span className="chip chip-success">Beta</span>
            </div>
            <p className="text-sm text-secondary mb-4">
              Projected 5-year wealth scaling based on your current expense optimization and task completion rates. 
              Built for tracking trillion-dollar empires.
            </p>
            <div className="progress-bar mb-2">
              <div className="progress-fill" style={{ width: '75%', background: 'var(--grad-primary)' }} />
            </div>
            <div className="flex justify-between text-xs text-muted font-semibold">
              <span>Optimization: 75%</span>
              <span className="text-success">Trajectory: Optimal</span>
            </div>
          </div>

          {/* AI CTA Banner */}
          <div className={styles.aiBanner}>
            <div className={styles.aiBannerIcon}>
              <Sparkles size={28} />
            </div>
            <div>
              <h3>AI Insights Ready</h3>
              <p>Get a smart summary of your week, detect missing records, and generate a shareable report.</p>
            </div>
            <Link href="/reports" className="btn btn-primary">
              Generate Report <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </main>
      <Onboarding />
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
