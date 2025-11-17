import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project credentials
// You can find these in your Supabase project settings
const supabaseUrl = 'https://aunexzpxzmxldqpothuf.supabase.co'; // e.g., 'https://xxxxx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bmV4enB4em14bGRxcG90aHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NDQyNjgsImV4cCI6MjA3NzQyMDI2OH0.n6YENBkQDxOYqnRGDPmw3oXkijuqrLByyoa4HT92amE'; // Your public anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);