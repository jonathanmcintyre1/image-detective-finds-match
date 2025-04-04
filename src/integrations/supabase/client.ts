// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://plsidbybfxgzobsxknsf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsc2lkYnliZnhnem9ic3hrbnNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MzIyNTcsImV4cCI6MjA1OTEwODI1N30.fNlMxqZFCUCoKFYzwaCq8FlWFf1lxk_Qud0cbRuPyb0";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
