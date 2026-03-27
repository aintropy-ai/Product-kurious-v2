import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatInputArea } from '../components/ChatInputArea';
import ThinkingState from '../components/ThinkingState';
import EnhancedAnswerBlock from '../components/EnhancedAnswerBlock';
import {
  findDemoQuestion,
  SUGGESTION_CARDS,
  DemoQuestion,
  AGENCY_FILTERS,
} from '../data/demoData';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  demoQ?: DemoQuestion;
}

interface Bookmark {
  id: string;
  query: string;
  answerId: string;
  savedAt: number;
  demoQ: DemoQuestion;
}

const BOOKMARKS_KEY = 'kurious_v2_bookmarks';

function loadBookmarks(): Bookmark[] {
  try { return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) ?? '[]'); } catch { return []; }
}

function saveBookmarks(bm: Bookmark[]) {
  try { localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bm)); } catch {}
}

// ─── Bookmark panel ───────────────────────────────────────────────────────────
function BookmarkPanel({
  bookmarks,
  onClose,
  onDelete,
  onSelect,
}: {
  bookmarks: Bookmark[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onSelect: (q: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-k-nav border-l border-k-border flex flex-col animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-k-border">
          <div>
            <h2 className="text-sm font-semibold text-k-text">Saved Answers</h2>
            <p className="text-xs text-k-muted">{bookmarks.length} saved</p>
          </div>
          <button onClick={onClose} className="text-k-muted hover:text-k-text transition-colors text-lg">✕</button>
        </div>
        {bookmarks.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center px-8">
            <div>
              <p className="text-3xl mb-3">🔖</p>
              <p className="text-sm font-medium text-k-text mb-1">No saved answers yet</p>
              <p className="text-xs text-k-muted">Click the Save button on any answer to bookmark it here.</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {bookmarks.map(bm => (
              <div key={bm.id} className="border border-k-border rounded-xl bg-k-card p-4 group">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <button
                    onClick={() => { onSelect(bm.query); onClose(); }}
                    className="text-sm font-medium text-k-text hover:text-k-cyan transition-colors text-left"
                  >
                    {bm.query}
                  </button>
                  <button
                    onClick={() => onDelete(bm.id)}
                    className="text-k-muted hover:text-red-400 transition-colors text-xs flex-shrink-0 opacity-0 group-hover:opacity-100"
                    title="Remove bookmark"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-k-muted line-clamp-2">
                  {bm.demoQ.answer.replace(/\*\*/g, '').replace(/\[(\d+)\]/g, '').substring(0, 120)}…
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-k-muted">{new Date(bm.savedAt).toLocaleDateString()}</span>
                  <span className="text-[10px] text-k-cyan">{bm.demoQ.crossSiloAgencies.length} agencies</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Agency filter chips ──────────────────────────────────────────────────────
function AgencyFilters({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (agency: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {AGENCY_FILTERS.map(agency => (
        <button
          key={agency}
          onClick={() => onSelect(agency)}
          className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all duration-200 whitespace-nowrap ${
            selected === agency
              ? 'border-k-cyan text-k-cyan bg-k-cyan/10'
              : 'border-k-border text-k-muted hover:border-k-border/80 hover:text-k-text'
          }`}
        >
          {agency}
        </button>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export const DemoChatPage = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [pendingQ, setPendingQ] = useState<DemoQuestion | null>(null);
  const [searchMode, setSearchMode] = useState<'quick' | 'deep_think'>('quick');
  const [agencyFilter, setAgencyFilter] = useState('All agencies');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(loadBookmarks);
  const [bookmarkPanelOpen, setBookmarkPanelOpen] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const lastUserMsgRef = useRef<HTMLDivElement>(null);

  // Theme
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  // Scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isThinking]);

  useEffect(() => {
    if (lastUserMsgRef.current) {
      lastUserMsgRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [messages.filter(m => m.role === 'user').length]);

  const handleSearch = (query: string) => {
    if (!query.trim()) return;
    setHasStarted(true);

    const demoQ = findDemoQuestion(query);
    // Override mode from demo question
    if (demoQ.mode === 'deeper') setSearchMode('deep_think');

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
    };
    setMessages(prev => [...prev, userMsg]);

    setPendingQ(demoQ);
    setIsThinking(true);
  };

  const handleThinkingComplete = useCallback(() => {
    setIsThinking(false);

    if (!pendingQ) return;

    const assistantMsg: Message = {
      id: `asst-${Date.now()}`,
      role: 'assistant',
      content: pendingQ.answer,
      demoQ: pendingQ,
    };
    setMessages(prev => [...prev, assistantMsg]);
    setPendingQ(null);
  }, [pendingQ]);

  const handleBookmark = (msg: Message) => {
    if (!msg.demoQ) return;
    setBookmarks(prev => {
      const existing = prev.find(b => b.answerId === msg.id);
      let next: Bookmark[];
      if (existing) {
        next = prev.filter(b => b.answerId !== msg.id);
      } else {
        const bm: Bookmark = {
          id: `bm-${Date.now()}`,
          query: msg.demoQ!.query || msg.content,
          answerId: msg.id,
          savedAt: Date.now(),
          demoQ: msg.demoQ!,
        };
        next = [bm, ...prev];
      }
      saveBookmarks(next);
      return next;
    });
  };

  const handleDeleteBookmark = (id: string) => {
    setBookmarks(prev => {
      const next = prev.filter(b => b.id !== id);
      saveBookmarks(next);
      return next;
    });
  };

  const handleNewChat = () => {
    setMessages([]);
    setHasStarted(false);
    setIsThinking(false);
    setPendingQ(null);
  };

  // Voice input
  const handleVoiceInput = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Voice input is not supported in this browser. Try Chrome.'); return; }
    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    setVoiceActive(true);
    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      handleSearch(text);
      setVoiceActive(false);
    };
    recognition.onerror = () => setVoiceActive(false);
    recognition.onend = () => setVoiceActive(false);
    recognition.start();
  };

  const userMessages = messages.filter(m => m.role === 'user');
  const lastUserMsgId = userMessages[userMessages.length - 1]?.id;

  return (
    <div className="h-screen bg-k-bg flex flex-col">
      {/* Header — with bookmark button */}
      <header className="sticky top-0 z-30 bg-k-nav border-b border-k-border flex items-center px-6 h-14 gap-4">
        <button
          onClick={handleNewChat}
          className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity"
          title="New chat"
        >
          <img src="/logo.png" alt="AIntropy" className="h-7 w-auto" />
          <span className="text-xs font-normal text-gray-500 px-1 leading-none">v2</span>
        </button>

        <span className="flex-1 text-center text-sm text-k-muted hidden sm:block whitespace-nowrap">
          NJ Open Data — 57M+ records across 23 agencies, 8+ formats.
        </span>

        <div className="flex items-center gap-3 ml-auto flex-shrink-0">
          {/* Voice */}
          <button
            onClick={handleVoiceInput}
            title="Voice input"
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
              voiceActive
                ? 'border-red-400 text-red-400 bg-red-400/10 animate-pulse'
                : 'border-k-border text-k-muted hover:text-k-cyan hover:border-k-cyan'
            }`}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M8 1a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z"/>
              <path d="M4.25 9.25a.75.75 0 0 0-1.5 0 5.25 5.25 0 0 0 4.5 5.201V15.5a.75.75 0 0 0 1.5 0v-1.049a5.25 5.25 0 0 0 4.5-5.201.75.75 0 0 0-1.5 0A3.75 3.75 0 0 1 8 13a3.75 3.75 0 0 1-3.75-3.75Z"/>
            </svg>
          </button>

          {/* Bookmarks */}
          <button
            onClick={() => setBookmarkPanelOpen(true)}
            title="Saved answers"
            className="relative w-8 h-8 rounded-full border border-k-border text-k-muted hover:text-k-cyan hover:border-k-cyan flex items-center justify-center transition-all"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
              <path d="M3.75 2h8.5c.966 0 1.75.784 1.75 1.75v10.5a.75.75 0 0 1-1.218.586L8 11.564l-4.782 3.272A.75.75 0 0 1 2 14.25V3.75C2 2.784 2.784 2 3.75 2Z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {bookmarks.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-k-cyan text-k-bg text-[9px] font-bold rounded-full flex items-center justify-center">
                {bookmarks.length}
              </span>
            )}
          </button>

          {/* Theme */}
          <button
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            className="w-8 h-8 rounded-full border border-k-border text-k-muted hover:text-k-text flex items-center justify-center transition-all"
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            <span className="text-sm">{theme === 'dark' ? '☀️' : '🌙'}</span>
          </button>
        </div>
      </header>

      {/* Bookmark panel */}
      {bookmarkPanelOpen && (
        <BookmarkPanel
          bookmarks={bookmarks}
          onClose={() => setBookmarkPanelOpen(false)}
          onDelete={handleDeleteBookmark}
          onSelect={query => { setBookmarkPanelOpen(false); handleSearch(query); }}
        />
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Sticky input — only after chat started */}
        {hasStarted && (
          <ChatInputArea
            onSubmit={handleSearch}
            disabled={isThinking}
            mode={searchMode}
            onModeChange={setSearchMode}
            preloadedQuestions={SUGGESTION_CARDS}
          />
        )}

        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1 max-w-3xl mx-auto px-4 pt-4 pb-6 w-full">

            {/* Welcome state */}
            {!hasStarted && (
              <div className="animate-fade-in text-center pt-6">
                <h1 className="text-3xl font-bold text-k-text mb-2">Welcome to Kurious.</h1>
                <p className="text-k-muted mb-5 text-base leading-relaxed max-w-xl mx-auto">
                  Your AI-powered knowledge engine — what do you want to explore?
                </p>

                {/* Agency filter chips */}
                <div className="max-w-2xl mx-auto mb-5">
                  <AgencyFilters selected={agencyFilter} onSelect={setAgencyFilter} />
                </div>

                {/* Search bar */}
                <div className="max-w-2xl mx-auto mb-6">
                  <ChatInputArea
                    onSubmit={handleSearch}
                    disabled={isThinking}
                    mode={searchMode}
                    onModeChange={setSearchMode}
                    preloadedQuestions={SUGGESTION_CARDS}
                  />
                </div>

                {/* Suggestion cards */}
                <div className="max-w-2xl mx-auto">
                  <p className="text-xs text-k-muted uppercase tracking-widest mb-3 font-medium text-center">Try asking:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SUGGESTION_CARDS.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSearch(s)}
                        className="text-left border border-k-border rounded-xl p-4 text-sm text-k-muted hover:border-k-cyan hover:text-k-text transition-all duration-200 bg-k-card hover:bg-k-card/80 group"
                      >
                        <span className="text-k-cyan mr-2 group-hover:translate-x-0.5 inline-block transition-transform">→</span>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map(msg => {
              const isLastUser = msg.id === lastUserMsgId;
              if (msg.role === 'user') {
                return (
                  <div
                    key={msg.id}
                    ref={isLastUser ? lastUserMsgRef : undefined}
                    className="flex justify-end mb-4 mt-4"
                  >
                    <div className="max-w-lg bg-k-card border border-k-border rounded-2xl px-4 py-3 text-sm text-k-text">
                      {msg.content}
                    </div>
                  </div>
                );
              }
              // Assistant
              if (!msg.demoQ) return null;
              const isBookmarked = bookmarks.some(b => b.answerId === msg.id);
              return (
                <div key={msg.id} className="mb-8">
                  <EnhancedAnswerBlock
                    demoQ={msg.demoQ}
                    onRelatedQuestion={handleSearch}
                    bookmarked={isBookmarked}
                    onBookmark={() => handleBookmark(msg)}
                  />
                </div>
              );
            })}

            {/* Thinking animation */}
            {isThinking && pendingQ && (
              <div className="mb-8">
                <ThinkingState
                  mode={pendingQ.mode === 'deeper' ? 'deeper' : 'quick'}
                  isDone={false}
                  onComplete={handleThinkingComplete}
                  streamEvents={[]}
                />
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Footer */}
          <div className="mt-auto py-3 px-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs text-k-muted leading-relaxed">
              <strong className="text-k-muted">Disclaimer:</strong> Kurious answers questions about NJ Open Data only. This is a prototype demo showcasing Kurious V2 capabilities.
            </p>
            <a
              href="https://aintropy.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-k-muted hover:text-k-text transition-colors cursor-pointer inline-block mt-1"
            >
              Underlying technology may be protected by one or more patents pending under USPTO. © 2026 AIntropy
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};
