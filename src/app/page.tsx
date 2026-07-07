import Link from 'next/link';
import { Sparkles, ArrowRight, Wallet, Calendar, Bot, CheckCircle2, Shield, Users } from 'lucide-react';
import styles from './landing.module.css';
import LandingNav from '@/components/LandingNav';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function LandingPage() {
  const session = await auth();
  if (session) redirect('/dashboard');

  return (
    <div className={styles.landingPage}>
      {/* Navigation */}
      <LandingNav />

      {/* Hero Section */}
      <header className={styles.hero}>
        <span className={styles.heroBadge}>v1.0 is now live</span>
        <h1 className={styles.heroTitle}>
          Manage your expenses, run errands, and <span className={styles.heroHighlight}>build your empire.</span>
        </h1>
        <p className={styles.heroSub}>
          The ultimate personal and operational command center. Track transport costs, report to your boss, automate your calendar, and use AI to forecast your financial future.
        </p>
        <div className={styles.heroActions}>
          <Link href="/register" className={`${styles.btnLarge} ${styles.btnPrimary}`}>
            Start for Free <ArrowRight size={20} />
          </Link>
          <a href="#features" className={`${styles.btnLarge} ${styles.btnSecondary}`}>
            See How it Works
          </a>
        </div>
      </header>

      {/* Features */}
      <section id="features" className={styles.features}>
        <h2 className={styles.sectionTitle}>Everything you need to scale</h2>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon} style={{ background: 'rgba(217, 119, 87, 0.15)', color: 'var(--primary)' }}>
              <Wallet size={28} />
            </div>
            <h3 className={styles.featureTitle}>Expense & Errand Tracking</h3>
            <p className={styles.featureDesc}>Log your daily transport, split funds between personal and mentor accounts, and instantly scan receipts with AI.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon} style={{ background: 'rgba(66, 133, 244, 0.15)', color: '#4285f4' }}>
              <Bot size={28} />
            </div>
            <h3 className={styles.featureTitle}>AI Predictive Reports</h3>
            <p className={styles.featureDesc}>Generate neat "End of Day" reports to send to your boss, or let the AI forecast your future net worth.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <Calendar size={28} />
            </div>
            <h3 className={styles.featureTitle}>Calendar & Bookings</h3>
            <p className={styles.featureDesc}>Manage your daily schedule and accept professional bookings automatically with our free Cal.com integration.</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className={styles.pricing}>
        <h2 className={styles.sectionTitle}>Simple, transparent pricing</h2>
        <div className={styles.pricingGrid}>
          {/* Basic */}
          <div className={styles.pricingCard}>
            <h3 className={styles.tierName}>Basic / Assistant</h3>
            <div className={styles.tierPrice}>$0<span className={styles.tierMo}>/mo</span></div>
            <ul className={styles.tierFeatures}>
              <li className={styles.tierFeature}><CheckCircle2 size={18} color="var(--primary)" /> Track personal expenses</li>
              <li className={styles.tierFeature}><CheckCircle2 size={18} color="var(--primary)" /> Manual calendar tracking</li>
              <li className={styles.tierFeature}><CheckCircle2 size={18} color="var(--primary)" /> Send basic reports to boss</li>
            </ul>
            <Link href="/register" className={`${styles.btnLarge} ${styles.btnSecondary}`} style={{ width: '100%', justifyContent: 'center' }}>
              Get Started
            </Link>
          </div>
          
          {/* Professional */}
          <div className={`${styles.pricingCard} ${styles.pricingCardPopular}`}>
            <span className={styles.popularBadge}>Most Popular</span>
            <h3 className={styles.tierName}>Professional</h3>
            <div className={styles.tierPrice}>$5<span className={styles.tierMo}>/mo</span></div>
            <ul className={styles.tierFeatures}>
              <li className={styles.tierFeature}><CheckCircle2 size={18} color="var(--primary)" /> Everything in Basic</li>
              <li className={styles.tierFeature}><CheckCircle2 size={18} color="var(--primary)" /> AI Receipt Scanning (OCR)</li>
              <li className={styles.tierFeature}><CheckCircle2 size={18} color="var(--primary)" /> Cal.com Booking Embed</li>
              <li className={styles.tierFeature}><CheckCircle2 size={18} color="var(--primary)" /> Advanced AI Wealth Forecasts</li>
            </ul>
            <Link href="/register" className={`${styles.btnLarge} ${styles.btnPrimary}`} style={{ width: '100%', justifyContent: 'center' }}>
              Upgrade to Pro
            </Link>
          </div>

          {/* Empire */}
          <div className={styles.pricingCard}>
            <h3 className={styles.tierName}>Empire / Boss</h3>
            <div className={styles.tierPrice}>$15<span className={styles.tierMo}>/mo</span></div>
            <ul className={styles.tierFeatures}>
              <li className={styles.tierFeature}><CheckCircle2 size={18} color="var(--primary)" /> Everything in Pro</li>
              <li className={styles.tierFeature}><CheckCircle2 size={18} color="var(--primary)" /> Team Workspaces (RBAC)</li>
              <li className={styles.tierFeature}><CheckCircle2 size={18} color="var(--primary)" /> Invite up to 5 Assistants</li>
              <li className={styles.tierFeature}><CheckCircle2 size={18} color="var(--primary)" /> Cross-team analytics</li>
            </ul>
            <Link href="/register" className={`${styles.btnLarge} ${styles.btnSecondary}`} style={{ width: '100%', justifyContent: 'center' }}>
              Build your Empire
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} /> BroJoe Platform &copy; {new Date().getFullYear()}
        </div>
        <div className={styles.footerLinks}>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/privacy">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}
