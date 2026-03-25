import React, { useState, useRef, useEffect } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  disabled?: boolean;
  preloadedQuestions?: string[];
  compact?: boolean; // true = single-line pill style for the sticky header
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  disabled = false,
  preloadedQuestions = [],
  compact = false,
}) => {
  const [query, setQuery] = useState('');
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !disabled) {
      setSuggestionsOpen(false);
      onSearch(query.trim());
      setQuery('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (query.trim() && !disabled) {
        setSuggestionsOpen(false);
        onSearch(query.trim());
        setQuery('');
      }
    }
  };

  const handleQuestionSelect = (question: string) => {
    setSuggestionsOpen(false);
    onSearch(question);
  };

  return (
    <div ref={containerRef} className="w-full">
      <form onSubmit={handleSubmit}>
        <div className={`flex items-center gap-2 bg-k-card border border-k-border transition-colors focus-within:border-k-cyan ${compact ? 'rounded-full px-4 py-2' : 'rounded-2xl px-4 py-3'}`}>
          {preloadedQuestions.length > 0 && (
            <button
              type="button"
              onClick={() => setSuggestionsOpen(v => !v)}
              disabled={disabled}
              className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-k-muted hover:text-k-cyan disabled:opacity-40 transition-colors rounded-full hover:bg-k-border"
              title="Example questions"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM8.94 6.94a.75.75 0 1 1-1.061-1.061 3 3 0 1 1 2.871 5.026v.345a.75.75 0 0 1-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 1 0 8.94 6.94ZM10 15a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
              </svg>
            </button>
          )}

          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Go ahead -- I answer at the speed of thought."
            disabled={disabled}
            className="search-input flex-1 bg-transparent text-k-text placeholder-k-muted/60 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          />

          <button
            type="submit"
            disabled={disabled || !query.trim()}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-k-cyan text-k-bg rounded-full hover:bg-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-k-muted/70 mt-2 px-1">
          Ask about anything — videos, documents, data, images and more.
        </p>
      </form>

      {suggestionsOpen && preloadedQuestions.length > 0 && (
        <div className="mt-2 border border-k-border rounded-xl bg-k-card overflow-hidden animate-fade-in z-50 relative">
          <p className="text-xs text-k-muted px-4 pt-3 pb-2 uppercase tracking-widest font-medium">Try asking:</p>
          <div className="max-h-52 overflow-y-auto">
            {preloadedQuestions.map((question, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuestionSelect(question)}
                className="w-full px-4 py-2.5 text-left text-sm text-k-muted hover:text-k-text hover:bg-k-border/30 transition-colors border-t border-k-border/40 first:border-t-0"
              >
                <span className="text-k-cyan mr-2">→</span>
                {question}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
