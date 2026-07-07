'use client';
// src/components/Sidebar.tsx
import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard, Wallet, CheckSquare, FileText, User,
  LogOut, Sparkles, ChevronRight, Settings, Bell, Shield, Calendar, Users, Crown, Menu, X
} from 'lucide-react';
import styles from './Sidebar.module.css';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/calendar', icon: Calendar, label: 'Calendar & Bookings' },
  { href: '/expenses', icon: Wallet, label: 'Expenses' },
  { href: '/tasks', icon: CheckSquare, label: 'Tasks & Errands' },
  { href: '/reports', icon: FileText, label: 'Reports & AI' },
  { href: '/portfolio', icon: User, label: 'Portfolio' },
  { href: '/team', icon: Users, label: 'Team Workspaces' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Mobile Top Bar ── */}
      <div className={styles.mobileTopBar}>
        <Link href="/dashboard" className={styles.brand} style={{ margin: 0, padding: 0 }}>
          <div className={styles.brandIcon} style={{ width: 28, height: 28 }}>
            <Sparkles size={16} />
          </div>
          <div>
            <span className={styles.brandName} style={{ fontSize: '1rem' }}>BroJoe</span>
            <span className={styles.brandSub} style={{ fontSize: '0.65rem' }}>Platform v2</span>
          </div>
        </Link>
        <button className={styles.hamburgerBtn} onClick={() => setMobileOpen(true)}>
          <Menu size={24} />
        </button>
      </div>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div className={styles.mobileBackdrop} onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`${styles.sidebar} ${mobileOpen ? styles.mobileOpen : ''}`}>
        {/* Mobile Close Button */}
        <button className={styles.closeBtn} onClick={() => setMobileOpen(false)}>
          <X size={24} />
        </button>
      {/* Brand */}
      <div className={styles.brand}>
        <div className={styles.brandIcon}>
          <Sparkles size={20} />
        </div>
        <div>
          <span className={styles.brandName}>BroJoe</span>
          <span className={styles.brandSub}>Platform</span>
        </div>
      </div>



      {/* Navigation */}
      <nav className={styles.nav}>
        <span className={styles.navSection}>Menu</span>
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link 
              key={href} 
              href={href} 
              className={`${styles.navItem} ${active ? styles.active : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {active && <ChevronRight size={14} className={styles.activeArrow} />}
            </Link>
          );
        })}
        
        {(session?.user as any)?.role === 'mentor' && (
          <Link href="/mentor" className={`${styles.navItem} ${pathname.startsWith('/mentor') ? styles.active : ''}`}>
            <Shield size={18} />
            <span>Mentor Console</span>
            {pathname.startsWith('/mentor') && <ChevronRight size={14} className={styles.activeArrow} />}
          </Link>
        )}
        {session?.user?.email?.toLowerCase() === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL?.toLowerCase() && (
          <Link href="/admin" className={`${styles.navItem} ${pathname.startsWith('/admin') ? styles.active : ''}`}
            style={{ borderColor: 'rgba(244,63,94,0.3)', color: '#f43f5e' }}>
            <Crown size={18} />
            <span>Super Admin</span>
            {pathname.startsWith('/admin') && <ChevronRight size={14} className={styles.activeArrow} />}
          </Link>
        )}
      </nav>

      <div className={styles.divider} />

      {/* Bottom */}
      <nav className={styles.nav}>
        <span className={styles.navSection}>Account</span>
        <Link href="/settings" className={`${styles.navItem} ${pathname === '/settings' ? styles.active : ''}`}>
          <Settings size={18} />
          <span>Settings</span>
        </Link>
        <Link href="/privacy" className={`${styles.navItem} ${pathname === '/privacy' ? styles.active : ''}`}>
          <Shield size={18} />
          <span>Privacy</span>
        </Link>
      </nav>

      {/* Footer Area with User Card & Sign Out */}
      <div className={styles.sidebarFooter}>
        <div className={styles.userCard}>
          <div className={styles.avatar}>
            {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{session?.user?.name || 'User'}</span>
            <span className={styles.userEmail}>{session?.user?.email || ''}</span>
          </div>
        </div>
        <button onClick={() => signOut({ callbackUrl: '/login' })} className={styles.signOutBtn}>
          <LogOut size={16} />
          <span>Sign Out of Platform</span>
        </button>
      </div>

      {/* Version */}
      <div className={styles.version}>BroJoe v1.0.0</div>
    </aside>
    </>
  );
}
