import { StreamEvent } from '../services/backendApi';

interface SearchProgressProps {
  currentStage: string | null;
  streamingEvents?: StreamEvent[];
  synthesizing?: boolean;
  minimal?: boolean;
}

const STAGE_LABELS: Record<string, { label: string; icon: string }> = {
  'retrieval_done': { label: 'Retrieval Complete', icon: '✓' },
  'schema_retrieved': { label: 'Schema Retrieved', icon: '✓' },
  'unstructured': { label: 'Unstructured Analysis', icon: '✓' },
  'sql_generated': { label: 'SQL Generated', icon: '✓' },
  'sql_executed': { label: 'SQL Executed', icon: '✓' },
  'structured': { label: 'Structured Analysis', icon: '✓' },
  'synthesizing': { label: 'Synthesizing Answer', icon: '◆' },
};

export const SearchProgress: React.FC<SearchProgressProps> = ({
  currentStage,
  streamingEvents = [],
  synthesizing = false
}) => {
  const completedStages = new Set(
    streamingEvents
      .map(e => e.stage)
      .filter((stage, idx, arr) => arr.indexOf(stage) === idx) // unique stages
  );

  const getPipelineStages = (): Array<{ stage: string; label: string; icon: string; completed: boolean; active: boolean }> => {
    const stageList = [
      'retrieval_done',
      'schema_retrieved',
      'sql_generated',
      'sql_executed',
      'unstructured',
      'structured',
    ] as const;

    return stageList.map(stg => ({
      stage: stg,
      ...STAGE_LABELS[stg],
      completed: completedStages.has(stg),
      active: currentStage === stg,
    }));
  };

  const pipelineStages = getPipelineStages();

  return (
    <div className="bg-gray-800 shadow-lg p-6 min-h-[300px] flex flex-col border-2 border-gray-700">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5 border-b-2 border-gray-700 pb-3">
        <h2 className="text-xl font-semibold text-white">Kurious Pipeline</h2>
        <span className="text-xs text-gray-400 ml-auto">Llama-3.1-70B</span>
      </div>

      {/* Pipeline stages */}
      <div className="space-y-3 flex-1">
        {pipelineStages.map((stage, idx) => (
          <div key={stage.stage} className="flex items-center gap-3">
            {/* Stage indicator */}
            {stage.completed ? (
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                <span className="text-xs text-white font-bold">✓</span>
              </div>
            ) : stage.active ? (
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center animate-pulse">
                <span className="text-xs text-white font-bold">◆</span>
              </div>
            ) : (
              <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-gray-600" />
            )}

            {/* Stage label */}
            <span className={`text-sm font-medium ${
              stage.active ? 'text-blue-300' :
              stage.completed ? 'text-green-400' :
              'text-gray-500'
            }`}>
              {stage.label}
            </span>

            {/* Connector line to next stage */}
            {idx < pipelineStages.length - 1 && (
              <div className="ml-auto hidden" />
            )}
          </div>
        ))}

        {/* Synthesis stage */}
        {(synthesizing || completedStages.has('structured')) && (
          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-700">
            {synthesizing ? (
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center animate-pulse">
                <span className="text-xs text-white font-bold">◆</span>
              </div>
            ) : (
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                <span className="text-xs text-white font-bold">✓</span>
              </div>
            )}
            <span className={`text-sm font-medium ${
              synthesizing ? 'text-purple-300' : 'text-green-400'
            }`}>
              Answer Synthesis
            </span>
          </div>
        )}
      </div>

      {/* Current activity */}
      {(currentStage || synthesizing) && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-400">Processing…</p>
        </div>
      )}
    </div>
  );
};
