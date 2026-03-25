import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SearchBar } from '../components/SearchBar';
import SuggestionCards from '../components/SuggestionCards';
import ThinkingState from '../components/ThinkingState';
import AnswerBlock from '../components/AnswerBlock';
import { intelligentStreamSearch, backendApi, StreamEvent } from '../services/backendApi';
import { synthesizeAnswer } from '../services/anthropicApi';
import { frontierApi } from '../services/frontierApi';
import {
  StreamSource,
  StreamUnstructuredEvent,
  StreamErrorEvent,
} from '../types';

import njQuestions from '../../assets/njopendata_questions_preloaded.txt?raw';

const PRELOADED_QUESTIONS = njQuestions.split('\n---\n').filter(q => q.trim());
const SUGGESTION_CARDS = PRELOADED_QUESTIONS.slice(0, 4);
const NO_ANSWER_PHRASE = 'does not contain the answer';

const WAITLIST_URL = 'https://script.google.com/macros/s/AKfycbw7wr9buR8gMmQ4Pwfyuo0gw7xX_nwXQlFzYu6SRx6kW5S2RpuqXUhqVi-9nRpyXFiG/exec';

const FRONTIER_MODEL_NAMES: Record<string, string> = {
  gpt4o: 'GPT-4o',
  gpt4omini: 'GPT-4o mini',
  gemini2flash: 'Gemini 2.0 Flash',
  gemini15pro: 'Gemini 1.5 Pro',
  claude: 'Claude 3.5 Sonnet',
  claude3haiku: 'Claude 3 Haiku',
  llama70b: 'Llama 3.1 70B',
};

function getFirstNameFromJWT(): string | null {
  try {
    const match = document.cookie.match(/(?:^|;\s*)CF_Authorization=([^;]+)/);
    if (!match) return null;
    const token = match[1];
    const payload = JSON.parse(atob(token.split('.')[1]));
    const name: string = payload.name || payload.given_name || payload.email || '';
    return name.split(/[\s@]/)[0] || null;
  } catch {
    return null;
  }
}

interface FrontierState {
  model: string;
  loading: boolean;
  answer: string | null;
  latency: number | null;
  error: string | null;
}

interface ConversationEntry {
  question: string;
  answer: string | null;
  sources: StreamSource[];
  latency: number | null;
  error: string | null;
  frontier: FrontierState | null;
  logId: number;
}

export const NJSearchPage = () => {
  const firstName = getFirstNameFromJWT();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [profileOpen, setProfileOpen] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistState, setWaitlistState] = useState<'idle' | 'submitting' | 'done'>('idle');

  // Conversation history
  const [conversations, setConversations] = useState<ConversationEntry[]>([]);
  const [hasStarted, setHasStarted] = useState(false);

  // ── In-flight search state ────────────────────────────────────────────────
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  const [pendingEvents, setPendingEvents] = useState<StreamEvent[]>([]);
  const [pendingAnswer, setPendingAnswer] = useState<string | null>(null);
  const [pendingSources, setPendingSources] = useState<StreamSource[]>([]);
  const [pendingLatency, setPendingLatency] = useState<number | null>(null);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [synthesizingAnswer, setSynthesizingAnswer] = useState(false);
  const [animDone, setAnimDone] = useState(false);

  // Derived: stream has sent the 'done' event
  const streamDone = pendingEvents.some(e => e.stage === 'done');

  const bottomRef = useRef<HTMLDivElement>(null);
  const pendingLogIdRef = useRef<number>(-1);

  // Theme
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations.length, pendingQuery, pendingAnswer, animDone]);

  // Answer resolution: once stream done, determine answer
  useEffect(() => {
    if (!streamDone || pendingAnswer || pendingError || synthesizingAnswer) return;
    if (!pendingQuery) return;

    const unstructuredEvt = pendingEvents.find(
      e => e.stage === 'unstructured'
    ) as StreamUnstructuredEvent | undefined;

    const unstructuredIsUseful =
      !!unstructuredEvt &&
      !unstructuredEvt.answer.toLowerCase().includes(NO_ANSWER_PHRASE);

    // Sources come from the unstructured event regardless of which answer path is taken
    if (unstructuredEvt) {
      setPendingSources(unstructuredEvt.sources as StreamSource[]);
    }

    if (unstructuredIsUseful) {
      setPendingAnswer(unstructuredEvt!.answer);
      return;
    }

    const synthesize = async () => {
      setSynthesizingAnswer(true);
      try {
        const answer = await synthesizeAnswer(pendingQuery!, pendingEvents);
        setPendingAnswer(answer);
      } catch {
        setPendingError('Failed to synthesize answer');
      } finally {
        setSynthesizingAnswer(false);
      }
    };
    synthesize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamDone, pendingEvents.length]);

  // Commit: when animation done AND answer ready → add to conversation list
  useEffect(() => {
    if (!animDone || !pendingQuery) return;
    if (synthesizingAnswer) return;
    if (!pendingAnswer && !pendingError) return;

    const entry: ConversationEntry = {
      question: pendingQuery,
      answer: pendingAnswer,
      sources: pendingSources,
      latency: pendingLatency,
      error: pendingError,
      frontier: null,
      logId: pendingLogIdRef.current,
    };

    setConversations(prev => [...prev, entry]);
    setPendingQuery(null);
    setPendingEvents([]);
    setPendingAnswer(null);
    setPendingSources([]);
    setPendingLatency(null);
    setPendingError(null);
    setAnimDone(false);
    setSynthesizingAnswer(false);
  }, [animDone, pendingQuery, pendingAnswer, pendingError, synthesizingAnswer]);

  const handleThinkingComplete = useCallback(() => {
    setAnimDone(true);
  }, []);

  // Search
  const handleSearch = async (query: string) => {
    setHasStarted(true);
    setPendingQuery(query);
    setPendingEvents([]);
    setPendingAnswer(null);
    setPendingSources([]);
    setPendingLatency(null);
    setPendingError(null);
    setAnimDone(false);
    setSynthesizingAnswer(false);
    pendingLogIdRef.current = -1;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);

    try {
      await intelligentStreamSearch(
        query,
        {
          onEvent: (event: StreamEvent) => {
            setPendingEvents(prev => [...prev, event]);
          },
          onUnstructured: () => {},
          onStructured: () => {},
          onError: (_event: StreamErrorEvent) => {},
          onDone: event => {
            setPendingLatency(event.total_elapsed_ms / 1000);
          },
        },
        controller.signal
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setPendingError(err.message || 'Network error');
        setPendingEvents(prev => [
          ...prev,
          { stage: 'done', total_elapsed_ms: 0 } as StreamEvent,
        ]);
      }
    } finally {
      clearTimeout(timeout);
    }

    try {
      const { id } = await backendApi.createSearchLog({ question: query });
      pendingLogIdRef.current = id;
    } catch {
      // silent
    }
  };

  // Ask another AI for a specific conversation entry
  const handleAskAnotherAI = async (entryIdx: number, modelValue: string) => {
    const entry = conversations[entryIdx];
    if (!entry) return;

    // Set frontier loading state on this entry
    setConversations(prev =>
      prev.map((c, i) =>
        i === entryIdx
          ? { ...c, frontier: { model: modelValue, loading: true, answer: null, latency: null, error: null } }
          : c
      )
    );

    const startTime = Date.now();
    try {
      const result = await frontierApi.search(modelValue, entry.question);
      const latency = (Date.now() - startTime) / 1000;
      setConversations(prev =>
        prev.map((c, i) =>
          i === entryIdx
            ? { ...c, frontier: { model: modelValue, loading: false, answer: result.answer, latency, error: null } }
            : c
        )
      );
    } catch (err: any) {
      setConversations(prev =>
        prev.map((c, i) =>
          i === entryIdx
            ? { ...c, frontier: { model: modelValue, loading: false, answer: null, latency: null, error: err.message || 'Failed' } }
            : c
        )
      );
    }
  };

  const handleCloseFrontier = (entryIdx: number) => {
    setConversations(prev =>
      prev.map((c, i) => i === entryIdx ? { ...c, frontier: null } : c)
    );
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;
    setWaitlistState('submitting');
    try {
      await fetch(WAITLIST_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ email: waitlistEmail.trim() }),
      });
    } catch {
      // no-cors swallows the response — treat as success
    }
    setWaitlistState('done');
  };

  const isSearching = pendingQuery !== null;

  return (
    <div className="min-h-screen bg-k-bg flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-30 bg-k-nav border-b border-k-border flex items-center px-6 h-14 gap-4">
        <div className="flex items-center gap-2 flex-shrink-0">
          <img src="/logo.png" alt="AIntropy" className="h-7 w-auto" />
          <span className="text-xs font-semibold text-k-cyan border border-k-cyan/50 rounded-full px-2 py-0.5 leading-none">beta</span>
        </div>

        <div className="flex items-center gap-3 ml-auto flex-shrink-0">
          <button
            onClick={() => { setWaitlistOpen(true); setWaitlistState('idle'); setWaitlistEmail(''); }}
            className="text-xs font-medium px-4 py-1.5 rounded-full bg-k-cyan text-k-bg hover:bg-cyan-300 transition-colors flex-shrink-0"
          >
            Join Waitlist
          </button>

          <div className="relative">
            <button
              onClick={() => setProfileOpen(v => !v)}
              className="w-8 h-8 rounded-full bg-k-card border border-k-border flex items-center justify-center text-k-muted hover:text-k-text transition-colors text-sm font-medium"
            >
              {firstName ? firstName[0].toUpperCase() : '?'}
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-k-card border border-k-border rounded-xl shadow-xl py-1 animate-fade-in z-50">
                {firstName && (
                  <div className="px-4 py-2 border-b border-k-border">
                    <p className="text-sm font-medium text-k-text">{firstName}</p>
                  </div>
                )}
                <button
                  onClick={() => { setTheme(t => t === 'dark' ? 'light' : 'dark'); setProfileOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-k-muted hover:text-k-text hover:bg-k-border/20 transition-colors"
                >
                  {theme === 'dark' ? '☀️ Light mode' : '🌙 Dark mode'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sticky search bar — shown after first search, below nav */}
      {hasStarted && (
        <div className="sticky top-14 z-20 bg-k-nav border-b border-k-border px-4 py-3">
          <div className="max-w-5xl mx-auto">
            <SearchBar
              onSearch={handleSearch}
              disabled={isSearching}
              preloadedQuestions={PRELOADED_QUESTIONS}
              compact
            />
          </div>
        </div>
      )}

      {/* Main scrollable area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-8">

          {/* Welcome / idle screen */}
          {!hasStarted && (
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold text-k-text mb-2">
                {firstName ? `Welcome to Kurious, ${firstName}.` : 'Welcome to Kurious.'}
              </h1>
              <p className="text-k-muted mb-10 text-base leading-relaxed">
                Your AI-powered knowledge engine — what do you want to explore?
              </p>
              <SearchBar
                onSearch={handleSearch}
                disabled={isSearching}
                preloadedQuestions={PRELOADED_QUESTIONS}
              />
              <div className="mt-8">
                <SuggestionCards
                  suggestions={SUGGESTION_CARDS}
                  onSelect={s => handleSearch(s)}
                />
              </div>
            </div>
          )}

          {/* Committed conversations */}
          {conversations.map((entry, idx) => {
            const hasFrontier = entry.frontier !== null;
            return (
              <div key={idx} className={`mb-12 ${hasFrontier ? 'max-w-none' : ''}`}>
                <h2 className="text-base font-semibold text-k-text mb-4">{entry.question}</h2>

                <div className={hasFrontier ? 'grid grid-cols-2 gap-4 items-stretch' : ''}>
                  {/* Kurious answer */}
                  <div className={hasFrontier ? 'flex flex-col' : ''}>
                    {hasFrontier && (
                      <p className="text-xs text-k-muted uppercase tracking-widest mb-2 font-medium">Kurious</p>
                    )}
                    {entry.error ? (
                      <div className="border border-k-error/40 rounded-xl bg-k-card p-4 text-sm text-k-error">
                        {entry.error}
                      </div>
                    ) : entry.answer ? (
                      <AnswerBlock
                        answer={entry.answer}
                        sources={entry.sources.map(s => ({
                          source_type: 'unstructured' as const,
                          category: 'supporting' as const,
                          title: s.title || s.h1 || undefined,
                          url: s.source_parent || s.source || s.url || undefined,
                          excerpt: s.text || undefined,
                        }))}
                        latency={entry.latency}
                        onAskAnotherAI={model => handleAskAnotherAI(idx, model)}
                        hideAskButton={hasFrontier}
                        onFeedback={(rating, text) =>
                          backendApi.submitFeedback(entry.logId, {
                            kurious_rating: rating,
                            kurious_feedback_text: text,
                          })
                        }
                      />
                    ) : null}
                  </div>

                  {/* Frontier comparison */}
                  {hasFrontier && entry.frontier && (
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-k-muted uppercase tracking-widest font-medium">
                          {FRONTIER_MODEL_NAMES[entry.frontier.model] ?? entry.frontier.model}
                        </p>
                        <button
                          onClick={() => handleCloseFrontier(idx)}
                          className="text-k-muted hover:text-k-text transition-colors text-sm leading-none"
                          title="Close comparison"
                        >
                          ✕
                        </button>
                      </div>

                      {entry.frontier.loading ? (
                        <div className="border border-k-border rounded-2xl bg-k-card p-6 flex-1 flex items-center gap-2.5 text-sm text-k-muted">
                          <div className="w-3.5 h-3.5 border-2 border-k-muted border-t-transparent rounded-full animate-spin flex-shrink-0" />
                          Generating…
                        </div>
                      ) : entry.frontier.error ? (
                        <div className="border border-k-error/40 rounded-xl bg-k-card p-4 text-sm text-k-error">
                          {entry.frontier.error}
                        </div>
                      ) : entry.frontier.answer ? (
                        <AnswerBlock
                          answer={entry.frontier.answer}
                          latency={entry.frontier.latency}
                          hideAskButton
                        />
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Suggestion cards after last answer — filtered to unasked questions */}
          {hasStarted && !isSearching && conversations.length > 0 && (() => {
            const askedSet = new Set(conversations.map(c => c.question));
            const remaining = SUGGESTION_CARDS.filter(s => !askedSet.has(s));
            return remaining.length > 0 ? (
              <div className="mb-8 animate-fade-in">
                <SuggestionCards
                  suggestions={remaining}
                  onSelect={s => handleSearch(s)}
                />
              </div>
            ) : null;
          })()}

          {/* In-flight ThinkingState */}
          {isSearching && (
            <div className="mb-12">
              <h2 className="text-base font-semibold text-k-text mb-4">{pendingQuery}</h2>

              {!animDone && (
                <ThinkingState
                  mode="quick"
                  isDone={streamDone}
                  onComplete={handleThinkingComplete}
                />
              )}

              {animDone && synthesizingAnswer && (
                <div className="flex items-center gap-2.5 text-sm text-k-muted animate-fade-in">
                  <div className="w-3.5 h-3.5 border-2 border-k-muted border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  Synthesizing answer…
                </div>
              )}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* Waitlist modal */}
      {waitlistOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in"
          onClick={() => setWaitlistOpen(false)}
        >
          <div
            className="bg-k-card border border-k-border rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {waitlistState === 'done' ? (
              <div className="text-center py-4">
                <p className="text-2xl mb-3">🎉</p>
                <p className="text-lg font-semibold text-k-text mb-2">You're on the list!</p>
                <p className="text-sm text-k-muted mb-6">We'll be in touch when access opens up.</p>
                <button
                  onClick={() => setWaitlistOpen(false)}
                  className="px-6 py-2 rounded-full bg-k-cyan text-k-bg text-sm font-medium hover:bg-cyan-300 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-k-text">Join the Waitlist</h2>
                    <p className="text-sm text-k-muted mt-1">Get early access to Kurious.</p>
                  </div>
                  <button
                    onClick={() => setWaitlistOpen(false)}
                    className="text-k-muted hover:text-k-text transition-colors text-lg leading-none ml-4"
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleWaitlistSubmit}>
                  <input
                    type="email"
                    value={waitlistEmail}
                    onChange={e => setWaitlistEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full bg-k-bg border border-k-border rounded-xl px-4 py-3 text-sm text-k-text placeholder-k-muted/60 focus:outline-none focus:border-k-cyan transition-colors mb-4"
                  />
                  <button
                    type="submit"
                    disabled={waitlistState === 'submitting' || !waitlistEmail.trim()}
                    className="w-full py-3 rounded-xl bg-k-cyan text-k-bg text-sm font-medium hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {waitlistState === 'submitting' ? 'Submitting…' : 'Request Access'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
