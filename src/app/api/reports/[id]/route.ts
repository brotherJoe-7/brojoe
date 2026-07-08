// src/app/api/reports/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { connectDB } from '@/lib/mongodb';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const { id } = params;

  try {
    if (isSupabaseConfigured() && supabaseAdmin) {
      const { error } = await supabaseAdmin
        .from('reports')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    await connectDB();
    const { Report } = await import('@/lib/models/Report');
    const result = await Report.deleteOne({ _id: id, userId });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Report not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE report error:', error);
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
  }
}
