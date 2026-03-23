interface SearchProgressProps {
  currentStage: string | null;
}

export const SearchProgress: React.FC<SearchProgressProps> = ({ currentStage }) => {
  return (
    <div className="bg-gray-800 shadow-lg p-6 min-h-[300px] flex flex-col border-2 border-gray-700">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5 border-b-2 border-gray-700 pb-3">
        <h2 className="text-xl font-semibold text-white">Kurious</h2>
        <span className="text-xs text-gray-400 ml-auto">Llama-3.1-70B</span>
      </div>

      {/* Current stage */}
      <div className="flex items-center gap-3 py-2 px-2">
        <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full flex-shrink-0" />
        <span className="text-sm text-blue-300 font-medium">
          {currentStage ?? 'Initializing…'}
        </span>
      </div>
    </div>
  );
};
