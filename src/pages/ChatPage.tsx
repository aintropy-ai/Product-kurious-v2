import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChatHeader } from '../components/ChatHeader';
import { ChatSidebar } from '../components/ChatSidebar';
import { WelcomeScreen } from '../components/WelcomeScreen';
import { ChatInputArea } from '../components/ChatInputArea';
import { ChatMessageComponent } from '../components/ChatMessage';
import AnswerBlock from '../components/AnswerBlock';
import ThinkingState from '../components/ThinkingState';
import {
  conversationApi,
  chatStreamSearch,
  backendApi,
} from '../services/backendApi';
import { frontierApi } from '../services/frontierApi';
import {
  ChatMessage,
  ConversationSummary,
  SearchMode,
  NewStreamEvent,
  SSEEventAnswer,
  SSEEventAnswerStart,
  SSEEventAnswerToken,
  SSEEventAnswerEnd,
  SSEEventDone,
  SourceAttribution,
} from '../types';

import njQuestions from '../../assets/njopendata_questions_preloaded.txt?raw';

const PRELOADED_QUESTIONS = njQuestions.split('\n---\n').filter(q => q.trim());
const SUGGESTION_CARDS = [
  "In the 2014 report, how many inmates participated in mandatory education programming, and what was their pass rate on the High School Equivalency (HSE) exam? How does this compare with the 2013 cohort's mandatory education group's - HSE pass rate?",
  "Which authority had the lowest year-to-date revenue in the most recent fiscal year?",
  "Which New Jersey townships have the most employees with terminal leave benefits?",
  "Which use category had the highest total construction costs?",
];

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

export const ChatPage = () => {
  const { conversationId: urlConversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();

  const firstName = getFirstNameFromJWT();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Sidebar
  const [sidebarConversations, setSidebarConversations] = useState<ConversationSummary[]>([]);
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(urlConversationId || null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Chat messages for the active conversation
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // In-flight state (mirrors NJSearchPage pattern)
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  const [pendingEvents, setPendingEvents] = useState<NewStreamEvent[]>([]);
  const [pendingAnswer, setPendingAnswer] = useState<string | null>(null);
  const [pendingAnswerTokens, setPendingAnswerTokens] = useState<string>('');
  const [pendingAnswerSources, setPendingAnswerSources] = useState<SourceAttribution[] | null>(null);
  const [pendingLatency, setPendingLatency] = useState<number | null>(null);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [animDone, setAnimDone] = useState(false);

  const streamDone = pendingEvents.some(e => e.stage === 'done');
  const isSearching = pendingQuery !== null;

  // Search mode
  const [searchMode, setSearchMode] = useState<SearchMode>('quick');

  const bottomRef = useRef<HTMLDivElement>(null);
  const pendingLogIdRef = useRef<number>(-1);
  const pendingConvIdRef = useRef<string | null>(null);

  // Theme
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  // Scroll: when a new user message arrives, scroll to it (not the bottom)
  // so the question stays visible. For all other state changes scroll to bottom.
  const userMsgs = messages.filter(m => m.role === 'user');
  const lastUserMsgId = userMsgs[userMsgs.length - 1]?.id;
  const lastUserMsgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [pendingAnswer, animDone]);

  useEffect(() => {
    if (lastUserMsgRef.current) {
      lastUserMsgRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [lastUserMsgId]);

  // Load sidebar conversations on mount
  useEffect(() => {
    setSidebarLoading(true);
    conversationApi.list().then(r => {
      setSidebarConversations(r.conversations);
    }).catch(() => {}).finally(() => setSidebarLoading(false));
  }, []);

  // Load messages when URL conversationId changes
  useEffect(() => {
    if (!urlConversationId) {
      setMessages([]);
      setActiveConversationId(null);
      setHasStarted(false);
      setMessagesLoading(false);
      return;
    }
    // If this conversation was just created by us, skip loading — we already have the messages in state
    if (urlConversationId === pendingConvIdRef.current) {
      setActiveConversationId(urlConversationId);
      return;
    }
    setActiveConversationId(urlConversationId);
    setMessagesLoading(true);
    conversationApi.getMessages(urlConversationId).then(({ messages: serverMsgs }) => {
      const hydrated: ChatMessage[] = serverMsgs
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          sources: m.sources_json ? (() => { try { return JSON.parse(m.sources_json!); } catch { return undefined; } })() : undefined,
          elapsed_ms: m.elapsed_ms ?? undefined,
          streaming: false,
        }));
      setMessages(hydrated);
      if (hydrated.length > 0) setHasStarted(true);
    }).catch(() => {}).finally(() => setMessagesLoading(false));
  }, [urlConversationId]);

  const NO_ANSWER_PHRASE = 'does not contain the answer';

  // Answer resolution: handle token-streamed answers and fallback to old API
  useEffect(() => {
    if (!streamDone || pendingAnswer || pendingError) return;
    if (!pendingQuery) return;

    // New streaming API: answer_token events (check if we have accumulated tokens with sources)
    if (pendingAnswerSources && pendingAnswerTokens) {
      setPendingAnswer(pendingAnswerTokens);
      return;
    }

    // New API: 'answer' stage event (non-streaming)
    const answerEvt = pendingEvents.find(e => e.stage === 'answer') as SSEEventAnswer | undefined;
    if (answerEvt) {
      setPendingAnswer(answerEvt.answer);
      return;
    }

    // Legacy API: 'unstructured' stage event
    const unstructuredEvt = (pendingEvents as any[]).find((e: any) => e.stage === 'unstructured') as any;
    if (unstructuredEvt?.answer && !unstructuredEvt.answer.toLowerCase().includes(NO_ANSWER_PHRASE)) {
      setPendingAnswer(unstructuredEvt.answer);
      return;
    }

    setPendingError('No answer received');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamDone, pendingEvents.length, pendingAnswerTokens, pendingAnswerSources]);

  // Commit: either when animation done AND answer ready, or when stream fully done with tokens
  useEffect(() => {
    if (!pendingQuery) return;
    if (!pendingAnswer && !pendingError) return;

    // For token streaming: commit once we have sources and stream is done
    // For legacy answer event: commit once animation is done
    const hasTokenSources = pendingAnswerSources && pendingAnswerTokens;
    const shouldCommit = (hasTokenSources && streamDone) || (animDone && !hasTokenSources);
    if (!shouldCommit) return;

    // Sources can come from: token streaming (answer_end), or legacy answer event
    const sources = pendingAnswerSources ||
                    (pendingEvents.find(e => e.stage === 'answer') as SSEEventAnswer | undefined)?.attributed_sources;

    const assistantMsg: ChatMessage = {
      id: `asst-${Date.now()}`,
      role: 'assistant',
      content: pendingAnswer ?? pendingError ?? '',
      sources,
      elapsed_ms: pendingLatency != null ? pendingLatency * 1000 : undefined,
      streamEvents: pendingEvents,
      streaming: false,
      searchLogId: pendingLogIdRef.current >= 0 ? pendingLogIdRef.current : undefined,
    };

    setMessages(prev => [...prev, assistantMsg]);

    // Refresh sidebar so the conversation title appears
    conversationApi.list().then(r => setSidebarConversations(r.conversations)).catch(() => {});

    // Reset pending state
    setPendingQuery(null);
    setPendingEvents([]);
    setPendingAnswer(null);
    setPendingAnswerTokens('');
    setPendingAnswerSources(null);
    setPendingLatency(null);
    setPendingError(null);
    setAnimDone(false);
    pendingLogIdRef.current = -1;
    pendingConvIdRef.current = null;
  }, [animDone, streamDone, pendingQuery, pendingAnswer, pendingError, pendingAnswerSources, pendingAnswerTokens]);

  const handleThinkingComplete = useCallback(() => {
    setAnimDone(true);
  }, []);

  const handleSearch = async (query: string) => {
    setHasStarted(true);

    // Optimistically add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
    };
    setMessages(prev => [...prev, userMsg]);

    setPendingQuery(query);
    setPendingEvents([]);
    setPendingAnswer(null);
    setPendingAnswerTokens('');
    setPendingAnswerSources(null);
    setPendingLatency(null);
    setPendingError(null);
    setAnimDone(false);
    pendingLogIdRef.current = -1;

    // Ensure conversation exists
    let convId = activeConversationId;
    if (!convId) {
      try {
        const title = query.length > 60 ? query.slice(0, 60).trimEnd() + '…' : query;
        const conv = await conversationApi.create(searchMode, title);
        convId = conv.id;
        pendingConvIdRef.current = convId;
        setActiveConversationId(convId);
        navigate(`/chat/${convId}`, { replace: true });
        // Optimistically add to sidebar immediately with the title
        setSidebarConversations(prev => [
          { id: conv.id, title, mode: searchMode, created_at: conv.created_at, updated_at: conv.updated_at },
          ...prev,
        ]);
      } catch {
        // Continue without conversation tracking
      }
    }

    try {
      const { id } = await backendApi.createSearchLog({ question: query });
      pendingLogIdRef.current = id;
    } catch {
      // silent
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);

    try {
      await chatStreamSearch(
        { query, mode: searchMode, conversation_id: convId ?? undefined },
        {
          onEvent: (event: NewStreamEvent) => {
            setPendingEvents(prev => [...prev, event]);
          },
          onAnswer: (_evt: SSEEventAnswer) => {},
          onAnswerStart: (_evt: SSEEventAnswerStart) => {
            setPendingAnswerTokens('');
          },
          onAnswerToken: (evt: SSEEventAnswerToken) => {
            setPendingAnswerTokens(prev => prev + evt.token);
          },
          onAnswerEnd: (evt: SSEEventAnswerEnd) => {
            setPendingAnswerSources(evt.attributed_sources);
          },
          onDone: (evt: SSEEventDone) => {
            setPendingLatency(evt.total_elapsed_ms / 1000);
          },
          onError: (evt) => {
            setPendingError(evt.detail);
            setPendingEvents(prev => [...prev, { stage: 'done', total_elapsed_ms: 0 } as NewStreamEvent]);
          },
        },
        controller.signal
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setPendingError(err.message || 'Network error');
        setPendingEvents(prev => [
          ...prev,
          { stage: 'done', total_elapsed_ms: 0 } as NewStreamEvent,
        ]);
      }
    } finally {
      clearTimeout(timeout);
    }

  };

  const handleAskAnotherAI = async (messageId: string, modelValue: string) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId
        ? { ...m, frontierResult: { model: modelValue, answer: '', latency: 0, error: undefined } }
        : m
    ));

    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;

    // Find the user message that preceded this assistant message
    const msgIdx = messages.findIndex(m => m.id === messageId);
    const userMsg = msgIdx > 0 ? messages[msgIdx - 1] : null;
    if (!userMsg || userMsg.role !== 'user') return;

    const startTime = Date.now();
    try {
      const result = await frontierApi.search(modelValue, userMsg.content);
      const latency = (Date.now() - startTime) / 1000;
      setMessages(prev => prev.map(m =>
        m.id === messageId
          ? { ...m, frontierResult: { model: modelValue, answer: result.answer, latency, error: undefined } }
          : m
      ));
    } catch (err: any) {
      setMessages(prev => prev.map(m =>
        m.id === messageId
          ? { ...m, frontierResult: { model: modelValue, answer: '', latency: 0, error: err.message || 'Failed' } }
          : m
      ));
    }
  };

  const handleCloseFrontier = (messageId: string) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, frontierResult: undefined } : m
    ));
  };

  const handleFeedback = (messageId: string, side: 'kurious' | 'frontier', rating: number, text: string) => {
    const msg = messages.find(m => m.id === messageId);
    const logId = msg?.searchLogId ?? -1;
    console.log('[handleFeedback] messageId:', messageId, 'side:', side, 'rating:', rating, 'logId:', logId, 'msg?.searchLogId:', msg?.searchLogId);
    if (side === 'kurious') {
      backendApi.submitFeedback(logId, { kurious_rating: rating, kurious_feedback_text: text });
    } else {
      backendApi.submitFeedback(logId, { frontier_rating: rating, frontier_feedback_text: text });
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setHasStarted(false);
    setActiveConversationId(null);
    setPendingQuery(null);
    navigate('/chat');
  };

  const handleSelectConversation = (id: string) => {
    if (id === activeConversationId) return;
    navigate(`/chat/${id}`);
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await conversationApi.delete(id);
      setSidebarConversations(prev => prev.filter(c => c.id !== id));
      if (id === activeConversationId) {
        handleNewChat();
      }
    } catch {
      // silent
    }
  };

  return (
    <div className="h-screen bg-k-bg flex flex-col">
      <ChatHeader
        firstName={firstName}
        theme={theme}
        onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        onNewChat={handleNewChat}
      />

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <ChatSidebar
            conversations={sidebarConversations}
            activeConversationId={activeConversationId}
            loading={sidebarLoading}
            onNewChat={handleNewChat}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={handleDeleteConversation}
            onToggleSidebar={() => setSidebarOpen(false)}
          />
        )}

        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex-shrink-0 w-12 border-r border-k-border bg-k-nav flex items-center justify-center text-k-muted hover:text-k-text transition-colors text-lg font-light"
            title="Open sidebar"
          >
            &gt;
          </button>
        )}

        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Sticky input area — only shown when chat has started */}
          {hasStarted && (
            <ChatInputArea
              onSubmit={handleSearch}
              disabled={isSearching}
              mode={searchMode}
              onModeChange={setSearchMode}
              preloadedQuestions={PRELOADED_QUESTIONS}
            />
          )}

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto flex flex-col">
            <div className="flex-1 max-w-5xl mx-auto px-4 pt-2 pb-4 w-full">

              {/* Loading animation */}
              {messagesLoading && (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="space-y-3">
                      {/* User message skeleton */}
                      <div className="flex justify-end">
                        <div className="max-w-xs bg-k-blue rounded-2xl p-4 h-12 w-32 animate-pulse" />
                      </div>
                      {/* Assistant message skeleton */}
                      <div className="border border-k-border rounded-2xl bg-k-card p-6 space-y-3">
                        <div className="h-4 bg-k-border rounded w-3/4 animate-pulse" />
                        <div className="h-4 bg-k-border rounded w-5/6 animate-pulse" />
                        <div className="h-4 bg-k-border rounded w-2/3 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Welcome / idle state */}
              {!hasStarted && !messagesLoading && (
                <WelcomeScreen
                  firstName={firstName}
                  onQuestionSelect={handleSearch}
                  suggestions={SUGGESTION_CARDS}
                  inputArea={
                    <ChatInputArea
                      onSubmit={handleSearch}
                      disabled={isSearching}
                      mode={searchMode}
                      onModeChange={setSearchMode}
                      preloadedQuestions={PRELOADED_QUESTIONS}
                    />
                  }
                />
              )}

              {/* Committed messages */}
              {messages.map((msg) => {
                if (msg.role === 'user') {
                  const isLastUser = msg.id === lastUserMsgId;
                  return (
                    <div key={msg.id} ref={isLastUser ? lastUserMsgRef : undefined}>
                      <ChatMessageComponent
                        message={msg}
                        showFrontierComparison={false}
                        selectedFrontierAPI="claude"
                        onAskAnotherAI={handleAskAnotherAI}
                        onCloseFrontier={handleCloseFrontier}
                        onFeedback={handleFeedback}
                      />
                    </div>
                  );
                }
                const hasFrontier = !!msg.frontierResult;
                return (
                  <div key={msg.id}>
                    <ChatMessageComponent
                      message={msg}
                      showFrontierComparison={hasFrontier}
                      selectedFrontierAPI={msg.frontierResult?.model ?? 'claude'}
                      onAskAnotherAI={handleAskAnotherAI}
                      onCloseFrontier={handleCloseFrontier}
                      onFeedback={handleFeedback}
                    />
                  </div>
                );
              })}


              {/* In-flight ThinkingState or Streaming Answer */}
              {isSearching && (
                <div className="mb-12">
                  {pendingAnswerTokens ? (
                    // Show streaming answer with sources once tokens start arriving
                    <div className="border border-k-border rounded-2xl bg-k-card p-6 animate-fade-in">
                      <div className="mb-5">
                        <AnswerBlock
                          answer={pendingAnswerTokens}
                          sources={pendingAnswerSources ?? undefined}
                          latency={pendingLatency ?? undefined}
                          hideAskButton={true}
                        />
                      </div>
                      {!streamDone && (
                        <div className="flex items-center gap-2 text-xs text-k-muted pt-4 border-t border-k-border">
                          <div className="w-2 h-2 bg-k-cyan rounded-full animate-pulse" />
                          Streaming response...
                        </div>
                      )}
                    </div>
                  ) : (
                    // Show progress animation before tokens arrive
                    <ThinkingState
                      mode={searchMode === 'deep_think' ? 'deeper' : 'quick'}
                      isDone={streamDone}
                      onComplete={handleThinkingComplete}
                      streamEvents={pendingEvents}
                    />
                  )}
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Disclaimer footer */}
            <div className="mt-auto py-3 px-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs text-k-muted leading-relaxed">
                <strong className="text-k-muted">Disclaimer:</strong> Kurious answers questions about NJ Open Data only. It is not a general-purpose AI and cannot answer questions outside this dataset, for now.
              </p>
              <p className="text-xs text-k-muted mt-1">
                This is an early alpha research preview. Responses may be incomplete or inaccurate. Do not use for legal, medical, or financial decisions.
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
    </div>
  );
};
