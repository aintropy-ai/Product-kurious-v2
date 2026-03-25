interface SuggestionCardsProps {
  suggestions: string[];
  onSelect: (s: string) => void;
  label?: string;
}

export default function SuggestionCards({ suggestions, onSelect, label = 'Try asking:' }: SuggestionCardsProps) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="animate-fade-in">
      <p className="text-xs text-k-muted uppercase tracking-widest mb-3 font-medium">{label}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {suggestions.slice(0, 4).map((s, i) => (
          <button
            key={i}
            onClick={() => onSelect(s)}
            className="text-left border border-k-border rounded-xl p-4 text-sm text-k-muted hover:border-k-cyan hover:text-k-text transition-all duration-200 bg-k-card hover:bg-k-card/80 group"
          >
            <span className="text-k-cyan mr-2 group-hover:translate-x-0.5 inline-block transition-transform">→</span>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
