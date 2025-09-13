import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zhxhuzcbsvumopxnhfxm.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoeGh1emNic3Z1bW9weG5oZnhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU5MjQ1MzcsImV4cCI6MjA0MTUwMDUzN30.HqPyM3bm6vhsuvbC-k9x1nVOWgaKdIEDQYUIVrC2dZQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);