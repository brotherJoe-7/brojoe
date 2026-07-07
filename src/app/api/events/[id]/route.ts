// src/app/api/events/[id]/route.ts
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
        .from('cal_events')
        .update({
          title: body.title,
          description: body.description,
          date: body.date,
          start_time: body.startTime,
          end_time: body.endTime,
          type: body.type,
          all_day: body.allDay,
          recurring: body.recurring,
          location: body.location,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ _id: data.id, ...data, startTime: data.start_time, endTime: data.end_time });
    } catch {
      return NextResponse.json({ error: 'Failed to update' }, { status: 503 });
    }
  }

  try {
    await connectDB();
    const { CalEvent } = await import('@/lib/models/CalEvent');
    const event = await CalEvent.findOneAndUpdate({ _id: id, userId }, body, { new: true });
    if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(event);
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
      await supabaseAdmin.from('cal_events').delete().eq('id', id).eq('user_id', userId);
      return NextResponse.json({ message: 'Deleted' });
    } catch {
      return NextResponse.json({ error: 'Failed to delete' }, { status: 503 });
    }
  }

  try {
    await connectDB();
    const { CalEvent } = await import('@/lib/models/CalEvent');
    await CalEvent.findOneAndDelete({ _id: id, userId });
    return NextResponse.json({ message: 'Deleted' });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 503 });
  }
}
