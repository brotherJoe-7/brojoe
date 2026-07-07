// src/app/api/user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { connectDB } from '@/lib/mongodb';

// PATCH — Update user settings
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;
  const body = await req.json();

  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      const updateData: any = {};
      if (body.mentorEmail !== undefined) updateData.mentor_email = body.mentorEmail;
      if (body.totalBudget !== undefined) updateData.total_budget = body.totalBudget;
      if (body.name !== undefined) updateData.name = body.name;
      if (body.calLink !== undefined) updateData.cal_link = body.calLink;
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ message: 'Settings saved', user: { id: data.id, name: data.name, email: data.email, role: data.role } });
    } catch (err) {
      console.error('Supabase PATCH user error:', err);
      return NextResponse.json({ error: 'Failed to save settings.' }, { status: 500 });
    }
  }

  // MongoDB fallback
  try {
    await connectDB();
    const { User } = await import('@/lib/models/User');
    const user = await User.findByIdAndUpdate(userId, {
      mentorEmail: body.mentorEmail,
      totalBudget: body.totalBudget,
      name: body.name,
      calLink: body.calLink,
    }, { new: true }).select('-password');
    return NextResponse.json({ message: 'Settings saved', user });
  } catch {
    return NextResponse.json({ error: 'Database error' }, { status: 503 });
  }
}

// GET — Export all user data (GDPR right to data portability)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;

  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      const [{ data: expenses }, { data: tasks }, { data: reports }, { data: events }] = await Promise.all([
        supabaseAdmin.from('expenses').select('*').eq('user_id', userId),
        supabaseAdmin.from('tasks').select('*').eq('user_id', userId),
        supabaseAdmin.from('reports').select('*').eq('user_id', userId),
        supabaseAdmin.from('cal_events').select('*').eq('user_id', userId),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        user: { id: userId, email: session.user.email, name: session.user.name },
        expenses: expenses || [],
        tasks: tasks || [],
        reports: reports || [],
        events: events || [],
      };

      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="brojoe-data-export-${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    } catch (err) {
      return NextResponse.json({ error: 'Export failed.' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Database not configured.' }, { status: 503 });
}

// DELETE — Delete account and all data (GDPR right to erasure)
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;

  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      // Cascade deletes will handle expenses, tasks, reports, events
      await supabaseAdmin.from('users').delete().eq('id', userId);
      return NextResponse.json({ message: 'Account and all data permanently deleted.' });
    } catch (err) {
      return NextResponse.json({ error: 'Failed to delete account.' }, { status: 500 });
    }
  }

  try {
    await connectDB();
    const { User } = await import('@/lib/models/User');
    await User.findByIdAndDelete(userId);
    return NextResponse.json({ message: 'Account deleted.' });
  } catch {
    return NextResponse.json({ error: 'Database error.' }, { status: 503 });
  }
}
