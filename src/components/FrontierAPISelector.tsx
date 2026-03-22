import React from 'react';

const FRONTIER_APIS = [
  { name: 'GPT-4o mini', value: 'gpt4omini' },
  { name: 'GPT-4o', value: 'gpt4o' },
  { name: 'Gemini 2.0 Flash', value: 'gemini2flash' },
  { name: 'Gemini 1.5 Pro', value: 'gemini15pro' },
  { name: 'Claude 3.5 Sonnet', value: 'claude' },
  { name: 'Claude 3 Haiku', value: 'claude3haiku' },
  { name: 'Llama 3.1 70B', value: 'llama70b' },
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
