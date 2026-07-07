// src/app/api/auth/forgot-password/route.ts
// Uses Supabase's built-in password reset email — no custom token management needed.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Service not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Supabase sends the reset email automatically with a secure token.
    // The redirect URL is where the user lands after clicking the link in their email.
    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
      redirectTo: `${process.env.NEXTAUTH_URL}/reset-password`,
    });

    if (error) {
      console.error('Supabase reset error:', error.message);
      // Don't reveal whether the email exists — always respond with success
    }

    // Always return success to prevent email enumeration attacks
    return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Failed to process request.' }, { status: 500 });
  }
}
