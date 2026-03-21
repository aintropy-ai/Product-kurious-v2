import { useState, useEffect, useRef } from 'react';
import stageNamesRaw from '../../assets/retrieval_stage_names_for_display.txt?raw';

const STEPS = stageNamesRaw.split('\n').map(s => s.trim()).filter(s => s.length > 0);

const RAPID_STEP_MS = 80;

const randomDelay = () => Math.floor(Math.random() * 4200) + 1800; // 1800–6000ms

interface SearchProgressProps {
  loading: boolean;
  onComplete: () => void;
}

export const SearchProgress: React.FC<SearchProgressProps> = ({ loading, onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const stepRef = useRef(0);
  const cleanupRef = useRef<() => void>(() => {});

  const updateStep = (n: number) => {
    stepRef.current = n;
    setActiveStep(n);
  };

  useEffect(() => {
    if (loading) {
      updateStep(0);

      const scheduleNext = (current: number) => {
        const timer = setTimeout(() => {
          const next = current + 1;
          if (next >= STEPS.length) return;
          updateStep(next);
          scheduleNext(next);
        }, randomDelay());
        cleanupRef.current = () => clearTimeout(timer);
      };

      scheduleNext(0);
      return () => cleanupRef.current();
    } else {
      // Backend returned — rapidly complete remaining steps, then notify parent
      const rapidComplete = (current: number) => {
        if (current >= STEPS.length) {
          const timer = setTimeout(onComplete, 500);
          cleanupRef.current = () => clearTimeout(timer);
          return;
        }
        updateStep(current);
        const timer = setTimeout(() => rapidComplete(current + 1), RAPID_STEP_MS);
        cleanupRef.current = () => clearTimeout(timer);
      };
      rapidComplete(stepRef.current + 1);
    }
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="bg-gray-800 shadow-lg p-6 min-h-[300px] flex flex-col border-2 border-gray-700">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5 border-b-2 border-gray-700 pb-3">
        <h2 className="text-xl font-semibold text-white">Kurious</h2>
        <span className="text-xs text-gray-400 ml-auto">Llama-3.1-70B</span>
      </div>

      {/* Current step only */}
      <div className="flex items-center gap-3 py-2 px-2">
        <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full flex-shrink-0" />
        <span className="text-sm text-blue-300 font-medium">{STEPS[activeStep]}</span>
      </div>
    </div>
  );
};
