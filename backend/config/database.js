/**database configuration  (initialize and export it)
 * Information Hiding: so that people won't know we're using Supabase. we can swap to another database through changing this file
 */

const { createClient } = require('@supabase/supabase-js');

function createDatabaseClient(accessToken = null) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  }

  const options = {};

  // If an access token is provided, add it to the request headers
  // This allows RLS policies to access the JWT claims
  if (accessToken) {
    options.global = {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    };
  }

  return createClient(supabaseUrl, supabaseKey, options);
}

// Create a service role client that bypasses RLS
// Used for operations like user registration where no JWT exists yet
function createServiceRoleClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

module.exports = { createDatabaseClient, createServiceRoleClient };