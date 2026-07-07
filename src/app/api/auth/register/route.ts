// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { connectDB, isDBConfigured } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, gdprConsent, accountType, mentorEmail } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }
    if (!gdprConsent) {
      return NextResponse.json({ error: 'GDPR consent required' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const role = accountType === 'boss' ? 'mentor' : (accountType === 'assistant' ? 'assistant' : 'user');

    // ── Try Supabase first ─────────────────────────────────────
    if (isSupabaseConfigured() && supabaseAdmin) {
      const { data: existing } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      if (existing) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
      }

      const { data: user, error } = await supabaseAdmin
        .from('users')
        .insert({
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          role,
          account_type: accountType || 'individual',
          mentor_email: mentorEmail || '',
          gdpr_consent: true,
          gdpr_consent_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ message: 'User created', userId: user.id }, { status: 201 });
    }

    // ── Fallback: MongoDB ──────────────────────────────────────
    if (!isDBConfigured()) {
      return NextResponse.json(
        { error: 'No database configured. Please set SUPABASE or MONGODB credentials in .env.local.' },
        { status: 503 }
      );
    }

    await connectDB();
    const { User } = await import('@/lib/models/User');
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    const user = await User.create({
      name, email, password: hashedPassword, role,
      mentorEmail: mentorEmail || '',
      gdprConsent: true, gdprConsentDate: new Date(),
    });
    return NextResponse.json({ message: 'User created', userId: user._id }, { status: 201 });

  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Server error during registration' }, { status: 500 });
  }
}
