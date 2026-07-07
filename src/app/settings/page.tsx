'use client';
// src/app/settings/page.tsx
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Sidebar from '@/components/Sidebar';
import { User, Bell, Shield, Database, Save, Check } from 'lucide-react';
import styles from './settings.module.css';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [saved, setSaved] = useState(false);
  const [budget, setBudget] = useState('');
  const [mentorEmail, setMentorEmail] = useState('');
  const [calLink, setCalLink] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch('/api/user').then(r => r.json()).then(data => {
      if (data) {
        setMentorEmail(data.mentorEmail || '');
        setCalLink(data.calLink || '');
        // We'll leave budget empty unless it's stored, but user settings API returns user
      }
    });
  }, []);

  const handleSave = async () => {
    const res = await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mentorEmail, calLink, totalBudget: parseFloat(budget) || 0 }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleExport = async () => {
    const res = await fetch('/api/user?export=true');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brojoe-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = async () => {
    if (!confirm('This will permanently delete your account and ALL your data. This cannot be undone. Are you sure?')) return;
    setDeleting(true);
    const res = await fetch('/api/user', { method: 'DELETE' });
    if (res.ok) {
      // Sign out after deletion
      import('next-auth/react').then(({ signOut }) => signOut({ callbackUrl: '/' }));
    }
    setDeleting(false);
  };

  return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-content animate-fadeIn">
          <div className="page-header">
            <h1>Settings</h1>
            <p className="text-secondary">Manage your account preferences and platform configuration</p>
          </div>

          <div style={{ maxWidth: 640 }}>
            {/* Profile */}
            <div className="card mb-5">
              <div className="flex items-center gap-2 mb-4">
                <User size={18} color="var(--primary-light)" />
                <h3>Profile</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-control" defaultValue={session?.user?.name || ''} readOnly style={{ opacity: 0.7 }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-control" defaultValue={session?.user?.email || ''} readOnly style={{ opacity: 0.7 }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Boss/Manager Email (for report sharing)</label>
                  <input id="mentor-email" className="form-control" placeholder="boss@example.com"
                    value={mentorEmail} onChange={e => setMentorEmail(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Public Profile & Booking */}
            <div className="card mb-5">
              <div className="flex items-center gap-2 mb-4">
                <User size={18} color="var(--primary-light)" />
                <h3>Public Profile & Booking</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Cal.com Profile Link</label>
                  <input id="cal-link" className="form-control" placeholder="e.g. joseph-nimneh-yjypl3"
                    value={calLink} onChange={e => setCalLink(e.target.value)} />
                  <span className="text-xs text-muted">Paste your Cal.com username to enable bookings in the platform</span>
                </div>
              </div>
            </div>

            {/* Budget */}
            <div className="card mb-5">
              <div className="flex items-center gap-2 mb-4">
                <Database size={18} color="var(--secondary)" />
                <h3>Budget Configuration</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Personal Budget (Le)</label>
                  <input id="personal-budget" type="number" className="form-control" placeholder="e.g. 500.00"
                    value={budget} onChange={e => setBudget(e.target.value)} />
                  <span className="text-xs text-muted">Set a monthly budget to track spending progress</span>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="card mb-5">
              <div className="flex items-center gap-2 mb-4">
                <Bell size={18} color="var(--accent-warning)" />
                <h3>Notifications</h3>
              </div>
              <label className={styles.toggle}>
                <span>Enable deadline reminders</span>
                <div className={`${styles.toggleSwitch} ${notifications ? styles.on : ''}`}
                  onClick={() => setNotifications(!notifications)}>
                  <div className={styles.toggleThumb} />
                </div>
              </label>
            </div>

            {/* Privacy */}
            <div className="card mb-5">
              <div className="flex items-center gap-2 mb-4">
                <Shield size={18} color="var(--accent-info)" />
                <h3>Privacy & Data</h3>
              </div>
              <div className={styles.privacyItems}>
                <div className={styles.privacyItem}>
                  <div>
                    <span className={styles.privacyLabel}>GDPR Consent</span>
                    <span className="text-xs text-muted">You consented to data processing</span>
                  </div>
                  <span className="chip chip-success"><Check size={10} /> Active</span>
                </div>
                <div className={styles.privacyItem}>
                  <div>
                    <span className={styles.privacyLabel}>Data Export</span>
                    <span className="text-xs text-muted">Download all your data as JSON</span>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={handleExport}>Export</button>
                </div>
                <div className={styles.privacyItem}>
                  <div>
                    <span className={styles.privacyLabel}>Delete Account</span>
                    <span className="text-xs text-muted">Permanently remove all data</span>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={handleDeleteAccount} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</button>
                </div>
              </div>
            </div>

            <button id="save-settings-btn" onClick={handleSave} className="btn btn-primary btn-lg">
              {saved ? <Check size={18} /> : <Save size={18} />}
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
