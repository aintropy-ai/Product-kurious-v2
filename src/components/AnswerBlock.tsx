import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { StreamSource } from '../types';
import FeedbackBar from './FeedbackBar';

const FRONTIER_MODELS = [
  { name: 'GPT-4o', value: 'gpt4o' },
  { name: 'GPT-4o mini', value: 'gpt4omini' },
  { name: 'Gemini 2.0 Flash', value: 'gemini2flash' },
  { name: 'Claude 3.5 Sonnet', value: 'claude' },
  { name: 'Claude 3 Haiku', value: 'claude3haiku' },
  { name: 'Llama 3.1 70B', value: 'llama70b' },
];

function unwrapFencedTables(text: string): string {
  return text.replace(/```[^\n]*\n((?:\|[^\n]+\n)+)```/g, '$1');
}

function MarkdownAnswer({ text }: { text: string }) {
  return (
    <div className="prose prose-sm prose-invert max-w-none
      prose-p:text-k-text prose-p:leading-relaxed
      prose-headings:text-k-text prose-headings:font-semibold
      prose-strong:text-k-text
      prose-a:text-k-cyan hover:prose-a:text-cyan-300
      prose-code:text-k-cyan prose-code:bg-k-bg prose-code:px-1 prose-code:rounded
      prose-pre:bg-k-bg prose-pre:text-k-muted
      prose-li:text-k-text prose-ol:text-k-text prose-ul:text-k-text
      prose-blockquote:border-l-k-border prose-blockquote:text-k-muted
      prose-table:text-sm prose-th:text-k-muted prose-td:text-k-text">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {unwrapFencedTables(text)}
      </ReactMarkdown>
    </div>
  );
}

interface AnswerBlockProps {
  answer: string;
  sources?: StreamSource[];
  latency?: number | null;
  label?: string;
  onAskAnotherAI?: (modelValue: string) => void;
  hideAskButton?: boolean;
  onFeedback?: (rating: number, text: string) => void;
}

export default function AnswerBlock({
  answer,
  sources = [],
  latency,
  label,
  onAskAnotherAI,
  hideAskButton = false,
  onFeedback,
}: AnswerBlockProps) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);

  const seenUrls = new Set<string>();
  const uniqueSources = sources.map(src => ({
    linkUrl: src.source_parent || src.source || src.url,
    linkText: src.title || src.h1 || '(no title)',
  })).filter(({ linkUrl }) => {
    if (!linkUrl) return true; // no URL — always include, don't deduplicate by name
    if (seenUrls.has(linkUrl)) return false;
    seenUrls.add(linkUrl);
    return true;
  });

  return (
    <div className="border border-k-border rounded-2xl bg-k-card p-6 animate-fade-in h-full flex flex-col">
      {label && (
        <p className="text-xs text-k-muted uppercase tracking-widest mb-3 font-medium">{label}</p>
      )}

      <div className="mb-5 flex-1">
        <MarkdownAnswer text={answer} />
      </div>

      {uniqueSources.length > 0 && (
        <div className="mb-5">
          <button
            onClick={() => setSourcesOpen(v => !v)}
            className="flex items-center gap-1.5 text-xs text-k-muted hover:text-k-text transition-colors"
          >
            <span className={`transition-transform duration-200 inline-block ${sourcesOpen ? 'rotate-90' : ''}`}>▶</span>
            <span>{uniqueSources.length} source{uniqueSources.length !== 1 ? 's' : ''}</span>
          </button>
          <div
            className="sources-panel"
            style={{ maxHeight: sourcesOpen ? '20rem' : '0', opacity: sourcesOpen ? 1 : 0 }}
          >
            <ol className="mt-3 space-y-1.5">
              {uniqueSources.map(({ linkUrl, linkText }, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-k-muted">
                  <span className="flex-shrink-0">{i + 1}.</span>
                  {linkUrl ? (
                    <a href={linkUrl} target="_blank" rel="noopener noreferrer"
                      className="text-k-muted hover:text-k-cyan underline underline-offset-2 transition-colors">
                      {linkText}
                    </a>
                  ) : (
                    <span>{linkText}</span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-k-border">
        <div className="flex items-center gap-3">
          {latency != null && (
            <span className="text-xs text-k-muted">{latency.toFixed(2)}s</span>
          )}
          {onAskAnotherAI && !hideAskButton && (
            <div className="relative">
              <button
                onClick={() => setModelPickerOpen(v => !v)}
                className="flex items-center gap-1.5 text-xs text-k-muted hover:text-k-cyan border border-k-border hover:border-k-cyan rounded-full px-3 py-1 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1zm0 1.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zm0 2a.75.75 0 0 1 .75.75v2.5h2.5a.75.75 0 0 1 0 1.5h-2.5v2.5a.75.75 0 0 1-1.5 0v-2.5h-2.5a.75.75 0 0 1 0-1.5h2.5v-2.5A.75.75 0 0 1 8 4.5z"/>
                </svg>
                Ask another AI
              </button>

              {modelPickerOpen && (
                <div className="absolute left-0 top-full mt-2 w-48 bg-k-card border border-k-border rounded-xl shadow-xl py-1 animate-fade-in z-50">
                  {FRONTIER_MODELS.map(model => (
                    <button
                      key={model.value}
                      onClick={() => {
                        setModelPickerOpen(false);
                        onAskAnotherAI(model.value);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-k-muted hover:text-k-text hover:bg-k-border/20 transition-colors"
                    >
                      {model.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <FeedbackBar onFeedback={onFeedback} />
      </div>
    </div>
  );
}
