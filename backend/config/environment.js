/* configure environments: code hiding too
 */

require('dotenv').config();

function getConfig() {
  const config = {
    port: process.env.PORT || 5001,
    jwtSecret: process.env.JWT_SECRET,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_ANON_KEY,
    nodeEnv: process.env.NODE_ENV || 'development'
  };

  if (!config.jwtSecret) {
    throw new Error('Missing JWT_SECRET environment variable');
  }

  if (!config.supabaseUrl || !config.supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  }

  return config;
}

module.exports = { getConfig };