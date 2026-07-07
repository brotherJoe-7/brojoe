// src/app/api/tasks/[id]/route.ts
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
        .from('tasks')
        .update({
          title: body.title,
          description: body.description,
          status: body.status,
          priority: body.priority,
          due_date: body.dueDate,
          sub_tasks: body.subTasks,
          completion_note: body.completionNote,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ _id: data.id, ...data });
    } catch {
      return NextResponse.json({ error: 'Failed to update task' }, { status: 503 });
    }
  }

  try {
    await connectDB();
    const { Task } = await import('@/lib/models/Task');
    const task = await Task.findOneAndUpdate({ _id: id, userId }, body, { new: true });
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(task);
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
      await supabaseAdmin.from('tasks').delete().eq('id', id).eq('user_id', userId);
      return NextResponse.json({ message: 'Deleted' });
    } catch {
      return NextResponse.json({ error: 'Failed to delete' }, { status: 503 });
    }
  }

  try {
    await connectDB();
    const { Task } = await import('@/lib/models/Task');
    await Task.findOneAndDelete({ _id: id, userId });
    return NextResponse.json({ message: 'Deleted' });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 503 });
  }
}
