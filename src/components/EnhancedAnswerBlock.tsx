import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { EnhancedSource, ChartData, DemoQuestion } from '../data/demoData';
import FeedbackBar from './FeedbackBar';

// ─── Inline citation pre-processor ──────────────────────────────────────────
function addCitations(text: string, sources?: EnhancedSource[]): string {
  // Collapse consecutive citations [1][2][3] → single badge showing "1.."
  return text.replace(/(\[\d+\])+/g, (match) => {
    const nums = [...match.matchAll(/\[(\d+)\]/g)].map(m => m[1]);
    // Check if any referenced source is a video clip
    const hasVideoRef = sources ? nums.some(n => {
      const idx = parseInt(n) - 1;
      return idx >= 0 && idx < sources.length && sources[idx].type === 'video';
    }) : false;
    const prefix = hasVideoRef ? '\uD83C\uDFAC' : '';
    if (nums.length === 1) {
      return `${prefix}<sup class="inline-citation" data-refs="${nums[0]}">${nums[0]}</sup>`;
    }
    return `${prefix}<sup class="inline-citation inline-citation-group" data-refs="${nums.join(',')}">${nums[0]}..</sup>`;
  });
}

function unwrapFencedTables(text: string): string {
  return text.replace(/```[^\n]*\n((?:\|[^\n]+\n)+)```/g, '$1');
}

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 bg-k-text text-k-bg text-sm font-medium rounded-full shadow-xl transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
      {message}
    </div>
  );
}

// ─── Video clip card ─────────────────────────────────────────────────────────
const THUMB_COLORS = ['#1a2a3a', '#1a2a2a', '#2a1a3a', '#2a2a1a'];

function formatClipDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatClipSec(seconds: number): string {
  return `${seconds} sec`;
}

function VideoClipCard({ src, idx, compact }: { src: EnhancedSource; idx: number; compact?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const clipLen = src.clipDuration ?? 15;
  const thumbColor = THUMB_COLORS[idx % THUMB_COLORS.length];

  if (compact) {
    return (
      <div
        onClick={() => setExpanded(v => !v)}
        className="rounded-lg border border-k-border bg-k-bg overflow-hidden cursor-pointer hover:border-k-border/80 transition-colors group/clip"
      >
        <div className="flex items-center gap-2.5 p-2">
          {/* Compact thumbnail */}
          <div className="relative flex-shrink-0 w-20 h-12 rounded overflow-hidden flex items-center justify-center" style={{ background: thumbColor }}>
            <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center group-hover/clip:bg-white/20 transition-colors">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 text-white ml-0.5">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
              {formatClipSec(clipLen)}
            </div>
          </div>
          {/* Compact meta */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-k-text truncate">
              {src.speaker?.name ?? 'Speaker'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-k-muted truncate">{src.title}</span>
              <span className="text-xs text-k-cyan font-medium flex-shrink-0">{formatClipSec(clipLen)}</span>
            </div>
            {src.excerpt && (
              <p className="text-xs text-k-muted/80 italic mt-1 line-clamp-1">"{src.excerpt}"</p>
            )}
          </div>
        </div>
        {/* Expanded: full transcript */}
        {expanded && src.excerpt && (
          <div className="border-t border-k-border/40 p-2.5 animate-fade-in">
            <p className="text-[10px] text-k-muted/60 font-semibold uppercase tracking-wider mb-1">{src.speaker?.role}</p>
            <p className="text-xs text-k-muted/80 italic">"{src.excerpt}"</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-k-border bg-k-bg overflow-hidden">
      {/* Main row: thumbnail + metadata */}
      <div
        onClick={() => setExpanded(v => !v)}
        className="flex items-start gap-3 p-3 cursor-pointer hover:bg-k-border/10 transition-colors group/clip"
      >
        {/* Thumbnail — 160x90 dark bg, centered play, duration badge bottom-right */}
        <div className="relative flex-shrink-0 w-[160px] h-[90px] rounded-lg overflow-hidden flex items-center justify-center" style={{ background: thumbColor }}>
          <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center group-hover/clip:bg-white/20 transition-colors duration-150">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white ml-0.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <div className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
            {formatClipSec(clipLen)}
          </div>
        </div>
        {/* Metadata */}
        <div className="min-w-0 flex-1 py-0.5">
          {/* Line 1: Speaker name + role */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold text-k-text">{src.speaker?.name ?? 'Speaker'}</span>
            <span className="text-xs text-k-muted">{src.speaker?.role ?? ''}</span>
          </div>
          {/* Line 2: Source title + clip duration */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-k-muted truncate">{src.title}</span>
            <span className="text-xs text-k-cyan font-medium flex-shrink-0">{formatClipSec(clipLen)}</span>
          </div>
          {/* Line 3-4: Transcript excerpt */}
          {src.excerpt && (
            <p className="text-xs text-k-muted/80 italic mt-1.5 line-clamp-2">"{src.excerpt}"</p>
          )}
        </div>
      </div>

      {/* Expanded inline clip player */}
      {expanded && (
        <div className="border-t border-k-border/40 animate-fade-in">
          {/* 16:9 dark area with large play button */}
          <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
                <div className="w-0 h-0 border-l-[20px] border-l-white border-y-[12px] border-y-transparent ml-1" />
              </div>
            </div>
            {/* Title bar */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-3">
              <span className="text-white text-xs font-medium">{src.speaker?.name} — {src.speaker?.role}</span>
            </div>
            {/* Simple clip progress bar: 0:00 to clipDuration */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white text-[10px] font-mono">0:00</span>
                <div className="flex-1 h-1 bg-white/20 rounded-full">
                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: '0%' }} />
                </div>
                <span className="text-white/60 text-[10px] font-mono">{formatClipDuration(clipLen)}</span>
              </div>
            </div>
          </div>
          {/* Transcript below player */}
          {src.excerpt && (
            <div className="bg-[#111] p-3 border-t border-k-border">
              <p className="text-[10px] text-k-muted/60 font-semibold uppercase tracking-wider mb-1">Transcript</p>
              <p className="text-xs text-k-body leading-relaxed italic">"{src.excerpt}"</p>
            </div>
          )}
          {/* Full video link — subtle, for context if needed */}
          {src.url && (
            <div className="px-3 py-2 border-t border-k-border/30">
              <a
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-k-muted/50 hover:text-k-muted/80 transition-colors"
              >
                Watch full video: {src.title}{src.videoDuration ? ` (${Math.floor(src.videoDuration / 60)} min)` : ''} →
              </a>
            </div>
          )}
        </div>
      )}
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
        <div
          className="absolute border-2 border-k-cyan rounded animate-pulse"
          style={{ left: `${region.x}%`, top: `${region.y}%`, width: `${region.w}%`, height: `${region.h}%`, background: 'rgba(0, 212, 255, 0.12)' }}
        />
      </div>
      <div className="p-3">
        <p className="text-xs font-medium text-k-text">{src.title}</p>
        <p className="text-[10px] text-k-muted mt-0.5">{src.agency} · {src.freshness}</p>
        <p className="text-[10px] text-k-muted/70 mt-0.5 italic">Used for: {src.contribution}</p>
      </div>
    </div>
  );
}

// ─── Build the deep-link URL for a source ────────────────────────────────────
function buildSourceUrl(src: EnhancedSource): string | null {
  if (!src.url) return null;
  // Video sources are now displayed as self-contained clips, no deep linking
  return src.url;
}

// ─── Document / structured source row ────────────────────────────────────────
function DocSourceRow({ src, index, highlighted, rowRef }: { src: EnhancedSource; index: number; highlighted?: boolean; rowRef?: (el: HTMLLIElement | null) => void }) {
  const [expanded, setExpanded] = useState(false);
  const icon = src.type === 'structured' ? '⛁' : '📄';
  const href = buildSourceUrl(src);

  return (
    <li ref={rowRef} className={`flex items-start gap-3 py-2.5 border-b border-k-border/30 last:border-b-0 rounded-lg px-2 transition-all duration-300 ${highlighted ? 'bg-k-cyan/10 border-l-2 border-l-k-cyan pl-3' : ''}`}>
      <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {href ? (
              <a href={href} target="_blank" rel="noopener noreferrer"
                className="text-sm text-k-cyan hover:text-cyan-300 underline-offset-2 transition-colors duration-150 font-medium truncate block group/link">
                {src.title}
                <span className="ml-1 opacity-0 group-hover/link:opacity-100 transition-opacity duration-150 text-[10px]">↗</span>
              </a>
            ) : (
              <span className="text-sm text-k-text font-medium">{src.title}</span>
            )}
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[10px] text-k-muted">{src.agency}</span>
              <span className="text-[10px] text-k-cyan/70">{src.freshness}</span>
              {src.type === 'structured' && (
                <span className="text-[10px] text-purple-400/80 font-medium">⛁ Opens to highlighted row</span>
              )}
            </div>
            <p className="text-[10px] text-k-muted/70 mt-0.5 italic">Used for: {src.contribution}</p>
          </div>
          <span className="text-[10px] text-k-muted/50 flex-shrink-0 mt-0.5">#{index + 1}</span>
        </div>
        {src.excerpt && (
          <>
            <button onClick={() => setExpanded(v => !v)} className="text-[10px] text-k-muted hover:text-k-cyan mt-1 transition-colors duration-150 flex items-center gap-1">
              <span className={`transition-transform duration-150 inline-block ${expanded ? 'rotate-90' : ''}`}>▶</span>
              {expanded ? 'Hide passage' : 'View passage'}
            </button>
            {expanded && (
              <p className="text-[11px] text-k-muted mt-1.5 leading-relaxed border-l-2 border-k-cyan/30 pl-2">
                {src.excerpt}
              </p>
            )}
          </>
        )}
      </div>
    </li>
  );
}

// ─── Inline chart ─────────────────────────────────────────────────────────────
function InlineChart({ data }: { data: ChartData }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 400); return () => clearTimeout(t); }, []);
  const color = data.color ?? '#00D4FF';
  return (
    <div className="mt-5 mb-2 border border-k-border/60 rounded-xl bg-k-bg/50 p-4 animate-fade-in">
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
    </div>
  );
}

// ─── Related questions ────────────────────────────────────────────────────────
function RelatedQuestions({ questions, onSelect }: { questions: string[]; onSelect: (q: string) => void }) {
  if (!questions.length) return null;
  return (
    <div className="mt-4">
      <p className="text-[11px] text-k-muted/70 uppercase tracking-wider font-medium mb-2">You might also ask</p>
      <div className="space-y-1">
        {questions.slice(0, 3).map((q, i) => (
          <button
            key={i}
            onClick={() => onSelect(q)}
            className="w-full text-left text-sm text-k-muted hover:text-k-text transition-colors py-1 flex items-start gap-2 group"
          >
            <span className="text-k-cyan/60 group-hover:text-k-cyan flex-shrink-0 mt-0.5 transition-colors">→</span>
            {q}
          </button>
        ))}
      </div>
    </div>
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
  const [citedSources, setCitedSources] = useState<number[]>([]);
  const sourceRowRefs = useRef<Map<number, HTMLLIElement>>(new Map());

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
    showToast('Copied to clipboard');
  };

  const handleShare = () => {
    const url = `${window.location.origin}/chat?q=${encodeURIComponent(demoQ.query)}`;
    navigator.clipboard.writeText(url).catch(() => {});
    showToast('Share link copied');
  };

  const handleDownload = () => {
    const lines = [
      `# ${demoQ.query}`, '',
      demoQ.answer.replace(/\[(\d+)\]/g, '').trim(), '',
      '## Sources', '',
      ...demoQ.sources.map((s, i) => `${i + 1}. **${s.title}** (${s.agency}) — ${s.freshness}`), '',
      `---`,
      `*Retrieved in ${(demoQ.elapsedMs / 1000).toFixed(2)}s. Powered by AIntropy Kurious.*`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `kurious-${demoQ.id}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Downloaded as Markdown');
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (el.classList.contains('inline-citation')) {
        const refs = (el.getAttribute('data-refs') ?? '')
          .split(',').map(Number).filter(Boolean);
        setCitedSources(refs);
        setSourcesOpen(true);
        setTimeout(() => {
          const firstRow = sourceRowRefs.current.get(refs[0] - 1);
          firstRow?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 120);
        setTimeout(() => setCitedSources([]), 2500);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const [showAllClips, setShowAllClips] = useState(false);
  const [showClips, setShowClips] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [showMeta, setShowMeta] = useState(false);

  // Staggered appearance timers
  useEffect(() => {
    const t1 = setTimeout(() => setShowClips(true), 300);
    const t2 = setTimeout(() => setShowChart(true), 500);
    const t3 = setTimeout(() => setShowMeta(true), 700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const processedAnswer = addCitations(unwrapFencedTables(demoQ.answer), demoQ.sources);
  const elapsedSec = (demoQ.elapsedMs / 1000).toFixed(2);
  const clipLayout = demoQ.clipLayout ?? 'highlight';
  const videoSources = demoQ.sources.filter(s => s.type === 'video');
  const sortedClips = [...videoSources].sort((a, b) => (a.relevanceRank ?? 99) - (b.relevanceRank ?? 99));
  const highlightTopClips = sortedClips.slice(0, 2);
  const highlightExtraClips = sortedClips.slice(2);
  const nonVideoSources = demoQ.sources.filter(s => s.type !== 'video');
  const hasVideo = videoSources.length > 0;
  const hasImage = nonVideoSources.some(s => s.type === 'image');
  const hasData = nonVideoSources.some(s => s.type === 'structured');
  const docCount = demoQ.sources.filter(s => s.type === 'document').length;
  const dataCount = demoQ.sources.filter(s => s.type === 'structured').length;
  const imageCount = demoQ.sources.filter(s => s.type === 'image').length;
  const videoCount = videoSources.length;

  // Build multi-modal badge parts
  const badgeParts: string[] = [];
  badgeParts.push(`${demoQ.sources.length} sources`);
  if (videoCount > 0) badgeParts.push(`${videoCount} video clip${videoCount > 1 ? 's' : ''}`);
  if (docCount > 0) badgeParts.push(`${docCount} document${docCount > 1 ? 's' : ''}`);
  if (dataCount > 0) badgeParts.push(`${dataCount} dataset${dataCount > 1 ? 's' : ''}`);
  if (imageCount > 0) badgeParts.push(`${imageCount} image${imageCount > 1 ? 's' : ''}`);
  const badgeText = 'ANSWER FROM ' + badgeParts.join(' \u00B7 ').toUpperCase();

  return (
    <>
      <Toast message={toast} visible={toastVisible} />

      <div className="group/answer animate-slide-up rounded-2xl px-6 py-5" style={{ background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.09)' }}>
        {/* Citation styles */}
        <style>{`
          .inline-citation {
            display: inline-flex; align-items: center; justify-content: center;
            min-width: 16px; height: 16px; padding: 0 3px;
            background: rgba(0, 212, 255, 0.12); border: 1px solid rgba(0, 212, 255, 0.35);
            color: #00D4FF; border-radius: 4px; font-size: 9px; font-weight: 700;
            cursor: pointer; vertical-align: super; line-height: 1; margin: 0 1px;
            transition: background 0.15s; user-select: none;
          }
          .inline-citation:hover { background: rgba(0, 212, 255, 0.28); }
          .inline-citation-group { background: rgba(0, 212, 255, 0.18); letter-spacing: -0.3px; }
        `}</style>

        {/* Multi-modal answer badge */}
        <p className="text-[11px] text-k-muted/50 uppercase tracking-wider font-medium mb-3">
          {badgeText}
        </p>

        {/* Answer text — no card, clean prose */}
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

        {/* Chart — staggered 500ms */}
        {demoQ.chartData && (
          <div className={`transition-opacity duration-500 ${showChart ? 'opacity-100' : 'opacity-0'}`}>
            <InlineChart data={demoQ.chartData} />
          </div>
        )}

        {/* Relevant Clips section — staggered 300ms */}
        {hasVideo && (
          <div className={`mt-5 mb-2 transition-opacity duration-500 ${showClips ? 'opacity-100' : 'opacity-0'}`}>
            {clipLayout === 'grid' ? (
              <>
                {/* Scenario B: Grid — all clips shown equally */}
                <p className="text-[10px] uppercase tracking-widest text-k-muted/60 font-semibold mb-2.5">
                  All clips related to this answer ({sortedClips.length}):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sortedClips.map((src, i) => (
                    <VideoClipCard key={i} src={src} idx={i} compact />
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Scenario A: Highlight — top 2 prominent, rest collapsed */}
                <p className="text-[10px] uppercase tracking-widest text-k-muted/60 font-semibold mb-2.5">Relevant Clips</p>
                <div className="space-y-2">
                  {highlightTopClips.map((src, i) => (
                    <VideoClipCard key={i} src={src} idx={i} />
                  ))}
                </div>
                {/* "... N more clips" bar */}
                {highlightExtraClips.length > 0 && !showAllClips && (
                  <button
                    onClick={() => setShowAllClips(true)}
                    className="bg-k-border/20 hover:bg-k-border/40 text-k-muted text-xs rounded-lg py-2 text-center w-full mt-2 transition-colors"
                  >
                    ··· {highlightExtraClips.length} more clip{highlightExtraClips.length > 1 ? 's' : ''} ▼
                  </button>
                )}
                {/* Expanded: remaining clips in 2-column grid */}
                {showAllClips && highlightExtraClips.length > 0 && (
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                    {highlightExtraClips.map((src, i) => (
                      <VideoClipCard key={i} src={src} idx={i + 2} compact />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Metadata row — sources + timing + cross-silo + hover actions — staggered 700ms */}
        <div className={`flex items-center gap-2 mt-4 flex-wrap transition-opacity duration-500 ${showMeta ? 'opacity-100' : 'opacity-0'}`}>
          {/* Sources toggle */}
          {nonVideoSources.length > 0 && (
            <button
              onClick={() => setSourcesOpen(v => !v)}
              className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-k-muted/70 hover:text-k-text font-medium transition-colors"
            >
              <span className={`transition-transform duration-150 inline-block text-[10px] ${sourcesOpen ? 'rotate-90' : ''}`}>▶</span>
              {nonVideoSources.length} sources
              {hasImage && <span className="text-[11px]">🖼️</span>}
              {hasData && <span className="text-[11px]">⛁</span>}
            </button>
          )}

          <span className="text-k-muted/40 text-[10px]">·</span>
          <span className="text-[11px] uppercase tracking-wider text-k-muted/70 font-medium">
            Searched 85M docs in <strong className="text-k-cyan font-semibold not-italic normal-case tracking-normal">{elapsedSec}s</strong>
          </span>

          {/* Cross-silo */}
          {demoQ.crossSiloAgencies.length >= 2 && (
            <>
              <span className="text-k-muted/40 text-[10px]">·</span>
              <span className="text-[11px] uppercase tracking-wider text-emerald-400/80 font-medium flex items-center gap-1">
                <span>✓</span>
                <span>{demoQ.crossSiloAgencies.length} agencies</span>
              </span>
            </>
          )}

          {/* Hover action buttons — appear on hover */}
          <div className="ml-auto flex items-center gap-1 opacity-0 group-hover/answer:opacity-100 transition-opacity duration-150">
            <button onClick={handleCopy} title="Copy answer"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-k-muted hover:text-k-text hover:bg-k-border/30 transition-colors">
              <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"/>
                <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/>
              </svg>
            </button>
            <button onClick={() => onBookmark?.()} title={bookmarked ? 'Saved' : 'Save'}
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${bookmarked ? 'text-k-cyan' : 'text-k-muted hover:text-k-text hover:bg-k-border/30'}`}>
              <svg viewBox="0 0 16 16" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                <path d="M3.75 2h8.5c.966 0 1.75.784 1.75 1.75v10.5a.75.75 0 0 1-1.218.586L8 11.564l-4.782 3.272A.75.75 0 0 1 2 14.25V3.75C2 2.784 2.784 2 3.75 2Z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button onClick={handleShare} title="Share"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-k-muted hover:text-k-text hover:bg-k-border/30 transition-colors">
              <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M7.22 1.22a.75.75 0 0 1 1.06 0L11.53 4.47a.75.75 0 0 1-1.06 1.06l-2-2V10a.75.75 0 0 1-1.5 0V3.53l-2 2a.75.75 0 0 1-1.06-1.06L7.22 1.22Z"/>
                <path d="M2.5 9.75C2.5 8.784 3.284 8 4.25 8h1a.75.75 0 0 1 0 1.5h-1a.25.25 0 0 0-.25.25v4.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-4.5a.25.25 0 0 0-.25-.25h-1a.75.75 0 0 1 0-1.5h1c.966 0 1.75.784 1.75 1.75v4.5A1.75 1.75 0 0 1 11.75 16h-7.5A1.75 1.75 0 0 1 2.5 14.25v-4.5Z"/>
              </svg>
            </button>
            <button onClick={handleDownload} title="Download"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-k-muted hover:text-k-text hover:bg-k-border/30 transition-colors">
              <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M8.75 1.75a.75.75 0 0 0-1.5 0V8.44L5.03 6.22a.75.75 0 0 0-1.06 1.06l3.5 3.5a.75.75 0 0 0 1.06 0l3.5-3.5a.75.75 0 0 0-1.06-1.06L8.75 8.44V1.75Z"/>
                <path d="M1.5 12.75a.75.75 0 0 1 1.5 0v1.5h11v-1.5a.75.75 0 0 1 1.5 0V15a.75.75 0 0 1-.75.75H2.25A.75.75 0 0 1 1.5 15v-2.25Z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Sources panel */}
        {sourcesOpen && (
          <div className="mt-4 border-t border-k-border/40 pt-4 space-y-5 animate-fade-in">
            {/* Image sources */}
            {demoQ.sources.filter(s => s.type === 'image').length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-k-muted/60 font-semibold mb-2">Image / Map</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {demoQ.sources.filter(s => s.type === 'image').map((src, i) => (
                    <ImageSourceCard key={i} src={src} />
                  ))}
                </div>
              </div>
            )}

            {/* Primary */}
            {primarySources.filter(s => s.type !== 'video' && s.type !== 'image').length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-k-muted/60 font-semibold mb-1">Primary</p>
                <ul>
                  {primarySources.filter(s => s.type !== 'video' && s.type !== 'image').map((src, i) => {
                    const globalIdx = demoQ.sources.indexOf(src);
                    return <DocSourceRow key={i} src={src} index={globalIdx} highlighted={citedSources.includes(globalIdx + 1)} rowRef={el => { if (el) sourceRowRefs.current.set(globalIdx, el); }} />;
                  })}
                </ul>
              </div>
            )}

            {/* Supporting */}
            {supportingSources.filter(s => s.type !== 'video' && s.type !== 'image').length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-k-muted/60 font-semibold mb-1">Supporting</p>
                <ul>
                  {supportingSources.filter(s => s.type !== 'video' && s.type !== 'image').map((src, i) => {
                    const globalIdx = demoQ.sources.indexOf(src);
                    return <DocSourceRow key={i} src={src} index={globalIdx} highlighted={citedSources.includes(globalIdx + 1)} rowRef={el => { if (el) sourceRowRefs.current.set(globalIdx, el); }} />;
                  })}
                </ul>
              </div>
            )}

            {/* Additional */}
            {additionalSources.filter(s => s.type !== 'video' && s.type !== 'image').length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-k-muted/60 font-semibold mb-1">Additional</p>
                <ul>
                  {additionalSources.filter(s => s.type !== 'video' && s.type !== 'image').map((src, i) => {
                    const globalIdx = demoQ.sources.indexOf(src);
                    return <DocSourceRow key={i} src={src} index={globalIdx} rowRef={el => { if (el) sourceRowRefs.current.set(globalIdx, el); }} />;
                  })}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Related questions */}
        <RelatedQuestions questions={demoQ.relatedQuestions} onSelect={onRelatedQuestion} />

        {/* Feedback */}
        <div className="mt-4 pt-3 border-t border-k-border/30">
          <FeedbackBar />
        </div>
      </div>
    </>
  );
}
