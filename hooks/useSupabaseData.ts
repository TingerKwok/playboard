import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { Note } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useSupabaseData() {
  const [notes, setNotes] = useState<Note[]>([]);
  const isPausedRef = useRef(false); // The lightweight "mute" switch

  const fetchNotes = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from('notes').select('*').order('zIndex');
    if (error) {
      console.error('Error fetching notes:', error);
    } else {
      setNotes(data || []);
    }
  }, []);

  const pauseSubscription = useCallback(() => {
    isPausedRef.current = true;
  }, []);

  const resumeSubscription = useCallback(() => {
    isPausedRef.current = false;
  }, []);


  useEffect(() => {
    if (!isSupabaseConfigured) return;
    
    fetchNotes(); // Initial fetch

    const channel = supabase
      .channel('realtime-notes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notes' },
        () => {
          // Only fetch notes if the subscription is not "muted"
          if (!isPausedRef.current) {
            fetchNotes();
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotes]);

  const addNote = useCallback(async (content: string, type: 'text' | 'image'): Promise<Note | null> => {
    if (!supabase) return null;
    
    // Get the latest maxZ from the current state before adding
    const maxZ = notes.reduce((max, note) => Math.max(max, note.zIndex || 1), 0);

    const noteColors = [
      'bg-orange-200 dark:bg-orange-700', 'bg-amber-200 dark:bg-amber-700',
      'bg-rose-200 dark:bg-rose-700', 'bg-sky-200 dark:bg-sky-700',
      'bg-lime-200 dark:bg-lime-700', 'bg-yellow-200 dark:bg-yellow-600',
    ];
    const rotations = ['-rotate-2', 'rotate-2', '-rotate-1', 'rotate-1', '-rotate-3', 'rotate-3'];
    
    const newNote: Omit<Note, 'id' | 'status'> = {
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

    const { data, error } = await supabase.from('notes').insert(newNote).select().single();
    if(error){
      console.error("Error adding note:", error);
      return null;
    }
    return data;
  }, [notes]);
  
  const deleteNote = useCallback(async (noteId: string) => {
    if (!supabase) return;
    // Don't delete optimistic notes from the DB as they don't exist there
    if(String(noteId).startsWith('temp-')) return;
    await supabase.from('notes').delete().eq('id', noteId);
  }, []);

  const updateNote = useCallback(async (noteId: string, newValues: Partial<Omit<Note, 'id'>>) => {
      if (!supabase) return;
      // Don't update optimistic notes in the DB as they don't exist there
      if(String(noteId).startsWith('temp-')) return;
      await supabase.from('notes').update(newValues).eq('id', noteId);
  }, []);

  const clearAllNotes = useCallback(async () => {
    if (!supabase) return;
    // This will delete all rows that the user has access to based on RLS policies.
    const { error } = await supabase.from('notes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
      console.error('Error clearing all notes:', error);
    }
  }, []);

  return { notes, addNote, deleteNote, updateNote, pauseSubscription, resumeSubscription, clearAllNotes };
}