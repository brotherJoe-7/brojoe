'use client';
// src/app/reports/page.tsx
import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import {
  Sparkles, Send, FileText, Download, Share2, MessageSquare,
  Loader, Copy, Check, ExternalLink, RefreshCw, Image as ImageIcon
} from 'lucide-react';
import { format } from 'date-fns';
import styles from './reports.module.css';

interface Message { role: 'user' | 'assistant'; content: string; time: string; }
interface Report { _id: string; title: string; type: string; summary: string; createdAt: string; shareToken: string; }

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm BroJoe AI 🤖 I can help you organize your expenses, review your tasks, detect missing records, and generate shareable reports. What would you like to know?", time: format(new Date(), 'HH:mm') },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [customDays, setCustomDays] = useState<number>(3);
  const [includeReceipts, setIncludeReceipts] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (status === 'unauthenticated') router.push('/login'); }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') fetchReports();
  }, [status]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fetchReports = async () => {
    const res = await fetch('/api/reports');
    const data = await res.json();
    setReports(data || []);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input, time: format(new Date(), 'HH:mm') };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat', userMessage: input }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response, time: format(new Date(), 'HH:mm') }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please check your OpenAI API key in .env.local.', time: format(new Date(), 'HH:mm') }]);
    }
    setLoading(false);
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      const payloadDateRange = reportType === 'custom' ? { type: 'custom', days: customDays } : { type: reportType };
      const res = await fetch('/api/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'report', dateRange: payloadDateRange }),
      });
      const data = await res.json();
      const reportText = data.response;

      const titleDays = reportType === 'custom' ? `${customDays}-Day` : (reportType.charAt(0).toUpperCase() + reportType.slice(1));
      const daysSubtract = reportType === 'weekly' ? 7 : (reportType === 'custom' ? customDays : 1);

      // Save report
      const saveRes = await fetch('/api/reports', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${titleDays} Report — ${format(new Date(), 'MMM d, yyyy')}`,
          type: reportType,
          dateRange: { start: new Date(Date.now() - daysSubtract * 86400000), end: new Date() },
          summary: reportText,
          aiInsights: reportText,
        }),
      });
      await saveRes.json();
      await fetchReports();
      setMessages(prev => [...prev, { role: 'assistant', content: `📊 **${reportType.toUpperCase()} REPORT GENERATED**nn${reportText}`, time: format(new Date(), 'HH:mm') }]);
    } catch { }
    setGenerating(false);
  };

  const exportToPDF = async (report: Report) => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(report.title, 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${format(new Date(report.createdAt), 'MMM d, yyyy HH:mm')}`, 14, 30);
    doc.setFontSize(11);
    doc.setTextColor(0);
    const lines = doc.splitTextToSize(report.summary || report.title, 180);
    doc.text(lines, 14, 45);

    if (includeReceipts) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Attached Receipts', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text('* Included with user GDPR consent for data sharing.', 14, 26);
      doc.setTextColor(0);

      try {
        const res = await fetch('/api/expenses?limit=100');
        const data = await res.json();
        const expenses = data.expenses || [];
        const withReceipts = expenses.filter((e: any) => e.receiptUrl);

        let yOffset = 35;
        withReceipts.slice(0, 6).forEach((e: any) => { // limit for demo to avoid massive pdfs
          if (yOffset > 220) {
            doc.addPage();
            yOffset = 20;
          }
          doc.text(`${e.description} - Le ${e.amount}`, 14, yOffset);
          if (e.receiptUrl.startsWith('data:image')) {
            const formatMatch = e.receiptUrl.match(/data:image\/([a-zA-Z]*);base64,/);
            const format = formatMatch ? formatMatch[1].toUpperCase() : 'JPEG';
            // standard sizing logic
            doc.addImage(e.receiptUrl, format === 'JPG' ? 'JPEG' : format, 14, yOffset + 5, 80, 80);
          }
          yOffset += 95;
        });
      } catch (err) {
        console.error('Failed to load receipts', err);
      }
    }

    doc.save(`${report.title.replace(/s+/g, '_')}.pdf`);
  };

  const shareWhatsApp = (report: Report) => {
    let textStr = `📊 *${report.title}*nn${(report.summary || '').slice(0, 500)}...nn_Generated by BroJoe Platform_`;
    if (includeReceipts) {
      textStr += `nn*(Receipt attachments are included in the PDF export version per GDPR consent)*`;
    }
    const text = encodeURIComponent(textStr);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const copyText = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-content animate-fadeIn">
          <div className="page-header">
            <h1>AI Reports & Assistant</h1>
            <p className="text-secondary">Chat with BroJoe AI, generate reports, and share with your mentor</p>
          </div>

          <div className={styles.reportsLayout}>
            {/* Left: Chat */}
            <div className={styles.chatSection}>
              <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '600px' }}>
                {/* Chat Header */}
                <div className={styles.chatHeader}>
                  <div className={styles.aiAvatar}>
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <span className={styles.aiName}>BroJoe AI</span>
                    <span className={styles.aiStatus}>● Online</span>
                  </div>
                </div>

                {/* Messages */}
                <div className={styles.chatMessages}>
                  {messages.map((msg, i) => (
                    <div key={i} className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.aiMessage}`}>
                      {msg.role === 'assistant' && (
                        <div className={styles.msgAvatar}><Sparkles size={12} /></div>
                      )}
                      <div className={styles.msgBubble}>
                        <div className={styles.msgContent}>
                          {msg.content.split('n').map((line, j) => (
                            <span key={j}>{line}{j < msg.content.split('n').length - 1 && <br />}</span>
                          ))}
                        </div>
                        <div className={styles.msgMeta}>
                          <span>{msg.time}</span>
                          {msg.role === 'assistant' && (
                            <button className={styles.copyBtn} onClick={() => copyText(msg.content, `msg-${i}`)}>
                              {copied === `msg-${i}` ? <Check size={10} /> : <Copy size={10} />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className={`${styles.message} ${styles.aiMessage}`}>
                      <div className={styles.msgAvatar}><Sparkles size={12} /></div>
                      <div className={`${styles.msgBubble} ${styles.typing}`}>
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className={styles.chatInput}>
                  <div className={styles.suggestRow}>
                    {['Summarize my week', 'Find missing expenses', 'What are my urgent tasks?'].map(s => (
                      <button key={s} className={styles.suggest} onClick={() => setInput(s)}>{s}</button>
                    ))}
                  </div>
                  <div className={styles.inputRow}>
                    <input
                      id="ai-chat-input"
                      className="form-control"
                      placeholder="Ask BroJoe AI anything..."
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    />
                    <button id="send-ai-btn" onClick={sendMessage} disabled={loading || !input.trim()} className="btn btn-primary">
                      {loading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Reports */}
            <div className={styles.reportsSection}>
              {/* Generate */}
              <div className="card mb-4">
                <h3 className="mb-4">Generate Report</h3>
                <div className={styles.reportTypeToggle}>
                  <button id="daily-report-btn" className={`btn ${reportType === 'daily' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setReportType('daily')}>Daily</button>
                  <button id="weekly-report-btn" className={`btn ${reportType === 'weekly' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setReportType('weekly')}>Weekly</button>
                  <button id="custom-report-btn" className={`btn ${reportType === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setReportType('custom')}>Custom</button>
                </div>

                {reportType === 'custom' && (
                  <div style={{ marginTop: 12, marginBottom: 12 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>How many days to combine?</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <input 
                        type="range" 
                        min="2" max="31" 
                        value={customDays} 
                        onChange={(e) => setCustomDays(parseInt(e.target.value))}
                        style={{ flex: 1 }}
                      />
                      <span style={{ fontWeight: 'bold', width: '60px', textAlign: 'right' }}>{customDays} Days</span>
                    </div>
                  </div>
                )}

                <p className="text-secondary text-sm mb-4">
                  AI will analyze your expenses and tasks for the selected period, then generate a highly formatted professional report.
                </p>
                <button id="generate-report-btn" onClick={generateReport} disabled={generating} className="btn btn-primary w-full">
                  {generating ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={16} />}
                  {generating ? 'Generating...' : `Generate ${reportType === 'custom' ? `${customDays}-Day` : reportType} Report`}
                </button>
              </div>

              {/* Reports List */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <h3>Saved Reports</h3>
                  <button onClick={fetchReports} className="btn btn-ghost btn-icon btn-sm"><RefreshCw size={14} /></button>
                </div>

                <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input type="checkbox" checked={includeReceipts} onChange={e => setIncludeReceipts(e.target.checked)} />
                    <ImageIcon size={14} /> Include receipt images in exports (GDPR Consent required)
                  </label>
                </div>

                <div className={styles.reportList}>
                  {reports.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                      <FileText size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                      <p className="text-sm">No reports generated yet</p>
                    </div>
                  ) : (
                    reports.map(r => (
                      <div key={r._id} className={styles.reportItem}>
                        <div className={styles.reportIcon}>
                          <FileText size={16} color={r.type === 'weekly' ? 'var(--secondary)' : 'var(--primary-light)'} />
                        </div>
                        <div className={styles.reportInfo}>
                          <span className={styles.reportTitle}>{r.title}</span>
                          <span className="text-xs text-muted">{format(new Date(r.createdAt), 'MMM d, yyyy HH:mm')}</span>
                        </div>
                        <div className="flex gap-1">
                          <button className="btn btn-ghost btn-icon btn-sm" title="Export PDF" onClick={() => exportToPDF(r)}>
                            <Download size={13} />
                          </button>
                          <button className="btn btn-success btn-icon btn-sm" title="Share to WhatsApp" onClick={() => shareWhatsApp(r)}>
                            <Share2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
