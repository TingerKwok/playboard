import React, { useState } from 'react';

interface AddNoteFormProps {
  onCreateText: (content: string) => void;
  onCreateImage: (content: string) => void;
  isProcessing: boolean;
}

const AddNoteForm: React.FC<AddNoteFormProps> = ({ onCreateText, onCreateImage, isProcessing }) => {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onCreateText(content.trim());
      setContent('');
    }
  };

  const handleImageClick = () => {
    if(content.trim()) {
      onCreateImage(content.trim());
      setContent('');
    }
  }

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg p-4 z-50">
      <div className="bg-orange-50/80 dark:bg-slate-800/80 backdrop-blur-md p-4 rounded-xl shadow-2xl">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50/80 dark:bg-gray-700/80 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
            aria-label="New note content"
            disabled={isProcessing}
          />
          <button
            type="submit"
            className="px-5 py-3 bg-orange-500 text-white font-semibold rounded-lg shadow-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-gray-800 transition-colors disabled:bg-orange-400 disabled:cursor-not-allowed"
            disabled={!content.trim() || isProcessing}
            aria-label="Add text note"
          >
            Add Text
          </button>
          <button
            type="button"
            onClick={handleImageClick}
            className="px-5 py-3 bg-sky-500 text-white font-semibold rounded-lg shadow-md hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:focus:ring-offset-gray-800 transition-colors disabled:bg-sky-400 disabled:cursor-not-allowed"
            disabled={!content.trim() || isProcessing}
            aria-label="Create image from note"
          >
            Image
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddNoteForm;