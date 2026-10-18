import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://fmphilimwxhcfysbgegr.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_qBGNmRBBKAENF7p9OLkqeQ_9luAvnbX';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. Fetch current settings row
    const { data: setRes, error: fetchError } = await supabase
      .from('settings')
      .select('wa_templates')
      .eq('id', 1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Fetch error:', fetchError);
    }

    const currentTemplates = setRes?.wa_templates || {};
    const stats = currentTemplates.new_year_stats || {
      total_views: 0,
      qr_scans: 0,
      home_clicks: 0,
      scholarship_clicks: 0,
      whatsapp_clicks: 0,
      last_updated: null
    };

    // If GET request, return current stats
    if (req.method === 'GET') {
      return res.status(200).json({ success: true, stats });
    }

    // If POST request, record an event
    if (req.method === 'POST') {
      const { type, source } = req.body || {};

      if (type === 'view') {
        stats.total_views = (stats.total_views || 0) + 1;
        if (source === 'home') {
          stats.home_clicks = (stats.home_clicks || 0) + 1;
        } else {
          // If not from home, it's a direct QR scan from the popcorn cup!
          stats.qr_scans = (stats.qr_scans || 0) + 1;
        }
      } else if (type === 'click_scholarship') {
        stats.scholarship_clicks = (stats.scholarship_clicks || 0) + 1;
      } else if (type === 'click_whatsapp') {
        stats.whatsapp_clicks = (stats.whatsapp_clicks || 0) + 1;
      }

      stats.last_updated = new Date().toISOString();

      const updatedTemplates = {
        ...currentTemplates,
        new_year_stats: stats
      };

      const { error: updateError } = await supabase
        .from('settings')
        .update({
          wa_templates: updatedTemplates,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1);

      if (updateError) {
        console.error('Update error in track-newyear:', updateError);
        return res.status(500).json({ error: updateError.message });
      }

      return res.status(200).json({ success: true, stats });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Error in track-newyear handler:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
