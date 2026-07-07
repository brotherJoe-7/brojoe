// src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { connectDB } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    let userFound = false;
    let userName = '';

    // Check Supabase first
    if (isSupabaseConfigured() && supabaseAdmin) {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, name')
        .eq('email', email.toLowerCase())
        .single();
      
      if (user && !error) {
        userFound = true;
        userName = user.name;
        // In a real implementation, you would save the reset token to the database here
      }
    } else {
      // Fallback to MongoDB
      await connectDB();
      const { User } = await import('@/lib/models/User');
      const user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        userFound = true;
        userName = user.name;
        // Save token to MongoDB
      }
    }

    if (!userFound) {
      // Return success even if not found to prevent email enumeration
      return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' });
    }

    // Send email using Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      console.log(`[DEV MODE] Forgot password requested for ${email}. Token: ${resetToken}`);
      return NextResponse.json({ 
        message: 'Email logged to console (configure RESEND_API_KEY to send real emails)',
        devToken: resetToken 
      });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'BroJoe Platform <noreply@brojoe.com>',
        to: email,
        subject: 'Reset your BroJoe password',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Password Reset Request</h2>
            <p>Hi ${userName},</p>
            <p>We received a request to reset your password for your BroJoe Platform account.</p>
            <div style="margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}" 
                 style="background-color: #d97757; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Reset Password
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `
      })
    });

    if (!res.ok) {
      throw new Error('Failed to send email via Resend');
    }

    return NextResponse.json({ message: 'Reset link sent successfully.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Failed to process request.' }, { status: 500 });
  }
}
