// src/app/api/ai/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action, userMessage, dateRange } = await req.json();

  // Pull expenses & tasks from Supabase
  let expenses: any[] = [];
  let tasks: any[] = [];

  try {
    if (isSupabaseConfigured() && supabaseAdmin) {
      const userId = (session.user as any).id;

      const [expRes, taskRes] = await Promise.all([
        supabaseAdmin
          .from('expenses')
          .select('description, amount, category, fund_source, date')
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .limit(50),
        supabaseAdmin
          .from('tasks')
          .select('title, status, priority, deadline')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(30),
      ]);

      expenses = expRes.data || [];
      tasks = taskRes.data || [];
    }
  } catch (e) {
    console.warn('Supabase fetch failed, using empty context:', e);
  }

  // Build context for the AI
  const totalSpent = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const personalSpent = expenses
    .filter(e => e.fund_source === 'personal')
    .reduce((s, e) => s + Number(e.amount), 0);
  const mentorSpent = expenses
    .filter(e => e.fund_source === 'mentor')
    .reduce((s, e) => s + Number(e.amount), 0);

  const contextData = `
User: ${session.user.name}
Email: ${session.user.email}
Date: ${new Date().toLocaleDateString()}

EXPENSE SUMMARY:
Total spent: Le ${totalSpent.toFixed(2)}
Personal funds used: Le ${personalSpent.toFixed(2)}
Mentor funds used: Le ${mentorSpent.toFixed(2)}

Recent expenses (last 10):
${expenses.slice(0, 10).map(e =>
  `- ${e.description}: Le ${e.amount} [${e.category}] [${e.fund_source}] on ${new Date(e.date).toLocaleDateString()}`
).join('\n') || '(No expenses logged yet)'}

TASK SUMMARY:
Total tasks: ${tasks.length}
Completed: ${tasks.filter(t => t.status === 'completed').length}
In Progress: ${tasks.filter(t => t.status === 'in-progress').length}
Pending: ${tasks.filter(t => t.status === 'pending').length}

Recent tasks:
${tasks.slice(0, 10).map(t =>
  `- [${t.priority?.toUpperCase()}] ${t.title}: ${t.status}`
).join('\n') || '(No tasks yet)'}
  `.trim();

  // System prompt
  const systemPrompt = action === 'report'
    ? `You are a professional administrative AI for ${session.user.name}.
The user acts as a field assistant running errands and managing logistics for their boss/mentor.
Generate a neat, professional ${dateRange?.type || 'daily'} "Errand & Expense Report" based on the user data.
Format it with clear sections: Executive Summary, Errand/Task Progress, Transport & Expense Breakdown (highlighting mentor vs personal funds), Key Insights, and Next Steps.
Use Le (Leones) as the currency. Be professional and concise so the user can send it directly to their boss.`
    : `You are BroJoe AI 🤖 — an intelligent executive assistant helping ${session.user.name} manage their daily operations and build toward financial independence.
Help with expense questions, errand planning, task prioritization, and operational strategy.
Be friendly, sharp, and actionable. Use Le (Leones) as currency. Keep replies concise and useful.
If the user greets you or asks a casual question, respond warmly and offer to help with their tasks or finances.`;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
    });

    const prompt = action === 'report'
      ? `Generate my ${dateRange?.type || 'daily'} report now.\n\nUser Data:\n${contextData}`
      : `${userMessage}\n\nUser Data Context:\n${contextData}`;

    const result = await model.generateContent(prompt);

    return NextResponse.json({
      response: result.response.text(),
      action,
    });
  } catch (err: any) {
    console.error('AI Error:', err);
    return NextResponse.json(
      { response: `⚠️ AI service is temporarily unavailable. Error: ${err?.message || 'Unknown error'}. Please check that GEMINI_API_KEY is set in Vercel environment variables.` },
      { status: 200 } // Return 200 so the chat UI shows the message instead of crashing
    );
  }
}
