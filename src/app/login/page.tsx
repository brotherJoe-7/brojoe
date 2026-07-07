'use client';
// src/app/login/page.tsx
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight, Loader } from 'lucide-react';
import styles from './auth.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    if (res?.ok) {
      router.push('/dashboard');
    } else {
      setError('Invalid email or password. Please try again.');
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

      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <div className={styles.authLogo}>
            <Sparkles size={24} />
          </div>
          <h1 className={styles.authTitle}>Welcome back</h1>
          <p className={styles.authSub}>Sign in to your BroJoe Platform</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.authForm}>
          {error && (
            <div className="alert alert-error animate-fadeIn">
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className={styles.inputWrap}>
              <Mail size={16} className={styles.inputIcon} />
              <input
                id="email"
                type="email"
                className={`form-control ${styles.inputWithIcon}`}
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="form-label" style={{ margin: 0 }}>Password</label>
              <Link href="/forgot-password" style={{ fontSize: '0.82rem', color: 'var(--primary)', textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>
            <div className={styles.inputWrap}>
              <Lock size={16} className={styles.inputIcon} />
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                className={`form-control ${styles.inputWithIcon} ${styles.inputWithToggle}`}
                placeholder="Your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
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

          <button id="login-btn" type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
            {loading ? <Loader size={18} className={styles.spinner} /> : <ArrowRight size={18} />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>or continue with</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
        </div>

        {/* Google Sign In */}
        <button
          type="button"
          className="btn btn-secondary w-full"
          style={{ gap: 10, justifyContent: 'center' }}
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Sign in with Google
        </button>

        <p className={styles.authFooter}>
          Don&apos;t have an account?{' '}
          <Link href="/register">Create one free</Link>
        </p>
      </div>
    </div>
  );
}
