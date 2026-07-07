// src/app/api/mentor/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { connectDB } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !['mentor', 'admin'].includes((session.user as any).role)) {
    return NextResponse.json({ error: 'Unauthorized. Mentor access required.' }, { status: 403 });
  }

  const body = await req.json();
  const { userId, title, description, priority, dueDate } = body;
  const mentorId = (session.user as any).id;
  const mentorEmail = session.user.email;

  // ── Supabase ──────────────────────────────────────────────────
  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      // Verify the user is actually a mentee of this mentor
      const { data: mentee, error: menteeError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', userId)
        .eq('mentor_email', mentorEmail)
        .single();

      if (menteeError || !mentee) {
        return NextResponse.json({ error: 'User is not assigned to this mentor.' }, { status: 403 });
      }

      const { data: task, error } = await supabaseAdmin
        .from('tasks')
        .insert({
          user_id: userId,
          assigned_by: mentorId,
          title,
          description: description || '',
          priority: priority || 'medium',
          due_date: dueDate || null,
          status: 'pending',
          is_mentor_task: true,
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ _id: task.id, ...task }, { status: 201 });
    } catch (error) {
      console.error('Supabase mentor task error:', error);
      return NextResponse.json({ error: 'Failed to assign task.' }, { status: 500 });
    }
  }

  // ── MongoDB fallback ──────────────────────────────────────────
  try {
    await connectDB();
    const { Task } = await import('@/lib/models/Task');
    const { User } = await import('@/lib/models/User');
    const mentee = await User.findOne({ _id: userId, mentorEmail });
    if (!mentee) {
      return NextResponse.json({ error: 'User is not assigned to this mentor.' }, { status: 403 });
    }
    const task = await Task.create({
      userId, assignedBy: mentorId,
      title, description, priority, dueDate,
      status: 'pending', isMentorTask: true,
    });
    return NextResponse.json(task, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 });
  }
}
