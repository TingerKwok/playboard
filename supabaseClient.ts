import { createClient } from '@supabase/supabase-js'

// --- ACTION REQUIRED ---
// 1. Go to your Supabase project dashboard: https://app.supabase.com
// 2. Navigate to Project Settings > API.
// 3. Find your Project URL and anon public key.
// 4. Replace the placeholders below.

// FIX: Explicitly type constants as `string` to avoid TypeScript's overly-strict literal type inference,
// which causes a compilation error when comparing the filled-in value with the placeholder string.
const supabaseUrl: string = "https://lwsufwvpqeuvuwubaulk.supabase.co"; // e.g., "https://xyz.supabase.co"
const supabaseAnonKey: string = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3c3Vmd3ZwcWV1dnV3dWJhdWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NjI1MDcsImV4cCI6MjA3ODIzODUwN30.Zkdo_9xMLdHu0R85SgTleVlfCr8weLxgglHvg0uWW2k"; // e.g., "ey..."

export const isSupabaseConfigured =
  supabaseUrl !== "YOUR_SUPABASE_URL" && supabaseAnonKey !== "YOUR_SUPABASE_ANON_KEY";

export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;