'use client';
// src/components/Onboarding.tsx
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import {
  Wallet, Calendar, CheckSquare, Bot, Sparkles,
  ArrowRight, ArrowLeft, X
} from 'lucide-react';

const STEPS = [
  {
    icon: <Sparkles size={40} color="var(--primary)" />,
    color: 'rgba(217,119,87,0.15)',
    title: 'Welcome to BroJoe Platform! 🎉',
    desc: 'Your personal command center for managing money, errands, and your calendar. Let\'s take a 30-second tour.',
  },
  {
    icon: <Wallet size={40} color="#10b981" />,
    color: 'rgba(16,185,129,0.15)',
    title: 'Expenses & Receipts 💰',
    desc: 'Tap "Expenses" in the menu to log your daily transport, food, and supplies. You can even scan a photo of your receipt with AI to auto-fill the form!',
  },
  {
    icon: <CheckSquare size={40} color="#4285f4" />,
    color: 'rgba(66,133,244,0.15)',
    title: 'Tasks & Errands ✅',
    desc: 'Open "Tasks & Errands" to create your daily to-do list in a Kanban board. Move tasks from Pending → In Progress → Done.',
  },
  {
    icon: <Calendar size={40} color="#8e24aa" />,
    color: 'rgba(142,36,170,0.15)',
    title: 'Calendar & Bookings 📅',
    desc: 'See your schedule in the Calendar. Add your Cal.com username in Settings to get a professional booking link you can share with clients.',
  },
  {
    icon: <Bot size={40} color="#f43f5e" />,
    color: 'rgba(244,63,94,0.15)',
    title: 'AI Reports & Forecasts 🤖',
    desc: 'Go to "Reports & AI" to generate a clean end-of-day summary to email to your boss, or ask the AI to forecast your future net worth!',
  },
];

export default function Onboarding() {
  const { data: session } = useSession();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    if (!session?.user) return;
    const key = `brojoe_tour_done_${session.user.email}`;
    if (!localStorage.getItem(key)) {
      setIsMobile(window.innerWidth <= 768);
      // Small delay so page renders first
      const t = setTimeout(() => {
        if (window.innerWidth > 768) {
          // Desktop: run driver.js
          const d = driver({
            showProgress: true,
            steps: [
              { element: 'body', popover: { title: 'Welcome! 🎉', description: 'Let\'s take a quick tour of your BroJoe command center.' } },
              { element: 'a[href="/expenses"]', popover: { title: 'Expenses & Receipts 💰', description: 'Log your daily transport and scan receipts with AI here.' } },
              { element: 'a[href="/tasks"]', popover: { title: 'Tasks & Errands ✅', description: 'Manage your daily to-do list in a Kanban board.' } },
              { element: 'a[href="/calendar"]', popover: { title: 'Calendar & Bookings 📅', description: 'See your schedule and manage Cal.com bookings.' } },
              { element: 'a[href="/reports"]', popover: { title: 'AI Reports 🤖', description: 'Generate clean end-of-day summaries for your boss.' } }
            ],
            onDestroyStarted: () => {
              localStorage.setItem(key, '1');
              d.destroy();
            }
          });
          d.drive();
        } else {
          // Mobile: show custom modal
          setVisible(true);
        }
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [session]);

  const dismiss = () => {
    if (session?.user?.email) {
      localStorage.setItem(`brojoe_tour_done_${session.user.email}`, '1');
    }
    setVisible(false);
  };

  if (!visible || !isMobile) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 24,
          padding: '36px 28px',
          maxWidth: 420,
          width: '100%',
          boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
          position: 'relative',
          animation: 'slideUp 0.35s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <button
          onClick={dismiss}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'var(--bg-base)', border: '1px solid var(--border)',
            borderRadius: '50%', width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-muted)',
          }}
        >
          <X size={16} />
        </button>

        <div style={{
          width: 80, height: 80,
          background: current.color,
          borderRadius: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          {current.icon}
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>
          Step {step + 1} of {STEPS.length}
        </p>

        <h2 style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: 700, marginBottom: 12 }}>
          {current.title}
        </h2>

        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', lineHeight: 1.65, fontSize: '0.9rem', marginBottom: 28 }}>
          {current.desc}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 28 }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              onClick={() => setStep(i)}
              style={{
                width: i === step ? 20 : 8,
                height: 8,
                borderRadius: 4,
                background: i === step ? 'var(--primary)' : 'var(--border-focus)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              style={{
                flex: 1, padding: '12px', borderRadius: 12,
                background: 'var(--bg-base)', border: '1px solid var(--border)',
                color: 'var(--text-secondary)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontWeight: 600, fontSize: '0.9rem',
              }}
            >
              <ArrowLeft size={16} /> Back
            </button>
          )}
          <button
            onClick={isLast ? dismiss : () => setStep(s => s + 1)}
            style={{
              flex: 2, padding: '12px', borderRadius: 12,
              background: 'var(--primary)', border: 'none',
              color: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontWeight: 600, fontSize: '0.9rem',
              boxShadow: '0 4px 16px rgba(217,119,87,0.4)',
            }}
          >
            {isLast ? '🚀 Get Started!' : <>Next <ArrowRight size={16} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
