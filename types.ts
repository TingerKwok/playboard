export interface Note {
  id: string;
  type: 'text' | 'image';
  content: string; // Will hold text or a base64 data URL for images
  x: number;
  y: number;
  color: string;
  rotation: string;
  zIndex: number;
  status?: 'pending' | 'saved';
}

// FIX: Add missing Topic interface.
export interface Topic {
  id: string;
  title: string;
  createdAt?: string;
  notes: Note[];
}
