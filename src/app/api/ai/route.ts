// src/app/api/ai/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { Expense } from '@/lib/models/Expense';
import { Task } from '@/lib/models/Task';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action, userMessage, dateRange } = await req.json();

  // Try to connect to DB, but don't fail immediately if it's the test login
  let expenses: any[] = [];
  let tasks: any[] = [];
  try {
    await connectDB();
    const userId = (session.user as any).id;
    if (userId !== 'test-mentor-id') {
      expenses = await Expense.find({ userId }).sort({ date: -1 }).limit(100);
      tasks = await Task.find({ userId }).sort({ createdAt: -1 }).limit(50);
    }
  } catch (e) {
    console.warn("DB not connected, using empty context");
  }

  // Gather context
  let contextData = '';

  if (action === 'chat' || action === 'report') {
    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
    const personalSpent = expenses.filter(e => e.fundSource === 'personal').reduce((s, e) => s + e.amount, 0);
    const mentorSpent = expenses.filter(e => e.fundSource === 'mentor').reduce((s, e) => s + e.amount, 0);

    contextData = `
User: ${(session.user as any).name}
Date: ${new Date().toLocaleDateString()}

EXPENSES SUMMARY:
Total spent: Le ${totalSpent.toFixed(2)}
Personal funds: Le ${personalSpent.toFixed(2)}
Mentor funds: Le ${mentorSpent.toFixed(2)}

Recent expenses (last 10):
${expenses.slice(0, 10).map(e => `- ${e.description}: Le ${e.amount} [${e.category}] [${e.fundSource}] on ${new Date(e.date).toLocaleDateString()}`).join('\n')}

TASKS SUMMARY:
Total tasks: ${tasks.length}
Completed: ${tasks.filter(t => t.status === 'completed').length}
In Progress: ${tasks.filter(t => t.status === 'in-progress').length}
Pending: ${tasks.filter(t => t.status === 'pending').length}

Recent tasks:
${tasks.slice(0, 10).map(t => `- [${t.priority.toUpperCase()}] ${t.title}: ${t.status} (${t.subTasks?.length || 0} sub-tasks)`).join('\n')}
    `;
  }

  let systemPrompt = '';
  if (action === 'report') {
    systemPrompt = `You are a professional administrative AI for ${(session.user as any).name}. 
    The user is currently acting as an assistant and running errands (mostly transport and logistics) for their boss/mentor. 
    Generate a neat, professional ${dateRange?.type || 'daily'} "Errand & Expense Report" based on the user's data. 
    Format it with clear sections: Executive Summary, Errand/Task Progress, Transport & Expense Breakdown (highlighting mentor funds vs personal funds), Key Insights, and Next Steps. 
    Use Le as currency. The tone must be highly professional, concise, and structured so the user can send it directly to their boss/mentor.`;
  } else {
    systemPrompt = `You are BroJoe AI, an executive assistant guiding ${(session.user as any).name} during their transition from an assistant to an independent professional. 
    Help the user organize their errands, transport expenses, and tasks. Detect patterns, suggest improvements for reporting to their boss, and provide actionable insights for building their own future empire. 
    Be concise but thorough. Use Le as currency.`;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', systemInstruction: systemPrompt });
    const prompt = (action === 'report' ? 'Generate my report now.' : userMessage) + '\n\nUser Data Context:\n' + contextData;
    
    const result = await model.generateContent(prompt);
    
    return NextResponse.json({
      response: result.response.text(),
      action,
    });
  } catch (err) {
    console.error("AI Error:", err);
    return NextResponse.json({ error: 'Failed to process AI response. Ensure GEMINI_API_KEY is set.' }, { status: 500 });
  }
}
