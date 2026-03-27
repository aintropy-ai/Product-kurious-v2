import React from 'react';
import SuggestionCards from './SuggestionCards';

interface WelcomeScreenProps {
  firstName?: string | null;
  onQuestionSelect: (question: string) => void;
  suggestions: string[];
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ firstName, onQuestionSelect, suggestions }) => {
  return (
    <div className="animate-fade-in text-center pt-12">
      <h1 className="text-3xl font-bold text-k-text mb-3">
        {firstName ? `Welcome to Kurious, ${firstName}.` : 'Welcome to Kurious.'}
      </h1>
      <p className="text-k-muted mb-12 text-base leading-relaxed max-w-xl mx-auto">
        Your AI-powered knowledge engine — what do you want to explore?
      </p>

      <SuggestionCards suggestions={suggestions} onSelect={onQuestionSelect} />
    </div>
  );
};
