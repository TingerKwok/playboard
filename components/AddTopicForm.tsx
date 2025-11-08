import React, { useState } from 'react';

interface AddNoteFormProps {
  onSubmit: (content: string) => void;
  isProcessing: boolean;
}

const AddNoteForm: React.FC<AddNoteFormProps> = ({ onSubmit, isProcessing }) => {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content.trim());
      setContent('');
    }
  };

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg p-4 z-50">
      <div className="bg-orange-50/80 dark:bg-slate-800/80 backdrop-blur-md p-4 rounded-xl shadow-2xl">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add text or an English noun for an image..."
            className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50/80 dark:bg-gray-700/80 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
            aria-label="New note content"
            disabled={isProcessing}
          />
          <button
            type="submit"
            className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg shadow-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-gray-800 transition-colors disabled:bg-orange-400 disabled:cursor-not-allowed"
            disabled={!content.trim() || isProcessing}
            aria-label="Add note"
          >
            Add
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddNoteForm;