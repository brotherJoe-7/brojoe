// src/app/api/calendar/google/debug/route.ts
// Temporary debug endpoint - remove after fixing
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

const GCAL_API = 'https://www.googleapis.com/calendar/v3';

async function refreshGoogleToken(refreshToken: string): Promise<string | null> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  return data.access_token || null;
}

export async function GET(req: NextRequest) {
  const session = await auth() as any;
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!isSupabaseConfigured() || !supabaseAdmin) {
    return NextResponse.json({ error: 'DB not configured' }, { status: 503 });
  }

  const userId = session.user.id;

  // Step 1: check what tokens are stored
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('google_access_token, google_refresh_token, google_token_expiry, email')
    .eq('id', userId)
    .single();

  const hasAccessToken = !!userData?.google_access_token;
  const hasRefreshToken = !!userData?.google_refresh_token;

  // Step 2: try to get a working token
  let accessToken = userData?.google_access_token;
  let tokenRefreshed = false;

  if (!accessToken && userData?.google_refresh_token) {
    accessToken = await refreshGoogleToken(userData.google_refresh_token);
    tokenRefreshed = true;
    if (accessToken) {
      await supabaseAdmin.from('users').update({ google_access_token: accessToken }).eq('id', userId);
    }
  }

  if (!accessToken) {
    return NextResponse.json({
      step: 'NO_TOKEN',
      hasAccessToken,
      hasRefreshToken,
      message: 'No valid Google token found. User needs to sign out and sign back in with Google.',
      userId,
      email: userData?.email,
    });
  }

  // Step 3: test the token against Google Calendar API
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 90);
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 90);

  const testRes = await fetch(
    `${GCAL_API}/calendars/primary/events?timeMin=${pastDate.toISOString()}&timeMax=${futureDate.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=10`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  const testStatus = testRes.status;
  const testData = await testRes.json();

  // Step 4: list calendars to verify access
  const calRes = await fetch(`${GCAL_API}/users/me/calendarList`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const calData = await calRes.json();

  return NextResponse.json({
    step: 'TOKEN_TEST',
    hasAccessToken,
    hasRefreshToken,
    tokenRefreshed,
    googleApiStatus: testStatus,
    eventsFound: testData.items?.length ?? 0,
    sampleEvents: (testData.items || []).slice(0, 3).map((e: any) => ({
      title: e.summary,
      date: e.start?.dateTime || e.start?.date,
      id: e.id,
      hasBroJoeId: !!e.extendedProperties?.private?.broJoeId,
    })),
    googleError: testData.error || null,
    calendarsFound: calData.items?.length ?? 0,
    calendarNames: (calData.items || []).map((c: any) => c.summary),
  });
}
