// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'BroJoe Platform — Personal Management Hub',
  description: 'Track expenses, manage tasks, get AI insights, and share reports with your mentor. Your all-in-one personal management platform.',
  keywords: 'expense tracker, task manager, errand management, AI assistant, personal finance',
  openGraph: {
    title: 'BroJoe Platform',
    description: 'Your personal management hub for expenses, tasks, and AI-powered insights.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
