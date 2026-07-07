'use client';
// src/app/admin/page.tsx
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import {
  Users, Wallet, CheckSquare, FileText, TrendingUp,
  Shield, RefreshCw, Crown, User, Briefcase, UserCheck
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { format } from 'date-fns';

const ROLE_COLORS: Record<string, string> = {
  user: '#4285f4',
  assistant: '#f59e0b',
  mentor: '#8e24aa',
  admin: '#f43f5e',
  accountant: '#10b981',
};

const ROLE_ICONS: Record<string, any> = {
  user: User,
  assistant: Briefcase,
  mentor: Crown,
  admin: Shield,
  accountant: UserCheck,
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roleChanges, setRoleChanges] = useState<Record<string, string>>({});
  const [savingRole, setSavingRole] = useState<string | null>(null);
  const [roleMsg, setRoleMsg] = useState<Record<string, string>>({});

  const fetchStats = () => {
    setLoading(true);
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else {
          setStats(data);
          // Pre-fill role dropdowns with current roles
          const roleInit: Record<string, string> = {};
          (data.recentUsers || []).forEach((u: any) => { roleInit[u.id] = u.role; });
          setRoleChanges(roleInit);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load admin stats.');
        setLoading(false);
      });
  };

  const updateRole = async (userId: string) => {
    setSavingRole(userId);
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: roleChanges[userId] }),
    });
    const data = await res.json();
    setRoleMsg(prev => ({ ...prev, [userId]: res.ok ? '✓ Saved' : data.error }));
    setSavingRole(null);
    setTimeout(() => setRoleMsg(prev => { const n = { ...prev }; delete n[userId]; return n; }), 2000);
    if (res.ok) fetchStats();
  };

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') fetchStats();
  }, [status]);

  if (status === 'loading' || loading) return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <Shield size={40} color="var(--primary)" style={{ animation: 'pulse 1.5s infinite' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading Super Admin Console...</p>
      </main>
    </div>
  );

  if (error) return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ textAlign: 'center', padding: 40, maxWidth: 420 }}>
          <Shield size={40} color="var(--danger)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ marginBottom: 8 }}>Access Denied</h3>
          <p className="text-secondary">{error}</p>
          <p className="text-xs text-muted" style={{ marginTop: 8 }}>Only the Super Admin account can view this page.</p>
        </div>
      </main>
    </div>
  );

  return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-content animate-fadeIn">

          {/* Header */}
          <div className="page-header">
            <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div className="flex items-center gap-2">
                  <Shield size={22} color="var(--primary)" />
                  <h1 style={{ margin: 0 }}>Super Admin Console</h1>
                </div>
                <p className="text-secondary">Full platform overview — {format(new Date(), 'MMMM d, yyyy')}</p>
              </div>
              <button className="btn btn-secondary" onClick={fetchStats}>
                <RefreshCw size={15} /> Refresh
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            {[
              { label: 'Total Users', value: stats.totalUsers, icon: Users, color: '#4285f4' },
              { label: 'Total Expenses Logged', value: stats.totalExpenses, icon: Wallet, color: 'var(--primary)' },
              { label: 'Tasks Created', value: stats.totalTasks, icon: CheckSquare, color: '#10b981' },
              { label: 'AI Reports Generated', value: stats.totalReports, icon: FileText, color: '#f59e0b' },
            ].map(card => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="stat-card">
                  <div className="stat-icon" style={{ background: `${card.color}22` }}>
                    <Icon size={18} color={card.color} />
                  </div>
                  <span className="stat-label">{card.label}</span>
                  <span className="stat-value">{card.value.toLocaleString()}</span>
                </div>
              );
            })}
          </div>

          {/* Platform Volume */}
          <div className="card mb-6" style={{ borderColor: 'rgba(217,119,87,0.3)' }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={18} color="var(--primary)" />
              <h3 style={{ margin: 0 }}>Total Platform Financial Volume</h3>
            </div>
            <p style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
              Le {stats.totalPlatformVolume.toLocaleString('en', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted">Sum of all expenses logged across all users on the platform</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 24 }}>
            {/* Signup Chart */}
            <div className="card">
              <h3 className="mb-4">New Signups — Last 7 Days</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.signupChart}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip formatter={(v) => [`${v} users`, 'Signups']} />
                  <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Role Breakdown */}
            <div className="card">
              <h3 className="mb-4">User Role Breakdown</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={stats.roleBreakdown} dataKey="count" nameKey="role" cx="50%" cy="50%" outerRadius={75} label={({ role, count }) => `${role}: ${count}`}>
                    {stats.roleBreakdown.map((entry: any) => (
                      <Cell key={entry.role} fill={ROLE_COLORS[entry.role] || '#a0a0c0'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Users Table */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Users size={18} color="var(--primary)" />
              <h3 style={{ margin: 0 }}>Most Recent Registrations</h3>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Account Type</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats.recentUsers || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 30 }}>No users yet. Share your platform!</td>
                    </tr>
                  ) : (
                    stats.recentUsers.map((u: any) => {
                      const RoleIcon = ROLE_ICONS[u.role] || User;
                      return (
                        <tr key={u.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${ROLE_COLORS[u.role] || '#888'}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <RoleIcon size={14} color={ROLE_COLORS[u.role] || '#888'} />
                              </div>
                              <span className="font-semibold">{u.name}</span>
                            </div>
                          </td>
                          <td className="text-secondary text-sm">{u.email}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <select
                                value={roleChanges[u.id] || u.role}
                                onChange={e => setRoleChanges(prev => ({ ...prev, [u.id]: e.target.value }))}
                                style={{
                                  background: `${ROLE_COLORS[roleChanges[u.id] || u.role] || '#888'}22`,
                                  color: ROLE_COLORS[roleChanges[u.id] || u.role] || '#888',
                                  border: `1px solid ${ROLE_COLORS[roleChanges[u.id] || u.role] || '#888'}44`,
                                  borderRadius: 6, padding: '3px 6px', fontSize: '0.78rem',
                                  fontWeight: 600, cursor: 'pointer',
                                }}
                              >
                                {['user','assistant','mentor','admin','accountant'].map(r => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                              </select>
                              <button
                                className="btn btn-primary btn-sm"
                                style={{ padding: '3px 10px', fontSize: '0.75rem' }}
                                onClick={() => updateRole(u.id)}
                                disabled={savingRole === u.id}
                              >
                                {savingRole === u.id ? '...' : roleMsg[u.id] || 'Save'}
                              </button>
                            </div>
                          </td>
                          <td className="text-sm text-secondary" style={{ textTransform: 'capitalize' }}>{u.account_type || 'individual'}</td>
                          <td className="text-sm text-muted">{u.created_at ? format(new Date(u.created_at), 'MMM d, yyyy') : '—'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
