// src/lib/auth.ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { authConfig } from './auth.config';
import { supabaseAdmin, isSupabaseConfigured } from './supabase';

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const { email, password } = credentials as { email: string; password: string };
        if (!email || !password) return null;

        const trimmedEmail = email.trim().toLowerCase();

        // ── Demo bypass ───────────────────────────────────────────
        if (trimmedEmail === 'mentor@brojoe.com' && password === 'mentor123') {
          return { id: 'test-mentor-id', name: 'BroJoe Mentor', email: 'mentor@brojoe.com', role: 'mentor' };
        }

        // ── Supabase Auth ─────────────────────────────────────────
        if (isSupabaseConfigured() && supabaseAdmin) {
          try {
            const { data: user, error } = await supabaseAdmin
              .from('users')
              .select('*')
              .eq('email', trimmedEmail)
              .single();

            if (error || !user) return null;
            const valid = await bcrypt.compare(password, user.password);
            if (!valid) return null;
            return { id: user.id, name: user.name, email: user.email, role: user.role };
          } catch (err) {
            console.error('Supabase auth error:', err);
            // fall through to MongoDB
          }
        }

        // ── MongoDB fallback ──────────────────────────────────────
        try {
          const { connectDB } = await import('./mongodb');
          await connectDB();
          const { User } = await import('./models/User');
          const user = await User.findOne({ email: trimmedEmail });
          if (!user) return null;
          const valid = await bcrypt.compare(password, user.password);
          if (!valid) return null;
          return { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
        } catch (err) {
          console.error('MongoDB auth error:', err);
          return null;
        }
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const email = user.email!.toLowerCase();
        if (isSupabaseConfigured() && supabaseAdmin) {
          const { data: existingUser } = await supabaseAdmin.from('users').select('*').eq('email', email).single();
          if (!existingUser) {
            const { data: newUser } = await supabaseAdmin.from('users').insert([{
              name: user.name || 'Google User',
              email: email,
              password: 'google_oauth_no_password',
              role: 'user',
              avatar: user.image || ''
            }]).select().single();
            if (newUser) {
              user.id = newUser.id;
              (user as any).role = newUser.role;
            }
          } else {
            user.id = existingUser.id;
            (user as any).role = existingUser.role;
          }
        }
      }
      return true;
    }
  }
});
