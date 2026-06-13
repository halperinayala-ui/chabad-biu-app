import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import './NotificationCenter.css';

interface Notification {
  id: string;
  title: string;
  body: string;
  link: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationCenterProps {
  onClose: () => void;
}

export const NotificationCenter = ({ onClose }: NotificationCenterProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string, link: string | null) => {
    try {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      
      await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (link) {
        onClose();
        navigate(link);
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length === 0) return;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .in('id', unreadIds);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  return (
    <motion.div 
      className="notification-center glass"
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <div className="nc-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bell size={18} style={{ color: 'var(--primary)' }} />
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>התראות</h3>
        </div>
        {notifications.some(n => !n.is_read) && (
          <button className="btn-text" onClick={markAllAsRead} style={{ fontSize: '0.8rem', color: 'var(--primary)', padding: '0.2rem 0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            סמן הכל כנקרא
          </button>
        )}
      </div>

      <div className="nc-body">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Loader2 className="spinner" size={24} style={{ color: 'var(--primary)' }} />
          </div>
        ) : notifications.length === 0 ? (
          <div className="nc-empty">
            <Bell size={32} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p>אין התראות חדשות</p>
          </div>
        ) : (
          <div className="nc-list">
            <AnimatePresence>
              {notifications.map((notif) => (
                <motion.div 
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`nc-item ${!notif.is_read ? 'unread' : ''}`}
                  onClick={() => markAsRead(notif.id, notif.link)}
                >
                  <div className="nc-item-icon">
                    {notif.type === 'registration' ? '📅' : notif.type === 'post' ? '💬' : notif.type === 'event' ? '🎉' : '🔔'}
                  </div>
                  <div className="nc-item-content">
                    <h4 className="nc-item-title">{notif.title}</h4>
                    <p className="nc-item-body">{notif.body}</p>
                    <span className="nc-item-time">
                      {new Date(notif.created_at).toLocaleDateString('he-IL')} • {new Date(notif.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {!notif.is_read && <div className="nc-item-dot" />}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
};
