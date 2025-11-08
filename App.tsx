import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTcbData } from './hooks/useTcbData';
import StickyNote from './components/StickyNote';
import AddNoteForm from './components/AddTopicForm';
import { isTcbConfigured, tcbApp } from './tcbConfig';
import { Note } from './types';

function TcbConfigMessage() {
  return (
    <div className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg shadow-2xl p-8 max-w-lg w-full text-center">
        <h2 className="text-2xl font-bold text-red-600 dark:text-red-500 mb-4">Action Required: Configure Tencent CloudBase</h2>
        <p className="mb-4">
          This collaborative board requires Tencent CloudBase (TCB) to function.
        </p>
        <p className="mb-6">
          Please open the <code className="bg-gray-200 dark:bg-gray-700 rounded px-2 py-1 text-sm font-mono">tcbConfig.ts</code> file and replace the placeholder with your TCB Environment ID.
        </p>
        <a 
          href="https://console.cloud.tencent.com/tcb/env/index" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-block bg-orange-500 text-white font-semibold rounded-lg shadow-md px-6 py-3 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-gray-800 transition-transform transform hover:scale-105"
        >
          Go to TCB Console
        </a>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
          After configuring, please follow the instructions in README.md to set up the database collection and cloud function.
        </p>
      </div>
    </div>
  );
}


function LoadingOverlay({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-[100] p-4 text-white">
      <div className="flex flex-col items-center gap-4">
        <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-xl font-semibold">{message}</p>
      </div>
    </div>
  );
}

function App() {
  const { notes, addNote, deleteNote, updateNote } = useTcbData();
  const [localNotes, setLocalNotes] = useState<Note[]>([]);
  const [draggingNote, setDraggingNote] = useState<{ id: string; offsetX: number; offsetY: number; width: number; height: number; } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Thinking...");
  const whiteboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!draggingNote) {
      setLocalNotes(notes);
    }
  }, [notes, draggingNote]);

  const handleFormSubmit = async (promptText: string) => {
    if (!tcbApp) return;
    setIsProcessing(true);
    setLoadingMessage("Thinking...");

    try {
      const res = await tcbApp.callFunction({
        name: 'hunyuan',
        data: { promptText },
      });

      if (!res.result || res.result.error) {
          throw new Error(res.result?.error || 'Cloud function returned an unexpected error.');
      }
      
      const { type, content } = res.result;

      if (type === 'image') {
        setLoadingMessage("Creating your image...");
        const imageUrl = `data:image/png;base64,${content}`;
        addNote(imageUrl, 'image');
      } else {
        addNote(content, 'text');
      }
    } catch (error) {
      console.error("Processing failed:", error);
      alert("Sorry, something went wrong. Please try again!");
      // As a fallback, create a text note with the original prompt
      addNote(promptText, 'text');
    } finally {
      setIsProcessing(false);
    }
  };

  const bringToFront = useCallback((noteId: string) => {
    const maxZ = localNotes.reduce((max, note) => Math.max(max, note.zIndex || 1), 0);
    const targetNote = localNotes.find(n => n.id === noteId);
    if (targetNote && targetNote.zIndex <= maxZ) {
        const newZIndex = maxZ + 1;
        setLocalNotes(prev => prev.map(n => n.id === noteId ? { ...n, zIndex: newZIndex } : n).sort((a,b) => (a.zIndex || 0) - (b.zIndex || 0)));
        updateNote(noteId, { zIndex: newZIndex });
    }
  }, [localNotes, updateNote]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, noteId: string) => {
    const noteElement = e.currentTarget;
    const rect = noteElement.getBoundingClientRect();
    setDraggingNote({
      id: noteId,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      width: noteElement.offsetWidth,
      height: noteElement.offsetHeight,
    });
    bringToFront(noteId);
    e.preventDefault();
  }, [bringToFront]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingNote || !whiteboardRef.current) return;
    
    const whiteboardRect = whiteboardRef.current.getBoundingClientRect();
    
    let x = e.clientX - whiteboardRect.left - draggingNote.offsetX;
    let y = e.clientY - whiteboardRect.top - draggingNote.offsetY;

    x = Math.max(10, Math.min(x, whiteboardRect.width - draggingNote.width - 10));
    y = Math.max(10, Math.min(y, whiteboardRect.height - draggingNote.height - 10));
    
    setLocalNotes(prevNotes => 
      prevNotes.map(n => 
          n.id === draggingNote.id ? { ...n, x, y } : n
      )
    );
  }, [draggingNote]);
  
  const handleMouseUp = useCallback(() => {
    if (!draggingNote) return;
    
    const finalNote = localNotes.find(n => n.id === draggingNote.id);
    if (finalNote) {
      updateNote(draggingNote.id, { x: finalNote.x, y: finalNote.y });
    }
    
    setDraggingNote(null);
  }, [draggingNote, updateNote, localNotes]);
  
  if (!isTcbConfigured) {
    return <TcbConfigMessage />;
  }

  return (
    <div className="min-h-screen font-sans">
      {isProcessing && <LoadingOverlay message={loadingMessage} />}
      <header className="text-center py-4 bg-orange-100/50 dark:bg-slate-800/50 backdrop-blur-sm fixed top-0 left-0 right-0 z-20">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'Caveat', cursive" }}>
          Play Board
        </h1>
      </header>

      <main 
        ref={whiteboardRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative w-full h-screen overflow-hidden pt-16"
      >
        {localNotes.map(note => (
          <StickyNote
            key={note.id}
            note={note}
            onMouseDown={handleMouseDown}
            onDelete={deleteNote}
          />
        ))}
        {localNotes.length === 0 && !isProcessing && (
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="text-center p-10">
                <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">Whiteboard is Empty</h2>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Add text or an English noun for an image!
                </p>
              </div>
           </div>
        )}
      </main>
      
      <AddNoteForm onSubmit={handleFormSubmit} isProcessing={isProcessing} />
    </div>
  );
}

export default App;