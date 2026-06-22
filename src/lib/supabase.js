
// --- MOCK DATABASE MODE ---
// To use real Supabase, comment this out and uncomment the real client.
export { mockSupabase as supabase } from './mockSupabase';

/*
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
*/
