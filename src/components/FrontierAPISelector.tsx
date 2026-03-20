import React from 'react';

const FRONTIER_APIS = [
  { name: 'GPT-3.5 Turbo', value: 'gpt5' },
  { name: 'Gemini 3 Pro', value: 'gemini3' },
  { name: 'Claude 3.5 Sonnet', value: 'claude' },
];

interface FrontierAPISelectorProps {
  selectedAPI: string;
  onAPIChange: (apiValue: string) => void;
}

export const FrontierAPISelector: React.FC<FrontierAPISelectorProps> = ({
  selectedAPI,
  onAPIChange
}) => {
  return (
    <div className="bg-gray-800 border-2 border-gray-700 border-b-0 px-6 py-3">
      <select
        value={selectedAPI}
        onChange={(e) => onAPIChange(e.target.value)}
        className="w-full px-4 py-2 bg-gray-700 text-white border-2 border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {FRONTIER_APIS.map((api) => (
          <option key={api.value} value={api.value}>
            {api.name}
          </option>
        ))}
      </select>
    </div>
  );
};
