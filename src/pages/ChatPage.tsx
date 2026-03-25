import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChatHeader } from '../components/ChatHeader';
import { ChatSidebar } from '../components/ChatSidebar';
import { WelcomeScreen } from '../components/WelcomeScreen';
import { ChatInputArea } from '../components/ChatInputArea';
import { ChatMessageComponent } from '../components/ChatMessage';
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
  SSEEventDone,
} from '../types';

import njQuestions from '../../assets/njopendata_questions_preloaded.txt?raw';

const PRELOADED_QUESTIONS = njQuestions.split('\n---\n').filter(q => q.trim());
const SUGGESTION_CARDS = PRELOADED_QUESTIONS.slice(0, 4);

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

  // In-flight state (mirrors NJSearchPage pattern)
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  const [pendingEvents, setPendingEvents] = useState<NewStreamEvent[]>([]);
  const [pendingAnswer, setPendingAnswer] = useState<string | null>(null);
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

  // Scroll to bottom on new messages / pending state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, pendingQuery, pendingAnswer, animDone]);

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
      return;
    }
    setActiveConversationId(urlConversationId);
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
    }).catch(() => {});
  }, [urlConversationId]);

  const NO_ANSWER_PHRASE = 'does not contain the answer';

  // Answer resolution: once stream done, extract answer from events
  useEffect(() => {
    if (!streamDone || pendingAnswer || pendingError) return;
    if (!pendingQuery) return;

    // New API: 'answer' stage event
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
  }, [streamDone, pendingEvents.length]);

  // Commit: when ThinkingState animation done AND answer ready
  useEffect(() => {
    if (!animDone || !pendingQuery) return;
    if (!pendingAnswer && !pendingError) return;

    const answerEvt = pendingEvents.find(e => e.stage === 'answer') as SSEEventAnswer | undefined;

    const assistantMsg: ChatMessage = {
      id: `asst-${Date.now()}`,
      role: 'assistant',
      content: pendingAnswer ?? pendingError ?? '',
      sources: answerEvt?.attributed_sources,
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
    setPendingLatency(null);
    setPendingError(null);
    setAnimDone(false);
    pendingLogIdRef.current = -1;
    pendingConvIdRef.current = null;
  }, [animDone, pendingQuery, pendingAnswer, pendingError]);

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

    try {
      const { id } = await backendApi.createSearchLog({ question: query });
      pendingLogIdRef.current = id;
    } catch {
      // silent
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
    <div className="min-h-screen bg-k-bg flex flex-col">
      <ChatHeader
        firstName={firstName}
        theme={theme}
        onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
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
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-5xl mx-auto px-4 py-8">

              {/* Welcome / idle state */}
              {!hasStarted && (
                <WelcomeScreen
                  firstName={firstName}
                  onQuestionSelect={handleSearch}
                  suggestions={SUGGESTION_CARDS}
                />
              )}

              {/* Committed messages */}
              {messages.map((msg) => {
                if (msg.role === 'user') {
                  return (
                    <ChatMessageComponent
                      key={msg.id}
                      message={msg}
                      showFrontierComparison={false}
                      selectedFrontierAPI="claude"
                      onAskAnotherAI={handleAskAnotherAI}
                      onCloseFrontier={handleCloseFrontier}
                      onFeedback={handleFeedback}
                    />
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


              {/* In-flight ThinkingState */}
              {isSearching && (
                <div className="mb-12">
                  <h2 className="text-base font-semibold text-k-text mb-4">{pendingQuery}</h2>
                  <ThinkingState
                    mode={searchMode === 'deep_think' ? 'deeper' : 'quick'}
                    isDone={streamDone}
                    onComplete={handleThinkingComplete}
                    streamEvents={pendingEvents}
                  />
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* Sticky input area */}
          <ChatInputArea
            onSubmit={handleSearch}
            disabled={isSearching}
            mode={searchMode}
            onModeChange={setSearchMode}
            preloadedQuestions={PRELOADED_QUESTIONS}
          />

          {/* Copyright footer */}
          <div className="py-1 px-4 text-right">
            <a
              href="https://aintropy.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-k-muted hover:text-k-text transition-colors cursor-pointer inline-block"
            >
              © 2026 AIntropy — Advanced AI Search
            </a>
          </div>
        </main>
      </div>
    </div>
  );
};
