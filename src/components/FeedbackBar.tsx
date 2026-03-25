import { useState } from 'react';

const NEGATIVE_OPTIONS = [
  "The answer didn't address my question",
  "The sources don't seem relevant",
  "The answer is incomplete",
  "The answer seems incorrect",
  "I couldn't understand the answer",
];

const POSITIVE_TAGS = ['Accurate', 'Fast', 'Great sources', 'Easy to read'];

interface FeedbackBarProps {
  onFeedback?: (rating: number, text: string) => void;
}

export default function FeedbackBar({ onFeedback }: FeedbackBarProps) {
  const [state, setState] = useState<'idle' | 'thumbs_up' | 'thumbs_down' | 'done'>('idle');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [extraText, setExtraText] = useState('');

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag);
    onFeedback?.(5, tag);
    setTimeout(() => setState('done'), 400);
  };

  if (state === 'done') {
    return (
      <div className="flex items-center gap-2 text-sm text-k-muted animate-fade-in py-1">
        <span className="text-k-cyan">✓</span>
        <span>Thanks — this helps me get smarter.</span>
      </div>
    );
  }

  if (state === 'thumbs_up') {
    return (
      <div className="animate-slide-up">
        <p className="text-sm text-k-text mb-3">Glad it helped! What worked well?</p>
        <div className="flex flex-wrap gap-2">
          {POSITIVE_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                selectedTag === tag
                  ? 'bg-k-cyan text-k-bg border-k-cyan'
                  : 'border-k-border text-k-muted hover:border-k-cyan hover:text-k-cyan'
              }`}
            >
              {tag}
            </button>
          ))}
          <button
            onClick={() => { onFeedback?.(5, ''); setState('done'); }}
            className="px-3 py-1.5 text-sm text-k-muted hover:text-k-text transition-colors"
          >
            Skip →
          </button>
        </div>
      </div>
    );
  }

  if (state === 'thumbs_down') {
    return (
      <div className="animate-slide-up border border-k-border rounded-xl p-4 bg-k-card">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-k-text">What went wrong?</p>
          <button onClick={() => setState('idle')} className="text-k-muted hover:text-k-text text-lg leading-none">✕</button>
        </div>
        <div className="space-y-2 mb-4">
          {NEGATIVE_OPTIONS.map(opt => (
            <label key={opt} className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                selectedOption === opt ? 'border-k-cyan' : 'border-k-border group-hover:border-k-muted'
              }`}>
                {selectedOption === opt && <div className="w-2 h-2 rounded-full bg-k-cyan" />}
              </div>
              <input type="radio" name="feedback" value={opt} className="sr-only" onChange={() => setSelectedOption(opt)} />
              <span className="text-sm text-k-muted group-hover:text-k-text transition-colors">{opt}</span>
            </label>
          ))}
        </div>
        <div className="mb-4">
          <p className="text-xs text-k-muted mb-2">Anything to add? <span className="opacity-60">(optional)</span></p>
          <textarea
            value={extraText}
            onChange={e => setExtraText(e.target.value)}
            rows={2}
            className="w-full bg-k-bg border border-k-border rounded-lg px-3 py-2 text-sm text-k-text placeholder-k-muted/50 focus:outline-none focus:border-k-teal transition-colors resize-none"
            placeholder="Type here..."
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => {
              if (!selectedOption) return;
              const text = extraText.trim() ? `${selectedOption} | ${extraText.trim()}` : selectedOption;
              onFeedback?.(1, text);
              setState('done');
            }}
            disabled={!selectedOption}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedOption ? 'bg-k-cyan text-k-bg hover:bg-cyan-300' : 'bg-k-border text-k-muted cursor-not-allowed'
            }`}
          >
            Submit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-k-muted">Was this helpful?</span>
      <button onClick={() => { onFeedback?.(5, ''); setState('thumbs_up'); }} className="text-xl hover:scale-110 transition-transform active:scale-95" title="Yes">👍</button>
      <button onClick={() => setState('thumbs_down')} className="text-xl hover:scale-110 transition-transform active:scale-95" title="No">👎</button>
    </div>
  );
}
