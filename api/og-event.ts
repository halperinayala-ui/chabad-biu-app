import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with robust fallbacks
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://fmphilimwxhcfysbgegr.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_qBGNmRBBKAENF7p9OLkqeQ_9luAvnbX';
const supabase = createClient(supabaseUrl, supabaseKey);

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const eventId = req.query.id as string;
  const baseUrl = 'https://chabad-biu-app.vercel.app';

  if (!eventId) {
    return res.redirect(302, '/');
  }

  try {
    // Fetch event details
    const { data: event, error } = await supabase
      .from('events')
      .select('id, title, description, flyer_image_url, header_image_url')
      .eq('id', eventId)
      .single();

    if (error || !event) {
      // Fallback with 200 OK so WhatsApp doesn't discard metadata
      const defaultHtml = `<!DOCTYPE html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="UTF-8">
    <title>חב״ד בקמפוס בר אילן</title>
    <meta property="og:site_name" content="חב״ד בקמפוס בר אילן">
    <meta property="og:type" content="website">
    <meta property="og:title" content="חב״ד בקמפוס בר אילן">
    <meta property="og:description" content="האפליקציה הרשמית של חב״ד בקמפוס בר אילן - הרשמה לאירועים, ארוחות שבת וקהילה.">
    <meta property="og:image" content="${baseUrl}/sharing-banner.png">
    <meta property="og:image:secure_url" content="${baseUrl}/sharing-banner.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <script>window.location.replace('/');</script>
  </head>
  <body><p>מעביר לאפליקציה...</p></body>
</html>`;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(defaultHtml);
    }

    // Determine the best image to show:
    // For party opening semester event (19a22fdd-1adf-485e-ae83-4cd4679a694a), use the optimized header banner
    let imageUrl = '';
    if (eventId === '19a22fdd-1adf-485e-ae83-4cd4679a694a') {
      imageUrl = `${baseUrl}/events/party-header.jpg`;
    } else {
      imageUrl = event.header_image_url || event.flyer_image_url || `${baseUrl}/sharing-banner.png`;
    }

    if (!imageUrl.startsWith('http')) {
      imageUrl = `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
    }

    const imageType = imageUrl.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

    // Clean up description for meta tags
    const rawDesc = event.description || 'לפרטים נוספים והרשמה היכנסו לאפליקציה!';
    const cleanDescription = rawDesc
      .replace(/<[^>]*>?/gm, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 160);

    const safeTitle = escapeHtml(`${event.title} - חב״ד בקמפוס בר אילן`);
    const safeOgTitle = escapeHtml(event.title);
    const safeDesc = escapeHtml(cleanDescription);
    const canonicalUrl = `${baseUrl}/events/${eventId}`;

    const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <title>${safeTitle}</title>
    
    <!-- Open Graph / WhatsApp / Facebook -->
    <meta property="og:site_name" content="חב״ד בקמפוס בר אילן">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:title" content="${safeOgTitle}">
    <meta property="og:description" content="${safeDesc}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:image:secure_url" content="${imageUrl}">
    <meta property="og:image:type" content="${imageType}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${canonicalUrl}">
    <meta name="twitter:title" content="${safeOgTitle}">
    <meta name="twitter:description" content="${safeDesc}">
    <meta name="twitter:image" content="${imageUrl}">

    <script>
      // Redirect real human users directly to the event page in the React app
      window.location.replace('/events/' + ${JSON.stringify(eventId)});
    </script>
    
    <style>
      body { font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #fafafa; margin: 0; direction: rtl; }
      .loader { text-align: center; color: #492691; padding: 20px; }
      .loader h2 { margin-bottom: 8px; }
      .loader a { color: #e67e22; text-decoration: none; font-weight: bold; }
    </style>
  </head>
  <body>
    <div class="loader">
      <h2>${safeOgTitle}</h2>
      <p>מעבירים אתכם לפרטי האירוע... <a href="/events/${eventId}">לחצו כאן אם אינכם מועברים</a></p>
    </div>
  </body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).send(html);

  } catch (error) {
    console.error('OG API Error:', error);
    return res.redirect(302, `/events/${eventId}`);
  }
}
