// FIX: Refactor application to use Gemini API and local storage instead of Tencent CloudBase.
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import useLocalStorage from './hooks/useLocalStorage';
import StickyNote from './components/StickyNote';
import AddNoteForm from './components/AddTopicForm';
import { Note } from './types';

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

const noteColors = [
  'bg-orange-200 dark:bg-orange-700',
  'bg-amber-200 dark:bg-amber-700',
  'bg-rose-200 dark:bg-rose-700',
  'bg-sky-200 dark:bg-sky-700',
  'bg-lime-200 dark:bg-lime-700',
  'bg-yellow-200 dark:bg-yellow-600',
];

const rotations = ['-rotate-2', 'rotate-2', '-rotate-1', 'rotate-1', '-rotate-3', 'rotate-3'];

function App() {
  // FIX: Use local storage for persistence instead of a cloud database.
  const [notes, setNotes] = useLocalStorage<Note[]>('gemini-playboard-notes', []);
  const [localNotes, setLocalNotes] = useState<Note[]>([]);
  const [draggingNote, setDraggingNote] = useState<{ id: string; offsetX: number; offsetY: number; width: number; height: number; } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Thinking...");
  const whiteboardRef = useRef<HTMLDivElement>(null);
  
  // FIX: Initialize Gemini AI client.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  useEffect(() => {
    if (!draggingNote) {
      setLocalNotes(notes);
    }
  }, [notes, draggingNote]);

  // FIX: Implement note management functions to work with local storage state.
  const addNote = useCallback((content: string, type: 'text' | 'image') => {
    const maxZ = notes.reduce((max, note) => Math.max(max, note.zIndex || 1), 0);
    const newNote: Note = {
      id: `${Date.now()}-${Math.random()}`,
      content,
      type,
      x: window.innerWidth / 2 - 100 + (Math.random() * 100 - 50),
      y: window.innerHeight / 3 + (Math.random() * 100 - 50),
      color: type === 'image' 
        ? 'bg-white dark:bg-gray-200' 
        : noteColors[Math.floor(Math.random() * noteColors.length)],
      rotation: type === 'image' 
        ? '' 
        : rotations[Math.floor(Math.random() * rotations.length)],
      zIndex: maxZ + 1,
    };
    setNotes(prev => [...prev, newNote]);
  }, [notes, setNotes]);

  const deleteNote = useCallback((noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
  }, [setNotes]);

  const updateNote = useCallback((noteId: string, newValues: Partial<Omit<Note, 'id'>>) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, ...newValues } : n));
  }, [setNotes]);

  // FIX: Replace TCB cloud function call with direct Gemini API calls.
  const handleFormSubmit = async (promptText: string) => {
    setIsProcessing(true);
    setLoadingMessage("Thinking...");

    try {
      const classificationPrompt = `Is the following an English noun or a simple noun phrase that can be depicted as a single object? Answer only with "yes" or "no". Text: "${promptText}"`;
      const classificationResult = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: classificationPrompt,
      });

      const classification = classificationResult.text.trim().toLowerCase();
      const isNoun = classification.includes('yes');

      if (isNoun) {
        setLoadingMessage("Creating your image...");
        const imagePrompt = `A simple, cute, cartoon-style icon of a "${promptText}". Centered on a clean, white background.`;
        const imageResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: imagePrompt }] },
          config: {
            responseModalities: [Modality.IMAGE],
          },
        });

        for (const part of imageResponse.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
            addNote(imageUrl, 'image');
            return;
          }
        }
        throw new Error("Image generation did not return an image part.");
      } else {
        addNote(promptText, 'text');
      }
    } catch (error) {
      console.error("Processing failed:", error);
      alert("Sorry, something went wrong. Please try again!");
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
