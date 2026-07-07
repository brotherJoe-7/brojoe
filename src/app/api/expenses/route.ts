// src/app/api/expenses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { connectDB } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const fundSource = searchParams.get('fundSource');
  const limit = parseInt(searchParams.get('limit') || '100');
  const userId = (session.user as any).id;

  // ── Supabase ──────────────────────────────────────────────────
  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      let query = supabaseAdmin
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(limit);

      if (category) query = query.eq('category', category);
      if (fundSource) query = query.eq('fund_source', fundSource);

      const { data, error } = await query;
      if (error) throw error;

      // Normalize field names to camelCase for frontend compatibility
      const expenses = (data || []).map(e => ({
        _id: e.id,
        description: e.description,
        amount: e.amount,
        category: e.category,
        fundSource: e.fund_source,
        date: e.date,
        notes: e.notes,
        vendor: e.vendor,
        receiptUrl: e.receipt_url,
        tags: e.tags,
      }));
      return NextResponse.json({ expenses, total: expenses.length });
    } catch (error) {
      console.error('Supabase GET expenses error:', error);
    }
  }

  // ── MongoDB fallback ──────────────────────────────────────────
  try {
    await connectDB();
    const { Expense } = await import('@/lib/models/Expense');
    const query: any = { userId };
    if (category) query.category = category;
    if (fundSource) query.fundSource = fundSource;
    const expenses = await Expense.find(query).sort({ date: -1 }).limit(limit);
    return NextResponse.json({ expenses, total: expenses.length });
  } catch {
    return NextResponse.json({ expenses: [], total: 0 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;

  try {
    const body = await req.json();

    // ── Supabase ────────────────────────────────────────────────
    if (isSupabaseConfigured() && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('expenses')
        .insert({
          user_id: userId,
          description: body.description,
          amount: body.amount,
          category: body.category || 'miscellaneous',
          fund_source: body.fundSource || 'personal',
          date: body.date || new Date().toISOString(),
          notes: body.notes || '',
          vendor: body.vendor || '',
          receipt_url: body.receiptUrl || '',
          tags: body.tags || [],
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ _id: data.id, ...data, fundSource: data.fund_source, receiptUrl: data.receipt_url });
    }

    // ── MongoDB fallback ──────────────────────────────────────────
    await connectDB();
    const { Expense } = await import('@/lib/models/Expense');
    const expense = await Expense.create({ userId, ...body });
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('POST expenses error:', error);
    return NextResponse.json({ error: 'Failed to save expense' }, { status: 500 });
  }
}
