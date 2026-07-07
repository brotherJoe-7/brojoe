// src/app/api/reports/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { connectDB } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json([]);
  const userId = (session.user as any).id;

  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return NextResponse.json((data || []).map(r => ({
        _id: r.id,
        title: r.title,
        type: r.type,
        summary: r.summary,
        aiInsights: r.ai_insights,
        shareToken: r.share_token,
        createdAt: r.created_at,
      })));
    } catch (err) {
      console.error('Supabase GET reports error:', err);
    }
  }

  try {
    await connectDB();
    const { Report } = await import('@/lib/models/Report');
    const reports = await Report.find({ userId }).sort({ createdAt: -1 }).limit(30);
    return NextResponse.json(reports);
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
        .from('reports')
        .insert({
          user_id: userId,
          title: body.title,
          type: body.type || 'daily',
          date_range: body.dateRange || {},
          summary: body.summary || '',
          ai_insights: body.aiInsights || '',
          share_token: Math.random().toString(36).substring(2, 10),
        })
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ _id: data.id, ...data }, { status: 201 });
    }

    await connectDB();
    const { Report } = await import('@/lib/models/Report');
    const report = await Report.create({
      userId, ...body,
      shareToken: Math.random().toString(36).substring(2, 10),
    });
    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('POST report error:', error);
    return NextResponse.json({ error: 'Failed to save report' }, { status: 500 });
  }
}
