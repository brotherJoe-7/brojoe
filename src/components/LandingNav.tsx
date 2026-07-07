'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Menu, X } from 'lucide-react';
import styles from '@/app/landing.module.css';

export default function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className={styles.nav}>
        <Link href="/" className={styles.brand}>
          <Sparkles size={24} color="var(--primary)" /> BroJoe Platform
        </Link>

        {/* Desktop Links */}
        <div className={styles.navLinks}>
          <a href="#features" className={styles.navLink}>Features</a>
          <a href="#pricing" className={styles.navLink}>Pricing</a>
          <Link href="/login" className={styles.navLink} style={{ fontWeight: 600 }}>Log In</Link>
          <Link href="/register" className={`${styles.btnLarge} ${styles.btnPrimary}`} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
            Get Started
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button className={styles.mobileMenuBtn} onClick={() => setOpen(true)}>
          <Menu size={28} />
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {open && (
        <div className={styles.mobileNavOverlay}>
          <div className={styles.mobileNavBox}>
            <button className={styles.mobileMenuClose} onClick={() => setOpen(false)}>
              <X size={28} />
            </button>
            <div className={styles.mobileNavLinks}>
              <a href="#features" className={styles.navLink} onClick={() => setOpen(false)}>Features</a>
              <a href="#pricing" className={styles.navLink} onClick={() => setOpen(false)}>Pricing</a>
              <Link href="/login" className={styles.navLink} style={{ fontWeight: 600 }} onClick={() => setOpen(false)}>Log In</Link>
              <Link href="/register" className={`${styles.btnLarge} ${styles.btnPrimary}`} style={{ width: '100%', justifyContent: 'center' }} onClick={() => setOpen(false)}>
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
