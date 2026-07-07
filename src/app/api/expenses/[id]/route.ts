// src/app/api/expenses/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { connectDB } from '@/lib/mongodb';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const userId = (session.user as any).id;

  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('expenses')
        .update({
          description: body.description,
          amount: body.amount,
          category: body.category,
          fund_source: body.fundSource,
          date: body.date,
          notes: body.notes,
          vendor: body.vendor,
          receipt_url: body.receiptUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ _id: data.id, ...data, fundSource: data.fund_source });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to update' }, { status: 503 });
    }
  }

  try {
    await connectDB();
    const { Expense } = await import('@/lib/models/Expense');
    const expense = await Expense.findOneAndUpdate({ _id: id, userId }, body, { new: true });
    if (!expense) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(expense);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 503 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const userId = (session.user as any).id;

  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      await supabaseAdmin.from('expenses').delete().eq('id', id).eq('user_id', userId);
      return NextResponse.json({ message: 'Deleted' });
    } catch {
      return NextResponse.json({ error: 'Failed to delete' }, { status: 503 });
    }
  }

  try {
    await connectDB();
    const { Expense } = await import('@/lib/models/Expense');
    await Expense.findOneAndDelete({ _id: id, userId });
    return NextResponse.json({ message: 'Deleted' });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 503 });
  }
}
