import React from 'react';
import { Zap, BrainCircuit } from 'lucide-react';
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
    <div className="flex-shrink-0 border-b border-k-border px-4 py-4 bg-k-nav">
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
            <Zap className={`w-3 h-3 transition-all duration-200 ${mode === 'quick' ? '[filter:drop-shadow(0_0_4px_currentColor)]' : ''}`} />
            Quick
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
            <BrainCircuit className={`w-3 h-3 transition-all duration-200 ${mode === 'deep_think' ? '[filter:drop-shadow(0_0_4px_currentColor)]' : ''}`} />
            Deep Dive
          </button>
        </div>
      </div>
    </div>
  );
};
