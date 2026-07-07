'use client';
// src/app/portfolio/page.tsx
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import {
  Trophy, Star, Target, TrendingUp, Award, Calendar,
  Wallet, CheckSquare, Clock, ArrowUp, Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import styles from './portfolio.module.css';

const ACHIEVEMENTS = [
  { id: 'first_expense', label: 'First Expense', icon: '💰', desc: 'Logged your first expense' },
  { id: 'first_task', label: 'Task Master', icon: '✅', desc: 'Created your first task' },
  { id: 'first_report', label: 'Reporter', icon: '📊', desc: 'Generated your first report' },
  { id: '10_expenses', label: 'Record Keeper', icon: '📚', desc: 'Logged 10+ expenses' },
  { id: 'week_streak', label: 'Consistent', icon: '🔥', desc: 'Active for 7 days' },
  { id: 'ai_user', label: 'AI Explorer', icon: '🤖', desc: 'Used the AI assistant' },
];

export default function PortfolioPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [forecast, setForecast] = useState<string | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  const generateForecast = async () => {
    setForecastLoading(true);
    try {
      const res = await fetch('/api/ai/forecast');
      const json = await res.json();
      if (json.forecast) {
        setForecast(json.forecast);
      }
    } catch (error) {
      console.error(error);
    }
    setForecastLoading(false);
  };

  useEffect(() => { if (status === 'unauthenticated') router.push('/login'); }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    Promise.all([
      fetch('/api/expenses?limit=500').then(r => r.json()),
      fetch('/api/tasks').then(r => r.json()),
      fetch('/api/reports').then(r => r.json()),
    ]).then(([expData, taskData, reportData]) => {
      const expenses = expData.expenses || [];
      const tasks = taskData || [];
      const reports = reportData || [];

      // Monthly chart
      const monthMap: Record<string, number> = {};
      expenses.forEach((e: any) => {
        const m = format(new Date(e.date), 'MMM');
        monthMap[m] = (monthMap[m] || 0) + e.amount;
      });
      const monthlyData = Object.entries(monthMap).map(([month, total]) => ({ month, total }));

      // Achievements
      const earned: string[] = [];
      if (expenses.length > 0) earned.push('first_expense');
      if (tasks.length > 0) earned.push('first_task');
      if (reports.length > 0) earned.push('first_report');
      if (expenses.length >= 10) earned.push('10_expenses');
      if (reports.length > 0) earned.push('ai_user');

      // Top categories
      const catMap: Record<string, number> = {};
      expenses.forEach((e: any) => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
      const topCategories = Object.entries(catMap).sort(([,a],[,b]) => b - a).slice(0, 5)
        .map(([cat, amt]) => ({ cat, amt }));

      setData({
        totalExpenses: expenses.reduce((s: number, e: any) => s + e.amount, 0),
        totalTasks: tasks.length,
        completedTasks: tasks.filter((t: any) => t.status === 'completed').length,
        totalReports: reports.length,
        expenseCount: expenses.length,
        monthlyData,
        earned,
        topCategories,
        memberSince: session?.user ? new Date().toISOString() : null,
        completionRate: tasks.length ? Math.round((tasks.filter((t: any) => t.status === 'completed').length / tasks.length) * 100) : 0,
      });
      setLoading(false);
    });
  }, [status]);

  if (loading) {
    return (
      <div className="page-layout">
        <Sidebar />
        <main className="main-content">
          <div className="page-content">
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading portfolio...
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
          {/* Hero */}
          <div className={styles.heroCard}>
            <div className={styles.heroGlow} />
            <div className={styles.heroContent}>
              <div className={styles.heroAvatar}>
                {session?.user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1>{session?.user?.name}</h1>
                <p className="text-secondary">{session?.user?.email}</p>
                <div className="flex gap-2 mt-3">
                  <span className="chip chip-primary"><Star size={12} /> Member</span>
                  <span className="chip chip-success"><Trophy size={12} /> {data.earned.length} Achievements</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <Wallet size={20} color="var(--primary-light)" />
                <span className={styles.heroStatVal}>Le {data.totalExpenses.toFixed(0)}</span>
                <span className="stat-label">Total Tracked</span>
              </div>
              <div className={styles.heroStat}>
                <CheckSquare size={20} color="var(--secondary)" />
                <span className={styles.heroStatVal}>{data.completedTasks}/{data.totalTasks}</span>
                <span className="stat-label">Tasks Done</span>
              </div>
              <div className={styles.heroStat}>
                <Target size={20} color="var(--accent-warning)" />
                <span className={styles.heroStatVal}>{data.completionRate}%</span>
                <span className="stat-label">Completion</span>
              </div>
              <div className={styles.heroStat}>
                <Sparkles size={20} color="var(--accent-info)" />
                <span className={styles.heroStatVal}>{data.totalReports}</span>
                <span className="stat-label">Reports</span>
              </div>
            </div>
          </div>

          <div className="grid-2 mt-6">
            {/* Achievements */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Trophy size={20} color="var(--accent-warning)" />
                <h3>Achievements</h3>
              </div>
              <div className={styles.achieveGrid}>
                {ACHIEVEMENTS.map(a => (
                  <div key={a.id} className={`${styles.achieveCard} ${data.earned.includes(a.id) ? styles.earned : styles.locked}`}>
                    <span className={styles.achieveIcon}>{data.earned.includes(a.id) ? a.icon : '🔒'}</span>
                    <span className={styles.achieveLabel}>{a.label}</span>
                    <span className={styles.achieveDesc}>{a.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Spending Chart */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={20} color="var(--secondary)" />
                <h3>Monthly Spending</h3>
              </div>
              {data.monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.monthlyData}>
                    <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }}
                      formatter={(v: any) => [`Le ${v.toFixed(2)}`, 'Spent']} />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                      {data.monthlyData.map((_: any, i: number) => (
                        <Cell key={i} fill={i % 2 === 0 ? '#d97757' : '#4285f4'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  No expense history yet
                </div>
              )}
            </div>
          </div>

          {/* Top Categories */}
          {data.topCategories.length > 0 && (
            <div className="card mt-6">
              <h3 className="mb-4">Top Spending Categories</h3>
              <div className={styles.categoryBars}>
                {data.topCategories.map((c: any, i: number) => {
                  const pct = Math.round((c.amt / data.totalExpenses) * 100);
                  return (
                    <div key={i} className={styles.categoryBar}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`chip cat-${c.cat}`}>{c.cat}</span>
                        <span className="text-sm font-semibold">Le {c.amt.toFixed(2)} <span className="text-muted text-xs">({pct}%)</span></span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Global Empire Analytics Placeholder */}
          <div className="card mt-6" style={{ background: 'linear-gradient(135deg, rgba(217, 119, 87, 0.05) 0%, rgba(66, 133, 244, 0.05) 100%)', border: '1px solid rgba(217, 119, 87, 0.2)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2">
                <Target size={20} color="var(--primary)" /> Global Empire Analytics & Forecasting
              </h3>
              <span className="chip chip-primary">Trillionaire Mode</span>
            </div>
            <p className="text-secondary text-sm mb-4">Advanced multi-currency portfolio tracking, international asset scaling, and predictive wealth forecasting ready for your future global operations.</p>
            
            {!forecast ? (
              <>
                <div className="grid-3 mb-4">
                  <div className="stat-card" style={{ background: 'var(--bg-base)' }}>
                    <span className="stat-label">Projected Net Worth</span>
                    <span className="stat-value">TBD</span>
                    <span className="text-xs text-muted">Awaiting global market integration</span>
                  </div>
                  <div className="stat-card" style={{ background: 'var(--bg-base)' }}>
                    <span className="stat-label">Global Operations</span>
                    <span className="stat-value">Locked</span>
                    <span className="text-xs text-muted">Available in Professional Tier</span>
                  </div>
                  <div className="stat-card" style={{ background: 'var(--bg-base)' }}>
                    <span className="stat-label">AI Optimization</span>
                    <span className="stat-value">99.9%</span>
                    <span className="text-xs text-muted">Continuous market analysis</span>
                  </div>
                </div>
                <button 
                  className="btn btn-primary" 
                  onClick={generateForecast} 
                  disabled={forecastLoading}
                >
                  <Sparkles size={16} /> {forecastLoading ? 'Running Advanced Analysis...' : 'Generate AI Wealth Forecast'}
                </button>
              </>
            ) : (
              <div style={{ padding: '20px', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <h4 style={{ marginBottom: 12, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={16} /> AI Executive Summary
                </h4>
                <div 
                  style={{ whiteSpace: 'pre-wrap', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}
                  dangerouslySetInnerHTML={{ __html: forecast.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }}
                />
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
