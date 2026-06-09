import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const eventId = req.query.id as string;
  const baseUrl = 'https://chabad-biu-app.vercel.app';

  if (!eventId) {
    res.redirect(302, '/');
    return;
  }

  try {
    // Fetch event details
    const { data: event, error } = await supabase
      .from('events')
      .select('title, description, flyer_image_url, header_image_url')
      .eq('id', eventId)
      .single();

    if (error || !event) {
      res.redirect(302, '/');
      return;
    }

    // Determine the best image to show (prefer flyer, then header, then default)
    const imageUrl = event.flyer_image_url || event.header_image_url || `${baseUrl}/sharing-banner.png`;
    
    // Clean up description for the meta tag
    const cleanDescription = (event.description || 'לחצו לפרטים והרשמה!')
      .replace(/<[^>]*>?/gm, '') // Remove HTML tags
      .substring(0, 150) + '...';

    // Return HTML with Open Graph tags and a JS redirect to the actual event page
    // WhatsApp scraper will read the tags but won't execute JS.
    // Real users will execute JS and be redirected to the React app immediately.
    const html = `
      <!DOCTYPE html>
      <html lang="he" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          
          <title>${event.title} - חב״ד בקמפוס בר אילן</title>
          
          <!-- Open Graph / WhatsApp / Facebook -->
          <meta property="og:type" content="website">
          <meta property="og:url" content="${baseUrl}/events/${eventId}">
          <meta property="og:title" content="${event.title}">
          <meta property="og:description" content="${cleanDescription}">
          <meta property="og:image" content="${imageUrl}">
          
          <!-- Twitter -->
          <meta property="twitter:card" content="summary_large_image">
          <meta property="twitter:url" content="${baseUrl}/events/${eventId}">
          <meta property="twitter:title" content="${event.title}">
          <meta property="twitter:description" content="${cleanDescription}">
          <meta property="twitter:image" content="${imageUrl}">

          <script>
            // Redirect real users to the React SPA route
            window.location.replace('/event/view/${eventId}');
          </script>
          
          <style>
            body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #fafafa; }
            .loader { text-align: center; color: #492691; }
          </style>
        </head>
        <body>
          <div class="loader">
            <h2>מעביר לאירוע...</h2>
            <p>אם לא הועברת אוטומטית, <a href="/event/view/${eventId}">לחץ כאן</a></p>
          </div>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).send(html);

  } catch (error) {
    console.error('OG API Error:', error);
    res.redirect(302, `/events/${eventId}`);
  }
}
