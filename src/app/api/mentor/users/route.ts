// src/app/api/mentor/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { connectDB } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const mentorEmail = session.user.email;

  // ── Supabase ──────────────────────────────────────────────────
  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, name, email, role, created_at')
        .eq('mentor_email', mentorEmail);
      if (error) throw error;
      const mentees = (data || []).map(u => ({
        _id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.created_at,
        totalExpenses: 0,
        completedTasks: 0,
      }));
      return NextResponse.json({ mentees });
    } catch (err) {
      console.error('Supabase GET mentees error:', err);
    }
  }

  // ── MongoDB fallback ──────────────────────────────────────────
  try {
    await connectDB();
    const { User } = await import('@/lib/models/User');
    const mentees = await User.find({ mentorEmail }).select('-password');
    return NextResponse.json({ mentees });
  } catch {
    return NextResponse.json({ mentees: [] });
  }
}
