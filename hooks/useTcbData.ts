
import { useCallback } from 'react';
import useLocalStorage from './useLocalStorage';
import { Note } from '../types';

const noteColors = [
  'bg-orange-200 dark:bg-orange-700',
  'bg-amber-200 dark:bg-amber-700',
  'bg-rose-200 dark:bg-rose-700',
  'bg-sky-200 dark:bg-sky-700',
  'bg-lime-200 dark:bg-lime-700',
  'bg-yellow-200 dark:bg-yellow-600',
];

const rotations = ['-rotate-2', 'rotate-2', '-rotate-1', 'rotate-1', '-rotate-3', 'rotate-3'];

/**
 * Custom hook to manage board notes using localStorage.
 * Provides functions to add, delete, and update notes.
 */
export function useBoardData() {
  const [notes, setNotes] = useLocalStorage<Note[]>('notes', []);

  const addNote = useCallback((content: string, type: 'text' | 'image') => {
    const maxZ = notes.reduce((max, note) => Math.max(max, note.zIndex || 1), 0);

    const newNote: Note = {
      id: crypto.randomUUID(),
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
    setNotes(prevNotes => [...prevNotes, newNote]);
  }, [notes, setNotes]);
  
  const deleteNote = useCallback((noteId: string) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
  }, [setNotes]);

  const updateNote = useCallback((noteId: string, newValues: Partial<Omit<Note, 'id'>>) => {
      setNotes(prevNotes => prevNotes.map(note => 
        note.id === noteId ? { ...note, ...newValues } : note
      ));
  }, [setNotes]);

  return { notes, addNote, deleteNote, updateNote };
}
