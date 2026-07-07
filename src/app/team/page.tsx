'use client';
// src/app/team/page.tsx
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Users, Shield, UserPlus, Plus, ShieldCheck, Mail, Briefcase, Key } from 'lucide-react';

export default function TeamPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') {
      fetch('/api/mentor/users')
        .then(res => res.json())
        .then(data => {
          setTeamMembers(data.mentees || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  if (status === 'loading' || loading) return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading team...</p>
      </main>
    </div>
  );

  return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-content animate-fadeIn">
          <div className="page-header flex items-center justify-between">
            <div>
              <h1>Team Workspaces</h1>
              <p className="text-secondary">Manage access control and operational roles for your empire.</p>
            </div>
            <button className="btn btn-primary">
              <UserPlus size={16} /> Invite Member
            </button>
          </div>

          <div className="grid-3 mb-6">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(66, 133, 244, 0.15)' }}>
                <Users size={18} color="var(--primary)" />
              </div>
              <span className="stat-label">Active Members</span>
              <span className="stat-value">{teamMembers.length}</span>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(217, 119, 87, 0.15)' }}>
                <ShieldCheck size={18} color="var(--primary-light)" />
              </div>
              <span className="stat-label">Security Tier</span>
              <span className="stat-value">Enterprise</span>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                <Key size={18} color="var(--success)" />
              </div>
              <span className="stat-label">Pending Invites</span>
              <span className="stat-value">0</span>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase size={20} color="var(--primary)" />
              <h3>Role-Based Access Control (RBAC)</h3>
            </div>
            <p className="text-sm text-secondary mb-4">
              Securely delegate operations. Assistants can manage your calendar, Accountants can view expenses, but neither can see the other's domain.
            </p>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Permissions</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '30px' }}>
                        No team members found. Ask them to register and enter your email as their Boss/Manager.
                      </td>
                    </tr>
                  ) : (
                    teamMembers.map(member => (
                      <tr key={member._id}>
                        <td>
                          <div className="font-semibold">{member.name}</div>
                          <div className="text-xs text-muted flex items-center gap-1">
                            <Mail size={10} /> {member.email}
                          </div>
                        </td>
                        <td>
                          <span className={`chip ${member.role === 'assistant' ? 'chip-primary' : 'chip-success'}`} style={{ textTransform: 'capitalize' }}>
                            {member.role || 'user'}
                          </span>
                        </td>
                        <td>
                          <span className="chip chip-info" style={{ textTransform: 'capitalize' }}>
                            Active
                          </span>
                        </td>
                        <td className="text-xs text-secondary">
                          {member.role === 'assistant' ? 'Calendar & Tasks' : (member.role === 'accountant' ? 'Expenses & Reports' : 'Basic')}
                        </td>
                        <td>
                          <button className="btn btn-ghost btn-sm text-danger">Revoke Access</button>
                        </td>
                      </tr>
                    ))
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
