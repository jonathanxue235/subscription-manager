/**database configuration  (initialize and export it)
 * Information Hiding: so that people won't know we're using Supabase. we can swap to another database through changing this file
 */

const { createClient } = require('@supabase/supabase-js');

function createDatabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  }

  return createClient(supabaseUrl, supabaseKey);
}

module.exports = { createDatabaseClient };