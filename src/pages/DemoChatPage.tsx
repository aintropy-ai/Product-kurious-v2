import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatInputArea } from '../components/ChatInputArea';
import ThinkingState from '../components/ThinkingState';
import EnhancedAnswerBlock from '../components/EnhancedAnswerBlock';
import { ProjectSidebar, MembersPanel, Project, Member } from '../components/ProjectSidebar';
import {
  findDemoQuestion,
  SUGGESTION_CARDS,
  DemoQuestion,
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
  bookmarks, onClose, onDelete, onSelect,
}: {
  bookmarks: Bookmark[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onSelect: (q: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-k-nav border-l border-k-border flex flex-col shadow-2xl">
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
              <p className="text-xs text-k-muted">Hover any answer and click the bookmark icon.</p>
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

// ─── Main page ────────────────────────────────────────────────────────────────
export const DemoChatPage = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [pendingQ, setPendingQ] = useState<DemoQuestion | null>(null);
  const [searchMode, setSearchMode] = useState<'quick' | 'deep_think'>('quick');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(loadBookmarks);
  const [bookmarkPanelOpen, setBookmarkPanelOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [chatTitle, setChatTitle] = useState<string>('');
  const [voiceActive, setVoiceActive] = useState(false);
  const [suggestionPage, setSuggestionPage] = useState(0);
const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeProjectRole, setActiveProjectRole] = useState<Member['role']>('Admin');
  const [membersPanelOpen, setMembersPanelOpen] = useState(false);
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [titleEditValue, setTitleEditValue] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);
  const lastUserRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isThinking]);

  const userMsgs = messages.filter(m => m.role === 'user');
  const lastUserMsgId = userMsgs[userMsgs.length - 1]?.id;

  useEffect(() => {
    lastUserRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [lastUserMsgId]);

  const handleSearch = (query: string) => {
    if (!query.trim() || isThinking) return;
    setHasStarted(true);

    const demoQ = findDemoQuestion(query);
    if (demoQ.mode === 'deeper') setSearchMode('deep_think');

    if (!chatTitle) setChatTitle(query.length > 50 ? query.slice(0, 50) + '…' : query);

    setMessages(prev => [...prev, { id: `user-${Date.now()}`, role: 'user', content: query }]);
    setPendingQ(demoQ);
    setIsThinking(true);
  };

  const handleThinkingComplete = useCallback(() => {
    setIsThinking(false);
    if (!pendingQ) return;
    setMessages(prev => [...prev, {
      id: `asst-${Date.now()}`,
      role: 'assistant',
      content: pendingQ.answer,
      demoQ: pendingQ,
    }]);
    setPendingQ(null);
  }, [pendingQ]);

  const handleBookmark = (msg: Message) => {
    if (!msg.demoQ) return;
    setBookmarks(prev => {
      const existing = prev.find(b => b.answerId === msg.id);
      const next = existing
        ? prev.filter(b => b.answerId !== msg.id)
        : [{ id: `bm-${Date.now()}`, query: msg.demoQ!.query || msg.content, answerId: msg.id, savedAt: Date.now(), demoQ: msg.demoQ! }, ...prev];
      saveBookmarks(next);
      return next;
    });
  };

  const handleNewChat = () => {
    setMessages([]);
    setHasStarted(false);
    setIsThinking(false);
    setPendingQ(null);
    setActiveConvId(null);
    setChatTitle('');
    setSearchMode('quick');
  };

  const handleSelectConversation = (id: string, title: string) => {
    handleNewChat();
    setActiveConvId(id);
    setChatTitle(title);
  };

  const handleVoiceInput = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Voice input requires Chrome or Safari.'); return; }
    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    setVoiceActive(true);
    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setVoiceActive(false);
      handleSearch(text);
    };
    recognition.onerror = () => setVoiceActive(false);
    recognition.onend = () => setVoiceActive(false);
    recognition.start();
  };

  return (
    <div className={`h-screen bg-k-bg flex flex-col ${theme}`}>

      {/* ── Top header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-k-nav border-b border-k-border flex items-center px-4 h-12 gap-3 flex-shrink-0">
        {/* Logo */}
        <button onClick={handleNewChat} className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity">
          <img src="/logo.png" alt="AIntropy" className="h-6 w-auto" />
          <span className="text-sm font-semibold text-k-text">Kurious</span>
          <span className="text-[10px] font-normal text-gray-500 leading-none px-1.5 py-0.5 rounded-full border border-gray-700">alpha</span>
        </button>

        {/* Chat title */}
        {chatTitle && (
          <div className="flex-1 flex justify-center min-w-0 px-4">
            {isTitleEditing ? (
              <input
                autoFocus
                value={titleEditValue}
                onChange={e => setTitleEditValue(e.target.value)}
                onBlur={() => { if (titleEditValue.trim()) setChatTitle(titleEditValue.trim()); setIsTitleEditing(false); }}
                onKeyDown={e => {
                  if (e.key === 'Enter') { if (titleEditValue.trim()) setChatTitle(titleEditValue.trim()); setIsTitleEditing(false); }
                  if (e.key === 'Escape') setIsTitleEditing(false);
                }}
                className="bg-k-card border border-k-cyan rounded-lg px-3 py-1 text-sm text-k-text focus:outline-none max-w-sm w-full text-center"
              />
            ) : (
              <div className="group flex items-center gap-1.5 max-w-sm min-w-0">
                <span className="text-sm font-semibold text-k-text/80 truncate">{chatTitle}</span>
                <button
                  onClick={() => { setTitleEditValue(chatTitle); setIsTitleEditing(true); }}
                  title="Rename chat"
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-k-muted hover:text-k-cyan"
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                    <path d="M11.013 2.513a1.75 1.75 0 0 1 2.475 2.474L6.226 12.25a2.751 2.751 0 0 1-.892.58l-2.185.91a.75.75 0 0 1-.977-.977l.91-2.184a2.75 2.75 0 0 1 .579-.892l7.352-7.174Z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {!chatTitle && <div className="flex-1" />}

        {/* Right actions */}
        <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
          <button
            onClick={() => setBookmarkPanelOpen(true)}
            title="Saved answers"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-k-muted hover:text-k-text hover:bg-k-border/30 transition-colors relative"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
              <path d="M3.75 2h8.5c.966 0 1.75.784 1.75 1.75v10.5a.75.75 0 0 1-1.218.586L8 11.564l-4.782 3.272A.75.75 0 0 1 2 14.25V3.75C2 2.784 2.784 2 3.75 2Z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {bookmarks.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-k-cyan rounded-full text-[8px] font-bold text-k-bg flex items-center justify-center">
                {bookmarks.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── Body: sidebar + main ─────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left sidebar */}
        <div className="relative flex-shrink-0 flex">
          {/* Cyan accent strip — glows when sidebar is collapsed */}
          <div
            className="flex-shrink-0 transition-all duration-250 ease-in-out"
            style={{
              width: sidebarOpen ? 0 : 3,
              background: sidebarOpen ? 'transparent' : '#00D4FF',
              boxShadow: sidebarOpen ? 'none' : '2px 0 10px rgba(0,212,255,0.3)',
            }}
          />

          {/* Sidebar content */}
          <div className={`transition-all duration-250 ease-in-out overflow-hidden ${sidebarOpen ? 'w-64' : 'w-0'}`}>
            {sidebarOpen && (
              <ProjectSidebar
                activeConvId={activeConvId}
                onNewChat={handleNewChat}
                onSelectConversation={handleSelectConversation}
                onActiveProjectChange={(p, role) => { setActiveProject(p); setActiveProjectRole(role); setMembersPanelOpen(false); }}
                theme={theme}
                onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              />
            )}
          </div>

          {/* Toggle tab — always at the sidebar's right boundary */}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            className="absolute top-3 z-20 w-5 h-8 rounded-r-lg flex items-center justify-center text-k-muted hover:text-k-cyan transition-all duration-150 group"
            style={{
              right: -20,
              background: 'var(--k-card)',
              border: '1px solid var(--k-border)',
              borderLeft: 'none',
              boxShadow: '2px 0 6px rgba(0,0,0,0.35)',
            }}
          >
            <svg
              viewBox="0 0 8 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`w-2.5 h-3 transition-transform duration-250 ${sidebarOpen ? '' : 'rotate-180'}`}
            >
              <polyline points="6,1 2,6 6,11" />
            </svg>
          </button>
        </div>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden relative">

          {/* ── Project members button (top-right, below header) ─────────── */}
          {activeProject && (
            <div className="absolute top-3 right-4 z-20">
              <button
                onClick={() => setMembersPanelOpen(true)}
                className="flex items-center gap-1.5 text-xs text-k-muted hover:text-k-text border border-k-border hover:border-k-border/80 rounded-lg px-3 py-1.5 bg-k-nav hover:bg-k-card transition-all"
              >
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
                  <path d="M2 5.5a3.5 3.5 0 1 1 5.898 2.549 5.508 5.508 0 0 1 3.034 4.084.75.75 0 1 1-1.482.235 4 4 0 0 0-7.9 0 .75.75 0 0 1-1.482-.236A5.507 5.507 0 0 1 3.102 8.05 3.493 3.493 0 0 1 2 5.5ZM11 4a.75.75 0 1 0 0 1.5 1.5 1.5 0 0 1 .666 2.844.75.75 0 0 0-.416.672v.352a.75.75 0 0 0 .574.73c1.2.289 2.162 1.2 2.522 2.372a.75.75 0 1 0 1.434-.44 5.01 5.01 0 0 0-2.56-3.012A3 3 0 0 0 11 4ZM5.5 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>
                </svg>
                {activeProjectRole === 'Admin' ? 'Manage members' : 'View members'}
              </button>
            </div>
          )}

          {/* ── Scrollable messages area ──────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-6 pt-6 pb-4 w-full">

              {/* Welcome state */}
              {!hasStarted && (
                <div
                  className="animate-fade-in pt-12 pb-8 transition-transform duration-300"
                  style={{ transform: sidebarOpen ? 'translateX(-128px)' : 'none' }}
                >

                  <div className="flex flex-col items-center text-center">
                    <h1 className="text-3xl font-semibold text-k-text mb-2">Welcome back, Kunal.</h1>
                    <p className="text-k-muted text-base mb-8 max-w-md">
                      Your AI knowledge engine. What do you want to explore today?
                    </p>

                    {/* Inline input */}
                    <div className="w-full max-w-2xl mb-6">
                      <ChatInputArea
                        onSubmit={handleSearch}
                        disabled={isThinking}
                        mode={searchMode}
                        onModeChange={setSearchMode}
                        preloadedQuestions={SUGGESTION_CARDS}
                        onVoice={handleVoiceInput}
                        voiceActive={voiceActive}
                      />
                    </div>

                    {/* Suggestion pills */}
                    {(() => {
                      const pageSize = 4;
                      const start = (suggestionPage * pageSize) % SUGGESTION_CARDS.length;
                      const visible = Array.from({ length: pageSize }, (_, i) =>
                        SUGGESTION_CARDS[(start + i) % SUGGESTION_CARDS.length]
                      );
                      return (
                        <>
                          <div className="flex flex-wrap justify-center gap-2">
                            {visible.map((s, i) => (
                              <button key={`${suggestionPage}-${i}`} onClick={() => handleSearch(s)}
                                className="text-xs text-k-muted hover:text-k-text border border-k-border hover:border-k-cyan/40 rounded-full px-4 py-2 transition-all duration-200 hover:bg-k-card/60 flex items-center gap-1.5 group animate-fade-in">
                                <span className="text-k-cyan/60 group-hover:text-k-cyan transition-colors">→</span>
                                {s.length > 48 ? s.slice(0, 48) + '…' : s}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => setSuggestionPage(p => p + 1)}
                            className="mt-4 flex items-center gap-1.5 text-xs text-k-muted/60 hover:text-k-cyan transition-colors mx-auto"
                          >
                            <span className="text-k-cyan/50">✦</span>
                            More ideas
                          </button>
                        </>
                      );
                    })()}
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
                      ref={isLastUser ? lastUserRef : undefined}
                      className="flex justify-end mb-6 mt-2"
                    >
                      <div className="max-w-lg bg-k-card border border-k-border rounded-2xl px-4 py-3 text-sm text-k-text animate-slide-up">
                        {msg.content}
                      </div>
                    </div>
                  );
                }
                if (!msg.demoQ) return null;
                const isBookmarked = bookmarks.some(b => b.answerId === msg.id);
                return (
                  <div key={msg.id} className="mb-10">
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
          </div>

          {/* ── Sticky input at bottom (chat state only) ──────────────────── */}
          {hasStarted && <div className="flex-shrink-0 border-t border-k-border/40 bg-k-bg">
            <div className="max-w-3xl mx-auto px-6 py-3">
              <ChatInputArea
                onSubmit={handleSearch}
                disabled={isThinking}
                mode={searchMode}
                onModeChange={setSearchMode}
                preloadedQuestions={SUGGESTION_CARDS}
                onVoice={handleVoiceInput}
                voiceActive={voiceActive}
              />
            </div>
            <p className="text-center text-[10px] text-k-muted/40 pb-2">
              Kurious · NJ Open Data demo · 85M+ records
            </p>
          </div>}
        </main>
      </div>

      {/* Members panel */}
      {membersPanelOpen && activeProject && (
        <MembersPanel
          project={activeProject}
          demoRole={activeProjectRole}
          onClose={() => setMembersPanelOpen(false)}
        />
      )}

      {/* Bookmark panel */}
      {bookmarkPanelOpen && (
        <BookmarkPanel
          bookmarks={bookmarks}
          onClose={() => setBookmarkPanelOpen(false)}
          onDelete={id => setBookmarks(prev => { const n = prev.filter(b => b.id !== id); saveBookmarks(n); return n; })}
          onSelect={q => { setBookmarkPanelOpen(false); handleSearch(q); }}
        />
      )}
    </div>
  );
};
