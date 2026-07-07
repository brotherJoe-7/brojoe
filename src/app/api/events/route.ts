// src/app/api/events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { connectDB } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json([], { status: 200 });
  const userId = (session.user as any).id;
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month'); // e.g. "2026-07"

  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      let query = supabaseAdmin
        .from('cal_events')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true });

      if (month) {
        const start = `${month}-01`;
        const end = `${month}-31`;
        query = query.gte('date', start).lte('date', end);
      }

      const { data, error } = await query;
      if (error) throw error;
      const events = (data || []).map(e => ({
        _id: e.id,
        title: e.title,
        description: e.description,
        date: e.date,
        startTime: e.start_time,
        endTime: e.end_time,
        type: e.type,
        allDay: e.all_day,
        recurring: e.recurring,
        location: e.location,
        status: e.status,
      }));
      return NextResponse.json(events);
    } catch (err) {
      console.error('Supabase GET events error:', err);
    }
  }

  try {
    await connectDB();
    const { CalEvent } = await import('@/lib/models/CalEvent');
    const query: any = { userId };
    if (month) {
      const [year, mon] = month.split('-').map(Number);
      query.date = {
        $gte: new Date(year, mon - 1, 1),
        $lte: new Date(year, mon, 0),
      };
    }
    const events = await CalEvent.find(query).sort({ date: 1 });
    return NextResponse.json(events);
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
        .from('cal_events')
        .insert({
          user_id: userId,
          title: body.title,
          description: body.description || '',
          date: body.date,
          start_time: body.startTime || '',
          end_time: body.endTime || '',
          type: body.type || 'personal',
          all_day: body.allDay || false,
          recurring: body.recurring || 'none',
          location: body.location || '',
        })
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ _id: data.id, ...data, startTime: data.start_time, endTime: data.end_time, allDay: data.all_day });
    }

    await connectDB();
    const { CalEvent } = await import('@/lib/models/CalEvent');
    const event = await CalEvent.create({ userId, ...body });
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('POST event error:', error);
    return NextResponse.json({ error: 'Failed to save event' }, { status: 500 });
  }
}
