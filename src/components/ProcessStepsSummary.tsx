import { useState } from 'react';
import stageNamesRaw from '../../assets/retrieval_stage_names_for_display.txt?raw';

const STEPS = stageNamesRaw.split('\n').map(s => s.trim()).filter(s => s.length > 0);

interface ProcessStepsSummaryProps {
  hasError?: boolean;
}

export const ProcessStepsSummary: React.FC<ProcessStepsSummaryProps> = ({ hasError }) => {
  const [expanded, setExpanded] = useState(false);
  const completedCount = hasError ? STEPS.length - 1 : STEPS.length;

  return (
    <div className="border border-gray-700 bg-gray-850 mb-4" style={{ background: '#1a2332' }}>
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700/40 transition-colors"
      >
        <span className={`text-gray-500 text-xs transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}>
          ▶
        </span>
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Knowledge perception trace</span>
        <span className={`ml-auto text-xs font-medium ${hasError ? 'text-red-400' : 'text-green-500'}`}>
          {completedCount}/{STEPS.length} steps
        </span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-1.5 border-t border-gray-700 pt-2.5">
          {STEPS.map((step, i) => {
            const isLastStep = i === STEPS.length - 1;
            const failed = hasError && isLastStep;
            return (
              <div key={i} className="flex items-center gap-2.5">
                <span className={`text-xs font-bold w-4 flex-shrink-0 ${failed ? 'text-red-400' : 'text-green-400'}`}>
                  {failed ? '✗' : '✓'}
                </span>
                <span className={`text-xs ${failed ? 'text-red-400' : 'text-gray-400'}`}>{step}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
