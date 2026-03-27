import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { EnhancedSource, ChartData, DemoQuestion, formatTimestamp } from '../data/demoData';
import FeedbackBar from './FeedbackBar';

// ─── Inline citation pre-processor ──────────────────────────────────────────
function addCitations(text: string): string {
  return text.replace(/\[(\d+)\]/g,
    '<sup class="inline-citation" data-ref="$1">$1</sup>');
}

function unwrapFencedTables(text: string): string {
  return text.replace(/```[^\n]*\n((?:\|[^\n]+\n)+)```/g, '$1');
}

// ─── Confidence badge ────────────────────────────────────────────────────────
function ConfidenceBadge({ level }: { level: 'high' | 'medium' | 'partial' }) {
  const cfg = {
    high:    { dot: 'bg-emerald-400', text: 'text-emerald-400', label: 'High confidence' },
    medium:  { dot: 'bg-yellow-400',  text: 'text-yellow-400',  label: 'Moderate confidence' },
    partial: { dot: 'bg-orange-400',  text: 'text-orange-400',  label: 'Partial match' },
  }[level];
  return (
    <span className={`flex items-center gap-1.5 text-xs ${cfg.text} font-medium`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Mode badge ──────────────────────────────────────────────────────────────
function ModeBadge({ mode }: { mode: 'quick' | 'deeper' }) {
  return mode === 'quick'
    ? <span className="text-xs text-k-cyan font-medium">⚡ Quick</span>
    : <span className="text-xs text-purple-400 font-medium">🔍 Think Deeper</span>;
}

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 bg-k-text text-k-bg text-sm font-medium rounded-full shadow-xl transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
      {message}
    </div>
  );
}

// ─── Video source card ────────────────────────────────────────────────────────
const THUMB_COLORS = ['#1a2a3a', '#1a2a2a', '#2a1a3a', '#2a2a1a'];

function VideoSourceCard({ src, idx }: { src: EnhancedSource; idx: number }) {
  const ts = src.timestamp ?? 0;
  const duration = src.videoDuration ?? 3600;
  const progress = (ts / duration) * 100;
  const thumbColor = THUMB_COLORS[idx % THUMB_COLORS.length];

  return (
    <div className="rounded-xl border border-k-border bg-k-bg overflow-hidden">
      {/* Thumbnail */}
      <div className="relative h-24 flex items-center justify-center" style={{ background: thumbColor }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white ml-0.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div className="h-full bg-k-cyan" style={{ width: `${progress}%` }} />
        </div>
        {/* Timestamp pill */}
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
          {formatTimestamp(ts)} / {formatTimestamp(duration)}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium text-k-text truncate">{src.title}</p>
            <p className="text-[10px] text-k-muted mt-0.5">{src.agency} · {src.freshness}</p>
            <p className="text-[10px] text-k-muted mt-0.5 italic">Used for: {src.contribution}</p>
          </div>
          {src.url && (
            <a
              href={`${src.url}#t=${ts}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 flex items-center gap-1 text-[11px] text-k-cyan hover:text-cyan-300 font-medium whitespace-nowrap transition-colors border border-k-cyan/30 rounded-full px-2 py-1 hover:border-k-cyan/60"
            >
              Jump to {formatTimestamp(ts)} →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Image source card ────────────────────────────────────────────────────────
function ImageSourceCard({ src }: { src: EnhancedSource }) {
  const region = src.region ?? { x: 30, y: 30, w: 40, h: 40 };

  return (
    <div className="rounded-xl border border-k-border bg-k-bg overflow-hidden">
      <div className="relative h-32 overflow-hidden bg-k-card">
        {src.imageUrl ? (
          <img src={src.imageUrl} alt={src.title} className="w-full h-full object-contain opacity-60" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-k-border to-k-card" />
        )}
        {/* Region highlight */}
        <div
          className="absolute border-2 border-k-cyan rounded animate-pulse"
          style={{
            left: `${region.x}%`,
            top: `${region.y}%`,
            width: `${region.w}%`,
            height: `${region.h}%`,
            background: 'rgba(0, 212, 255, 0.12)',
          }}
        />
        <div
          className="absolute -top-1 -right-1 bg-k-cyan text-k-bg text-[9px] font-bold px-1 rounded"
          style={{ left: `${region.x + region.w}%`, top: `${region.y}%` }}
        >
          ↑ region
        </div>
      </div>
      <div className="p-3">
        <p className="text-xs font-medium text-k-text">{src.title}</p>
        <p className="text-[10px] text-k-muted mt-0.5">{src.agency} · {src.freshness}</p>
        <p className="text-[10px] text-k-muted mt-0.5 italic">Used for: {src.contribution}</p>
      </div>
    </div>
  );
}

// ─── Document / structured source row ────────────────────────────────────────
function DocSourceRow({ src, index }: { src: EnhancedSource; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const icon = src.type === 'structured' ? '⛁' : '📄';

  return (
    <li className="flex items-start gap-3 py-2.5 border-b border-k-border/40 last:border-b-0">
      <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {src.url ? (
              <a href={src.url} target="_blank" rel="noopener noreferrer"
                className="text-sm text-k-cyan hover:text-cyan-300 underline underline-offset-2 transition-colors font-medium truncate block">
                {src.title}
              </a>
            ) : (
              <span className="text-sm text-k-text font-medium">{src.title}</span>
            )}
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[10px] text-k-muted">{src.agency}</span>
              <span className="text-[10px] text-k-cyan/70 bg-k-cyan/10 border border-k-cyan/20 px-1.5 py-0.5 rounded-full">
                {src.freshness}
              </span>
            </div>
            <p className="text-[11px] text-k-muted/80 mt-1 italic">Used for: {src.contribution}</p>
          </div>
          <span className="text-xs text-k-muted flex-shrink-0 mt-0.5">#{index + 1}</span>
        </div>
        {src.excerpt && (
          <>
            <button
              onClick={() => setExpanded(v => !v)}
              className="text-[10px] text-k-muted hover:text-k-text mt-1 transition-colors"
            >
              {expanded ? '▾ hide excerpt' : '▸ show excerpt'}
            </button>
            {expanded && (
              <p className="text-[11px] text-k-muted mt-1.5 leading-relaxed border-l-2 border-k-border pl-2">
                {src.excerpt}
              </p>
            )}
          </>
        )}
      </div>
    </li>
  );
}

// ─── Inline chart (recharts) ─────────────────────────────────────────────────
function InlineChart({ data }: { data: ChartData }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 400); return () => clearTimeout(t); }, []);

  const color = data.color ?? '#00D4FF';

  return (
    <div className="mt-5 mb-2 border border-k-border rounded-xl bg-k-bg p-4 animate-fade-in">
      <p className="text-xs text-k-muted uppercase tracking-wider font-medium mb-4">{data.title}</p>
      {mounted && (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data.data} margin={{ top: 0, right: 8, left: 0, bottom: 0 }} barSize={32}>
            <XAxis dataKey="label" tick={{ fill: '#A0A0A0', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#A0A0A0', fontSize: 10 }} axisLine={false} tickLine={false} width={50}
              tickFormatter={v => `${data.prefix ?? ''}${(v / 1000).toFixed(1)}B`} />
            <Tooltip
              contentStyle={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#FFFFFF', fontWeight: 600 }}
              formatter={(v) => [`${data.prefix ?? ''}${Number(v).toLocaleString()} ${data.unit}`, '']}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.data.map((_, i) => (
                <Cell key={i} fill={i === data.data.length - 1 ? color : `${color}80`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
      <p className="text-[10px] text-k-muted mt-1 text-right">{data.unit}</p>
    </div>
  );
}

// ─── Cross-silo signal ────────────────────────────────────────────────────────
function CrossSiloSignal({ agencies }: { agencies: string[] }) {
  if (agencies.length < 2) return null;
  return (
    <div className="flex items-center gap-2 py-3 border-b border-k-border">
      <span className="text-emerald-400 text-sm flex-shrink-0">✓</span>
      <span className="text-xs text-k-muted">
        Kurious connected <strong className="text-k-text">{agencies.length} agencies</strong>
        {' — '}
        {agencies.map((a, i) => (
          <span key={a}>
            <span className="text-k-cyan">{a}</span>
            {i < agencies.length - 1 && <span className="text-k-muted"> · </span>}
          </span>
        ))}
      </span>
    </div>
  );
}

// ─── Related questions ────────────────────────────────────────────────────────
function RelatedQuestions({ questions, onSelect }: { questions: string[]; onSelect: (q: string) => void }) {
  if (!questions.length) return null;
  return (
    <div className="mt-5 pt-4 border-t border-k-border">
      <p className="text-xs text-k-muted uppercase tracking-wider font-medium mb-3">You might also ask:</p>
      <div className="space-y-2">
        {questions.slice(0, 3).map((q, i) => (
          <button
            key={i}
            onClick={() => onSelect(q)}
            className="w-full text-left text-xs text-k-muted hover:text-k-text border border-k-border hover:border-k-cyan rounded-xl px-4 py-2.5 transition-all duration-200 bg-k-card hover:bg-k-card/60 flex items-center gap-2 group"
          >
            <span className="text-k-cyan group-hover:translate-x-0.5 transition-transform flex-shrink-0">→</span>
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Action button ────────────────────────────────────────────────────────────
function ActionBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-all duration-200 ${
        active
          ? 'border-k-cyan text-k-cyan bg-k-cyan/10'
          : 'border-k-border text-k-muted hover:text-k-text hover:border-k-border/80 hover:bg-k-border/20'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface EnhancedAnswerBlockProps {
  demoQ: DemoQuestion;
  onRelatedQuestion: (q: string) => void;
  bookmarked?: boolean;
  onBookmark?: () => void;
}

export default function EnhancedAnswerBlock({
  demoQ,
  onRelatedQuestion,
  bookmarked = false,
  onBookmark,
}: EnhancedAnswerBlockProps) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<number | null>(null);
  const [citedSource, setCitedSource] = useState<number | null>(null);

  // Group sources
  const primarySources = demoQ.sources.filter(s => s.category === 'primary');
  const supportingSources = demoQ.sources.filter(s => s.category === 'supporting');
  const additionalSources = demoQ.sources.filter(s => s.category === 'additional');

  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    setToastVisible(true);
    toastTimer.current = window.setTimeout(() => setToastVisible(false), 2500);
  };

  const handleCopy = () => {
    const plain = demoQ.answer.replace(/\[(\d+)\]/g, '').replace(/\*\*/g, '').trim();
    navigator.clipboard.writeText(plain).catch(() => {});
    showToast('Answer copied to clipboard');
  };

  const handleShare = () => {
    const url = `${window.location.origin}/chat?q=${encodeURIComponent(demoQ.query)}`;
    navigator.clipboard.writeText(url).catch(() => {});
    showToast('Share link copied!');
  };

  const handleDownload = () => {
    const lines = [
      `# ${demoQ.query}`,
      '',
      demoQ.answer.replace(/\[(\d+)\]/g, '').trim(),
      '',
      '## Sources',
      '',
      ...demoQ.sources.map((s, i) => `${i + 1}. **${s.title}** (${s.agency}) — ${s.freshness}`),
      '',
      `---`,
      `*Retrieved in ${(demoQ.elapsedMs / 1000).toFixed(2)}s across 57M documents. Powered by AIntropy Kurious.*`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `kurious-${demoQ.id}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Downloaded as Markdown');
  };

  // Handle citation click — scroll to / highlight source
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (el.classList.contains('inline-citation')) {
        const ref = parseInt(el.getAttribute('data-ref') ?? '0');
        setCitedSource(ref);
        setSourcesOpen(true);
        setTimeout(() => setCitedSource(null), 2000);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const processedAnswer = addCitations(unwrapFencedTables(demoQ.answer));
  const elapsedSec = (demoQ.elapsedMs / 1000).toFixed(2);

  return (
    <>
      <Toast message={toast} visible={toastVisible} />

      <div className="border border-k-border rounded-2xl bg-k-card overflow-hidden animate-fade-in">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-k-border/60">
          <div className="flex items-center gap-3">
            <ModeBadge mode={demoQ.mode} />
            <ConfidenceBadge level={demoQ.confidence} />
            <span className="text-xs text-k-muted hidden sm:inline">
              Retrieved in <strong className="text-k-text">{elapsedSec}s</strong> · 57M docs
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <ActionBtn
              label="Copy"
              active={false}
              onClick={handleCopy}
              icon={
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"/>
                  <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/>
                </svg>
              }
            />
            <ActionBtn
              label={bookmarked ? 'Saved' : 'Save'}
              active={bookmarked}
              onClick={() => onBookmark?.()}
              icon={
                <svg viewBox="0 0 16 16" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                  <path d="M3.75 2h8.5c.966 0 1.75.784 1.75 1.75v10.5a.75.75 0 0 1-1.218.586L8 11.564l-4.782 3.272A.75.75 0 0 1 2 14.25V3.75C2 2.784 2.784 2 3.75 2Z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
            />
            <ActionBtn
              label="Share"
              active={false}
              onClick={handleShare}
              icon={
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M7.22 1.22a.75.75 0 0 1 1.06 0L11.53 4.47a.75.75 0 0 1-1.06 1.06l-2-2V10a.75.75 0 0 1-1.5 0V3.53l-2 2a.75.75 0 0 1-1.06-1.06L7.22 1.22Z"/>
                  <path d="M2.5 9.75C2.5 8.784 3.284 8 4.25 8h1a.75.75 0 0 1 0 1.5h-1a.25.25 0 0 0-.25.25v4.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-4.5a.25.25 0 0 0-.25-.25h-1a.75.75 0 0 1 0-1.5h1c.966 0 1.75.784 1.75 1.75v4.5A1.75 1.75 0 0 1 11.75 16h-7.5A1.75 1.75 0 0 1 2.5 14.25v-4.5Z"/>
                </svg>
              }
            />
            <ActionBtn
              label="Download"
              active={false}
              onClick={handleDownload}
              icon={
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M8.75 1.75a.75.75 0 0 0-1.5 0V8.44L5.03 6.22a.75.75 0 0 0-1.06 1.06l3.5 3.5a.75.75 0 0 0 1.06 0l3.5-3.5a.75.75 0 0 0-1.06-1.06L8.75 8.44V1.75Z"/>
                  <path d="M1.5 12.75a.75.75 0 0 1 1.5 0v1.5h11v-1.5a.75.75 0 0 1 1.5 0V15a.75.75 0 0 1-.75.75H2.25A.75.75 0 0 1 1.5 15v-2.25Z"/>
                </svg>
              }
            />
          </div>
        </div>

        {/* Answer body */}
        <div className="px-6 pt-5 pb-2">
          {/* Inline citation style */}
          <style>{`
            .inline-citation {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 16px;
              height: 16px;
              background: rgba(0, 212, 255, 0.15);
              border: 1px solid rgba(0, 212, 255, 0.4);
              color: #00D4FF;
              border-radius: 4px;
              font-size: 9px;
              font-weight: 700;
              cursor: pointer;
              vertical-align: super;
              line-height: 1;
              margin: 0 1px;
              transition: background 0.15s;
              user-select: none;
            }
            .inline-citation:hover {
              background: rgba(0, 212, 255, 0.3);
            }
          `}</style>
          <div className="prose prose-sm prose-invert max-w-none
            prose-p:text-k-text prose-p:leading-relaxed
            prose-headings:text-k-text prose-headings:font-semibold
            prose-strong:text-k-text
            prose-a:text-k-cyan hover:prose-a:text-cyan-300
            prose-code:text-k-cyan prose-code:bg-k-bg prose-code:px-1 prose-code:rounded
            prose-pre:bg-k-bg
            prose-li:text-k-text prose-ol:text-k-text prose-ul:text-k-text
            prose-blockquote:border-l-k-border prose-blockquote:text-k-muted
            prose-table:text-sm prose-th:text-k-muted prose-td:text-k-text">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {processedAnswer}
            </ReactMarkdown>
          </div>

          {/* Chart */}
          {demoQ.chartData && <InlineChart data={demoQ.chartData} />}
        </div>

        {/* Cross-silo signal */}
        {demoQ.crossSiloAgencies.length >= 2 && (
          <div className="px-6">
            <CrossSiloSignal agencies={demoQ.crossSiloAgencies} />
          </div>
        )}

        {/* Sources section */}
        {demoQ.sources.length > 0 && (
          <div className="px-6 py-3">
            <button
              onClick={() => setSourcesOpen(v => !v)}
              className="flex items-center gap-1.5 text-xs text-k-muted hover:text-k-text transition-colors group"
            >
              <span className={`transition-transform duration-200 inline-block ${sourcesOpen ? 'rotate-90' : ''}`}>▶</span>
              <span className="group-hover:underline">
                {sourcesOpen ? 'Hide' : 'View'} {demoQ.sources.length} sources
              </span>
              {/* Source type icons */}
              <span className="ml-2 flex items-center gap-1 text-k-muted/60">
                {demoQ.sources.some(s => s.type === 'video') && <span title="Video">🎥</span>}
                {demoQ.sources.some(s => s.type === 'image') && <span title="Image">🖼️</span>}
                {demoQ.sources.some(s => s.type === 'structured') && <span title="Data">⛁</span>}
                {demoQ.sources.some(s => s.type === 'document') && <span title="Document">📄</span>}
              </span>
            </button>

            <div className={`sources-panel overflow-hidden`}
              style={{ maxHeight: sourcesOpen ? '64rem' : '0', opacity: sourcesOpen ? 1 : 0 }}>
              <div className="mt-4 space-y-6">
                {/* Video sources (always shown as cards) */}
                {demoQ.sources.filter(s => s.type === 'video').length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-k-muted font-semibold mb-2">Video</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {demoQ.sources.filter(s => s.type === 'video').map((src, i) => (
                        <VideoSourceCard key={i} src={src} idx={i} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Image sources */}
                {demoQ.sources.filter(s => s.type === 'image').length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-k-muted font-semibold mb-2">Image / Map</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {demoQ.sources.filter(s => s.type === 'image').map((src, i) => (
                        <ImageSourceCard key={i} src={src} />
                      ))}
                    </div>
                  </div>
                )}

                {/* PRIMARY documents/structured */}
                {primarySources.filter(s => s.type !== 'video' && s.type !== 'image').length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-k-muted font-semibold mb-2">Primary Sources</p>
                    <ul className="divide-y divide-k-border/30">
                      {primarySources.filter(s => s.type !== 'video' && s.type !== 'image').map((src, i) => {
                        const globalIdx = demoQ.sources.indexOf(src);
                        return (
                          <div key={i}
                            className={`transition-colors rounded-lg ${citedSource === globalIdx + 1 ? 'bg-k-cyan/5 border border-k-cyan/20' : ''}`}>
                            <DocSourceRow src={src} index={globalIdx} />
                          </div>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* SUPPORTING */}
                {supportingSources.filter(s => s.type !== 'video' && s.type !== 'image').length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-k-muted font-semibold mb-2">Supporting Sources</p>
                    <ul className="divide-y divide-k-border/30">
                      {supportingSources.filter(s => s.type !== 'video' && s.type !== 'image').map((src, i) => {
                        const globalIdx = demoQ.sources.indexOf(src);
                        return (
                          <div key={i}
                            className={`transition-colors rounded-lg ${citedSource === globalIdx + 1 ? 'bg-k-cyan/5 border border-k-cyan/20' : ''}`}>
                            <DocSourceRow src={src} index={globalIdx} />
                          </div>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* ADDITIONAL */}
                {additionalSources.filter(s => s.type !== 'video' && s.type !== 'image').length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-k-muted font-semibold mb-2">Additional</p>
                    <ul className="divide-y divide-k-border/30">
                      {additionalSources.filter(s => s.type !== 'video' && s.type !== 'image').map((src, i) => {
                        const globalIdx = demoQ.sources.indexOf(src);
                        return <DocSourceRow key={i} src={src} index={globalIdx} />;
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Related questions */}
        <div className="px-6 pb-4">
          <RelatedQuestions questions={demoQ.relatedQuestions} onSelect={onRelatedQuestion} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-k-border">
          <span className="text-xs text-k-muted sm:hidden">{elapsedSec}s · 57M docs</span>
          <FeedbackBar />
        </div>
      </div>
    </>
  );
}
