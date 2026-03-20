import { useState, useEffect, useRef } from 'react';
import stageNamesRaw from '../../assets/retrieval_stage_names_for_display.txt?raw';

const STEPS = stageNamesRaw.split('\n').map(s => s.trim()).filter(s => s.length > 0);

// Time per step in ms while loading
const STEP_INTERVAL_MS = 1300;
// Time per step in ms when rapidly completing remaining steps after load finishes
const RAPID_STEP_MS = 80;

interface SearchProgressProps {
  loading: boolean;
  onComplete: () => void;
}

export const SearchProgress: React.FC<SearchProgressProps> = ({ loading, onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const stepRef = useRef(0); // track current step synchronously

  const updateStep = (n: number) => {
    stepRef.current = n;
    setActiveStep(n);
  };

  useEffect(() => {
    if (loading) {
      // Reset and start normal progression
      updateStep(0);
      const interval = setInterval(() => {
        const next = stepRef.current + 1;
        if (next >= STEPS.length) {
          clearInterval(interval);
          return;
        }
        updateStep(next);
      }, STEP_INTERVAL_MS);
      return () => clearInterval(interval);
    } else {
      // Backend returned — rapidly complete any remaining steps, then notify parent
      const rapidComplete = (current: number) => {
        if (current >= STEPS.length) {
          // Hold the all-done state briefly so the user sees all checkmarks
          const timer = setTimeout(onComplete, 500);
          return () => clearTimeout(timer);
        }
        updateStep(current);
        const timer = setTimeout(() => rapidComplete(current + 1), RAPID_STEP_MS);
        return () => clearTimeout(timer);
      };
      rapidComplete(stepRef.current + 1);
    }
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="bg-gray-800 shadow-lg p-6 min-h-[300px] flex flex-col border-2 border-gray-700">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 border-b-2 border-gray-700 pb-3">
        {loading && (
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full flex-shrink-0" />
        )}
        <h2 className="text-xl font-semibold text-white">Llama-3.1-70B-Instruct with Kurious</h2>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {STEPS.map((step, i) => {
          const completed = i < activeStep;
          const active = i === activeStep && loading;

          return (
            <div
              key={i}
              className={`flex items-center gap-3 py-1.5 px-2 rounded transition-all duration-200 ${
                active ? 'bg-blue-900/30' : ''
              }`}
            >
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                {completed ? (
                  <span className="text-green-400 text-sm font-bold">✓</span>
                ) : active ? (
                  <div className="animate-spin h-3.5 w-3.5 border-2 border-blue-400 border-t-transparent rounded-full" />
                ) : (
                  <span className="text-gray-600 text-xs">○</span>
                )}
              </div>
              <span
                className={`text-sm transition-colors duration-200 ${
                  completed ? 'text-gray-400' : active ? 'text-blue-300 font-medium' : 'text-gray-600'
                }`}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
