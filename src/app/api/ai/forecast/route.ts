// src/app/api/ai/forecast/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { connectDB } from '@/lib/mongodb';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;

  let totalSpent = 0;
  let taskCompletionRate = 0;
  let topCategory = 'transport';

  // ── Supabase ──────────────────────────────────────────────────
  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      const [{ data: expenses }, { data: tasks }] = await Promise.all([
        supabaseAdmin.from('expenses').select('amount, category, fund_source').eq('user_id', userId),
        supabaseAdmin.from('tasks').select('status').eq('user_id', userId),
      ]);

      totalSpent = (expenses || []).reduce((s: number, e: any) => s + Number(e.amount), 0);
      const completed = (tasks || []).filter((t: any) => t.status === 'completed').length;
      taskCompletionRate = tasks && tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

      // Find top spending category
      const catMap: Record<string, number> = {};
      (expenses || []).forEach((e: any) => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
      topCategory = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'transport';
    } catch (err) {
      console.error('Supabase forecast fetch error:', err);
    }
  } else {
    // ── MongoDB fallback ──────────────────────────────────────────
    try {
      await connectDB();
      const { Expense } = await import('@/lib/models/Expense');
      const { Task } = await import('@/lib/models/Task');
      const [expenses, tasks] = await Promise.all([
        Expense.find({ userId }),
        Task.find({ userId }),
      ]);
      totalSpent = expenses.reduce((s: number, e: any) => s + e.amount, 0);
      const completed = tasks.filter((t: any) => t.status === 'completed').length;
      taskCompletionRate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
    } catch (err) {
      console.error('MongoDB forecast fetch error:', err);
    }
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({
      forecast: '**API Key not configured.** Please set your GEMINI_API_KEY in .env.local to unlock AI Wealth Forecasting.'
    });
  }

  try {
    const prompt = `You are an advanced enterprise AI financial analyst advising a highly ambitious professional in West Africa who is building their empire.

Here is their current operational data:
- Total Spent This Period: Le ${totalSpent.toFixed(2)}
- Task Completion Rate: ${taskCompletionRate}%
- Highest Spending Category: ${topCategory}
- Context: They are currently working as an operational assistant, logging transport, food, and supply expenses on behalf of their employer.

Your analysis should:
1. Acknowledge where they are now (assistant phase, building discipline)
2. Project what their finances could look like in 1 year if they maintain this tracking discipline
3. Project what an empire could look like in 5 years if they transition to running their own operations
4. Give 3 specific, actionable recommendations to improve their financial trajectory
5. Warn about their top spending category if it seems excessive

Format as a professional executive briefing. Use bold headers. Be direct, inspiring, and realistic.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    return NextResponse.json({ forecast: result.response.text() });
  } catch (error) {
    console.error('AI Forecast generation error:', error);
    return NextResponse.json({ error: 'Failed to generate AI forecast.' }, { status: 500 });
  }
}
