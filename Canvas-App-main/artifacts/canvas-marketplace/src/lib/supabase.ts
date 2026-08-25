import { createClient } from '@supabase/supabase-js';

// Replace these with the actual URL and Key from your Supabase Dashboard
const supabaseUrl = 'https://dszaiwzzfqukgzvovfna.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzemFpd3p6ZnF1a2d6dm92Zm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMzE2NzEsImV4cCI6MjEwMjkwNzY3MX0.IXMb2OJb7hwzpjhaGN0Le_aaaZ9YWK4-HTMY_2Mjqg8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);