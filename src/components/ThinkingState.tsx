import { useEffect, useState } from 'react';

const QUICK_STEPS = [
  'Understood your question',
  'Searching across 57M documents',
  'Scanning government records & data',
  'Connecting insights',
];

const DEEPER_STEPS = [
  'Understood your question',
  'Searching across 57M documents',
  'Scanning government records & data',
  'Cross-referencing sources',
  'Analysing connections',
  'Synthesising a comprehensive answer',
];

interface ThinkingStateProps {
  mode: 'quick' | 'deeper';
  /** Becomes true when the backend has actually finished */
  isDone: boolean;
  onComplete: () => void;
}

export default function ThinkingState({ mode, isDone, onComplete }: ThinkingStateProps) {
  const steps = mode === 'deeper' ? DEEPER_STEPS : QUICK_STEPS;
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [animComplete, setAnimComplete] = useState(false);
  const delay = mode === 'deeper' ? 600 : 350;

  useEffect(() => {
    setVisibleSteps(0);
    setAnimComplete(false);
    let step = 0;
    const iv = setInterval(() => {
      step++;
      setVisibleSteps(step);
      if (step >= steps.length) {
        clearInterval(iv);
        setAnimComplete(true);
      }
    }, delay);
    return () => clearInterval(iv);
  }, [mode]);

  // Only call onComplete once animation is done AND backend is done
  useEffect(() => {
    if (animComplete && isDone) {
      const t = setTimeout(onComplete, 300);
      return () => clearTimeout(t);
    }
  }, [animComplete, isDone]);

  return (
    <div className="animate-fade-in py-8 max-w-xl">
      <p className="text-sm font-medium text-k-muted mb-6 tracking-wide">
        {mode === 'deeper' ? '🔍' : '⚡'} Searching your knowledge base...
      </p>
      <div className="space-y-3">
        {steps.map((step, i) => {
          const done    = i < visibleSteps - 1 || (i === visibleSteps - 1 && visibleSteps === steps.length);
          const active  = i === visibleSteps - 1 && visibleSteps < steps.length;
          const pending = i >= visibleSteps;
          return (
            <div key={step} className={`flex items-center gap-3 transition-opacity duration-300 ${pending ? 'opacity-20' : 'opacity-100'}`}>
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                {done   && <span className="text-k-cyan text-sm animate-tick">✓</span>}
                {active && <div className="w-3 h-3 border-2 border-k-cyan border-t-transparent rounded-full animate-spin" />}
                {pending && <div className="w-2 h-2 rounded-full bg-k-border" />}
              </div>
              <span className={`text-sm transition-colors ${done ? 'text-k-text' : active ? 'text-k-cyan' : 'text-k-muted'}`}>
                {step}{active ? '...' : ''}
              </span>
            </div>
          );
        })}

        {/* Shown after animation finishes but backend hasn't responded yet */}
        {animComplete && !isDone && (
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
              <div className="w-3 h-3 border-2 border-k-muted border-t-transparent rounded-full animate-spin" />
            </div>
            <span className="text-sm text-k-muted">Preparing your answer...</span>
          </div>
        )}
      </div>
      {mode === 'deeper' && (
        <p className="text-xs text-k-muted/60 mt-6">avg. under 10 seconds</p>
      )}
    </div>
  );
}
