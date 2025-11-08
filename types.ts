
export interface Note {
  id: string;
  type: 'text' | 'image';
  content: string; // Will hold text or a base64 data URL for images
  x: number;
  y: number;
  color: string;
  rotation: string;
  zIndex: number;
}

// FIX: Add and export the missing Topic interface, which is used by TopicBoard.tsx.
export interface Topic {
  id: string;
  title: string;
  createdAt?: string;
  notes: Note[];
}
