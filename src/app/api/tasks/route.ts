// src/app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { connectDB } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json([], { status: 200 });
  const userId = (session.user as any).id;

  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const tasks = (data || []).map(t => ({
        _id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.due_date,
        subTasks: t.sub_tasks || [],
        isMentorTask: t.is_mentor_task,
        completionNote: t.completion_note,
        createdAt: t.created_at,
      }));
      return NextResponse.json(tasks);
    } catch (error) {
      console.error('Supabase GET tasks error:', error);
    }
  }

  try {
    await connectDB();
    const { Task } = await import('@/lib/models/Task');
    const tasks = await Task.find({ userId }).sort({ createdAt: -1 });
    return NextResponse.json(tasks);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;

  try {
    const body = await req.json();

    if (isSupabaseConfigured() && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('tasks')
        .insert({
          user_id: userId,
          title: body.title,
          description: body.description || '',
          status: body.status || 'pending',
          priority: body.priority || 'medium',
          due_date: body.dueDate || null,
          sub_tasks: body.subTasks || [],
          is_mentor_task: body.isMentorTask || false,
        })
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ _id: data.id, ...data }, { status: 201 });
    }

    await connectDB();
    const { Task } = await import('@/lib/models/Task');
    const task = await Task.create({ userId, ...body });
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('POST task error:', error);
    return NextResponse.json({ error: 'Failed to save task' }, { status: 500 });
  }
}
