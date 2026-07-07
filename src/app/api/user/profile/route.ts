// src/app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { connectDB } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;

  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, name, email, role, account_type, mentor_email, total_budget, cal_link')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return NextResponse.json({
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        accountType: data.account_type,
        mentorEmail: data.mentor_email,
        totalBudget: data.total_budget,
        calLink: data.cal_link
      });
    } catch (err) {
      console.error('Supabase profile fetch error:', err);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
  }

  try {
    await connectDB();
    const { User } = await import('@/lib/models/User');
    const user = await User.findById(userId).select('-password');
    return NextResponse.json(user);
  } catch (err) {
    console.error('MongoDB profile fetch error:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 503 });
  }
}
