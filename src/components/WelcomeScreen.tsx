import React from 'react';
import SuggestionCards from './SuggestionCards';

interface WelcomeScreenProps {
  firstName?: string | null;
  onQuestionSelect: (question: string) => void;
  suggestions: string[];
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ firstName, onQuestionSelect, suggestions }) => {
  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold text-k-text mb-2">
        {firstName ? `Welcome to Kurious, ${firstName}.` : 'Welcome to Kurious.'}
      </h1>
      <p className="text-k-muted mb-10 text-base leading-relaxed">
        Your AI-powered knowledge engine — what do you want to explore?
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-k-card border border-k-border rounded-full text-sm text-k-muted mb-8">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-k-cyan flex-shrink-0">
          <path d="M3.196 12.87l-.825.483a.75.75 0 0 0 0 1.294l7.25 4.25a.75.75 0 0 0 .758 0l7.25-4.25a.75.75 0 0 0 0-1.294l-.825-.484-5.666 3.322a2.25 2.25 0 0 1-2.276 0L3.196 12.87Z" />
          <path d="m3.196 8.87-.825.483a.75.75 0 0 0 0 1.294l7.25 4.25a.75.75 0 0 0 .758 0l7.25-4.25a.75.75 0 0 0 0-1.294l-.825-.484-5.666 3.322a2.25 2.25 0 0 1-2.276 0L3.196 8.87Z" />
          <path d="M10.38 1.103a.75.75 0 0 0-.76 0l-7.25 4.25a.75.75 0 0 0 0 1.294l7.25 4.25a.75.75 0 0 0 .76 0l7.25-4.25a.75.75 0 0 0 0-1.294l-7.25-4.25Z" />
        </svg>
        Powered by New Jersey Open Data — 57M documents across 23 agencies
      </div>
      <SuggestionCards suggestions={suggestions} onSelect={onQuestionSelect} />
    </div>
  );
};
