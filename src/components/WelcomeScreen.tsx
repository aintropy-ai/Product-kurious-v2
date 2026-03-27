import React from 'react';
import SuggestionCards from './SuggestionCards';

interface WelcomeScreenProps {
  firstName?: string | null;
  onQuestionSelect: (question: string) => void;
  suggestions: string[];
  inputArea?: React.ReactNode;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ firstName, onQuestionSelect, suggestions, inputArea }) => {
  return (
    <div className="animate-fade-in text-center pt-12">
      <h1 className="text-3xl font-bold text-k-text mb-3">
        {firstName ? `Welcome to Kurious, ${firstName}.` : 'Welcome to Kurious.'}
      </h1>
      <p className="text-k-muted mb-8 text-base leading-relaxed max-w-xl mx-auto">
        Your AI-powered knowledge engine — what do you want to explore?
      </p>

      {inputArea && (
        <div className="max-w-2xl mx-auto mb-10">
          {inputArea}
        </div>
      )}

      <SuggestionCards suggestions={suggestions} onSelect={onQuestionSelect} />
    </div>
  );
};
