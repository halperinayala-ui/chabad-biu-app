-- ========================================================
-- Chabad on Campus BIU - Database Schema
-- Paste this ENTIRE file into your Supabase SQL Editor
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (For registered users & Admins)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    gender TEXT CHECK (gender IN ('m', 'f', 'other')),
    is_student BOOLEAN DEFAULT true,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Settings Table (For dynamic categories & WA templates)
CREATE TABLE IF NOT EXISTS public.settings (
    id SERIAL PRIMARY KEY,
    categories JSONB DEFAULT '["סעודת שבת", "שיעור תורה", "אירוע חג / מסיבה", "טיול"]'::jsonb,
    wa_templates JSONB DEFAULT '{"approved": "היי {{name}}, איזה כיף שנרשמת! מחכים לך בקוצר רוח.", "verify": "היי {{name}}, ראיתי שנרשמת אלינו. רק רציתי לוודא, האם את/ה סטודנט/ית בבר אילן?", "rejected": "היי {{name}}, לצערנו ההרשמה לאירוע זה כבר נסגרה. נשמח לראותך בפעמים הבאות!"}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert a default settings row if it doesn't exist
INSERT INTO public.settings (id) 
VALUES (1) 
ON CONFLICT (id) DO NOTHING;

-- 3. Events Table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    category TEXT,
    event_date DATE,
    event_time TEXT,
    location TEXT,
    description TEXT,
    header_image_url TEXT,
    flyer_image_url TEXT,
    requires_approval BOOLEAN DEFAULT false,
    max_registrants INTEGER,
    closed_message TEXT DEFAULT 'ההרשמה לאירוע זה נסגרה. נשמח לראותכם בפעמים הבאות!',
    form_config JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Registrations Table
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Nullable for Guests
    guest_name TEXT,
    guest_phone TEXT,
    guest_gender TEXT,
    answers JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Gallery Posts (Community Area)
CREATE TABLE IF NOT EXISTS public.gallery_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    status TEXT DEFAULT 'approved', -- Can be 'pending' if you want to moderate user uploads
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Comments (Community Area)
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- For MVP purposes, we will create permissive policies for viewing, 
-- but restrict editing to authenticated users.

-- Profiles: Anyone can read, users can update their own
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Settings: Anyone can read, only admins can update
CREATE POLICY "Settings are viewable by everyone." ON public.settings FOR SELECT USING (true);
CREATE POLICY "Only admins can update settings." ON public.settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Events: Anyone can read, authenticated can create/edit (we assume staff log in)
CREATE POLICY "Events are viewable by everyone." ON public.events FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert events." ON public.events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update events." ON public.events FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete events." ON public.events FOR DELETE USING (auth.role() = 'authenticated');

-- Registrations: Admins can see all, users can see their own, guests can insert
CREATE POLICY "Admins view all, users view own registrations." ON public.registrations FOR SELECT USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Anyone can insert a registration (incl. guests)." ON public.registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Only admins can update registration status." ON public.registrations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Gallery & Comments: Anyone can view, Authenticated can post
CREATE POLICY "Gallery posts viewable by everyone." ON public.gallery_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated can post to gallery." ON public.gallery_posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Comments viewable by everyone." ON public.comments FOR SELECT USING (true);
CREATE POLICY "Authenticated can post comments." ON public.comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Trigger to create profile automatically on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, is_admin)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'phone',
    (new.email IN ('halperinayala@gmail.com', 'efipiki@gmail.com'))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- PHASE 3 MIGRATION: Tags, RSVP, and Storage
-- ==========================================

-- 1. Add new columns to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS registration_mode TEXT DEFAULT 'form' CHECK (registration_mode IN ('form', 'rsvp', 'none'));

-- 2. Setup Storage for Images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('events', 'events', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'events');

CREATE POLICY "Admin Upload Access" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'events' AND auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- ==========================================
-- PHASE 4 MIGRATION: Admin Settings
-- ==========================================
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '["לסטודנטיות בלבד", "לסטודנטים בלבד", "בהרשמה מראש", "פתוח לכולם", "כניסה חופשית", "בשרי", "חלבי"]'::jsonb;

-- ==========================================
-- PHASE 5 MIGRATION: Community Page Updates
-- ==========================================

-- 1. Add heb_birthday column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS heb_birthday TEXT;

-- 2. Add allow_student_uploads and show_in_community columns to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS allow_student_uploads BOOLEAN DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS show_in_community BOOLEAN DEFAULT false;

-- 3. Setup community storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('community', 'community', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage Policies for Community bucket
DROP POLICY IF EXISTS "Public Read Access on Community Bucket" ON storage.objects;
CREATE POLICY "Public Read Access on Community Bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'community');

DROP POLICY IF EXISTS "Authenticated Upload Access on Community Bucket" ON storage.objects;
CREATE POLICY "Authenticated Upload Access on Community Bucket"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'community' 
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can delete their own community images" ON storage.objects;
CREATE POLICY "Users can delete their own community images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'community' 
  AND auth.uid()::text = owner::text
);

-- ==========================================
-- PHASE 6 MIGRATION: Media Hub (Torah & Content)
-- ==========================================

-- 1. Create media_contents table
CREATE TABLE IF NOT EXISTS public.media_contents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('parasha', 'lesson', 'inspiration', 'other')),
    description TEXT,
    video_url TEXT, -- YouTube/Vimeo link
    image_url TEXT, -- Content cover image
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 2. Enable RLS
ALTER TABLE public.media_contents ENABLE ROW LEVEL SECURITY;

-- 3. Media contents RLS Policies
-- Everyone can read
DROP POLICY IF EXISTS "Media contents viewable by everyone" ON public.media_contents;
CREATE POLICY "Media contents viewable by everyone" 
ON public.media_contents FOR SELECT 
USING (true);

-- Only admins can manage (ALL operations: INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Only admins can manage media contents" ON public.media_contents;
CREATE POLICY "Only admins can manage media contents" 
ON public.media_contents FOR ALL 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- ==========================================
-- PHASE 7 MIGRATION: Media Comments & Likes System
-- ==========================================

-- 1. Create media_comments table
CREATE TABLE IF NOT EXISTS public.media_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    media_id UUID NOT NULL REFERENCES public.media_contents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create unified likes table
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    item_id UUID NOT NULL, -- can be event_id or media_id
    item_type TEXT NOT NULL CHECK (item_type IN ('event', 'media')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

-- 3. Enable RLS
ALTER TABLE public.media_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for media_comments
CREATE POLICY "Media comments viewable by everyone" ON public.media_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated can post media comments" ON public.media_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can delete any media comment" ON public.media_comments FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- 5. RLS Policies for likes
CREATE POLICY "Likes viewable by everyone" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Authenticated can toggle likes" ON public.likes FOR ALL USING (auth.role() = 'authenticated');

-- ==========================================
-- PHASE 8 MIGRATION: Event Registration Scheduling
-- ==========================================
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMPTZ;

-- ==========================================
-- PHASE 9 MIGRATION: Gallery Cover Images
-- ==========================================
ALTER TABLE public.gallery_posts ADD COLUMN IF NOT EXISTS is_cover BOOLEAN DEFAULT false;

-- ==========================================
-- PHASE 10 MIGRATION: External Registration
-- ==========================================
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_registration_mode_check;
ALTER TABLE public.events ADD CONSTRAINT events_registration_mode_check CHECK (registration_mode IN ('form', 'rsvp', 'none', 'external'));
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS external_registration_link TEXT;
