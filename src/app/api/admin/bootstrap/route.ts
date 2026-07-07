// src/app/api/admin/bootstrap/route.ts
// Emergency endpoint: sets the super admin's role to 'admin' in Supabase.
// Only works if the calling user's email matches one of the known super admin emails.
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

const SUPER_ADMIN_EMAILS = [
  process.env.SUPER_ADMIN_EMAIL?.toLowerCase(),
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL?.toLowerCase(),
  'jnimneh20@gmail.com',
  'brotherjoseph79@gmail.com',
].filter(Boolean);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

  const callerEmail = session.user.email?.toLowerCase();
  if (!SUPER_ADMIN_EMAILS.includes(callerEmail)) {
    return NextResponse.json({ error: 'Your email is not in the super admin list.' }, { status: 403 });
  }

  if (!isSupabaseConfigured() || !supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured.' }, { status: 503 });
  }

  // Find the user by email and set role to admin
  const { data: user, error: findError } = await supabaseAdmin
    .from('users')
    .select('id, email, role')
    .eq('email', callerEmail)
    .single();

  if (findError || !user) {
    return NextResponse.json({ error: 'Your account was not found in the database. Try logging out and back in.' }, { status: 404 });
  }

  if (user.role === 'admin') {
    return NextResponse.json({ message: `Already admin! Your role is: ${user.role}`, role: user.role });
  }

  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({ role: 'admin' })
    .eq('id', user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: `✅ Role upgraded to admin for ${callerEmail}. Please sign out and sign back in to see your Super Admin link.`,
  });
}
