import React from 'react';

interface GoldenAnswerBoxProps {
  goldenAnswer: string | string[] | null;
}

export const GoldenAnswerBox: React.FC<GoldenAnswerBoxProps> = ({ goldenAnswer }) => {
  if (!goldenAnswer) return null;

  const isArray = Array.isArray(goldenAnswer);

  return (
    <div className="mb-6 bg-blue-900 border-2 border-blue-700 p-4">
      <p className="text-blue-200 font-semibold mb-2">
        {isArray ? 'Correct Answers (Alternatives):' : 'Correct Answer:'}
      </p>
      {isArray ? (
        <ul className="list-disc list-inside space-y-1">
          {goldenAnswer.map((answer, idx) => (
            <li key={idx} className="text-blue-100 text-lg">{answer}</li>
          ))}
        </ul>
      ) : (
        <p className="text-blue-100 text-lg">{goldenAnswer}</p>
      )}
    </div>
  );
};
