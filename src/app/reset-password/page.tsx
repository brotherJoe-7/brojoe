'use client';
// src/app/reset-password/page.tsx
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight, Sparkles, Loader } from 'lucide-react';
import styles from '../login/auth.module.css';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Supabase automatically picks up the access token from the URL hash
      const { error: updateError } = await supabase.auth.updateUser({
        password: form.password,
      });

      if (updateError) {
        setError(updateError.message || 'Failed to update password. The link may have expired.');
      } else {
        setDone(true);
        setTimeout(() => router.push('/login'), 3000);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
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

      <div className={styles.authCard} style={{ maxWidth: '420px', textAlign: 'center' }}>
        <div className={styles.authHeader}>
          <div className={styles.authLogo}>
            <Sparkles size={24} />
          </div>
          <h1 className={styles.authTitle}>Set New Password</h1>
          <p className={styles.authSub}>Choose a strong password for your account</p>
        </div>

        {done ? (
          <div className="animate-slideUp" style={{ padding: '20px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--success)', marginBottom: 16 }}>
              <CheckCircle2 size={56} />
            </div>
            <h3 style={{ marginBottom: 8 }}>Password Updated!</h3>
            <p className="text-secondary text-sm mb-4">
              Your password has been successfully changed. Redirecting you to login...
            </p>
            <Link href="/login" className="btn btn-primary w-full" style={{ justifyContent: 'center' }}>
              Go to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.authForm} style={{ textAlign: 'left' }}>
            {error && (
              <div className="alert alert-error animate-fadeIn" style={{ marginBottom: 16 }}>
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">New Password</label>
              <div className={styles.inputWrap}>
                <Lock size={16} className={styles.inputIcon} />
                <input
                  type={showPass ? 'text' : 'password'}
                  className={`form-control ${styles.inputWithIcon} ${styles.inputWithToggle}`}
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className={styles.inputWrap}>
                <Lock size={16} className={styles.inputIcon} />
                <input
                  type={showPass ? 'text' : 'password'}
                  className={`form-control ${styles.inputWithIcon}`}
                  placeholder="Repeat your password"
                  value={form.confirm}
                  onChange={e => setForm({ ...form, confirm: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Password strength indicator */}
            {form.password && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      style={{
                        flex: 1, height: 4, borderRadius: 2,
                        background: form.password.length >= i * 3
                          ? i <= 1 ? '#ef4444' : i <= 2 ? '#f59e0b' : i <= 3 ? '#3b82f6' : '#10b981'
                          : 'var(--border)',
                        transition: 'background 0.2s',
                      }}
                    />
                  ))}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {form.password.length < 4 ? 'Too short' : form.password.length < 7 ? 'Weak' : form.password.length < 10 ? 'Good' : 'Strong'}
                </p>
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
              {loading ? <Loader size={18} className={styles.spinner} /> : <ArrowRight size={18} />}
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}

        <p className={styles.authFooter} style={{ marginTop: 16 }}>
          Remembered your password?{' '}
          <Link href="/login">Sign in instead</Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
