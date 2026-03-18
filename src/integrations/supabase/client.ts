import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://znngymbrvutdrhxvjrfs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpubmd5bWJydnV0ZHJoeHZqcmZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NjEyNDMsImV4cCI6MjA4OTQzNzI0M30.WqQbiQDBp0cIdABrpwCOqYMUYWA4Wlt_Y83fOUPOoWg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
