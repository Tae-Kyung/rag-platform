'use client';

interface SuggestedQuestionsProps {
  questions: string[];
  onSelect: (question: string) => void;
  compact?: boolean;
}

export function SuggestedQuestions({ questions, onSelect, compact }: SuggestedQuestionsProps) {
  if (questions.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? 'px-3 pb-2' : 'px-4 pb-3'}`}>
      {questions.map((question, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onSelect(question)}
          className={`rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors ${
            compact ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm'
          }`}
        >
          {question}
        </button>
      ))}
    </div>
  );
}
