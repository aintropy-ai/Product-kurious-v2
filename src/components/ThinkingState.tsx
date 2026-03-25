import { useEffect, useState, useRef } from 'react';
import {
  NewStreamEvent,
  SSEEventSearching,
  SSEEventToolCall,
  SSEEventToolResult,
  SSEEventThinking,
} from '../types';

const STRUCTURED_PHRASES = [
  'Reading schema…',
  'Building SQL query…',
  'Scanning table indexes…',
  'Running query…',
  'Aggregating rows…',
  'Cross-referencing columns…',
  'Joining datasets…',
];

const UNSTRUCTURED_PHRASES = [
  'Embedding query…',
  'Scanning 57M documents…',
  'Ranking by relevance…',
  'Reading top matches…',
  'Pulling excerpts…',
  'Filtering sources…',
  'Checking coverage…',
];

const THINKING_PHRASES = [
  'Reasoning through context…',
  'Refining the approach…',
  'Checking for gaps…',
  'Considering edge cases…',
  'Synthesising findings…',
];

const GENERATING_PHRASES = [
  'Reading through sources…',
  'Connecting the dots…',
  'Drafting a response…',
  'Weighing the evidence…',
  'Checking for gaps…',
  'Structuring the answer…',
];

function phrasesForStep(id: string): string[] {
  if (id === 'generating') return GENERATING_PHRASES;
  if (id.includes('structured') && !id.includes('unstructured')) return STRUCTURED_PHRASES;
  if (id.includes('unstructured')) return UNSTRUCTURED_PHRASES;
  if (id.includes('thinking')) return THINKING_PHRASES;
  return UNSTRUCTURED_PHRASES;
}

const ALMOST_THERE = 'Almost there…';

function CyclingText({ stepId }: { stepId: string }) {
  const phrases = phrasesForStep(stepId);
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    setIdx(0);
    setVisible(true);
    setFinished(false);
    let current = 0;
    const iv = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        current += 1;
        if (current >= phrases.length) {
          setFinished(true);
          clearInterval(iv);
        } else {
          setIdx(current);
        }
        setVisible(true);
      }, 300);
    }, 2800);
    return () => clearInterval(iv);
  }, [stepId]);

  return (
    <span
      className="text-xs text-k-muted/60 ml-2 transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {finished ? ALMOST_THERE : phrases[idx]}
    </span>
  );
}

interface LiveStep {
  id: string;
  label: string;
  status: 'active' | 'done' | 'error';
}

interface ThinkingStateProps {
  mode: 'quick' | 'deeper';
  isDone: boolean;
  onComplete: () => void;
  streamEvents?: NewStreamEvent[];
}

function toolLabel(tool: string, query?: string): string {
  const base = tool === 'search_structured' ? 'Querying government records'
             : tool === 'search_unstructured' ? 'Searching documents'
             : `Running ${tool}`;
  return query ? `${base}: "${query.length > 60 ? query.slice(0, 60) + '…' : query}"` : base;
}

function buildLiveSteps(events: NewStreamEvent[], isDone = false): LiveStep[] {
  // Ordered list of steps built as events arrive — mutations happen in place
  const ordered: LiveStep[] = [];
  const byId = new Map<string, LiveStep>();

  const upsert = (id: string, label: string, status: LiveStep['status']) => {
    if (byId.has(id)) {
      const s = byId.get(id)!;
      s.label = label;
      s.status = status;
    } else {
      const s: LiveStep = { id, label, status };
      byId.set(id, s);
      ordered.push(s);
    }
  };

  for (const e of events) {
    if (e.stage === 'searching') {
      // Quick mode
      const evt = e as SSEEventSearching;
      for (const tool of evt.tools) {
        const id = `tool-0-${tool === 'structured' ? 'search_structured' : tool === 'unstructured' ? 'search_unstructured' : tool}`;
        const label = tool === 'structured' ? 'Querying government records'
                    : tool === 'unstructured' ? 'Searching documents'
                    : `Searching ${tool}`;
        upsert(id, label, 'active');
      }
    } else if (e.stage === 'thinking') {
      const evt = e as SSEEventThinking;
      // Mark any previous active thinking step as done
      ordered.forEach(s => { if (s.id.startsWith('thinking-') && s.status === 'active') s.status = 'done'; });
      upsert(`thinking-${evt.iteration}`, 'Thinking', 'active');
    } else if (e.stage === 'tool_call') {
      // When a tool call starts, mark the current thinking step as done
      ordered.forEach(s => { if (s.id.startsWith('thinking-') && s.status === 'active') s.status = 'done'; });

      const evt = e as SSEEventToolCall;
      const id = `tool-${evt.iteration ?? 0}-${evt.tool}`;
      upsert(id, toolLabel(evt.tool, evt.query), 'active');
    } else if (e.stage === 'tool_result') {
      const evt = e as SSEEventToolResult;
      const possibleIds = [
        `tool-${evt.iteration ?? 0}-${evt.tool}`,
        `tool-0-search_${evt.tool}`,
        `tool-0-${evt.tool}`,
      ];
      const id = possibleIds.find(pid => byId.has(pid));
      if (id) {
        const s = byId.get(id)!;
        const hasError = !!(evt.error ?? evt.summary?.error);
        s.status = hasError ? 'error' : 'done';
        if (!hasError) {
          const count = evt.row_count ?? evt.hit_count ?? evt.summary?.row_count ?? evt.summary?.hit_count;
          if (count != null) s.label = `${s.label} — ${count} result${count !== 1 ? 's' : ''}`;
        } else {
          s.label = `${s.label} — no results`;
          s.status = 'done';
        }
      }
    } else if (e.stage === 'answer' || e.stage === 'answer_start') {
      ordered.forEach(s => { if (s.status === 'active') s.status = 'done'; });
    } else if (e.stage === 'answer_token' || e.stage === 'answer_end') {
      // Token streaming or end - these are handled as the answer streams in
      // Mark any remaining active steps as done
      ordered.forEach(s => { if (s.status === 'active') s.status = 'done'; });
    }
  }

  // If all steps are resolved but no answer yet, add a live "generating" step
  const hasAnswer = events.some(e => e.stage === 'answer' || e.stage === 'answer_start' || e.stage === 'answer_token' || e.stage === 'answer_end');
  const allDone = ordered.length > 0 && ordered.every(s => s.status !== 'active');
  if (allDone && !hasAnswer) {
    const gen: LiveStep = { id: 'generating', label: 'Generating answer', status: isDone ? 'done' : 'active' };
    ordered.push(gen);
  }

  return ordered;
}

// Fallback animated steps when no live events yet
const QUICK_STEPS = [
  'Understood your question',
  'Searching across 57M documents',
  'Scanning government records & data',
  'Connecting insights',
];
const DEEPER_STEPS = [
  'Understood your question',
  'Searching across 57M documents',
  'Scanning government records & data',
  'Cross-referencing sources',
  'Analysing connections',
  'Synthesising a comprehensive answer',
];

export default function ThinkingState({ mode, isDone, onComplete, streamEvents = [] }: ThinkingStateProps) {
  const liveSteps = buildLiveSteps(streamEvents, isDone);
  const hasLiveSteps = liveSteps.length > 0;

  // Fallback animation (shown until first live event arrives)
  const fallbackSteps = mode === 'deeper' ? DEEPER_STEPS : QUICK_STEPS;
  const delay = mode === 'deeper' ? 600 : 350;
  const [visibleFallback, setVisibleFallback] = useState(0);
  const [fallbackComplete, setFallbackComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setVisibleFallback(0);
    setFallbackComplete(false);
    let step = 0;
    intervalRef.current = setInterval(() => {
      step++;
      setVisibleFallback(step);
      if (step >= fallbackSteps.length) {
        clearInterval(intervalRef.current!);
        setFallbackComplete(true);
      }
    }, delay);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [mode]);

  // Stop fallback animation once live events arrive
  useEffect(() => {
    if (hasLiveSteps && intervalRef.current) {
      clearInterval(intervalRef.current);
      setFallbackComplete(true);
    }
  }, [hasLiveSteps]);

  // Determine if animation side is complete
  const animComplete = hasLiveSteps ? isDone : fallbackComplete;

  useEffect(() => {
    if (animComplete && isDone) {
      const t = setTimeout(onComplete, 300);
      return () => clearTimeout(t);
    }
  }, [animComplete, isDone]);

  return (
    <div className="animate-fade-in py-8 max-w-xl">
      <p className="text-sm font-medium text-k-muted mb-6 tracking-wide">
        {mode === 'deeper' ? '🔍' : '⚡'} Searching your knowledge base...
      </p>
      <div className="space-y-3">
        {hasLiveSteps ? (
          // Live event-driven steps
          liveSteps.map(step => (
            <div key={step.id} className="flex items-center gap-3 transition-opacity duration-300">
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                {step.status === 'done'  && <span className="text-k-cyan text-sm animate-tick">✓</span>}
                {step.status === 'error' && <span className="text-red-400 text-sm">✗</span>}
                {step.status === 'active' && <div className="w-3 h-3 border-2 border-k-cyan border-t-transparent rounded-full animate-spin" />}
              </div>
              <span className="flex items-baseline gap-0">
                <span className={`text-sm transition-colors ${
                  step.status === 'done'  ? 'text-k-text' :
                  step.status === 'error' ? 'text-red-400' :
                  'text-k-cyan'
                }`}>
                  {step.label}{step.status === 'active' ? '…' : ''}
                </span>
                {step.status === 'active' && <CyclingText stepId={step.id} />}
              </span>
            </div>
          ))
        ) : (
          // Fallback animated steps
          fallbackSteps.map((step, i) => {
            const done    = i < visibleFallback - 1 || (i === visibleFallback - 1 && visibleFallback === fallbackSteps.length);
            const active  = i === visibleFallback - 1 && visibleFallback < fallbackSteps.length;
            const pending = i >= visibleFallback;
            return (
              <div key={step} className={`flex items-center gap-3 transition-opacity duration-300 ${pending ? 'opacity-20' : 'opacity-100'}`}>
                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                  {done    && <span className="text-k-cyan text-sm animate-tick">✓</span>}
                  {active  && <div className="w-3 h-3 border-2 border-k-cyan border-t-transparent rounded-full animate-spin" />}
                  {pending && <div className="w-2 h-2 rounded-full bg-k-border" />}
                </div>
                <span className={`text-sm transition-colors ${done ? 'text-k-text' : active ? 'text-k-cyan' : 'text-k-muted'}`}>
                  {step}{active ? '...' : ''}
                </span>
              </div>
            );
          })
        )}

        {/* Shown after animation finishes but backend hasn't responded yet */}
        {animComplete && !isDone && (
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
              <div className="w-3 h-3 border-2 border-k-muted border-t-transparent rounded-full animate-spin" />
            </div>
            <span className="text-sm text-k-muted">Preparing your answer...</span>
          </div>
        )}
      </div>
    </div>
  );
}
