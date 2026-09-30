import { createClient } from '@supabase/supabase-js';

// Replace these with the actual URL and Key from your Supabase Dashboard
const supabaseUrl = 'https://trxrsixgxnklbnhhyexc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyeHJzaXhneG5rbGJuaGh5ZXhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMTEwMzcsImV4cCI6MjEwNDg4NzAzN30.6KVWCFCoLEcIUi8Hpb0FK9-zwt_CL6GGpEGToksHmtM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);