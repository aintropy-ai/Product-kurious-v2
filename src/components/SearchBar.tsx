import React, { useState, useRef, useEffect } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  disabled: boolean;
  preloadedQuestions?: string[];
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, disabled, preloadedQuestions = [] }) => {
  const [query, setQuery] = useState('');
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [userTyping, setUserTyping] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea to fit content
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [query]);

  // Close suggestions when clicking outside
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
    if (query.trim()) {
      setSuggestionsOpen(false);
      onSearch(query);
    }
  };

  const handleQuestionSelect = (question: string) => {
    setQuery(question);
    setUserTyping(false);
    setSuggestionsOpen(false);
    onSearch(question);
  };

  const filteredQuestions = userTyping && query.trim()
    ? preloadedQuestions.filter(q => q.toLowerCase().includes(query.toLowerCase()))
    : preloadedQuestions;

  return (
    <div ref={containerRef} className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        <textarea
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setUserTyping(true); }}
          placeholder="Ask me anything about the State of New Jersey!"
          disabled={disabled}
          rows={3}
          className="w-full pl-14 pr-14 py-3 text-base bg-gray-900 text-white border-2 border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg resize-none overflow-hidden"
        />

        {/* Suggestions toggle button */}
        {preloadedQuestions.length > 0 && (
          <button
            type="button"
            onClick={() => setSuggestionsOpen(v => !v)}
            disabled={disabled}
            className="absolute left-2 bottom-2 h-9 px-2 flex items-center gap-1 text-gray-400 hover:text-white disabled:opacity-40 transition-colors"
            title={suggestionsOpen ? 'Hide suggestions' : 'Show example questions'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM8.94 6.94a.75.75 0 1 1-1.061-1.061 3 3 0 1 1 2.871 5.026v.345a.75.75 0 0 1-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 1 0 8.94 6.94ZM10 15a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
            </svg>
            <span className={`text-sm transition-transform duration-150 inline-block ${suggestionsOpen ? 'rotate-180' : ''}`}>▾</span>
          </button>
        )}

        <button
          type="submit"
          disabled={disabled || !query.trim()}
          className="absolute right-2 bottom-2 w-9 h-9 flex items-center justify-center bg-blue-600 text-white hover:bg-blue-500 disabled:cursor-not-allowed transition-colors rounded-sm"
          title="Search"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
          </svg>
        </button>
      </form>

      {/* Collapsible suggestions panel — attached directly below search box */}
      {suggestionsOpen && filteredQuestions.length > 0 && (
        <div className="bg-gray-800 border-2 border-t-0 border-gray-700 shadow-lg max-h-56 overflow-y-auto">
          {filteredQuestions.map((question, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuestionSelect(question)}
              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
            >
              {question}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
