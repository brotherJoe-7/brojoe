'use client';
// src/components/Onboarding.tsx
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export default function Onboarding() {
  const { data: session } = useSession();

  useEffect(() => {
    // Check if user has completed the tour
    const completed = localStorage.getItem('brojoe_tour_completed');
    if (!completed && session?.user) {
      // Small delay to ensure DOM is fully rendered
      setTimeout(() => {
        startTour();
      }, 1000);
    }
  }, [session]);

  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: false,
      doneBtnText: 'Finish',
      nextBtnText: 'Next ➔',
      prevBtnText: '⬅ Prev',
      steps: [
        {
          popover: {
            title: 'Welcome to BroJoe Platform! 🎉',
            description: 'Let me give you a quick tour of your new operational command center to help you build your empire.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: 'a[href="/dashboard"]',
          popover: {
            title: 'Your Dashboard',
            description: 'This is where you see a high-level overview of your daily stats, pending tasks, and quick actions.',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: 'a[href="/calendar"]',
          popover: {
            title: 'Calendar & Bookings',
            description: 'Manage your daily schedule and let clients book sessions with you using your free Cal.com link.',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: 'a[href="/expenses"]',
          popover: {
            title: 'Expense Tracking',
            description: 'Log transport, food, and supplies here. You can even use AI to scan your receipts automatically!',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: 'a[href="/settings"]',
          popover: {
            title: 'Settings & Profile',
            description: 'Don\'t forget to set up your Cal.com link and your Mentor\'s email in the settings to unlock all features.',
            side: 'right',
            align: 'start'
          }
        }
      ],
      onDestroyed: () => {
        localStorage.setItem('brojoe_tour_completed', 'true');
      }
    });

    driverObj.drive();
  };

  return null;
}
