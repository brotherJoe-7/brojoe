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
      // Request Google Calendar access
      authorization: {
        params: {
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/calendar',
          ].join(' '),
          access_type: 'offline',  // needed to get refresh_token
          prompt: 'consent',       // force consent screen to always issue refresh_token
        },
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,

    async jwt({ token, user, account }: any) {
      // Store Google tokens in the JWT when first signing in
      if (account?.provider === 'google') {
        token.googleAccessToken = account.access_token;
        token.googleRefreshToken = account.refresh_token;
        token.googleTokenExpiry = account.expires_at;
      }
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.googleAccessToken = token.googleAccessToken;
        session.googleRefreshToken = token.googleRefreshToken;
        session.googleTokenExpiry = token.googleTokenExpiry;
        session.hasCalendarAccess = !!token.googleAccessToken;
      }
      return session;
    },

    async signIn({ user, account }: any) {
      if (account?.provider === 'google') {
        const email = user.email!.toLowerCase();
        if (isSupabaseConfigured() && supabaseAdmin) {
          const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

          const tokenData = {
            google_access_token: account.access_token || null,
            google_refresh_token: account.refresh_token || null,
            google_token_expiry: account.expires_at ? new Date(account.expires_at * 1000).toISOString() : null,
          };

          if (!existingUser) {
            const { data: newUser } = await supabaseAdmin.from('users').insert([{
              name: user.name || 'Google User',
              email: email,
              password: 'google_oauth_no_password',
              role: 'user',
              avatar: user.image || '',
              ...tokenData,
            }]).select().single();
            if (newUser) {
              user.id = newUser.id;
              (user as any).role = newUser.role;
            }
          } else {
            // Update tokens on every login
            await supabaseAdmin
              .from('users')
              .update(tokenData)
              .eq('id', existingUser.id);
            user.id = existingUser.id;
            (user as any).role = existingUser.role;
          }
        }
      }
      return true;
    },
  },
});
