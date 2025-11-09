import React from 'react';
import { Note } from '../types';

interface StickyNoteProps {
  note: Note;
  onDelete: (noteId: string) => void;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>, noteId: string) => void;
}

const StickyNote: React.FC<StickyNoteProps> = ({ note, onDelete, onMouseDown }) => {
  const isTextNote = !note.type || note.type === 'text';

  // Define size and layout classes based on note type
  const noteSpecificClasses = isTextNote
    ? 'w-auto max-w-[250px] p-3'
    : 'w-32 h-32 p-2 flex-col items-center justify-center'; // w-32 is 8rem or 128px

  return (
    <div
      data-note-id={note.id}
      onMouseDown={(e) => onMouseDown(e, note.id)}
      className={`
        absolute shadow-lg rounded-md transition-all duration-200 ease-in-out 
        hover:scale-105 hover:shadow-xl 
        cursor-grab active:cursor-grabbing active:scale-110 active:shadow-2xl active:transition-none 
        flex transform ${note.color} ${note.rotation} ${noteSpecificClasses}
      `}
      style={{ 
        fontFamily: isTextNote ? "'Caveat', cursive" : 'sans-serif',
        '--tw-translate-x': `${note.x}px`,
        '--tw-translate-y': `${note.y}px`,
        zIndex: note.zIndex,
        touchAction: 'none',
      }}
    >
      <button 
        onClick={(e) => {
          e.stopPropagation(); 
          onDelete(note.id);
        }}
        className="absolute top-1 right-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 font-sans text-xs font-bold w-5 h-5 bg-white/50 dark:bg-black/30 rounded-full flex items-center justify-center transition-colors z-10"
        aria-label="Delete note"
      >
        X
      </button>
      {isTextNote && (
        <p className="text-lg text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">{note.content}</p>
      )}
      {note.type === 'image' && (
        <div className="w-full h-full flex items-center justify-center">
          {note.status === 'pending' ? (
            <svg className="animate-spin h-8 w-8 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <img src={note.content} alt="Generated content" className="max-w-full max-h-full object-contain rounded-sm"/>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(StickyNote);
