const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl ? 'exists' : 'missing');
console.log('Supabase Key:', supabaseAnonKey ? 'exists' : 'missing');

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = supabase;