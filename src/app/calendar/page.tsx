'use client';
// src/app/calendar/page.tsx
import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import {
  ChevronLeft, ChevronRight, Plus, X, Calendar,
  Clock, MapPin, Users, Sparkles, Link2, Repeat,
  BookOpen, Briefcase, ShoppingCart, User, Zap, Trash2
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday, parseISO } from 'date-fns';
import styles from './calendar.module.css';

/* ── Event type config ─────────────────────────────── */
const EVENT_TYPES = [
  { id: 'errand',         label: 'Errand',         color: '#f59e0b', bg: 'rgba(245,158,11,0.2)',   icon: ShoppingCart },
  { id: 'meeting',        label: 'Meeting',         color: '#4285f4', bg: 'rgba(66,133,244,0.2)',   icon: Briefcase },
  { id: 'mentor-session', label: 'Mentor',          color: '#8e24aa', bg: 'rgba(142,36,170,0.2)',   icon: Users },
  { id: 'personal',       label: 'Personal',        color: '#d97757', bg: 'rgba(217,119,87,0.2)',   icon: User },
  { id: 'deadline',       label: 'Deadline',        color: '#f43f5e', bg: 'rgba(244,63,94,0.2)',    icon: Zap },
  { id: 'booking',        label: 'Booking',         color: '#10b981', bg: 'rgba(16,185,129,0.2)',   icon: BookOpen },
];

const typeInfo = (id: string) => EVENT_TYPES.find(t => t.id === id) ?? EVENT_TYPES[3];

/* ── Local mock events (shown before DB connected) ── */
const LOCAL_DEMO: any[] = [
  { _id: 'demo-1', title: 'Morning Errand Run', date: new Date().toISOString(), startTime: '08:00', endTime: '09:30', type: 'errand',   allDay: false },
  { _id: 'demo-2', title: 'Mentor Check-In',    date: new Date().toISOString(), startTime: '10:00', endTime: '11:00', type: 'mentor-session', allDay: false },
  { _id: 'demo-3', title: 'Market Visit',       date: addDays(new Date(), 2).toISOString(), startTime: '14:00', endTime: '16:00', type: 'errand', allDay: false },
  { _id: 'demo-4', title: 'Weekly Report Due',  date: addDays(new Date(), 5).toISOString(), startTime: '', endTime: '', type: 'deadline', allDay: true },
];

/* ── Blank event ─────────────────────────────────────── */
const blank = () => ({
  title: '', description: '', date: format(new Date(), 'yyyy-MM-dd'),
  startTime: '09:00', endTime: '10:00', type: 'personal', allDay: false,
  recurring: 'none', location: '',
});

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [current, setCurrent] = useState(new Date());
  const [events, setEvents] = useState<any[]>(LOCAL_DEMO);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState<any | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [form, setForm] = useState(blank());
  const [saving, setSaving] = useState(false);
  const [calLink, setCalLink] = useState('');
  const [showBooking, setShowBooking] = useState(false);
  const [tab, setTab] = useState<'calendar'|'booking'>('calendar');

  useEffect(() => { if (status === 'unauthenticated') router.push('/login'); }, [status, router]);

  /* Fetch events and profile */
  useEffect(() => {
    if (status !== 'authenticated') return;
    
    fetch('/api/user/profile')
      .then(r => r.json())
      .then(data => {
        if (data.calLink) {
          setCalLink(data.calLink);
          setShowBooking(true);
        }
      })
      .catch(() => {});

    const monthStr = format(current, 'yyyy-MM');
    fetch(`/api/events?month=${monthStr}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setEvents(data);
        // else keep demo data
      })
      .catch(() => {});
  }, [status, current]);

  /* Build calendar grid */
  const grid = useMemo(() => {
    const start = startOfWeek(startOfMonth(current), { weekStartsOn: 1 });
    const end   = endOfWeek(endOfMonth(current),     { weekStartsOn: 1 });
    const days: Date[] = [];
    let d = start;
    while (d <= end) { days.push(d); d = addDays(d, 1); }
    return days;
  }, [current]);

  const eventsOnDay = (day: Date) =>
    events.filter(e => isSameDay(new Date(e.date), day));

  const todayEvents = events
    .filter(e => isSameDay(new Date(e.date), new Date()))
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  /* Stats */
  const monthEvents  = events.filter(e => isSameMonth(new Date(e.date), current));
  const todayCount   = events.filter(e => isToday(new Date(e.date))).length;
  const pendingCount = events.filter(e => e.type === 'deadline').length;

  /* Handlers */
  const openCreate = (day?: Date) => {
    setEditEvent(null);
    setForm({ ...blank(), date: format(day ?? new Date(), 'yyyy-MM-dd') });
    setIsReadOnly(false);
    setShowModal(true);
  };
  const openEdit = (ev: any) => {
    setEditEvent(ev);
    setForm({
      title: ev.title, description: ev.description || '',
      date: format(new Date(ev.date), 'yyyy-MM-dd'),
      startTime: ev.startTime || '09:00', endTime: ev.endTime || '10:00',
      type: ev.type, allDay: ev.allDay, recurring: ev.recurring || 'none', location: ev.location || '',
    });
    setIsReadOnly(false);
    setShowModal(true);
  };
  const openView = (ev: any) => {
    openEdit(ev);
    setIsReadOnly(true);
  };

  const saveEvent = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = { ...form, date: new Date(form.date).toISOString() };
    try {
      if (editEvent) {
        const res = await fetch(`/api/events/${editEvent._id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setEvents(prev => prev.map(e => e._id === editEvent._id ? updated : e));
        }
      } else {
        const res = await fetch('/api/events', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setEvents(prev => [...prev, created]);
        } else {
          // offline demo mode — add locally
          setEvents(prev => [...prev, { ...payload, _id: `local-${Date.now()}` }]);
        }
      }
    } catch {
      setEvents(prev => [...prev, { ...payload, _id: `local-${Date.now()}` }]);
    }
    setSaving(false);
    setShowModal(false);
  };

  const deleteEvent = async (id: string) => {
    try { await fetch(`/api/events/${id}`, { method: 'DELETE' }); } catch {}
    setEvents(prev => prev.filter(e => e._id !== id));
    setShowModal(false);
  };

  if (status === 'loading') return null;

  return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-content animate-fadeIn">

          {/* Page header */}
          <div className="page-header">
            <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1>Calendar & Bookings</h1>
                <p className="text-secondary">Manage your schedule, errands, sessions, and bookings</p>
              </div>
              <div className="flex gap-2">
                <button
                  className={`btn ${tab === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setTab('calendar')}
                >
                  <Calendar size={16} /> Calendar
                </button>
                <button
                  className={`btn ${tab === 'booking' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setTab('booking')}
                >
                  <Link2 size={16} /> Booking
                </button>
                <button className="btn btn-primary" onClick={() => openCreate()}>
                  <Plus size={16} /> New Event
                </button>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className={styles.quickStats}>
            <div className={styles.quickStat}>
              <span className={styles.quickStatVal}>{todayCount}</span>
              <span className={styles.quickStatLabel}>Today</span>
            </div>
            <div className={styles.quickStat}>
              <span className={styles.quickStatVal}>{monthEvents.length}</span>
              <span className={styles.quickStatLabel}>This Month</span>
            </div>
            <div className={styles.quickStat}>
              <span className={styles.quickStatVal}>{pendingCount}</span>
              <span className={styles.quickStatLabel}>Deadlines</span>
            </div>
          </div>

          {tab === 'calendar' ? (
            <div className={styles.calendarWrap}>
              {/* ── Main calendar ── */}
              <div className={styles.calGrid}>
                {/* Navigation */}
                <div className={styles.calHeader}>
                  <div className={styles.calNav}>
                    <button className={styles.calNavBtn} onClick={() => setCurrent(subMonths(current, 1))}>
                      <ChevronLeft size={16} />
                    </button>
                    <span className={styles.calMonthLabel}>{format(current, 'MMMM yyyy')}</span>
                    <button className={styles.calNavBtn} onClick={() => setCurrent(addMonths(current, 1))}>
                      <ChevronRight size={16} />
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setCurrent(new Date())}>Today</button>
                  </div>
                  <div className={styles.viewToggle}>
                    <button className={`${styles.viewBtn} ${styles.viewBtnActive}`}>Month</button>
                  </div>
                </div>

                {/* Day labels */}
                <div className={styles.dayLabels}>
                  {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                    <div key={d} className={styles.dayLabel}>{d}</div>
                  ))}
                </div>

                {/* Grid */}
                <div className={styles.monthGrid}>
                  {grid.map((day, i) => {
                    const dayEvs = eventsOnDay(day);
                    const inMonth = isSameMonth(day, current);
                    const today = isToday(day);
                    return (
                      <div
                        key={i}
                        className={`${styles.dayCell} ${!inMonth ? styles.dayCellOtherMonth : ''} ${today ? styles.dayCellToday : ''}`}
                        onClick={() => openCreate(day)}
                      >
                        <span className={`${styles.dayNum} ${today ? styles.dayNumToday : ''}`}>
                          {format(day, 'd')}
                        </span>
                        {dayEvs.slice(0, 3).map(ev => {
                          const t = typeInfo(ev.type);
                          return (
                            <span
                              key={ev._id}
                              className={styles.eventPill}
                              style={{ background: t.bg, color: t.color }}
                              onClick={e => { e.stopPropagation(); openView(ev); }}
                            >
                              {ev.title}
                            </span>
                          );
                        })}
                        {dayEvs.length > 3 && (
                          <span className={styles.moreEvents}>+{dayEvs.length - 3} more</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Side panel ── */}
              <div className={styles.sidePanel}>
                {/* Today's Agenda */}
                <div className={styles.agendaCard}>
                  <p className={styles.agendaTitle}>Today's Agenda — {format(new Date(), 'EEE, MMM d')}</p>
                  {todayEvents.length ? todayEvents.map(ev => {
                    const t = typeInfo(ev.type);
                    return (
                      <div key={ev._id} className={styles.agendaItem} onClick={() => openView(ev)} style={{ cursor: 'pointer' }}>
                        <span className={styles.agendaDot} style={{ background: t.color }} />
                        <div className={styles.agendaInfo}>
                          <span className={styles.agendaEventTitle}>{ev.title}</span>
                          <span className={styles.agendaTime}>
                            {ev.allDay ? 'All Day' : `${ev.startTime}${ev.endTime ? ` – ${ev.endTime}` : ''}`}
                            {ev.location && ` · ${ev.location}`}
                          </span>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className={styles.agendaEmpty}>
                      <Calendar size={28} style={{ margin: '0 auto 8px', display: 'block', color: 'var(--text-muted)' }} />
                      <p>No events today</p>
                      <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={() => openCreate()}>
                        Add Event
                      </button>
                    </div>
                  )}
                </div>

                {/* Event Types Legend */}
                <div className={styles.agendaCard}>
                  <p className={styles.agendaTitle}>Event Types</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {EVENT_TYPES.map(t => (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{t.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upcoming */}
                <div className={styles.agendaCard}>
                  <p className={styles.agendaTitle}>Coming Up</p>
                  {events
                    .filter(e => new Date(e.date) > new Date())
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .slice(0, 4)
                    .map(ev => {
                      const t = typeInfo(ev.type);
                      return (
                        <div key={ev._id} className={styles.agendaItem} onClick={() => openView(ev)} style={{ cursor: 'pointer' }}>
                          <span className={styles.agendaDot} style={{ background: t.color }} />
                          <div className={styles.agendaInfo}>
                            <span className={styles.agendaEventTitle}>{ev.title}</span>
                            <span className={styles.agendaTime}>{format(new Date(ev.date), 'EEE, MMM d')}</span>
                          </div>
                        </div>
                      );
                    })
                  }
                  {events.filter(e => new Date(e.date) > new Date()).length === 0 && (
                    <p className={styles.agendaEmpty}>Nothing upcoming</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ── Booking Tab ── */
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start', width: '100%' }}>
              {/* Instructions */}
              <div style={{ flex: '1 1 300px', width: '100%' }}>
                <div className="card mb-4" style={{ borderColor: 'rgba(217,119,87,0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 44, height: 44, background: 'rgba(217,119,87,0.15)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Sparkles size={22} color="var(--primary)" />
                    </div>
                    <div>
                      <h3 style={{ marginBottom: 2 }}>Professional Booking</h3>
                      <p className="text-sm text-muted">Free Cal.com booking page — no account needed</p>
                    </div>
                  </div>
                  <p className="text-secondary text-sm mb-4">
                    Share a professional booking link so mentors, clients, or teammates can schedule sessions with you instantly.
                    Powered by Cal.com — 100% free forever.
                  </p>

                  <div className="form-group mb-4">
                    <label className="form-label">Your Cal.com username or full booking URL</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. brojoe or https://cal.com/yourname/30min"
                      value={calLink}
                      onChange={e => setCalLink(e.target.value)}
                    />
                    <p className="text-xs text-muted" style={{ marginTop: 6 }}>
                      Create your free account at <a href="https://cal.com" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>cal.com</a> — takes 2 minutes
                    </p>
                  </div>

                  {calLink && (
                    <button
                      className="btn btn-primary w-full"
                      onClick={() => {
                        setShowBooking(true);
                        fetch('/api/user', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ calLink })
                        });
                      }}
                    >
                      <Link2 size={16} /> Save & Load Booking Page
                    </button>
                  )}
                  {!calLink && (
                    <a
                      href="https://cal.com/signup"
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary w-full"
                      style={{ justifyContent: 'center', display: 'flex' }}
                    >
                      <BookOpen size={16} /> Create Free Cal.com Account
                    </a>
                  )}
                </div>

                {/* How to share */}
                <div className="card">
                  <h3 className="mb-4">Your Everyday Booking Flow</h3>
                  {[
                    { step: '1', title: 'Morning Prep', desc: 'Open calendar, review today\'s sessions and errands. Block focus time.' },
                    { step: '2', title: 'Mentor Sessions', desc: 'Mentor books a slot via your Cal.com link — it auto-syncs to your calendar.' },
                    { step: '3', title: 'Errand Tracking', desc: 'Log market trips, deliveries, and errands as timed events with locations.' },
                    { step: '4', title: 'Client Bookings', desc: 'Future clients can book paid consultations — upgrade Cal.com when ready.' },
                    { step: '5', title: 'Weekly Review', desc: 'Every Sunday, review completed events and auto-generate your weekly report.' },
                  ].map(s => (
                    <div key={s.step} style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                      <span style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: 'var(--primary)', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700, flexShrink: 0, marginTop: 1,
                      }}>{s.step}</span>
                      <div>
                        <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2, fontSize: '0.88rem' }}>{s.title}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cal.com embed */}
              {showBooking && calLink ? (
                <div style={{ flex: '1.5 1 320px', width: '100%' }}>
                  <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <iframe
                      src={calLink.startsWith('http') ? calLink : `https://cal.com/${calLink}`}
                      className={styles.calEmbedFrame}
                      title="Cal.com Booking"
                    />
                  </div>
                </div>
              ) : (
                <div style={{ flex: '1.5 1 320px', width: '100%' }}>
                  <div className="card" style={{ textAlign: 'center', padding: 60, borderStyle: 'dashed', borderColor: 'rgba(217,119,87,0.3)' }}>
                    <Calendar size={48} style={{ margin: '0 auto 16px', color: 'var(--text-muted)' }} />
                    <h3 style={{ marginBottom: 8 }}>Booking Preview</h3>
                    <p className="text-secondary text-sm">Enter your Cal.com username above and click Load Booking Page to preview and share your professional booking page</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── Event Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3>{isReadOnly ? 'Event Details' : editEvent ? 'Edit Event' : 'New Event'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            {isReadOnly ? (
              <div className={styles.modalGrid} style={{ paddingTop: 8 }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 16 }}>{form.title}</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--text-secondary)' }}>
                  <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Calendar size={16} color="var(--primary)" /> 
                    {format(parseISO(form.date), 'EEEE, MMMM d, yyyy')}
                  </p>
                  
                  {!form.allDay ? (
                    <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Clock size={16} color="var(--primary)" />
                      {form.startTime} – {form.endTime}
                    </p>
                  ) : (
                    <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Clock size={16} color="var(--primary)" />
                      All day
                    </p>
                  )}
                  
                  {form.location && (
                    <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <MapPin size={16} color="var(--primary)" />
                      {form.location}
                    </p>
                  )}
                  
                  <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {(() => {
                      const t = typeInfo(form.type);
                      const Icon = t.icon;
                      return <><Icon size={16} color={t.color} /> {t.label}</>;
                    })()}
                  </p>
                  
                  {form.description && (
                    <div style={{ marginTop: 12, padding: 16, background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <p style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap', margin: 0 }}>{form.description}</p>
                    </div>
                  )}
                </div>

                <div className="modal-footer" style={{ marginTop: 32 }}>
                  {editEvent && (
                    <button className="btn btn-danger" onClick={() => deleteEvent(editEvent._id)} style={{ marginRight: 'auto' }}>
                      <Trash2 size={15} /> Delete
                    </button>
                  )}
                  <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                  <button className="btn btn-primary" onClick={() => setIsReadOnly(false)}>Edit Event</button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.modalGrid}>
                  {/* Title */}
                  <div className={`form-group ${styles.fullWidth}`}>
                    <label className="form-label">Event Title *</label>
                    <input className="form-control" value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Market visit, Mentor check-in..." />
                  </div>

                  {/* Type */}
                  <div className={`form-group ${styles.fullWidth}`}>
                    <label className="form-label">Event Type</label>
                    <div className={styles.typeGrid}>
                      {EVENT_TYPES.map(t => {
                        const Icon = t.icon;
                        return (
                          <button key={t.id}
                            className={`${styles.typeBtn} ${form.type === t.id ? styles.typeBtnActive : ''}`}
                            style={form.type === t.id ? { background: t.bg, borderColor: t.color, color: t.color } : {}}
                            onClick={() => setForm(f => ({ ...f, type: t.id }))}
                            type="button"
                          >
                            <Icon size={16} />
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="form-group">
                    <label className="form-label"><Calendar size={13} style={{ display: 'inline', marginRight: 4 }} />Date</label>
                    <input type="date" className="form-control" value={form.date}
                      onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                  </div>

                  {/* All day toggle */}
                  <div className="form-group" style={{ justifyContent: 'flex-end', paddingTop: 24 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      <input type="checkbox" checked={form.allDay}
                        onChange={e => setForm(f => ({ ...f, allDay: e.target.checked }))} />
                      All day event
                    </label>
                  </div>

                  {/* Times */}
                  {!form.allDay && <>
                    <div className="form-group">
                      <label className="form-label"><Clock size={13} style={{ display: 'inline', marginRight: 4 }} />Start Time</label>
                      <input type="time" className="form-control" value={form.startTime}
                        onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label"><Clock size={13} style={{ display: 'inline', marginRight: 4 }} />End Time</label>
                      <input type="time" className="form-control" value={form.endTime}
                        onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
                    </div>
                  </>}

                  {/* Location */}
                  <div className={`form-group ${styles.fullWidth}`}>
                    <label className="form-label"><MapPin size={13} style={{ display: 'inline', marginRight: 4 }} />Location (optional)</label>
                    <input className="form-control" value={form.location}
                      onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                      placeholder="e.g. Aberdeen Market, Zoom, Office" />
                  </div>

                  {/* Recurring */}
                  <div className="form-group">
                    <label className="form-label"><Repeat size={13} style={{ display: 'inline', marginRight: 4 }} />Repeat</label>
                    <select className="form-control" value={form.recurring}
                      onChange={e => setForm(f => ({ ...f, recurring: e.target.value }))}>
                      <option value="none">Does not repeat</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div className={`form-group ${styles.fullWidth}`}>
                    <label className="form-label">Notes (optional)</label>
                    <textarea className="form-control" value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Additional notes..." rows={2} />
                  </div>
                </div>

                <div className="modal-footer">
                  {editEvent && (
                    <button className="btn btn-danger" onClick={() => deleteEvent(editEvent._id)}>
                      <Trash2 size={15} /> Delete
                    </button>
                  )}
                  <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={saveEvent} disabled={saving || !form.title.trim()}>
                    {saving ? 'Saving...' : editEvent ? 'Update Event' : 'Create Event'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
