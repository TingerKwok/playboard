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

function App() {
  const { notes, addNote, deleteNote, updateNote, pauseSubscription, resumeSubscription } = useSupabaseData();
  const [localNotes, setLocalNotes] = useState<Note[]>([]);
  const [draggingNote, setDraggingNote] = useState<{ id: string; offsetX: number; offsetY: number; width: number; height: number; } | null>(null);
  const whiteboardRef = useRef<HTMLDivElement>(null);
  const draggedElementRef = useRef<HTMLDivElement | null>(null);
  const dragPositionRef = useRef({ x: 0, y: 0 });

  // Refs for managing drag state and queuing updates
  const isDraggingRef = useRef(false);
  const pendingUpdatesRef = useRef<((notes: Note[]) => Note[])[]>([]);

  // Helper to queue state updates that occur during a drag to prevent re-renders
  const queueOrSetNotes = useCallback((updateFn: (prevNotes: Note[]) => Note[]) => {
    if (isDraggingRef.current) {
      pendingUpdatesRef.current.push(updateFn);
    } else {
      setLocalNotes(updateFn);
    }
  }, []);

  useEffect(() => {
    // When notes from Supabase change, queue the update if a drag is in progress
    queueOrSetNotes(() => notes);
  }, [notes, queueOrSetNotes]);

  const createOptimisticNote = (
    type: 'text' | 'image',
    content: string,
    tempId: string,
    status: 'pending' | 'saved' = 'pending'
  ): Note => {
    const maxZ = localNotes.reduce((max, note) => Math.max(max, note.zIndex || 1), 0);
    const noteColors = [
      'bg-orange-200 dark:bg-orange-700', 'bg-amber-200 dark:bg-amber-700',
      'bg-rose-200 dark:bg-rose-700', 'bg-sky-200 dark:bg-sky-700',
      'bg-lime-200 dark:bg-lime-700', 'bg-yellow-200 dark:bg-yellow-600',
    ];
    const rotations = ['-rotate-2', 'rotate-2', '-rotate-1', 'rotate-1', '-rotate-3', 'rotate-3'];

    return {
      id: tempId,
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
      status,
    };
  };

  const handleCreateTextNote = (promptText: string) => {
    if (!isSupabaseConfigured) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticNote = createOptimisticNote('text', promptText, tempId);
    setLocalNotes(prev => [...prev, optimisticNote]);

    // Run persistence in the background
    (async () => {
      const savedNote = await addNote(promptText, 'text');
      if (savedNote) {
        queueOrSetNotes(prev => prev.map(n => n.id === tempId ? { ...savedNote, status: 'saved' } : n));
      } else {
        // On failure, remove the optimistic note
        queueOrSetNotes(prev => prev.filter(n => n.id !== tempId));
        alert("Sorry, we couldn't save your note. Please try again.");
      }
    })();
  };

  const handleCreateImageNote = (promptText: string) => {
    if (!isSupabaseConfigured) return;

    const tempId = `temp-${Date.now()}`;
    // Create a placeholder note and add it to the UI instantly
    const placeholderNote = createOptimisticNote('image', '', tempId, 'pending');
    setLocalNotes(prev => [...prev, placeholderNote]);

    // Run the full generation and persistence flow in the background
    (async () => {
      try {
        const classificationResponse = await fetch("/api/proxy", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'classify', prompt: promptText })
        });

        if (!classificationResponse.ok) throw new Error(`Classification failed: ${await classificationResponse.text()}`);
        
        const classificationData = await classificationResponse.json();
        const classification = classificationData.choices[0].message.content.trim().toLowerCase();
        const isNoun = classification.includes('yes');

        if (isNoun) {
          const imageResponse = await fetch("/api/proxy", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'generate', prompt: promptText })
          });

          if (!imageResponse.ok) throw new Error(`Image generation failed: ${await imageResponse.text()}`);

          const imageData = await imageResponse.json();
          if (imageData.error) throw new Error(`Server error: ${imageData.error}`);
          
          if (imageData.data && imageData.data[0].b64_json) {
              const imageUrl = `data:image/png;base64,${imageData.data[0].b64_json}`;
              const savedNote = await addNote(imageUrl, 'image');
              if (savedNote) {
                queueOrSetNotes(prev => prev.map(n => n.id === tempId ? { ...savedNote, status: 'saved' } : n));
              } else {
                throw new Error("Failed to save the generated image to the database.");
              }
          } else {
              throw new Error("Image data not found in response.");
          }
        } else {
          // If not a noun, create a text note instead and remove placeholder
          alert("Sorry, that didn't look like something we can draw. Your original text will be added as a note instead.");
          queueOrSetNotes(prev => prev.filter(n => n.id !== tempId)); // Remove placeholder
          handleCreateTextNote(promptText); // Create a text note
        }
      } catch (error) {
        console.error("Processing failed:", error);
        alert("Sorry, something went wrong. Please try again!");
        queueOrSetNotes(prev => prev.filter(n => n.id !== tempId)); // Clean up placeholder on any error
      }
    })();
  };

  const handleDeleteNote = useCallback((noteId: string) => {
    // Optimistically remove from local state first
    setLocalNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
    // Then delete from database in the background
    deleteNote(noteId);
  }, [deleteNote]);

  const bringToFront = useCallback((noteId: string) => {
    setLocalNotes(prevNotes => {
        const maxZ = prevNotes.reduce((max, note) => Math.max(max, note.zIndex || 1), 0);
        const targetNote = prevNotes.find(n => n.id === noteId);

        if (targetNote && targetNote.zIndex <= maxZ) {
            const newZIndex = maxZ + 1;
            // Update database in the background
            updateNote(noteId, { zIndex: newZIndex });
            // Optimistically update local state and return it
            return prevNotes
                .map(n => (n.id === noteId ? { ...n, zIndex: newZIndex } : n))
                .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        }
        // If no change is needed, return the original state
        return prevNotes;
    });
  }, [updateNote]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, noteId: string) => {
    isDraggingRef.current = true; // Set the drag lock ON
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
    const draggedNoteId = draggingNote.id;
    
    // Persist final position to DB
    updateNote(draggedNoteId, { x: finalPosition.x, y: finalPosition.y });
    
    // Clean up drag state
    setDraggingNote(null);
    draggedElementRef.current = null;
    resumeSubscription();
    
    // Set lock OFF before processing updates
    isDraggingRef.current = false;

    // Apply all updates (drag position + any queued updates) in a single render
    setLocalNotes(currentNotes => {
      // 1. Apply the position update from the completed drag
      let newNotes = currentNotes.map(n => 
        n.id === draggedNoteId ? { ...n, x: finalPosition.x, y: finalPosition.y } : n
      );

      // 2. Apply all queued updates from the background
      if (pendingUpdatesRef.current.length > 0) {
        pendingUpdatesRef.current.forEach(updateFn => {
          newNotes = updateFn(newNotes);
        });
        pendingUpdatesRef.current = []; // Clear the queue after applying
      }
      
      return newNotes;
    });

  }, [draggingNote, updateNote, resumeSubscription]);
  
  if (!isSupabaseConfigured) {
    return <AppConfigMessage />;
  }

  return (
    <div className="min-h-screen font-sans">
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
        {localNotes.length === 0 && (
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
      />
    </div>
  );
}

export default App;