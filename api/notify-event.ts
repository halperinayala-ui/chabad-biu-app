import type { VercelRequest, VercelResponse } from '@vercel/node';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// Initialize web-push with VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@chabad-biu.com',
  process.env.VITE_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

// Initialize Supabase with Service Role Key to bypass RLS and get all subscriptions
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, body, url, targetUserId, audience } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Missing title' });
    }

    // Verify authentication - check if the user sending this request is an admin
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if the sender is asking to notify admins
    const targetRole = req.body.targetRole; // 'admin' or undefined
    const isSendingToAdmins = targetRole === 'admin';

    // Verify user is an admin, UNLESS they are sending a notification explicitly to admins
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin && !isSendingToAdmins) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    // Get push subscriptions from the database
    // Removed is_student as it's no longer reliable. Using user_status instead.
    let query = supabase.from('push_subscriptions').select('*');
    if (targetUserId) {
      query = query.eq('user_id', targetUserId);
    }
    const { data: rawSubscriptions, error: dbError } = await query;

    if (dbError) {
      console.error('Error fetching subscriptions:', dbError);
      return res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }

    let subscriptions = rawSubscriptions || [];

    // If we need to filter by role/audience, fetch profiles separately
    if (subscriptions.length > 0 && (!targetUserId || isSendingToAdmins)) {
      const userIds = [...new Set(subscriptions.map(s => s.user_id).filter(Boolean))];
      
      if (userIds.length > 0) {
        const { data: profilesData, error: profileErr } = await supabase
          .from('profiles')
          .select('id, user_status, is_admin')
          .in('id', userIds);
          
        if (!profileErr && profilesData) {
          // Attach profiles to subscriptions
          subscriptions = subscriptions.map(sub => {
            const profile = profilesData.find(p => p.id === sub.user_id);
            return { ...sub, profiles: profile || null };
          });
        }
      }
    }

    // Filter by audience or role if provided
    if (isSendingToAdmins) {
      // Send ONLY to admins
      subscriptions = subscriptions.filter(sub => sub.profiles?.is_admin === true);
    } else if (!targetUserId && audience && audience.length > 0) {
      const isStudentTarget = audience.includes('student');
      const isOtherTarget = audience.includes('graduate') || audience.includes('other');
      
      if (isStudentTarget && !isOtherTarget) {
        // Only students
        subscriptions = subscriptions.filter(sub => sub.profiles?.user_status === 'student');
      } else if (!isStudentTarget && isOtherTarget) {
        // Only non-students (graduates/others)
        subscriptions = subscriptions.filter(sub => sub.profiles?.user_status !== 'student');
      }
      // If both are true, it sends to everyone, so no filter needed.
    }



    if (!subscriptions || subscriptions.length === 0) {
      return res.status(200).json({ success: true, message: 'No subscriptions found', sentCount: 0 });
    }

    const payload = JSON.stringify({
      title: title,
      body: body || 'כנסו לאפליקציה לפרטים נוספים',
      url: url || 'https://chabad-biu-app.vercel.app/',
      icon: 'https://chabad-biu-app.vercel.app/logo-purple.png',
      badge: 'https://chabad-biu-app.vercel.app/logo-purple.png'
    });

    let sentCount = 0;
    const errors = [];

    // Send push notifications in parallel
    const sendPromises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
        sentCount++;
      } catch (err: any) {
        // If the subscription is gone (e.g., user revoked permission), delete it from our DB
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        } else {
          console.error('Push error:', err);
          errors.push(err);
        }
      }
    });

    await Promise.all(sendPromises);

    return res.status(200).json({ 
      success: true, 
      message: `Pushes sent to ${sentCount} devices`, 
      sentCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
