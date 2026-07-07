// src/app/api/calendar/google/sync/route.ts
// Bidirectional sync between BroJoe cal_events table and Google Calendar.
// POST: push BroJoe events to Google, pull Google events into BroJoe.
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

const GCAL_API = 'https://www.googleapis.com/calendar/v3';

// Refresh an expired Google access token using the stored refresh_token
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
  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token || null;
}

// Convert a BroJoe event to Google Calendar event format
function broJoeToGoogle(event: any) {
  const start = event.start_time
    ? { dateTime: new Date(`${event.date}T${event.start_time}`).toISOString(), timeZone: 'UTC' }
    : { date: event.date };
  const end = event.end_time
    ? { dateTime: new Date(`${event.date}T${event.end_time}`).toISOString(), timeZone: 'UTC' }
    : start;

  return {
    summary: event.title,
    description: [
      event.description || '',
      `Type: ${event.type || 'event'}`,
      event.location ? `Location: ${event.location}` : '',
      `Synced from BroJoe Platform`,
    ].filter(Boolean).join('\n'),
    location: event.location || '',
    start,
    end,
    extendedProperties: {
      private: { broJoeId: event.id, broJoeType: event.type || 'event' },
    },
    colorId: getGoogleColor(event.type),
  };
}

function getGoogleColor(type: string): string {
  const colors: Record<string, string> = {
    errand: '5',         // banana
    meeting: '9',        // blueberry
    'mentor-session': '3', // grape
    personal: '6',       // tangerine
    deadline: '11',      // tomato
    booking: '2',        // sage
  };
  return colors[type] || '1';
}

// Convert a Google Calendar event to BroJoe format
function googleToBroJoe(gEvent: any, userId: string) {
  const start = gEvent.start?.dateTime || gEvent.start?.date;
  const end = gEvent.end?.dateTime || gEvent.end?.date;

  const dateStr = start ? start.split('T')[0] : new Date().toISOString().split('T')[0];
  const startTime = start?.includes('T') ? start.split('T')[1]?.slice(0, 5) : '';
  const endTime = end?.includes('T') ? end.split('T')[1]?.slice(0, 5) : '';

  return {
    user_id: userId,
    title: gEvent.summary || 'Google Calendar Event',
    description: gEvent.description?.replace(/\nSynced from BroJoe Platform/g, '').trim() || '',
    date: dateStr,
    start_time: startTime,
    end_time: endTime,
    location: gEvent.location || '',
    type: 'meeting', // default for imported Google events
    google_event_id: gEvent.id,
    synced_from_google: true,
    all_day: !start?.includes('T'),
  };
}

export async function POST(req: NextRequest) {
  const session = await auth() as any;
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!isSupabaseConfigured() || !supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 });
  }

  const userId = session.user.id;

  // Get stored tokens from Supabase
  const { data: userData, error: userErr } = await supabaseAdmin
    .from('users')
    .select('google_access_token, google_refresh_token, google_token_expiry')
    .eq('id', userId)
    .single();

  if (userErr || !userData) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }

  let accessToken: string | null = null;

  if (!userData.google_refresh_token) {
    // No refresh token means the user never granted calendar access
    return NextResponse.json({
      error: 'No Google Calendar access. Please sign out and sign back in with Google to grant calendar permissions.',
      needsReauth: true,
    }, { status: 403 });
  }

  // ALWAYS get a fresh access token using the refresh_token.
  // Stored access tokens expire after 1 hour - never trust the stored one.
  accessToken = await refreshGoogleToken(userData.google_refresh_token);

  if (accessToken) {
    // Save the new fresh token back to DB
    await supabaseAdmin
      .from('users')
      .update({ google_access_token: accessToken })
      .eq('id', userId);
  } else {
    // Refresh failed - fall back to stored token as last resort
    accessToken = userData.google_access_token;
  }

  if (!accessToken) {
    return NextResponse.json({
      error: 'Could not get a valid Google token. Please sign out and sign back in with Google.',
      needsReauth: true,
    }, { status: 403 });
  }

  const results = { pushed: 0, pulled: 0, errors: [] as string[] };

  // ── PUSH: Send BroJoe events → Google Calendar ─────────────────────
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const { data: broJoeEvents } = await supabaseAdmin
      .from('cal_events')
      .select('*')
      .eq('user_id', userId)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .is('google_event_id', null); // Only push events not already synced

    for (const event of (broJoeEvents || [])) {
      const gEventBody = broJoeToGoogle(event);
      const pushRes = await fetch(`${GCAL_API}/calendars/primary/events`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gEventBody),
      });

      if (pushRes.ok) {
        const gEvent = await pushRes.json();
        // Save the Google event ID back to BroJoe
        await supabaseAdmin
          .from('cal_events')
          .update({ google_event_id: gEvent.id })
          .eq('id', event.id);
        results.pushed++;
      } else {
        const errText = await pushRes.text();
        results.errors.push(`Push failed for "${event.title}": ${errText.slice(0, 100)}`);
      }
    }
  } catch (err: any) {
    results.errors.push(`Push error: ${err.message}`);
  }

  // ── PULL: Import Google Calendar events → BroJoe ──────────────────
  try {
    // Pull from 90 days ago up to 90 days in the future so we catch past events too
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 90);
    const past = pastDate.toISOString();

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 90);
    const future = futureDate.toISOString();

    const pullRes = await fetch(
      `${GCAL_API}/calendars/primary/events?timeMin=${past}&timeMax=${future}&singleEvents=true&orderBy=startTime&maxResults=250`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (pullRes.ok) {
      const gData = await pullRes.json();
      const googleEvents = (gData.items || []).filter((e: any) =>
        // Don't re-import events that originated from BroJoe
        !e.extendedProperties?.private?.broJoeId
      );

      for (const gEvent of googleEvents) {
        const broEvent = googleToBroJoe(gEvent, userId);

        // Check if already imported
        const { data: existing } = await supabaseAdmin
          .from('cal_events')
          .select('id')
          .eq('google_event_id', gEvent.id)
          .eq('user_id', userId)
          .single();

        if (!existing) {
          await supabaseAdmin.from('cal_events').insert([broEvent]);
          results.pulled++;
        }
      }
    }
  } catch (err: any) {
    results.errors.push(`Pull error: ${err.message}`);
  }

  return NextResponse.json({
    success: true,
    pushed: results.pushed,
    pulled: results.pulled,
    errors: results.errors,
    message: `✅ Synced! ${results.pushed} events pushed to Google, ${results.pulled} events imported from Google.`,
  });
}

// GET: Check if user has Google Calendar connected
export async function GET(req: NextRequest) {
  const session = await auth() as any;
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!isSupabaseConfigured() || !supabaseAdmin) {
    return NextResponse.json({ connected: false });
  }

  const { data } = await supabaseAdmin
    .from('users')
    .select('google_access_token, google_refresh_token')
    .eq('id', session.user.id)
    .single();

  const connected = !!(data?.google_access_token || data?.google_refresh_token);
  return NextResponse.json({ connected });
}
