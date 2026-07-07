// src/app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only the super admin email can access this
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  if (session.user.email !== superAdminEmail) {
    return NextResponse.json({ error: 'Forbidden. Super Admin access only.' }, { status: 403 });
  }

  if (!isSupabaseConfigured() || !supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 });
  }

  try {
    // Fetch all platform stats in parallel
    const [
      { count: totalUsers },
      { count: totalExpenses },
      { count: totalTasks },
      { count: totalReports },
      { data: recentUsers },
      { data: expenseData },
      { data: roleBreakdown },
    ] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('expenses').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('tasks').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('reports').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('users').select('id, name, email, role, account_type, created_at').order('created_at', { ascending: false }).limit(10),
      supabaseAdmin.from('expenses').select('amount, created_at').order('created_at', { ascending: false }).limit(500),
      supabaseAdmin.from('users').select('role'),
    ]);

    // Total platform revenue (sum of all expenses logged)
    const totalPlatformVolume = (expenseData || []).reduce((s: number, e: any) => s + Number(e.amount), 0);

    // Daily signups (last 7 days)
    const last7Days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days[d.toISOString().split('T')[0]] = 0;
    }
    (recentUsers || []).forEach((u: any) => {
      const day = u.created_at?.split('T')[0];
      if (day && last7Days[day] !== undefined) last7Days[day]++;
    });

    // Role distribution
    const roles: Record<string, number> = {};
    (roleBreakdown || []).forEach((u: any) => {
      roles[u.role] = (roles[u.role] || 0) + 1;
    });

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalExpenses: totalExpenses || 0,
      totalTasks: totalTasks || 0,
      totalReports: totalReports || 0,
      totalPlatformVolume,
      recentUsers: recentUsers || [],
      signupChart: Object.entries(last7Days).map(([date, count]) => ({ date, count })),
      roleBreakdown: Object.entries(roles).map(([role, count]) => ({ role, count })),
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats.' }, { status: 500 });
  }
}
