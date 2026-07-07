'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, KeyRound, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import styles from '../login/auth.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      // Always show success to prevent email enumeration
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authBg}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
      </div>

      <div className={styles.authCard} style={{ maxWidth: '420px', textAlign: 'center' }}>
        <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: 24, fontSize: '0.85rem', width: '100%' }}>
          <ArrowLeft size={14} /> Back to login
        </Link>
        
        <div style={{ width: 56, height: 56, background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <KeyRound size={28} />
        </div>
        
        <h1 className={styles.authTitle}>Reset Password</h1>
        
        {!submitted ? (
          <>
            <p className={styles.authSub}>Enter your email address and we'll send you a link to securely reset your password.</p>
            <form onSubmit={handleSubmit} className={styles.authForm} style={{ marginTop: 24, textAlign: 'left' }}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className={styles.inputWrap}>
                  <Mail size={16} className={styles.inputIcon} />
                  <input type="email" className={`form-control ${styles.inputWithIcon}`}
                    placeholder="you@example.com" value={email}
                    onChange={e => setEmail(e.target.value)} required />
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
                {loading ? 'Sending link...' : 'Send Reset Link'} <ArrowRight size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="animate-slideUp" style={{ padding: '20px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--success)', marginBottom: 16 }}>
              <CheckCircle2 size={48} />
            </div>
            <h3 style={{ marginBottom: 12 }}>Check your email</h3>
            <p className="text-secondary text-sm mb-6">
              We sent a secure password reset link to <strong>{email}</strong>. Please check your inbox and spam folder.
            </p>
            <button onClick={() => setSubmitted(false)} className="btn btn-ghost w-full">
              Didn't receive it? Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
