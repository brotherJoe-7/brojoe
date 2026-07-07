// src/lib/auth.config.ts
export const authConfig = {
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt' as const,
    // Stay logged in for 30 days on this device
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.gdprConsent = user.gdprConsent;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.gdprConsent = token.gdprConsent;
      }
      return session;
    },
  },
};
