import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const baseUrl = 'https://chabad-biu-app.vercel.app';
  const imageUrl = `${baseUrl}/share-banner.jpeg`;
  const title = 'חב״ד בקמפוס בר אילן - יש לך בית בקמפוס! 🍿🏠';
  const description = 'מלגות לימודים, ארוחות שבת, חגים, אירועים וקהילה חמה לסטודנטים בבר אילן';

  const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <title>${title}</title>
    
    <!-- Open Graph / WhatsApp / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${baseUrl}/new-year">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:image:secure_url" content="${imageUrl}">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${baseUrl}/new-year">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${imageUrl}">

    <script>
      // Redirect real human users to the React SPA route
      window.location.replace('/new-year' + window.location.search);
    </script>
    
    <style>
      body { font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #fafafa; margin: 0; direction: rtl; }
      .loader { text-align: center; color: #441e8c; }
    </style>
  </head>
  <body>
    <div class="loader">
      <h2>יש לך בית בקמפוס... 🍿</h2>
      <p>מעבירים אתכם לעמוד הפעילות... <a href="/new-year">לחצו כאן אם אינכם מועברים</a></p>
    </div>
  </body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  return res.status(200).send(html);
}
