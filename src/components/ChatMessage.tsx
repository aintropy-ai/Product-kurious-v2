import React from 'react';
import AnswerBlock from './AnswerBlock';
import ThinkingState from './ThinkingState';
import { ChatMessage as ChatMessageType, NewStreamEvent } from '../types';

const FRONTIER_MODEL_NAMES: Record<string, string> = {
  gpt4o: 'GPT-4o',
  gpt4omini: 'GPT-4o mini',
  gemini2flash: 'Gemini 2.0 Flash',
  gemini15pro: 'Gemini 1.5 Pro',
  claude: 'Claude 3.5 Sonnet',
  claude3haiku: 'Claude 3 Haiku',
  llama70b: 'Llama 3.1 70B',
};

interface ChatMessageProps {
  message: ChatMessageType;
  showFrontierComparison: boolean;
  selectedFrontierAPI: string;
  onAskAnotherAI: (messageId: string, model: string) => void;
  onCloseFrontier: (messageId: string) => void;
  onFeedback: (messageId: string, side: 'kurious' | 'frontier', rating: number, text: string) => void;
}

function streamDone(events: NewStreamEvent[]): boolean {
  return events.some(e => e.stage === 'done');
}

export const ChatMessageComponent: React.FC<ChatMessageProps> = ({
  message,
  showFrontierComparison,
  selectedFrontierAPI: _selectedFrontierAPI,
  onAskAnotherAI,
  onCloseFrontier,
  onFeedback,
}) => {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-6 animate-fade-in">
        <div className="max-w-2xl bg-k-cyan/10 border border-k-cyan/20 rounded-2xl px-5 py-3 text-k-text text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant message
  const hasFrontier = !!message.frontierResult;
  const events = message.streamEvents ?? [];
  const isDone = streamDone(events);

  return (
    <div className="mb-12 animate-fade-in">
      {/* Thinking state while streaming */}
      {message.streaming && !message.content && (
        <ThinkingState
          mode="quick"
          isDone={isDone}
          onComplete={() => {/* ChatPage handles commit via streaming flag */}}
        />
      )}

      {/* Answer */}
      {message.content && (
        <div className={hasFrontier ? 'grid grid-cols-2 gap-4 items-stretch' : ''}>
          {/* Kurious answer */}
          <div className={hasFrontier ? 'flex flex-col' : ''}>
            {hasFrontier && (
              <p className="text-xs text-k-muted uppercase tracking-widest mb-2 font-medium">Kurious</p>
            )}
            {message.content ? (
              <AnswerBlock
                answer={message.content}
                sources={message.sources}
                latency={message.elapsed_ms != null ? message.elapsed_ms / 1000 : null}
                onAskAnotherAI={hasFrontier ? undefined : (model) => onAskAnotherAI(message.id, model)}
                hideAskButton={hasFrontier}
                onFeedback={(rating, text) => onFeedback(message.id, 'kurious', rating, text)}
              />
            ) : null}
          </div>

          {/* Frontier comparison */}
          {hasFrontier && message.frontierResult && (
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-k-muted uppercase tracking-widest font-medium">
                  {FRONTIER_MODEL_NAMES[message.frontierResult.model] ?? message.frontierResult.model}
                </p>
                <button
                  onClick={() => onCloseFrontier(message.id)}
                  className="text-k-muted hover:text-k-text transition-colors text-sm leading-none"
                  title="Close comparison"
                >
                  ✕
                </button>
              </div>

              {message.frontierResult.error ? (
                <div className="border border-k-error/40 rounded-xl bg-k-card p-4 text-sm text-k-error">
                  {message.frontierResult.error}
                </div>
              ) : (
                <AnswerBlock
                  answer={message.frontierResult.answer}
                  latency={message.frontierResult.latency}
                  hideAskButton
                  onFeedback={(rating, text) => onFeedback(message.id, 'frontier', rating, text)}
                />
              )}
            </div>
          )}

          {/* Frontier loading */}
          {showFrontierComparison && message.frontierResult && !message.frontierResult.answer && !message.frontierResult.error && (
            <div className="flex flex-col">
              <p className="text-xs text-k-muted uppercase tracking-widest mb-2 font-medium">
                {FRONTIER_MODEL_NAMES[_selectedFrontierAPI] ?? _selectedFrontierAPI}
              </p>
              <div className="border border-k-border rounded-2xl bg-k-card p-6 flex-1 flex items-center gap-2.5 text-sm text-k-muted">
                <div className="w-3.5 h-3.5 border-2 border-k-muted border-t-transparent rounded-full animate-spin flex-shrink-0" />
                Generating…
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
