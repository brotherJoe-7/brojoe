import Link from 'next/link';
import { ArrowLeft, Scale } from 'lucide-react';

export default function TermsPage() {
  return (
    <div style={{ backgroundColor: 'var(--bg-base)', minHeight: '100vh', padding: '60px 5%', color: 'var(--text-primary)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: 40, fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back to Home
        </Link>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Scale size={24} />
          </div>
          <h1 style={{ fontSize: '2.5rem', fontFamily: 'Space Grotesk, sans-serif' }}>Terms of Service</h1>
        </div>
        
        <p style={{ color: 'var(--text-secondary)', marginBottom: 40 }}>Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="card" style={{ padding: 40 }}>
          <h3 style={{ marginBottom: 16 }}>1. Acceptance of Terms</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
            By accessing and using the BroJoe Platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this site.
          </p>

          <h3 style={{ marginBottom: 16 }}>2. Subscription and Billing</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
            Certain features of the platform (such as AI Forecasting, Team Workspaces, and Advanced OCR) require a paid subscription. Payments are processed securely via our payment partners. Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current billing cycle.
          </p>

          <h3 style={{ marginBottom: 16 }}>3. User Data and Privacy</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
            We take your privacy seriously. By agreeing to these terms, you also agree to our Privacy Policy, which governs how we collect and process your personal and financial data. You retain full ownership of all data you input into the system.
          </p>

          <h3 style={{ marginBottom: 16 }}>4. Account Termination</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
            We reserve the right to suspend or terminate your account if you violate these terms or engage in fraudulent activities on the platform.
          </p>
        </div>
      </div>
    </div>
  );
}
