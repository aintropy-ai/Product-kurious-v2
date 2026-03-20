import React, { useState, useRef, useEffect } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  disabled: boolean;
  preloadedQuestions?: string[];
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, disabled, preloadedQuestions = [] }) => {
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea to fit content
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (!isTyping && value.length > 0) {
      setIsTyping(true);
    }
  };

  const handleQuestionSelect = (question: string) => {
    setQuery(question);
    setIsTyping(false);
    onSearch(question);
  };

  const filteredQuestions = isTyping
    ? preloadedQuestions.filter(q => q.toLowerCase().includes(query.toLowerCase()))
    : preloadedQuestions;

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        <textarea
          ref={inputRef}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => !isTyping && setQuery('')}
          placeholder={preloadedQuestions.length > 0 ? "Type a question or select from suggestions below..." : "Enter your search query..."}
          disabled={disabled}
          rows={3}
          className="w-full px-6 py-3 text-base bg-gray-900 text-white border-2 border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg resize-none overflow-hidden"
        />
        <button
          type="submit"
          disabled={disabled || !query.trim()}
          className="absolute right-2 bottom-2 px-4 py-1.5 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          Search
        </button>
      </form>

      {/* Preloaded Questions Suggestions */}
      {preloadedQuestions.length > 0 && filteredQuestions.length > 0 && (
        <div className="mt-2 bg-gray-800 border-2 border-gray-700 shadow-lg max-h-48 overflow-y-auto">
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
