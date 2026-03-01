import { createClient } from '@supabase/supabase-js';

const url = import.meta.env?.VITE_SUPABASE_URL || 'https://lietpzxydupsxmlncrpi.supabase.co';
const key = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'YOUR_KEY';

console.log('Testing...');
