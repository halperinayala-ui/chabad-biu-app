import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

export default async function handler(req: any, res: any) {
  // Only allow GET requests (Vercel Cron makes GET requests)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Ensure this is called by Vercel Cron
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Missing Supabase credentials' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const publicVapidKey = process.env.VITE_VAPID_PUBLIC_KEY;
    const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

    if (!publicVapidKey || !privateVapidKey) {
      console.error('Missing VAPID keys');
      return res.status(500).json({ error: 'Missing VAPID keys' });
    }

    webpush.setVapidDetails(
      'mailto:support@chabadoncampus.com',
      publicVapidKey,
      privateVapidKey
    );

    // 1. Find events that opened in the LAST HOUR
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const { data: events, error: eventsErr } = await supabase
      .from('events')
      .select('*')
      .gte('registration_start', oneHourAgo.toISOString())
      .lte('registration_start', now.toISOString());

    if (eventsErr) {
      console.error('Error fetching events:', eventsErr);
      return res.status(500).json({ error: 'Failed to fetch events' });
    }

    if (!events || events.length === 0) {
      return res.status(200).json({ message: 'No events opened recently', count: 0 });
    }

    // 2. Fetch ALL subscriptions (we'll filter later)
    const { data: subscriptions, error: subErr } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (subErr || !subscriptions || subscriptions.length === 0) {
      return res.status(200).json({ message: 'No subscriptions found' });
    }

    // 3. Fetch profiles to know user status
    const userIds = [...new Set(subscriptions.map(s => s.user_id).filter(Boolean))];
    let profilesMap: Record<string, any> = {};
    
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, user_status, is_admin')
        .in('id', userIds);
        
      if (profilesData) {
        profilesData.forEach(p => {
          profilesMap[p.id] = p;
        });
      }
    }

    let totalSent = 0;

    // 4. Send notifications for each opened event
    for (const event of events) {
      const aud: string[] = event.audience || [];
      
      const payload = JSON.stringify({
        title: 'הרשמה נפתחה!',
        body: `ההרשמה לאירוע "${event.title}" נפתחה עכשיו! מהרו להבטיח את מקומכם.`,
        url: `https://chabad-biu-app.vercel.app/events/${event.id}`,
        icon: 'https://chabad-biu-app.vercel.app/logo-purple.png',
        badge: 'https://chabad-biu-app.vercel.app/logo-purple.png'
      });

      // Filter who should get this
      const targetSubs = subscriptions.filter(sub => {
        if (!sub.user_id) return true; // Guests? Allow? Yes.
        const profile = profilesMap[sub.user_id];
        if (!profile) return true;
        
        if (profile.is_admin) return true; // Admins get everything
        
        if (aud.length > 0) {
          if (!profile.user_status || !aud.includes(profile.user_status)) {
            return false; // User not in audience
          }
        }
        return true; // Send to everyone else
      });

      const promises = targetSubs.map(async (sub) => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
          };
          await webpush.sendNotification(pushSubscription, payload);
          return true;
        } catch (error: any) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          }
          return false;
        }
      });

      const results = await Promise.all(promises);
      totalSent += results.filter(Boolean).length;
    }

    return res.status(200).json({ success: true, sent: totalSent });
  } catch (err: any) {
    console.error('Cron job error:', err);
    return res.status(500).json({ error: err.message });
  }
}
