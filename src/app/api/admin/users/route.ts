// src/app/api/admin/users/route.ts
// Super Admin only: update a user's role
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

const SUPER_ADMIN_EMAILS = [
  process.env.SUPER_ADMIN_EMAIL?.toLowerCase(),
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL?.toLowerCase(),
  'jnimneh20@gmail.com',
  'brotherjoseph79@gmail.com',
].filter(Boolean);

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const callerEmail = session.user.email?.toLowerCase();
  if (!SUPER_ADMIN_EMAILS.includes(callerEmail)) {
    return NextResponse.json({ error: 'Forbidden. Super Admin only.' }, { status: 403 });
  }

  if (!isSupabaseConfigured() || !supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 });
  }

  const { userId, role } = await req.json();
  const validRoles = ['user', 'assistant', 'mentor', 'admin', 'accountant'];

  if (!userId || !role || !validRoles.includes(role)) {
    return NextResponse.json({ error: 'Invalid userId or role.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('users')
    .update({ role })
    .eq('id', userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: `User role updated to ${role}` });
}
