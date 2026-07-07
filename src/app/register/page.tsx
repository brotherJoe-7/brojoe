'use client';
// src/app/register/page.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader, Shield } from 'lucide-react';
import styles from '../login/auth.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', accountType: 'individual', mentorEmail: '' });
  const [gdpr, setGdpr] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!gdpr) {
      setError('You must accept the data consent to continue.');
      return;
    }
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password, gdprConsent: gdpr, accountType: form.accountType, mentorEmail: form.mentorEmail }),
    });
    const data = await res.json();
    if (res.ok) {
      router.push('/login?registered=true');
    } else {
      setError(data.error || 'Registration failed.');
    }
    setLoading(false);
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authBg}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />
      </div>

      <div className={styles.authCard} style={{ maxWidth: '460px' }}>
        <div className={styles.authHeader}>
          <div className={styles.authLogo}><Sparkles size={24} /></div>
          <h1 className={styles.authTitle}>Create Account</h1>
          <p className={styles.authSub}>Join BroJoe Platform for free</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.authForm}>
          {error && <div className="alert alert-error animate-fadeIn"><span>{error}</span></div>}

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className={styles.inputWrap}>
              <User size={16} className={styles.inputIcon} />
              <input id="name" type="text" className={`form-control ${styles.inputWithIcon}`}
                placeholder="Your full name" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className={styles.inputWrap}>
              <Mail size={16} className={styles.inputIcon} />
              <input id="reg-email" type="email" className={`form-control ${styles.inputWithIcon}`}
                placeholder="you@example.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className={styles.inputWrap}>
              <Lock size={16} className={styles.inputIcon} />
              <input id="reg-password" type={showPass ? 'text' : 'password'}
                className={`form-control ${styles.inputWithIcon} ${styles.inputWithToggle}`}
                placeholder="Min. 8 characters" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} required minLength={8} />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className={styles.inputWrap}>
              <Lock size={16} className={styles.inputIcon} />
              <input id="confirm-password" type={showPass ? 'text' : 'password'}
                className={`form-control ${styles.inputWithIcon}`}
                placeholder="Repeat password" value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '10px' }}>
            <label className="form-label">How will you use this platform?</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
              <button 
                type="button"
                onClick={() => setForm({ ...form, accountType: 'boss' })}
                style={{ 
                  padding: '12px', border: '1px solid', borderRadius: '8px', 
                  borderColor: form.accountType === 'boss' ? 'var(--primary)' : 'var(--border)',
                  background: form.accountType === 'boss' ? 'var(--primary-glow)' : 'var(--bg-input)',
                  color: form.accountType === 'boss' ? 'var(--primary-light)' : 'var(--text-secondary)',
                  cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s'
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Boss / Mentor</div>
                <div style={{ fontSize: '0.7rem', marginTop: '4px', opacity: 0.8 }}>Manage a team</div>
              </button>
              
              <button 
                type="button"
                onClick={() => setForm({ ...form, accountType: 'individual' })}
                style={{ 
                  padding: '12px', border: '1px solid', borderRadius: '8px', 
                  borderColor: form.accountType === 'individual' ? 'var(--primary)' : 'var(--border)',
                  background: form.accountType === 'individual' ? 'var(--primary-glow)' : 'var(--bg-input)',
                  color: form.accountType === 'individual' ? 'var(--primary-light)' : 'var(--text-secondary)',
                  cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s'
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Personal / Individual</div>
                <div style={{ fontSize: '0.7rem', marginTop: '4px', opacity: 0.8 }}>Track my own expenses</div>
              </button>
            </div>
          </div>

          {form.accountType === 'individual' && (
            <div className="form-group animate-slideUp">
              <label className="form-label">Are you an assistant? Enter Boss's Email (Optional)</label>
              <div className={styles.inputWrap}>
                <Mail size={16} className={styles.inputIcon} />
                <input id="mentor-email" type="email" className={`form-control ${styles.inputWithIcon}`}
                  placeholder="Leave blank if using personally" value={form.mentorEmail}
                  onChange={e => setForm({ ...form, mentorEmail: e.target.value })} />
              </div>
              <p className="text-xs text-muted mt-1">If provided, they can assign you tasks and view your reports.</p>
            </div>
          )}

          {/* GDPR Consent */}
          <label className={styles.consentBox}>
            <input id="gdpr-consent" type="checkbox" checked={gdpr} onChange={e => setGdpr(e.target.checked)} />
            <span className={styles.consentText}>
              <Shield size={12} style={{ display: 'inline', marginRight: 4 }} />
              I consent to the collection and processing of my personal data as described in the{' '}
              <Link href="/privacy" target="_blank">Privacy Policy</Link>. My data will be stored securely
              and used only for expense tracking and task management purposes.
            </span>
          </label>

          <button id="register-btn" type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
            {loading ? <Loader size={18} className={styles.spinner} /> : <ArrowRight size={18} />}
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className={styles.authFooter}>
          Already have an account?{' '}
          <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
