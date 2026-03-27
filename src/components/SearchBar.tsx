import React, { useState, useRef } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  disabled?: boolean;
  preloadedQuestions?: string[];
  compact?: boolean;
  onVoice?: () => void;
  voiceActive?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  disabled = false,
  compact = false,
  onVoice,
  voiceActive = false,
}) => {
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !disabled) {
      onSearch(query.trim());
      setQuery('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (query.trim() && !disabled) {
        onSearch(query.trim());
        setQuery('');
      }
    }
  };

  return (
    <div ref={containerRef} className="w-full">
      <form onSubmit={handleSubmit}>
        <div className={`flex items-center gap-2 bg-k-card border border-k-border transition-colors focus-within:border-k-cyan ${compact ? 'rounded-full px-4 py-2' : 'rounded-2xl px-4 py-3'}`}>

          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            disabled={disabled}
            className="search-input flex-1 bg-transparent text-k-text placeholder-k-muted/60 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          />

          {onVoice && (
            <button
              type="button"
              onClick={onVoice}
              disabled={disabled}
              title={voiceActive ? 'Listening...' : 'Voice input'}
              className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                voiceActive
                  ? 'text-red-400 animate-pulse'
                  : 'text-k-muted hover:text-k-cyan'
              }`}
            >
              <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M8 1a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z"/>
                <path d="M4.25 9.25a.75.75 0 0 0-1.5 0 5.25 5.25 0 0 0 4.5 5.201V15.5a.75.75 0 0 0 1.5 0v-1.049a5.25 5.25 0 0 0 4.5-5.201.75.75 0 0 0-1.5 0A3.75 3.75 0 0 1 8 13a3.75 3.75 0 0 1-3.75-3.75Z"/>
              </svg>
            </button>
          )}

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
          Ask about anything. Videos, documents, data, images and more.
        </p>
      </form>

    </div>
  );
};
