import { useState, useEffect, useCallback } from 'react';
import { tcbApp, isTcbConfigured } from '../tcbConfig';
import { Note } from '../types';

// TCB returns notes with an '_id' property
type TcbNote = Omit<Note, 'id'> & { _id: string };

const noteColors = [
  'bg-orange-200 dark:bg-orange-700',
  'bg-amber-200 dark:bg-amber-700',
  'bg-rose-200 dark:bg-rose-700',
  'bg-sky-200 dark:bg-sky-700',
  'bg-lime-200 dark:bg-lime-700',
  'bg-yellow-200 dark:bg-yellow-600',
];

const rotations = ['-rotate-2', 'rotate-2', '-rotate-1', 'rotate-1', '-rotate-3', 'rotate-3'];

export function useTcbData() {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    if (!isTcbConfigured || !tcbApp) {
      return;
    }

    const db = tcbApp.database();
    const notesCollection = db.collection('notes');
    
    const watcher = notesCollection.watch({
      onChange: (snapshot) => {
        if (!snapshot.docs) return;
        const notesArray: Note[] = snapshot.docs.map((doc: TcbNote) => ({
          ...doc,
          id: doc._id, // Map TCB's _id to our app's id
        }));
        setNotes(notesArray);
      },
      onError: (err) => {
        console.error('Tencent CloudBase watcher error:', err);
      }
    });

    return () => watcher.close();
  }, []);

  const addNote = useCallback((content: string, type: 'text' | 'image') => {
    if (!tcbApp) return;
    const db = tcbApp.database();
    
    const maxZ = notes.reduce((max, note) => Math.max(max, note.zIndex || 1), 0);

    const newNote: Omit<Note, 'id'> = {
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

    db.collection('notes').add(newNote);
  }, [notes]);
  
  const deleteNote = useCallback((noteId: string) => {
    if (!tcbApp) return;
    tcbApp.database().collection('notes').doc(noteId).remove();
  }, []);

  const updateNote = useCallback((noteId: string, newValues: Partial<Omit<Note, 'id'>>) => {
      if (!tcbApp) return;
      tcbApp.database().collection('notes').doc(noteId).update(newValues);
  }, []);

  return { notes, addNote, deleteNote, updateNote };
}
