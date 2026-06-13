import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Image as ImageIcon, MessageCircle, Upload, 
  Trash2, X, Cake, ChevronLeft, ChevronRight, Loader2, Sparkles, Video, 
  Heart, MoreVertical, Edit, Lock, Unlock, Plus, Save, Star
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { compressImage } from '../utils/imageCompressor';
import toast from 'react-hot-toast';
import ImageCropper from '../components/ImageCropper';
import './Community.css';

interface GalleryPost {
  id: string;
  image_url: string;
  caption: string;
  created_at: string;
  is_cover?: boolean;
  profiles: {
    full_name: string;
    gender: string;
    is_admin?: boolean;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string;
    gender: string;
  };
}

interface BirthdayProfile {
  id: string;
  full_name: string;
  gender: string;
  heb_birthday: string;
}

interface UnifiedFeedItem {
  id: string;
  type: 'event' | 'media';
  date: Date;
  rawDateString: string;
  title: string; // Acts as the optional title
  category: string;
  description?: string; // Acts as the main post text / caption
  video_url?: string;
  image_url?: string;
  allow_student_uploads?: boolean;
  posts?: GalleryPost[];
  comments: Comment[];
  likesCount: number;
  hasLiked: boolean;
}

interface LikeItem {
  id: string;
  item_id: string;
  user_id: string;
}

const getYouTubeId = (url: string) => {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : '';
};

const Community = () => {
  const { user, profile } = useAuth();

  const [feed, setFeed] = useState<UnifiedFeedItem[]>([]);
  const [birthdays, setBirthdays] = useState<BirthdayProfile[]>([]);
  const [currentHebrewMonthName, setCurrentHebrewMonthName] = useState('');
  const [loading, setLoading] = useState(true);

  // Likes & Comments State
  const [allLikes, setAllLikes] = useState<LikeItem[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Track expanded descriptions per post
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});

  const isGenericCaption = (caption: string) => {
    if (!caption) return true;
    const trimmed = caption.trim();
    if (trimmed === 'תמונה ראשית' || trimmed === 'קאבר גלרייה' || trimmed === 'תמונת גלרייה' || trimmed === 'העלאת סטודנט' || trimmed === 'תמונה נוספה בעריכה') {
      return true;
    }
    return /^תמונה\s+\d+$/.test(trimmed);
  };

  // Inline Carousel active indexes per item
  const [activeSlideIndices, setActiveSlideIndices] = useState<Record<string, number>>({});

  // Swipe support state
  const [touchStartCoords, setTouchStartCoords] = useState<{ [id: string]: number | null }>({});

  const handleTouchStart = (e: React.TouchEvent, itemId: string) => {
    setTouchStartCoords(prev => ({ ...prev, [itemId]: e.targetTouches[0].clientX }));
  };

  const handleTouchEnd = (e: React.TouchEvent, itemId: string, photosLength: number, currentSlide: number) => {
    const touchStart = touchStartCoords[itemId];
    if (touchStart === null || touchStart === undefined) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // swipe left -> next
        setActiveSlideIndices(prev => ({ ...prev, [itemId]: currentSlide === photosLength - 1 ? 0 : currentSlide + 1 }));
      } else {
        // swipe right -> prev
        setActiveSlideIndices(prev => ({ ...prev, [itemId]: currentSlide === 0 ? photosLength - 1 : currentSlide - 1 }));
      }
    }
    setTouchStartCoords(prev => ({ ...prev, [itemId]: null }));
  };

  // Inline expanded comments per item
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  
  // Composer Card State (Facebook/Instagram Style at top of feed)
  const [mediaOptionalTitle, setMediaOptionalTitle] = useState(''); // Stores optional title
  const [mediaTitle, setMediaTitle] = useState(''); // Stores main post text / caption
  const [mediaVideoUrl, setMediaVideoUrl] = useState('');
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [mediaAllowStudentUploads, setMediaAllowStudentUploads] = useState(true); // Default to true
  
  const [composerFiles, setComposerFiles] = useState<File[]>([]);
  const [composerPreviews, setComposerPreviews] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState<number>(0);
  const [croppingFileIndex, setCroppingFileIndex] = useState<number | null>(null);
  const [submittingMedia, setSubmittingMedia] = useState(false);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGalleryPosts, setEditingGalleryPosts] = useState<GalleryPost[]>([]);
  const [uploadingToExisting, setUploadingToExisting] = useState(false);

  // Inline comment state per feed item
  const [inlineComments, setInlineComments] = useState<Record<string, string>>({});

  // State for uploading student image inline
  const [uploadingItemMap, setUploadingItemMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchCommunityData();
  }, []);

  const getHebrewMonth = () => {
    try {
      const formatter = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { month: 'long' });
      const parts = formatter.formatToParts(new Date());
      let month = parts.find(p => p.type === 'month')?.value || '';
      
      // Normalize to match ProfileSettings.tsx MONTH_MAP
      const normalization: Record<string, string> = {
        'תשרי': 'תשרי', 'מרחשוון': 'חשוון', 'חשוון': 'חשוון', 'כסלו': 'כסלו',
        'טבת': 'טבת', 'שבט': 'שבט', 'אדר': 'אדר', 'אדר א׳': 'אדר', 'אדר א': 'אדר',
        'אדר ב׳': 'אדר ב', 'אדר ב': 'אדר ב', 'ניסן': 'ניסן', 'אייר': 'אייר',
        'סיוון': 'סיון', 'סיון': 'סיון', 'תמוז': 'תמוז', 'אב': 'אב', 'אלול': 'אלול'
      };
      
      return normalization[month] || month;
    } catch {
      return '';
    }
  };

  const fetchCommunityData = async () => {
    try {
      setLoading(true);
      
      if (profile?.is_blocked) {
        setFeedItems([]);
        setBirthdays([]);
        setLoading(false);
        return;
      }

      // 1. Get current Hebrew Month for Birthday Banner
      const currentMonth = getHebrewMonth();
      setCurrentHebrewMonthName(currentMonth);

      // 2. Fetch Birthdays of this month
      if (currentMonth) {
        const { data: bdays, error: bdayErr } = await supabase
          .from('profiles')
          .select('id, full_name, gender, heb_birthday')
          .not('heb_birthday', 'is', null);

        if (!bdayErr && bdays) {
          const thisMonthBirthdays = bdays.filter((p: any) => {
            const parts = p.heb_birthday.split(' ב');
            return parts.length === 2 && parts[1].trim() === currentMonth.trim();
          });
          setBirthdays(thisMonthBirthdays);
        }
      }

      // 3. Fetch all community events (no past restriction!)
      let pastEvents: any[] = [];
      try {
        const { data, error } = await supabase
          .from('events')
          .select('id, title, description, event_date, category, allow_student_uploads, show_in_community')
          .eq('show_in_community', true)
          .order('event_date', { ascending: false });
        
        if (error) throw error;
        pastEvents = data || [];
      } catch (fallbackError) {
        console.warn('show_in_community column not found or error, falling back to all events', fallbackError);
        const { data, error } = await supabase
          .from('events')
          .select('id, title, description, event_date, category, allow_student_uploads')
          .order('event_date', { ascending: false });
          
        if (error) throw error;
        pastEvents = data || [];
      }

      const eventsData: any[] = [];
      if (pastEvents && pastEvents.length > 0) {
        for (const ev of pastEvents) {
          const { data: posts } = await supabase
            .from('gallery_posts')
            .select(`
              id, image_url, caption, created_at, is_cover,
              profiles (full_name, gender, is_admin)
            `)
            .eq('event_id', ev.id)
            .order('is_cover', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false });

          const { data: comments } = await supabase
            .from('comments')
            .select(`
              id, content, created_at,
              profiles (full_name, gender)
            `)
            .eq('event_id', ev.id)
            .order('created_at', { ascending: true });

          eventsData.push({
            id: ev.id,
            title: ev.title,
            description: ev.description,
            event_date: ev.event_date,
            category: ev.category,
            allow_student_uploads: ev.allow_student_uploads || false,
            posts: (posts || []) as any[],
            comments: (comments || []) as any[]
          });
        }
      }

      // 4. Fetch Torah & Media posts
      let mediaData: any[] = [];
      try {
        const { data } = await supabase
          .from('media_contents')
          .select('*')
          .order('created_at', { ascending: false });
        mediaData = data || [];
      } catch (mediaErr) {
        console.warn('Error fetching media contents:', mediaErr);
      }

      // 5. Fetch media comments
      const mediaCommentsMap: Record<string, Comment[]> = {};
      try {
        const { data: mComments } = await supabase
          .from('media_comments')
          .select(`
            id, media_id, content, created_at,
            profiles (full_name, gender)
          `)
          .order('created_at', { ascending: true });

        if (mComments) {
          mComments.forEach((c: any) => {
            if (!mediaCommentsMap[c.media_id]) {
              mediaCommentsMap[c.media_id] = [];
            }
            mediaCommentsMap[c.media_id].push({
              id: c.id,
              content: c.content,
              created_at: c.created_at,
              profiles: c.profiles
            });
          });
        }
      } catch (err) {
        console.warn('media_comments table does not exist yet', err);
      }

      // 6. Fetch Likes
      let likesList: LikeItem[] = [];
      try {
        const { data: dbLikes } = await supabase
          .from('likes')
          .select('*');
        if (dbLikes) {
          likesList = dbLikes;
          setAllLikes(dbLikes);
        }
      } catch (likesErr) {
        console.warn('likes table does not exist yet', likesErr);
      }

      // 7. Combine and Sort Feed chronologically
      const feedItems: UnifiedFeedItem[] = [];

      eventsData.forEach(ev => {
        const itemLikes = likesList.filter(l => l.item_id === ev.id);
        const hasLiked = user ? itemLikes.some(l => l.user_id === user.id) : false;

        feedItems.push({
          id: ev.id,
          type: 'event',
          date: new Date(ev.event_date),
          rawDateString: ev.event_date,
          title: ev.title, // Title
          category: ev.category,
          description: ev.description, // Main post text
          allow_student_uploads: ev.allow_student_uploads,
          posts: ev.posts,
          comments: ev.comments,
          likesCount: itemLikes.length,
          hasLiked
        });
      });

      mediaData.forEach(post => {
        const itemLikes = likesList.filter(l => l.item_id === post.id);
        const hasLiked = user ? itemLikes.some(l => l.user_id === user.id) : false;

        feedItems.push({
          id: post.id,
          type: 'media',
          date: new Date(post.created_at),
          rawDateString: post.created_at,
          title: post.title, // Title
          category: post.category,
          description: post.description, // Main post text
          video_url: post.video_url,
          image_url: post.image_url,
          comments: mediaCommentsMap[post.id] || [],
          likesCount: itemLikes.length,
          hasLiked
        });
      });

      // Sort descending (newest first)
      feedItems.sort((a, b) => b.date.getTime() - a.date.getTime());
      setFeed(feedItems);

    } catch (err) {
      console.error('Error fetching community data:', err);
      toast.error('שגיאה בטעינת נתוני הקהילה');
    } finally {
      setLoading(false);
    }
  };

  // Toggle Likes System
  const handleToggleLike = async (itemId: string, itemType: 'event' | 'media') => {
    if (!user) {
      toast.error('יש להתחבר כדי לסמן לייק! ❤️');
      return;
    }

    const existingLike = allLikes.find(l => l.item_id === itemId && l.user_id === user.id);
    
    // Optimistic UI update
    setFeed(prevFeed => prevFeed.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          hasLiked: !item.hasLiked,
          likesCount: item.hasLiked ? item.likesCount - 1 : item.likesCount + 1
        };
      }
      return item;
    }));

    try {
      if (existingLike) {
        // Delete like
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('id', existingLike.id);
        
        if (!error) {
          const updatedLikes = allLikes.filter(l => l.id !== existingLike.id);
          setAllLikes(updatedLikes);
        }
      } else {
        // Insert like
        const { data, error } = await supabase
          .from('likes')
          .insert([{
            item_id: itemId,
            item_type: itemType,
            user_id: user.id
          }])
          .select()
          .single();

        if (!error && data) {
          setAllLikes([...allLikes, data]);
        }
      }
    } catch (err) {
      console.warn('Likes table might be missing, reverting update', err);
    }
  };

  // Toggle Student Uploads for Events
  const handleToggleStudentUploads = async (eventId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ allow_student_uploads: !currentStatus })
        .eq('id', eventId);

      if (error) throw error;
      
      toast.success(currentStatus ? 'העלאת תמונות לסטודנטים ננעלה 🔒' : 'העלאת תמונות לסטודנטים אושרה! 🔓');
      setFeed(prevFeed => prevFeed.map(item => {
        if (item.type === 'event' && item.id === eventId) {
          return { ...item, allow_student_uploads: !currentStatus };
        }
        return item;
      }));
      setActiveMenuId(null);
    } catch (err) {
      toast.error('שגיאה בשינוי הגדרות האירוע');
    }
  };

  // Delete Torah & Media Content
  const handleDeleteMediaContent = async (itemId: string, itemType: 'event' | 'media') => {
    if (!window.confirm('האם למחוק פוסט זה לצמיתות מהפיד?')) return;

    try {
      if (itemType === 'event') {
        const { error } = await supabase
          .from('events')
          .delete()
          .eq('id', itemId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('media_contents')
          .delete()
          .eq('id', itemId);
        if (error) throw error;
      }
      
      toast.success('הפוסט נמחק בהצלחה');
      setFeed(prevFeed => prevFeed.filter(item => item.id !== itemId));
      setActiveMenuId(null);
    } catch (err) {
      toast.error('שגיאה במחיקת הפוסט');
    }
  };

  // Multiple files selection handler for composer
  const handleMultipleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setComposerFiles(prev => [...prev, ...filesArray]);
      
      const previewsArray = filesArray.map(file => URL.createObjectURL(file));
      setComposerPreviews(prev => [...prev, ...previewsArray]);
    }
  };

  const handleRemoveComposerFile = (index: number) => {
    setComposerFiles(prev => prev.filter((_, i) => i !== index));
    setComposerPreviews(prev => prev.filter((_, i) => i !== index));
    if (coverIndex === index) {
      setCoverIndex(0);
    } else if (coverIndex > index) {
      setCoverIndex(prev => prev - 1);
    }
  };

  const handleCropDone = (croppedFile: File) => {
    if (croppingFileIndex === null) return;
    
    setComposerFiles(prev => {
      const newFiles = [...prev];
      newFiles[croppingFileIndex] = croppedFile;
      return newFiles;
    });

    setComposerPreviews(prev => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[croppingFileIndex]);
      newPreviews[croppingFileIndex] = URL.createObjectURL(croppedFile);
      return newPreviews;
    });

    setCroppingFileIndex(null);
  };

  // Direct Add / Edit Media Submit Handler
  const handleMediaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaTitle.trim()) {
      toast.error('אנא כתבו את תוכן הפוסט ✍️');
      return;
    }

    setSubmittingMedia(true);
    try {
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      if (editingItem) {
        if (editingItem.type === 'event') {
          // Update event details
          const { error } = await supabase
            .from('events')
            .update({ 
              title: mediaOptionalTitle.trim(),
              description: mediaTitle.trim()
            })
            .eq('id', editingItem.id);

          if (error) throw error;
        } else {
          // Update media details
          const { error } = await supabase
            .from('media_contents')
            .update({
              title: mediaOptionalTitle.trim(),
              description: mediaTitle.trim(),
              video_url: mediaVideoUrl.trim()
            })
            .eq('id', editingItem.id);

          if (error) throw error;
        }
        toast.success('הפוסט עודכן בהצלחה!');
      } else {
        // CREATE NEW POST
        // If they upload MULTIPLE images OR they upload at least one image with Student uploads enabled, 
        // it is automatically saved as a fully customizable event gallery post!
        if (composerFiles.length > 0) {
          toast.loading('יוצר פוסט גלרייה...', { id: 'gallery' });
          
          // 1. Create a container Event row
          const { data: newEv, error: evErr } = await supabase
            .from('events')
            .insert([{
              title: mediaOptionalTitle.trim(),
              description: mediaTitle.trim(),
              event_date: todayStr,
              category: 'other',
              allow_student_uploads: mediaAllowStudentUploads,
              show_in_community: true
            }])
            .select()
            .single();

          if (evErr) throw evErr;

          // 2. Upload each file in the files array
          for (let i = 0; i < composerFiles.length; i++) {
            const file = composerFiles[i];
            toast.loading(`מעלה תמונה ${i + 1} מתוך ${composerFiles.length}...`, { id: 'gallery' });
            
            const compressed = await compressImage(file);
            const fileExt = file.name.split('.').pop() || 'jpg';
            const fileName = `${newEv.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            const filePath = `uploads/${fileName}`;

            const { error: uploadErr } = await supabase.storage
              .from('community')
              .upload(filePath, compressed, { contentType: 'image/jpeg' });

            if (uploadErr) throw uploadErr;

            const { data: publicUrlData } = supabase.storage
              .from('community')
              .getPublicUrl(filePath);

            const { error: gpErr } = await supabase.from('gallery_posts').insert([{
              event_id: newEv.id,
              user_id: user?.id,
              image_url: publicUrlData.publicUrl,
              caption: i === coverIndex ? 'תמונה ראשית' : `תמונה ${i + 1}`,
              is_cover: i === coverIndex
            }]);
            if (gpErr) {
              console.error('gallery_posts insert error:', gpErr);
              // Try without is_cover if column doesn't exist
              if (gpErr.code === 'PGRST204' || gpErr.message?.includes('is_cover')) {
                const { error: gpErr2 } = await supabase.from('gallery_posts').insert([{
                  event_id: newEv.id,
                  user_id: user?.id,
                  image_url: publicUrlData.publicUrl,
                  caption: i === coverIndex ? 'תמונה ראשית' : `תמונה ${i + 1}`
                }]);
                if (gpErr2) throw gpErr2;
              } else {
                throw gpErr;
              }
            }
          }

          toast.dismiss('gallery');
          toast.success('גלריית פוסט חדשה פורסמה בהצלחה! 📸');
        } else {
          // Normal simple post (stored in media_contents)
          const { error } = await supabase
            .from('media_contents')
            .insert([{
              title: mediaOptionalTitle.trim(),
              description: mediaTitle.trim(),
              category: 'other',
              video_url: mediaVideoUrl.trim(),
              created_by: user?.id
            }]);

          if (error) throw error;
          toast.success('פוסט חדש פורסם בהצלחה!');
        }

        // Trigger Inbox Notification (via RPC)
        try {
          await supabase.rpc('notify_users', {
            p_title: 'פוסט חדש בקהילה!',
            p_body: mediaOptionalTitle.trim() || mediaTitle.trim() || 'כנסו לראות מה חדש',
            p_link: '/community',
            p_type: 'post',
            p_audience: [] // Send to everyone
          });
        } catch (inboxErr) {
          console.error("Could not trigger inbox notification", inboxErr);
        }

        // Trigger Push Notification for new post
        try {
          const session = await supabase.auth.getSession();
          const token = session.data.session?.access_token;
          if (token) {
            fetch('/api/notify-event', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                title: 'פוסט חדש בקהילה! 🎉',
                body: mediaOptionalTitle.trim() || mediaTitle.trim() || 'כנסו לראות מה חדש',
                url: 'https://chabad-biu-app.vercel.app/community'
              })
            }).catch(e => console.error("Push notification trigger failed:", e));
          }
        } catch (pushErr) {
          console.error("Could not trigger push notification", pushErr);
        }
      }

      // Reset states and reload
      setIsEditModalOpen(false);
      setEditingItem(null);
      resetCreatorFields();
      fetchCommunityData();
    } catch (err: any) {
      toast.dismiss('gallery');
      toast.error('שגיאה בשמירת הפוסט: ' + err.message);
    } finally {
      setSubmittingMedia(false);
    }
  };

  const resetCreatorFields = () => {
    setMediaOptionalTitle('');
    setMediaTitle('');
    setMediaVideoUrl('');
    setComposerFiles([]);
    setComposerPreviews([]);
    setMediaAllowStudentUploads(true);
    setShowYoutubeInput(false);
  };

  const handleOpenEditMedia = (item: UnifiedFeedItem) => {
    setEditingItem(item);
    setMediaOptionalTitle(item.title || '');
    setMediaTitle(item.description || '');
    setMediaVideoUrl(item.video_url || '');
    setEditingGalleryPosts(item.posts || []);
    setIsEditModalOpen(true);
    setActiveMenuId(null);
  };

  const handleSetCover = async (postId: string, eventId: string) => {
    try {
      await supabase.from('gallery_posts').update({ is_cover: false }).eq('event_id', eventId);
      await supabase.from('gallery_posts').update({ is_cover: true, caption: 'תמונה ראשית' }).eq('id', postId);
      toast.success('תמונת נושא הוגדרה בהצלחה!');
      const updatedPosts = editingGalleryPosts.map(p => ({
        ...p,
        is_cover: p.id === postId,
        caption: p.id === postId ? 'תמונה ראשית' : p.caption
      }));
      setEditingGalleryPosts(updatedPosts as any);
      setFeed(prevFeed => prevFeed.map(item => item.id === eventId ? { ...item, posts: updatedPosts as any } : item));
    } catch (e) {
      toast.error('שגיאה בהגדרת תמונת הנושא');
    }
  };

  const handleDeleteExistingGalleryPost = async (postId: string) => {
    if (!window.confirm('האם למחוק תמונה זו מהגלריה? הפעולה לא הפיכה.')) return;
    try {
      await supabase.from('gallery_posts').delete().eq('id', postId);
      toast.success('התמונה נמחקה');
      const updatedPosts = editingGalleryPosts.filter(p => p.id !== postId);
      setEditingGalleryPosts(updatedPosts);
      setFeed(prevFeed => prevFeed.map(item => item.id === editingItem?.id ? { ...item, posts: updatedPosts as any } : item));
    } catch (e) {
      toast.error('שגיאה במחיקת תמונה');
    }
  };

  const handleAddPhotosToExisting = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length || !editingItem || !user) return;
    setUploadingToExisting(true);
    try {
      const filesArray = Array.from(e.target.files);
      const newPosts: GalleryPost[] = [];
      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];
        toast.loading(`מעלה תמונה ${i + 1}/${filesArray.length}...`, { id: 'upload-existing' });
        const compressed = await compressImage(file);
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${editingItem.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `uploads/${fileName}`;
        await supabase.storage.from('community').upload(filePath, compressed, { contentType: 'image/jpeg' });
        const { data: publicUrlData } = supabase.storage.from('community').getPublicUrl(filePath);
        const { data: newPost } = await supabase.from('gallery_posts').insert([{
          event_id: editingItem.id,
          user_id: user.id,
          image_url: publicUrlData.publicUrl,
          caption: 'תמונה נוספה בעריכה'
        }]).select('id, image_url, caption, created_at, is_cover, profiles (full_name, gender, is_admin)').single();
        if (newPost) newPosts.push(newPost as any);
      }
      toast.dismiss('upload-existing');
      toast.success('תמונות חדשות נוספו בהצלחה!');
      const updatedPosts = [...newPosts, ...editingGalleryPosts];
      setEditingGalleryPosts(updatedPosts);
      setFeed(prevFeed => prevFeed.map(item => item.id === editingItem.id ? { ...item, posts: updatedPosts as any } : item));
    } catch (err: any) {
      toast.dismiss('upload-existing');
      toast.error('שגיאה בהעלאה: ' + err.message);
    } finally {
      setUploadingToExisting(false);
    }
  };

  // Submit comment directly on the Feed card (Instagram style)
  const handleInlineCommentSubmit = async (e: React.FormEvent, itemId: string, itemType: 'event' | 'media') => {
    e.preventDefault();
    const commentText = inlineComments[itemId];
    if (!commentText || !commentText.trim()) return;

    if (!user) {
      toast.error('יש להתחבר כדי להגיב! 💬');
      return;
    }

    try {
      if (itemType === 'event') {
        const { data: newComment, error } = await supabase
          .from('comments')
          .insert([{
            event_id: itemId,
            user_id: user.id,
            content: commentText.trim()
          }])
          .select(`
            id, content, created_at,
            profiles (full_name, gender)
          `)
          .single();

        if (error) throw error;
        toast.success('תגובתך פורסמה!');

        // Update local Feed state
        setFeed(prevFeed => prevFeed.map(item => {
          if (item.id === itemId) {
            return { ...item, comments: [...item.comments, newComment as any] };
          }
          return item;
        }));
      } else {
        // media comments
        const { data: newMComment, error } = await supabase
          .from('media_comments')
          .insert([{
            media_id: itemId,
            user_id: user.id,
            content: commentText.trim()
          }])
          .select(`
            id, content, created_at,
            profiles (full_name, gender)
          `)
          .single();

        if (error) throw error;
        toast.success('תגובתך פורסמה!');

        // Update local Feed state
        setFeed(prevFeed => prevFeed.map(item => {
          if (item.id === itemId) {
            return { ...item, comments: [...item.comments, newMComment as any] };
          }
          return item;
        }));
      }

      setInlineComments({ ...inlineComments, [itemId]: '' });
    } catch (err) {
      toast.error('שגיאה בפרסום התגובה');
    }
  };

  // Inline student photo upload handler
  const handleInlinePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, eventId: string) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    if (!user) {
      toast.error('יש להתחבר כדי להעלות תמונות! 🔐');
      return;
    }

    setUploadingItemMap(prev => ({ ...prev, [eventId]: true }));
    try {
      toast.loading('מעבד ומכווץ תמונה...', { id: 'inline-compress' });
      const compressed = await compressImage(file);
      toast.dismiss('inline-compress');

      toast.loading('מעלה תמונה לגלריית הפוסט...', { id: 'inline-upload' });
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${eventId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('community')
        .upload(filePath, compressed, { contentType: 'image/jpeg' });

      if (uploadErr) throw uploadErr;

      const { data: publicUrlData } = supabase.storage
        .from('community')
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      // Insert into gallery_posts
      const { data: newPost, error: dbErr } = await supabase
        .from('gallery_posts')
        .insert([{
          event_id: eventId,
          user_id: user.id,
          image_url: publicUrl,
          caption: 'העלאת סטודנט'
        }])
        .select(`
          id, image_url, caption, created_at,
          profiles (full_name, gender, is_admin)
        `)
        .single();

      if (dbErr) throw dbErr;

      toast.dismiss('inline-upload');
      toast.success('תמונתך נוספה לגלריית הפוסט בהצלחה! 🎉');

      // Update local feed state to render immediately in carousel
      setFeed(prevFeed => prevFeed.map(item => {
        if (item.id === eventId) {
          const posts = item.posts ? [newPost as any, ...item.posts] : [newPost as any];
          return { ...item, posts: posts as any };
        }
        return item;
      }));

      // Set carousel active slide to the newly uploaded image (which is at index 0)
      setActiveSlideIndices(prev => ({ ...prev, [eventId]: 0 }));

    } catch (err: any) {
      toast.dismiss('inline-upload');
      toast.error('שגיאה בהעלאת התמונה: ' + err.message);
    } finally {
      setUploadingItemMap(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const handleDeleteComment = async (commentId: string, itemId: string, itemType: 'event' | 'media') => {
    if (!window.confirm('האם למחוק תגובה זו מהרשימה?')) return;

    try {
      if (itemType === 'event') {
        const { error } = await supabase
          .from('comments')
          .delete()
          .eq('id', commentId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('media_comments')
          .delete()
          .eq('id', commentId);
        if (error) throw error;
      }
      
      toast.success('התגובה נמחקה');
      setFeed(prevFeed => prevFeed.map(item => {
        if (item.id === itemId) {
          return { ...item, comments: item.comments.filter(c => c.id !== commentId) };
        }
        return item;
      }));
    } catch (err) {
      toast.error('שגיאה במחיקת התגובה');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8rem 2rem' }}>
        <Loader2 className="spinner" size={40} style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  return (
    <div className="community-page" style={{ paddingTop: '1rem' }}>
      {/* 1. Birthday Banner */}
      {currentHebrewMonthName && (
        <motion.div 
          className="birthday-banner glass"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="birthday-balloon-bg">
            <div className="balloon red"></div>
            <div className="balloon yellow"></div>
            <div className="balloon blue"></div>
          </div>
          <div className="birthday-content">
            <div className="birthday-icon-wrapper">
              <Cake className="birthday-icon" size={32} />
              <Sparkles className="sparkles-icon" size={18} />
            </div>
            <div className="birthday-text">
              <h2>ימי הולדת החודש! 🥳</h2>
              {birthdays.length > 0 ? (
                <>
                  <p>שולחים המון מזל טוב וברכות חמות לסטודנטים שלנו שחוגגים בחודש <strong>{currentHebrewMonthName}</strong>:</p>
                  <div className="birthday-list">
                    {birthdays.map((b, idx) => (
                      <span key={b.id} className="birthday-name-tag">
                        {b.full_name} ({b.heb_birthday.split(' ב')[0]})
                        {idx < birthdays.length - 1 ? ' • ' : ''}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <p>אין ימי הולדת רשומים בחודש <strong>{currentHebrewMonthName}</strong>. עדיין לא עדכנתם את יום ההולדת שלכם? עברו אל <strong>האזור האישי</strong> והזינו את יום ההולדת העברי שלכם כדי להופיע כאן!</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Unified Instagram chronological feed */}
      <div className="instagram-feed-container">
        
        {/* 2. Instagram Style Composer Card (Facebook Style Creator at top of feed) */}
        {profile?.is_admin && (
          <div className="instagram-composer-card glass" style={{ width: '100%', padding: '1.25rem', borderRadius: '24px', border: '1px solid rgba(73, 38, 145, 0.08)', display: 'flex', flexDirection: 'column', gap: '0.85rem', background: 'white', boxShadow: '0 8px 30px rgba(73,38,145,0.03)', marginBottom: '1rem' }}>
            <div className="composer-header" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div className="author-avatar gradient-border" style={{ flexShrink: 0 }}>👑</div>
              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {/* Optional Title Field */}
                <input 
                  type="text"
                  placeholder="כותרת הפוסט (אופציונלי)..."
                  value={mediaOptionalTitle}
                  onChange={(e) => setMediaOptionalTitle(e.target.value)}
                  style={{ width: '100%', border: 'none', background: 'rgba(0,0,0,0.012)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.9rem', fontWeight: 800, outline: 'none', fontFamily: 'inherit' }}
                />
                {/* Main Post Text/Caption Area */}
                <textarea 
                  className="composer-textarea"
                  placeholder="על מה תרצו לכתוב היום? (תוכן הפוסט)..."
                  value={mediaTitle}
                  onChange={(e) => setMediaTitle(e.target.value)}
                  style={{ width: '100%', border: 'none', background: 'rgba(0,0,0,0.015)', borderRadius: '12px', padding: '0.75rem', fontSize: '0.92rem', resize: 'none', outline: 'none', minHeight: '80px', fontFamily: 'inherit' }}
                />
              </div>
            </div>
            
            {/* Scrollable Previews of Selected Multiple Files */}
            {composerPreviews.length > 0 && (
              <div className="composer-previews-list" style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', padding: '0.25rem 0', alignItems: 'flex-start' }}>
                {composerPreviews.map((preview, index) => (
                  <div key={index} className="composer-preview-wrapper" style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '12px', overflow: 'hidden', border: coverIndex === index ? '3px solid var(--primary)' : '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }}>
                    <img src={preview} alt="Upload Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {coverIndex === index && (
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--primary)', color: 'white', fontSize: '0.7rem', textAlign: 'center', padding: '2px 0', fontWeight: 'bold' }}>
                        ראשית
                      </div>
                    )}
                    <button 
                      type="button" 
                      className="remove-preview-btn" 
                      onClick={() => handleRemoveComposerFile(index)}
                      style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(231, 76, 60, 0.85)', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                      title="הסר"
                    >
                      <X size={12} />
                    </button>
                    <div style={{ position: 'absolute', top: '4px', left: '4px', display: 'flex', gap: '4px' }}>
                      <button 
                        type="button" 
                        onClick={() => setCroppingFileIndex(index)}
                        style={{ background: 'rgba(0,0,0,0.65)', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                        title="חיתוך תמונה"
                      >
                        <Edit size={12} />
                      </button>
                      {coverIndex !== index && (
                        <button 
                          type="button" 
                          onClick={() => setCoverIndex(index)}
                          style={{ background: 'rgba(0,0,0,0.65)', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                          title="קבע כראשית"
                        >
                          <Star size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* YouTube Link field */}
            {showYoutubeInput && (
              <div className="composer-youtube-drawer" style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="url"
                  className="form-control"
                  placeholder="הדביקו קישור מיוטיוב לכאן..."
                  value={mediaVideoUrl}
                  onChange={(e) => setMediaVideoUrl(e.target.value)}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>
            )}

            {/* Composer Action Footer */}
            <div className="composer-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.03)', paddingTop: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div className="composer-actions-left" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                <label className="composer-btn-attach" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)', background: 'rgba(73, 38, 145, 0.05)', padding: '0.45rem 0.8rem', borderRadius: '10px' }}>
                  <ImageIcon size={16} />
                  <span>בחירת תמונות / גלריה</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple
                    onChange={handleMultipleFilesChange}
                    style={{ display: 'none' }}
                  />
                </label>

                <button 
                  type="button"
                  className={`composer-btn-attach ${showYoutubeInput ? 'active' : ''}`}
                  onClick={() => setShowYoutubeInput(!showYoutubeInput)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, color: '#e74c3c', background: 'rgba(231, 76, 60, 0.05)', padding: '0.45rem 0.8rem', borderRadius: '10px', border: 'none' }}
                >
                  <Video size={16} />
                  <span>קישור סרטון</span>
                </button>

                <label className="composer-switch" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 700 }}>
                  <input 
                    type="checkbox" 
                    checked={mediaAllowStudentUploads}
                    onChange={(e) => setMediaAllowStudentUploads(e.target.checked)}
                  />
                  <span>הרשאת העלאה לסטודנטים</span>
                </label>
              </div>

              <button 
                className="btn btn-primary"
                onClick={handleMediaSubmit}
                disabled={submittingMedia || !mediaTitle.trim()}
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.88rem', fontWeight: 800 }}
              >
                {submittingMedia ? 'מפרסם פוסט...' : 'פרסם פוסט'}
              </button>
            </div>
          </div>
        )}

        {/* The Chronological Feed Stream */}
        {feed.map((item) => {
          const isEvent = item.type === 'event';
          const ytId = !isEvent ? getYouTubeId(item.video_url || '') : '';
          
          // Manage active carousel slide index
          const photos = isEvent ? (item.posts || []) : [];
          const currentSlide = activeSlideIndices[item.id] || 0;
          const hasPhotos = photos.length > 0;
          const coverImage = !isEvent ? (item.image_url || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null)) : null;

          return (
            <motion.div 
              key={`${item.type}-${item.id}`}
              className="instagram-post-card glass"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Admin dots menu - floats over the image, no header bar */}
              {profile?.is_admin && (
                <div className="post-header-actions" style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 20 }}>
                  <button 
                    className="btn-options-dots"
                    onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === item.id ? null : item.id); }}
                    style={{ background: 'rgba(0,0,0,0.45)', color: 'white', borderRadius: '50%', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
                  >
                    <MoreVertical size={18} />
                  </button>

                  <AnimatePresence>
                    {activeMenuId === item.id && (
                      <motion.div 
                        className="admin-dropdown-menu glass"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                            {isEvent ? (
                              <>
                                <button 
                                  className="dropdown-item"
                                  onClick={() => handleToggleStudentUploads(item.id, item.allow_student_uploads || false)}
                                >
                                  {item.allow_student_uploads ? (
                                    <><Lock size={14} /> נעילת העלאת סטודנטים</>
                                  ) : (
                                    <><Unlock size={14} /> אישור העלאת סטודנטים</>
                                  )}
                                </button>
                                <button className="dropdown-item" onClick={() => handleOpenEditMedia(item)}>
                                  <Edit size={14} /> עריכת פוסט
                                </button>
                                <button className="dropdown-item delete" onClick={() => handleDeleteMediaContent(item.id, 'event')}>
                                  <Trash2 size={14} /> מחיקת פוסט
                                </button>
                              </>
                            ) : (
                              <>
                                <button className="dropdown-item" onClick={() => handleOpenEditMedia(item)}>
                                  <Edit size={14} /> עריכת פוסט
                                </button>
                                <button className="dropdown-item delete" onClick={() => handleDeleteMediaContent(item.id, 'media')}>
                                  <Trash2 size={14} /> מחיקת פוסט
                                </button>
                              </>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

              {/* Instagram Post Media Area - RENDER DIRECTLY INLINE (NO POPUPS!) */}
              {isEvent ? (
                // Event gallery slider carousel inline
                hasPhotos ? (
                  <div 
                    className="instagram-post-media inline-carousel"
                    onTouchStart={(e) => handleTouchStart(e, item.id)}
                    onTouchEnd={(e) => handleTouchEnd(e, item.id, photos.length, currentSlide)}
                  >
                    <div 
                      className="carousel-track-container" 
                      dir="ltr"
                      style={{ 
                        position: 'relative',
                        width: '100%', 
                        height: 'auto',
                        overflow: 'hidden'
                      }}
                    >
                      {photos.map((photo, idx) => {
                        const isCurrent = idx === currentSlide;
                        const isPrev = idx < currentSlide;
                        const isNext = idx > currentSlide;
                        
                        let transform = 'translateX(0)';
                        if (isPrev) transform = 'translateX(-100%)';
                        if (isNext) transform = 'translateX(100%)';

                        return (
                          <div 
                            key={photo.id} 
                            style={{ 
                              position: isCurrent ? 'relative' : 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              transition: 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
                              transform: transform,
                              zIndex: isCurrent ? 1 : 0
                            }}
                          >
                            <img 
                              src={photo.image_url} 
                              alt={`Gallery slide ${idx}`} 
                              className="post-media-img" 
                              style={{ width: '100%', height: 'auto', display: 'block' }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Student uploader badge on the active photo */}
                    {photos[currentSlide]?.profiles && !photos[currentSlide].profiles.is_admin && (
                      <div className="photo-uploader-badge" style={{ position: 'absolute', bottom: '24px', right: '12px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', zIndex: 10 }}>
                        הועלה ע"י {photos[currentSlide].profiles.full_name}
                      </div>
                    )}

                    {/* Caption for the active photo if exists and is NOT generic */}
                    {photos[currentSlide]?.caption && !isGenericCaption(photos[currentSlide].caption) && (
                      <div className="photo-caption" style={{ position: 'absolute', bottom: '24px', left: '12px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', zIndex: 10 }}>
                        {photos[currentSlide].caption}
                      </div>
                    )}

                    {/* Trash photo button for admin */}
                    {profile?.is_admin && (
                      <button 
                        className="delete-photo-btn"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!window.confirm('האם למחוק תמונה זו מהגלריה?')) return;
                          await supabase.from('gallery_posts').delete().eq('id', photos[currentSlide].id);
                          toast.success('התמונה נמחקה בהצלחה');
                          setFeed(prevFeed => prevFeed.map(f => {
                            if (f.id === item.id) {
                              return { ...f, posts: f.posts?.filter(p => p.id !== photos[currentSlide].id) || [] };
                            }
                            return f;
                          }));
                          setActiveSlideIndices({ ...activeSlideIndices, [item.id]: 0 });
                        }}
                        style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 12, background: 'rgba(231, 76, 60, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        title="מחק תמונה זו"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}

                    {/* Navigation Arrows for Slider Carousel */}
                    {photos.length > 1 && (
                      <>
                        <button 
                          className="carousel-arrow prev"
                          onClick={() => {
                            const nextIndex = currentSlide === 0 ? photos.length - 1 : currentSlide - 1;
                            setActiveSlideIndices({ ...activeSlideIndices, [item.id]: nextIndex });
                          }}
                        >
                          <ChevronRight size={18} />
                        </button>
                        <button 
                          className="carousel-arrow next"
                          onClick={() => {
                            const nextIndex = currentSlide === photos.length - 1 ? 0 : currentSlide + 1;
                            setActiveSlideIndices({ ...activeSlideIndices, [item.id]: nextIndex });
                          }}
                        >
                          <ChevronLeft size={18} />
                        </button>

                        {/* Pagination Indicator Dots */}
                        <div className="carousel-dots">
                          {photos.map((_, i) => (
                            <span key={i} className={`carousel-dot ${i === currentSlide ? 'active' : ''}`} />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="instagram-post-media">
                    <div className="post-media-placeholder">
                      <ImageIcon size={48} />
                      <span>אין תמונות בגלריה עדיין</span>
                    </div>
                  </div>
                )
              ) : (
                // Simple Torah & Media content: image or video embedded directly inline
                ytId ? (
                  <div className="instagram-post-media video-mode">
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}`}
                      title={item.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="youtube-iframe-player inline-player"
                    ></iframe>
                  </div>
                ) : coverImage ? (
                  <div className="instagram-post-media">
                    <img src={coverImage} alt={item.title} className="post-media-img" style={{ width: '100%', height: 'auto', display: 'block' }} />
                  </div>
                ) : null
              )}

              {/* Instagram Actions Bar (Like, Comment) */}
              <div className="instagram-actions-bar">
                <div className="actions-left">
                  <button 
                    className={`action-btn-heart ${item.hasLiked ? 'liked' : ''}`}
                    onClick={() => handleToggleLike(item.id, item.type)}
                  >
                    <Heart size={24} fill={item.hasLiked ? '#ff385c' : 'none'} color={item.hasLiked ? '#ff385c' : 'var(--text-primary)'} />
                  </button>

                  <button 
                    className="action-btn-comment"
                    onClick={() => {
                      const inputEl = document.getElementById(`comment-input-${item.id}`);
                      if (inputEl) inputEl.focus();
                    }}
                  >
                    <MessageCircle size={24} />
                  </button>
                </div>

                {isEvent && (
                  <div className="actions-right">
                    <span className="uploads-status-badge">
                      {item.allow_student_uploads ? '🔓 העלאת סטודנטים פעילה' : '🔒 העלאת תמונות נעולה'}
                    </span>
                  </div>
                )}
              </div>

              {/* Instagram Card Caption & Comments */}
              <div className="instagram-post-details">
                {/* Likes count */}
                {item.likesCount > 0 && (
                  <div className="likes-count-label" style={{ marginBottom: '0.45rem' }}>
                    Liked by <strong>{item.likesCount}</strong> people
                  </div>
                )}

                {/* Optional Title & Main Post Text */}
                <div className="post-caption-block" style={{ marginBottom: '0.65rem' }}>
                  {item.title && item.title.trim() !== '' && (
                    <h3 className="inline-post-title">{item.title}</h3>
                  )}
                  {item.description && item.description.trim() !== '' && (
                    <div className="inline-post-text-wrapper">
                      <p className="inline-post-text">
                        {item.description.length > 150 && !expandedDescriptions[item.id]
                          ? `${item.description.slice(0, 150)}...`
                          : item.description}
                      </p>
                      {item.description.length > 150 && (
                        <button
                          type="button"
                          className="btn-read-more"
                          onClick={() => setExpandedDescriptions(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary)',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            padding: '0.2rem 0',
                            marginTop: '0.25rem',
                            display: 'block'
                          }}
                        >
                          {expandedDescriptions[item.id] ? 'הצג פחות' : 'קרא עוד'}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Inline Student Upload Action Button inside the card itself! */}
                {isEvent && item.allow_student_uploads && (
                  <div className="inline-student-upload-bar">
                    <label className="inline-upload-btn">
                      {uploadingItemMap[item.id] ? (
                        <>
                          <Loader2 size={14} className="spinner" />
                          <span>מעלה תמונה לגלריה...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={14} />
                          <span>הצטרפו והעלו תמונות לגלריה 📸</span>
                        </>
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        disabled={uploadingItemMap[item.id]}
                        onChange={(e) => handleInlinePhotoUpload(e, item.id)} 
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                )}

                {/* Comments List Preview - Rendered fully inline with toggle */}
                {item.comments.length > 0 && (
                  <div className="feed-comments-preview" style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {item.comments.length > 3 && !expandedComments[item.id] && (
                      <button 
                        className="btn-inline-show-more-comments"
                        onClick={() => setExpandedComments({ ...expandedComments, [item.id]: true })}
                      >
                        צפו בכל {item.comments.length} התגובות
                      </button>
                    )}

                    {item.comments.length > 3 && expandedComments[item.id] && (
                      <button 
                        className="btn-inline-show-more-comments"
                        onClick={() => setExpandedComments({ ...expandedComments, [item.id]: false })}
                      >
                        הסתר תגובות מורחבות
                      </button>
                    )}

                    {/* Slice list depending on expanded toggle state */}
                    {(expandedComments[item.id] ? item.comments : item.comments.slice(-3)).map(c => (
                      <div key={c.id} className="feed-single-comment" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{c.profiles.full_name}:</strong>
                          <span>{c.content}</span>
                        </div>
                        {profile?.is_admin && (
                          <button 
                            onClick={() => handleDeleteComment(c.id, item.id, item.type)}
                            style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', padding: '0.2rem' }}
                            title="מחק תגובה"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment Input Form */}
                <form 
                  className="feed-add-comment-form"
                  onSubmit={(e) => handleInlineCommentSubmit(e, item.id, item.type)}
                >
                  <input 
                    id={`comment-input-${item.id}`}
                    type="text"
                    placeholder="הוסיפו תגובה או חוויה..."
                    className="feed-comment-input"
                    value={inlineComments[item.id] || ''}
                    onChange={(e) => setInlineComments({ ...inlineComments, [item.id]: e.target.value })}
                  />
                  <button 
                    type="submit" 
                    className="feed-comment-submit-btn"
                    disabled={!inlineComments[item.id] || !inlineComments[item.id].trim()}
                  >
                    פרסם
                  </button>
                </form>
              </div>
            </motion.div>
          );
        })}

        {feed.length === 0 && (
          <div className="empty-state glass">
            <ImageIcon size={48} className="empty-icon" />
            <h3>הפיד ריק עדיין</h3>
            <p>המנהלים יעלו גלריות, שיעורים וסרטונים בקרוב. הישארו מעודכנים!</p>
          </div>
        )}
      </div>

      {/* Edit Post Modal (Admins Only) */}
      <AnimatePresence>
        {isEditModalOpen && editingItem && (
          <div className="modal-backdrop" onClick={() => setIsEditModalOpen(false)}>
            <motion.div 
              className="media-watch-modal glass"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '500px', height: 'auto', maxHeight: '90vh' }}
            >
              <button className="modal-close" onClick={() => setIsEditModalOpen(false)}>
                <X size={22} />
              </button>

              <div className="admin-media-form-wrapper" style={{ padding: '2.5rem', overflowY: 'auto', textAlign: 'right' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1.5rem' }}>
                  🎥 עריכת פוסט בפיד
                </h2>

                <form onSubmit={handleMediaSubmit} className="admin-media-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-group">
                    <label>כותרת הפוסט (אופציונלי)</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={mediaOptionalTitle}
                      onChange={(e) => setMediaOptionalTitle(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>תוכן / כיתוב הפוסט *</label>
                    <textarea 
                      className="form-control"
                      rows={4}
                      value={mediaTitle}
                      onChange={(e) => setMediaTitle(e.target.value)}
                      required
                    />
                  </div>

                  {editingItem.type === 'event' && (
                    <div className="form-group">
                      <label>ניהול תמונות בגלריה</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px', marginTop: '0.5rem' }}>
                        {editingGalleryPosts.map(post => (
                          <div key={post.id} style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', border: post.is_cover ? '2px solid var(--primary)' : '1px solid #ccc' }}>
                            <img src={post.image_url} alt="Gallery" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            {post.is_cover && (
                              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--primary)', color: 'white', fontSize: '0.7rem', textAlign: 'center', padding: '2px 0', fontWeight: 'bold' }}>
                                ראשית
                              </div>
                            )}
                            <div style={{ position: 'absolute', top: '4px', left: '4px', display: 'flex', gap: '4px', flexDirection: 'column' }}>
                              <button type="button" onClick={() => handleDeleteExistingGalleryPost(post.id)} style={{ background: 'rgba(231, 76, 60, 0.9)', color: 'white', border: 'none', borderRadius: '4px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="מחיקה"><Trash2 size={12} /></button>
                              {!post.is_cover && (
                                <button type="button" onClick={() => handleSetCover(post.id, editingItem.id)} style={{ background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '4px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="קבע כראשית"><Star size={12} /></button>
                              )}
                            </div>
                          </div>
                        ))}
                        <label style={{ width: '100%', aspectRatio: '1', borderRadius: '8px', border: '2px dashed var(--primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(73, 38, 145, 0.05)', color: 'var(--primary)' }}>
                          {uploadingToExisting ? <Loader2 size={24} className="spinner" /> : <><Plus size={24} /><span style={{ fontSize: '0.75rem', fontWeight: 600, marginTop: '4px' }}>הוסף</span></>}
                          <input type="file" accept="image/*" multiple onChange={handleAddPhotosToExisting} style={{ display: 'none' }} disabled={uploadingToExisting} />
                        </label>
                      </div>
                    </div>
                  )}

                  {editingItem.type === 'media' && (
                    <div className="form-group">
                      <label>קישור וידאו יוטיוב (אופציונלי)</label>
                      <input 
                        type="url" 
                        className="form-control"
                        value={mediaVideoUrl}
                        onChange={(e) => setMediaVideoUrl(e.target.value)}
                      />
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={submittingMedia}
                    style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    {submittingMedia ? <Loader2 size={18} className="spinner" /> : <><Save size={18} /> שמור שינויים</>}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Cropper Overlay */}
      {croppingFileIndex !== null && composerPreviews[croppingFileIndex] && (
        <ImageCropper
          imageSrc={composerPreviews[croppingFileIndex]}
          onCropDone={handleCropDone}
          onCancel={() => setCroppingFileIndex(null)}
          aspectRatio={4/5}
        />
      )}
    </div>
  );
};

export default Community;
