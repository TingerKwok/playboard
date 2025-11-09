import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useSupabaseData } from './hooks/useSupabaseData';
import StickyNote from './components/StickyNote';
import AddNoteForm from './components/AddTopicForm';
import { isSupabaseConfigured } from './supabaseClient';
import { Note } from './types';

function AppConfigMessage() {
  return (
    <div className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg shadow-2xl p-8 max-w-lg w-full">
        <h2 className="text-2xl font-bold text-red-600 dark:text-red-500 mb-4">Action Required: Configuration Needed</h2>
        <p className="mb-6">
          This collaborative board requires a Supabase project to function. Please follow the steps in the README file to set it up. The SiliconFlow API key should be set in your Cloudflare project settings.
        </p>
        <div className="space-y-4 text-left">
          <div className={`p-3 rounded-lg ${isSupabaseConfigured ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
            <h3 className="font-bold text-lg">{isSupabaseConfigured ? '✔' : '❌'} Supabase Configuration</h3>
            <p className="text-sm">
              {isSupabaseConfigured 
                ? "Supabase client is configured." 
                : "Please open supabaseClient.ts and add your project URL and anon key."
              }
            </p>
          </div>
           <div className={`p-3 rounded-lg bg-blue-100 dark:bg-blue-900`}>
            <h3 className="font-bold text-lg">ℹ️ SiliconFlow API Key</h3>
            <p className="text-sm">
              Your API key must be configured as a secret environment variable in your Cloudflare project settings. See the README for instructions.
            </p>
          </div>
        </div>
        <a 
          href="https://github.com/google-gemini-vignettes/play-board/blob/main/README.md"
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-block mt-6 bg-orange-500 text-white font-semibold rounded-lg shadow-md px-6 py-3 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-gray-800 transition-transform transform hover:scale-105"
        >
          View README Instructions
        </a>
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
  const { notes, addNote, deleteNote, updateNote, pauseSubscription, resumeSubscription } = useSupabaseData();
  const [localNotes, setLocalNotes] = useState<Note[]>([]);
  const [draggingNote, setDraggingNote] = useState<{ id: string; offsetX: number; offsetY: number; width: number; height: number; } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Thinking...");
  const whiteboardRef = useRef<HTMLDivElement>(null);
  const draggedElementRef = useRef<HTMLDivElement | null>(null);
  const dragPositionRef = useRef({ x: 0, y: 0 });

  // This effect now simply syncs the local state with the data from the hook.
  // The complex logic to prevent race conditions is no longer needed because
  // the subscription is paused during drag operations.
  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  const handleCreateTextNote = (promptText: string) => {
    if (!isSupabaseConfigured) return;
    addNote(promptText, 'text');
  };

  const handleCreateImageNote = async (promptText: string) => {
    if (!isSupabaseConfigured) return;
    setIsProcessing(true);
    setLoadingMessage("Thinking...");

    try {
      // Step 1: Call our secure proxy to classify the prompt
      const classificationResponse = await fetch("/api/proxy", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'classify', prompt: promptText })
      });

      if (!classificationResponse.ok) {
        throw new Error(`Classification failed: ${await classificationResponse.text()}`);
      }
      
      const classificationData = await classificationResponse.json();
      const classification = classificationData.choices[0].message.content.trim().toLowerCase();
      const isNoun = classification.includes('yes');

      // Step 2: Generate image or add text
      if (isNoun) {
        setLoadingMessage("Creating your image...");
        // Step 2a: Call our secure proxy to generate an image
        const imageResponse = await fetch("/api/proxy", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'generate', prompt: promptText })
        });

        if (!imageResponse.ok) {
            throw new Error(`Image generation failed: ${await imageResponse.text()}`);
        }

        const imageData = await imageResponse.json();
        
        if (imageData.error) {
          throw new Error(`Server error: ${imageData.error}`);
        }
        
        if (imageData.data && imageData.data[0].b64_json) {
            const imageUrl = `data:image/png;base64,${imageData.data[0].b64_json}`;
            addNote(imageUrl, 'image');
        } else {
            throw new Error("Image data not found in response.");
        }

      } else {
        alert("Sorry, that didn't look like something we can draw. Your original text will be added as a note instead.");
        addNote(promptText, 'text');
      }
    } catch (error) {
      console.error("Processing failed:", error);
      alert("Sorry, something went wrong. Please try again! Your original text will be added as a note.");
      addNote(promptText, 'text');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteNote = useCallback((noteId: string) => {
    setLocalNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
    deleteNote(noteId);
  }, [deleteNote]);

  const bringToFront = useCallback((noteId: string) => {
    const currentNotes = localNotes;
    const maxZ = currentNotes.reduce((max, note) => Math.max(max, note.zIndex || 1), 0);
    const targetNote = currentNotes.find(n => n.id === noteId);

    if (targetNote && targetNote.zIndex <= maxZ) {
        const newZIndex = maxZ + 1;
        // Optimistically update local state
        setLocalNotes(prev => 
            prev.map(n => n.id === noteId ? { ...n, zIndex: newZIndex } : n)
                .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
        );
        // Update database in the background
        updateNote(noteId, { zIndex: newZIndex });
    }
  }, [localNotes, updateNote]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, noteId: string) => {
    // Pause real-time updates to prevent interference during drag
    pauseSubscription();

    const noteElement = e.currentTarget;
    draggedElementRef.current = noteElement;
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
  }, [bringToFront, pauseSubscription]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingNote || !whiteboardRef.current || !draggedElementRef.current) return;
    
    const whiteboardRect = whiteboardRef.current.getBoundingClientRect();
    
    let x = e.clientX - whiteboardRect.left - draggingNote.offsetX;
    let y = e.clientY - whiteboardRect.top - draggingNote.offsetY;

    x = Math.max(10, Math.min(x, whiteboardRect.width - draggingNote.width - 10));
    y = Math.max(10, Math.min(y, whiteboardRect.height - draggingNote.height - 10));
    
    dragPositionRef.current = { x, y };

    const element = draggedElementRef.current;
    element.style.setProperty('--tw-translate-x', `${x}px`);
    element.style.setProperty('--tw-translate-y', `${y}px`);
  }, [draggingNote]);
  
  const handleMouseUp = useCallback(() => {
    if (!draggingNote) return;

    const finalPosition = dragPositionRef.current;
    
    setLocalNotes(prevNotes => 
      prevNotes.map(n => 
        n.id === draggingNote.id ? { ...n, x: finalPosition.x, y: finalPosition.y } : n
      )
    );

    updateNote(draggingNote.id, { x: finalPosition.x, y: finalPosition.y });
    
    setDraggingNote(null);
    draggedElementRef.current = null;
    
    // Resume real-time updates now that the drag is complete
    resumeSubscription();

  }, [draggingNote, updateNote, resumeSubscription]);
  
  if (!isSupabaseConfigured) {
    return <AppConfigMessage />;
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
            onDelete={handleDeleteNote}
          />
        ))}
        {localNotes.length === 0 && !isProcessing && (
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="text-center p-10">
                <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">Whiteboard is Empty</h2>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Type something below to get started!
                </p>
              </div>
           </div>
        )}
      </main>
      
      <AddNoteForm 
        onCreateText={handleCreateTextNote} 
        onCreateImage={handleCreateImageNote} 
        isProcessing={isProcessing} 
      />
    </div>
  );
}

export default App;