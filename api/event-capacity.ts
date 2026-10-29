import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://fmphilimwxhcfysbgegr.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_qBGNmRBBKAENF7p9OLkqeQ_9luAvnbX';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { eventId } = req.query;
  if (!eventId || typeof eventId !== 'string') {
    return res.status(400).json({ error: 'Missing eventId parameter' });
  }

  try {
    const { count, error } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .neq('status', 'rejected');

    if (error) {
      console.error('Error querying registrations count:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ count: count ?? 0 });
  } catch (err: any) {
    console.error('Unexpected error in event-capacity handler:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
