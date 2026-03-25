import React from 'react';
import { SearchBar } from './SearchBar';
import { SearchMode } from '../types';

interface ChatInputAreaProps {
  onSubmit: (query: string) => void;
  disabled: boolean;
  mode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
  preloadedQuestions: string[];
}

export const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  onSubmit,
  disabled,
  mode,
  onModeChange,
  preloadedQuestions,
}) => {
  return (
    <div className="flex-shrink-0 border-t border-k-border px-4 py-4 bg-k-nav">
      <div className="max-w-5xl mx-auto">
        <SearchBar
          onSearch={onSubmit}
          disabled={disabled}
          preloadedQuestions={preloadedQuestions}
          compact
        />
        {/* Mode toggle */}
        <div className="flex items-center gap-2 mt-3 px-1">
          <button
            type="button"
            onClick={() => onModeChange('quick')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-full border transition-colors ${
              mode === 'quick'
                ? 'bg-k-cyan/10 border-k-cyan/50 text-k-cyan'
                : 'border-k-border text-k-muted hover:border-k-muted hover:text-k-text'
            }`}
          >
            ⚡ Quick
          </button>
          <button
            type="button"
            onClick={() => onModeChange('deep_think')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-full border transition-colors ${
              mode === 'deep_think'
                ? 'bg-k-cyan/10 border-k-cyan/50 text-k-cyan'
                : 'border-k-border text-k-muted hover:border-k-muted hover:text-k-text'
            }`}
          >
            🧠 Deep Dive
          </button>
          <span className="text-xs text-k-muted/50 ml-1">
            {mode === 'quick' ? '~1–3s' : '~5–15s, multi-step reasoning'}
          </span>
        </div>
      </div>
    </div>
  );
};
