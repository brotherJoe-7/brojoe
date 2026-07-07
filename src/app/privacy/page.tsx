'use client';
// src/app/privacy/page.tsx
import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '40px 20px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', marginBottom: 32, textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, background: 'var(--grad-primary)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={24} color="white" />
          </div>
          <div>
            <h1 style={{ marginBottom: 4 }}>Privacy Policy</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {[
          { title: '1. Data Collection', body: 'We collect only the data you explicitly provide: your name, email address, expense records, and task information. We do not collect data in the background or share it with third parties.' },
          { title: '2. How We Use Your Data', body: 'Your data is used exclusively to provide the BroJoe Platform services — tracking expenses, managing tasks, and generating AI-powered reports. We use OpenAI\'s API to generate insights; data sent is anonymized where possible.' },
          { title: '3. Data Storage & Security', body: 'All data is stored in MongoDB Atlas with encryption at rest. Authentication uses industry-standard JWT tokens with bcrypt password hashing. We follow OWASP security guidelines.' },
          { title: '4. Your Rights (GDPR)', body: 'You have the right to: access your data, correct inaccurate data, request deletion of your data (right to be forgotten), and withdraw consent at any time. Contact us to exercise these rights.' },
          { title: '5. Data Sharing', body: 'You control what you share. Reports are only shared when you explicitly use the "Share" feature. No data is sold or disclosed to third parties without your explicit consent.' },
          { title: '6. Cookies', body: 'We use session cookies only for authentication purposes. No tracking or advertising cookies are used.' },
          { title: '7. Contact', body: 'For privacy concerns or data requests, contact the platform administrator through your account settings.' },
        ].map((section, i) => (
          <div key={i} className="card mb-4">
            <h3 style={{ marginBottom: 10 }}>{section.title}</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
