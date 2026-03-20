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

export const FrontierAPISelector: React.FC<FrontierAPISelectorProps> = ({ selectedAPI, onAPIChange }) => {
  return (
    <select
      value={selectedAPI}
      onChange={(e) => onAPIChange(e.target.value)}
      className="w-full px-3 py-0.5 bg-gray-800 text-white text-base border border-gray-600 focus:outline-none focus:border-blue-500"
    >
      {FRONTIER_APIS.map((api) => (
        <option key={api.value} value={api.value}>
          {api.name}
        </option>
      ))}
    </select>
  );
};
