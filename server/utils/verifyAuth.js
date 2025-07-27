const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

let supabase = null;

// Only initialize Supabase if credentials are provided and not placeholder
if (config.SUPABASE_URL && config.SUPABASE_ANON_KEY && 
    config.SUPABASE_URL !== 'placeholder' && config.SUPABASE_ANON_KEY !== 'placeholder') {
  supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
}

const verifyAuth = async (req, res, next) => {
  // If Supabase is not configured, require proper authentication
  if (!supabase) {
    console.log('Supabase not configured - authentication required');
    return res.status(401).json({ error: 'Authentication service not configured' });
  }

  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });

  req.user = user;
  next();
};

module.exports = verifyAuth; 