'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, PieChart, FileText, Settings, Rocket, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const STEPS = [
  {
    title: "Welcome to your Empire",
    description: "This platform is designed to transition you from an everyday assistant to a professional manager. Let's take a quick tour.",
    icon: <Rocket size={48} color="var(--primary)" />,
  },
  {
    title: "1. Log Your Expenses",
    description: "Every time you spend money on transport, food, or supplies, log it here. You can tag whether it was personal money or your boss's funds.",
    icon: <PieChart size={48} color="var(--accent-info)" />,
  },
  {
    title: "2. Generate AI Reports",
    description: "Stop writing manual reports. Head to the Reports tab, select your dates, and let our AI generate a Fortune 500-level expense report for your boss.",
    icon: <FileText size={48} color="var(--accent-warning)" />,
  },
  {
    title: "3. Professional Calendar",
    description: "Navigate to the Calendar tab to set up your personal booking link via Cal.com. Start accepting professional bookings synced straight to your Google Calendar.",
    icon: <Calendar size={48} color="var(--success)" />,
  },
  {
    title: "4. Link Your Manager",
    description: "Go to Settings and add your Boss/Manager's email. They will automatically see your progress and be able to assign you tasks seamlessly.",
    icon: <Settings size={48} color="var(--secondary)" />,
  }
];

export default function Onboarding() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // Check if the user has already seen the onboarding
    const hasOnboarded = localStorage.getItem('brojoe_onboarded');
    if (!hasOnboarded) {
      setIsOpen(true);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem('brojoe_onboarded', 'true');
    setIsOpen(false);
  };

  const nextStep = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      completeOnboarding();
    }
  };

  if (!isOpen) return null;

  const currentStep = STEPS[step];

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-box animate-fadeIn" style={{ maxWidth: 500, textAlign: 'center', padding: '40px 30px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{ 
            width: 90, height: 90, borderRadius: '50%', 
            background: 'rgba(66, 133, 244, 0.08)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            {currentStep.icon}
          </div>
        </div>

        <h2 style={{ marginBottom: 12, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
          {currentStep.title}
        </h2>
        
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 32, fontSize: '1rem', minHeight: 70 }}>
          {currentStep.description}
        </p>

        {/* Progress Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: i === step ? 'var(--primary)' : 'var(--border-color)',
              transition: 'background 0.3s ease'
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {step < STEPS.length - 1 ? (
            <>
              <button className="btn btn-ghost" onClick={completeOnboarding} style={{ color: 'var(--text-muted)' }}>
                Skip Tour
              </button>
              <button className="btn btn-primary" onClick={nextStep} style={{ minWidth: 140 }}>
                Next <ArrowRight size={16} style={{ marginLeft: 4 }} />
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={completeOnboarding} style={{ minWidth: 200 }}>
              <CheckCircle2 size={16} style={{ marginRight: 8 }} /> Get Started
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
