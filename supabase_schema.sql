-- ==========================================
-- Supabase Schema Updates for Tripomist
-- ==========================================

-- Admin check function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. PROMOTIONAL BANNERS
CREATE TABLE IF NOT EXISTS public.promotional_banners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    label TEXT,
    title TEXT NOT NULL,
    highlighted_text TEXT,
    subtitle TEXT,
    price_text TEXT,
    desktop_image TEXT NOT NULL,
    mobile_image TEXT,
    button_text TEXT DEFAULT 'Explore Now',
    button_link TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_promotional_banners_updated_at ON public.promotional_banners;
CREATE TRIGGER trg_promotional_banners_updated_at BEFORE UPDATE ON public.promotional_banners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. DESTINATIONS
CREATE TABLE IF NOT EXISTS public.destinations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    image_url TEXT,
    region TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_destinations_updated_at ON public.destinations;
CREATE TRIGGER trg_destinations_updated_at BEFORE UPDATE ON public.destinations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.destinations (name, slug, image_url, display_order)
VALUES 
('Ladakh', 'ladakh', 'https://images.unsplash.com/photo-1581793746485-04698e79a4e8?q=80&w=600&auto=format&fit=crop', 1),
('Kashmir', 'kashmir', 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=600&q=80', 2),
('Spiti Valley', 'spiti-valley', 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80', 3),
('Uttarakhand', 'uttarakhand', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80', 4),
('Himachal', 'himachal', 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80', 5),
('Rajasthan', 'rajasthan', 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600&q=80', 6),
('Kerala', 'kerala', 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&q=80', 7),
('Meghalaya', 'meghalaya', 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=1600&q=80', 8),
('Goa', 'goa', 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=80', 9)
ON CONFLICT (slug) DO NOTHING;

-- 3. INTEREST CATEGORIES
CREATE TABLE IF NOT EXISTS public.interest_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    image_url TEXT,
    route TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_interest_categories_updated_at ON public.interest_categories;
CREATE TRIGGER trg_interest_categories_updated_at BEFORE UPDATE ON public.interest_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.interest_categories (name, slug, route, image_url, display_order)
VALUES 
('Only Trek', 'trek', '/trips/trek', 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?q=80&w=600&auto=format&fit=crop', 1),
('Group Departures', 'group-departures', '/trips/group-departures', 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=600&auto=format&fit=crop', 2),
('Weekend Departures', 'weekend-departures', '/trips/weekend-departures', 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=600&auto=format&fit=crop', 3),
('Family Destination', 'family-trips', '/trips/family-trips', 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=600&auto=format&fit=crop', 4),
('Honeymoon Trips', 'honeymoon-trips', '/trips/honeymoon-trips', 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=600&q=80', 5)
ON CONFLICT (slug) DO NOTHING;

-- 4. HOMEPAGE SECTIONS
CREATE TABLE IF NOT EXISTS public.homepage_sections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    section_key TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    subtitle TEXT,
    icon TEXT,
    view_all_text TEXT DEFAULT 'View All',
    view_all_route TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    max_cards INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_homepage_sections_updated_at ON public.homepage_sections;
CREATE TRIGGER trg_homepage_sections_updated_at BEFORE UPDATE ON public.homepage_sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.homepage_sections (section_key, title, subtitle, icon, view_all_text, view_all_route, display_order)
VALUES
('destinations', 'Destinations', '', '', '', '', 1),
('interests', 'Destination According To Interest', '', '', '', '', 2),
('recommended', 'Recommended Packages', 'Hot Selling', 'local_fire_department', 'View All Packages', '/trips/recommended', 3),
('best_seller', 'Best Seller', 'Top Choice', 'award_star', 'View All Sellers', '/trips/best-seller', 4),
('upcoming', 'Upcoming Trips', 'Plan Ahead', 'event_upcoming', 'View All', '/trips/upcoming-trips', 5),
('international', 'Soon you can plan abroad trips with us', 'International', 'flight_takeoff', 'View All Destinations', '/trips/international', 6)
ON CONFLICT (section_key) DO NOTHING;

-- 5. WEBSITE PAGES
CREATE TABLE IF NOT EXISTS public.website_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_key TEXT NOT NULL UNIQUE,
    title TEXT,
    subtitle TEXT,
    content JSONB DEFAULT '{}'::jsonb,
    hero_image_url TEXT,
    seo_title TEXT,
    seo_description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_website_pages_updated_at ON public.website_pages;
CREATE TRIGGER trg_website_pages_updated_at BEFORE UPDATE ON public.website_pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.website_pages (page_key, title, subtitle, content)
VALUES
('about-us', 'About Us', 'Learn more about TripoMist', '{"paragraphs": ["Welcome to TripoMist, your ultimate travel partner.", "We provide the best curated packages."]}'::jsonb),
('cancellation-refund', 'Cancellation & Refund', 'Our refund policies', '{"paragraphs": ["Refunds are subject to terms and conditions.", "Please contact support for detailed information."]}'::jsonb),
('terms-conditions', 'Terms & Conditions', 'Our terms of service', '{"paragraphs": ["By using this site, you agree to our terms of service.", "Please read carefully before booking."]}'::jsonb),
('privacy-policy', 'Privacy Policy', 'How we protect your data', '{"paragraphs": ["Your privacy is our priority.", "We do not share your data with third parties."]}'::jsonb),
('contact-us', 'Contact Us', 'Get in touch with us', '{"paragraphs": ["Email: support@tripomist.com", "Phone: +91 9999999999"]}'::jsonb)
ON CONFLICT (page_key) DO NOTHING;

-- 6. BOOKINGS
-- Using IF NOT EXISTS for the table itself, and ALTER TABLE ADD COLUMN IF NOT EXISTS for every column to protect existing production data.
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY
);

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_reference TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_source TEXT DEFAULT 'manual';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS package_id UUID; -- Intentionally leaving without foreign key constraints as requested
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS package_title TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS travel_date DATE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS travellers_count INTEGER DEFAULT 1;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS sharing_type TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS total_amount NUMERIC DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS advance_payment NUMERIC DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS remaining_payment NUMERIC DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_status TEXT DEFAULT 'pending';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DROP TRIGGER IF EXISTS trg_bookings_updated_at ON public.bookings;
CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Booking reference generator
CREATE OR REPLACE FUNCTION public.generate_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.booking_reference IS NULL OR trim(NEW.booking_reference) = '' THEN
        NEW.booking_reference := 'BKG-' || upper(substr(md5(random()::text), 1, 8));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_booking_reference ON public.bookings;
CREATE TRIGGER trg_set_booking_reference BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.generate_booking_reference();

-- Apply safe constraints to bookings (using a DO block to avoid errors if they already exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_booking_reference_key') THEN
        ALTER TABLE public.bookings ADD CONSTRAINT bookings_booking_reference_key UNIQUE (booking_reference);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_total_amount_check') THEN
        ALTER TABLE public.bookings ADD CONSTRAINT bookings_total_amount_check CHECK (total_amount >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_advance_payment_check') THEN
        ALTER TABLE public.bookings ADD CONSTRAINT bookings_advance_payment_check CHECK (advance_payment >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_remaining_payment_check') THEN
        ALTER TABLE public.bookings ADD CONSTRAINT bookings_remaining_payment_check CHECK (remaining_payment >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_advance_payment_exceed_check') THEN
        ALTER TABLE public.bookings ADD CONSTRAINT bookings_advance_payment_exceed_check CHECK (advance_payment <= total_amount);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_travellers_count_check') THEN
        ALTER TABLE public.bookings ADD CONSTRAINT bookings_travellers_count_check CHECK (travellers_count >= 1);
    END IF;
END $$;


-- 7. SITE SETTINGS
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER trg_site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Using ON CONFLICT DO NOTHING to not overwrite admin settings
INSERT INTO public.site_settings (setting_key, setting_value)
VALUES
('hero', '{
  "media_type": "video",
  "desktop_media_url": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260629_032424_3c9c2a9d-807b-4482-80e6-dd6d9dfd4545.mp4",
  "mobile_media_url": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260629_032424_3c9c2a9d-807b-4482-80e6-dd6d9dfd4545.mp4",
  "heading": "Find Yourself<br /><span class=\"text-primary-container\">With TripoMist</span>",
  "subtitle": "Your Safe Travel Our Responsibility<span class=\"text-primary-container\">.</span>",
  "primary_button_text": "Explore All Departures",
  "primary_button_route": "/all-departures",
  "secondary_button_text": "See Upcoming Trips",
  "secondary_button_route": "/trips/upcoming-trips",
  "overlay_opacity": "30",
  "is_active": true
}'::jsonb),
('navbar', '{
  "logo_text": "TripoMist",
  "logo_image_url": "",
  "search_placeholder": "Search destinations...",
  "login_button_text": "Login",
  "login_route": "/login",
  "menu_button_text": "Menu",
  "main_links": []
}'::jsonb),
('footer', '{
  "company_description": "Creating extraordinary adventures, from mountain trails to dream destinations, designed for explorers who seek more than just a trip.",
  "copyright_text": "TripoMist c {year} All Rights Reserved.",
  "columns": [
    {
      "title": "Company",
      "links": [
        {"label": "About Us", "href": "/about"},
        {"label": "Cancellation & Refund", "href": "/refund-policy"},
        {"label": "Terms & Conditions", "href": "/terms-conditions"},
        {"label": "Privacy Policy", "href": "/privacy-policy"},
        {"label": "Contact Us", "href": "/contact"}
      ]
    }
  ]
}'::jsonb),
('contact', '{
  "phone": "9990802608",
  "email": "info@tripomist.com",
  "address": "New Kondli, Mayur Vihar Phase-3, Delhi 110096"
}'::jsonb),
('social_links', '{
  "twitter": "https://twitter.com",
  "instagram": "https://www.instagram.com/travellhikes?igsh=dDIxcmJvbmRkemlj",
  "facebook": "https://www.facebook.com/share/1BWhe7V5V3/",
  "youtube": "",
  "whatsapp": "https://wa.me/919990802608"
}'::jsonb),
('package_detail_settings', '{
  "default_badge_text": "Most Popular",
  "show_badge": true,
  "whatsapp_number": "919990802608",
  "whatsapp_template": "Hey *TripoMist* I''m interested in *{package_title}*\nMy Full Name: \nPrefer Travel date: \nDestination: {package_title}\nHow Many people travel with me : {travellers}",
  "gst_label": "+ 5% GST",
  "default_enquiry_text": "Send Enquiry"
}'::jsonb),
('static_page_settings', '{}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;


-- 8. REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    customer_image_url TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL CHECK (length(trim(review_text)) > 0),
    package_id UUID,
    package_title TEXT,
    destination TEXT,
    review_date DATE DEFAULT current_date,
    is_featured BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    source TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_reviews_updated_at ON public.reviews;
CREATE TRIGGER trg_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. NAVIGATION ITEMS
CREATE TABLE IF NOT EXISTS public.navigation_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seed_key TEXT UNIQUE, -- Optional unique key for safe seeding
    label TEXT NOT NULL CHECK (length(trim(label)) > 0),
    route TEXT,
    external_url TEXT,
    item_type TEXT DEFAULT 'link' CHECK (item_type IN ('link', 'dropdown', 'button')),
    parent_id UUID REFERENCES public.navigation_items(id) ON DELETE SET NULL,
    location TEXT DEFAULT 'navbar' CHECK (location IN ('navbar', 'mobile_menu', 'footer', 'both')),
    display_order INTEGER DEFAULT 0 CHECK (display_order >= 0),
    is_active BOOLEAN DEFAULT true,
    show_on_desktop BOOLEAN DEFAULT true,
    show_on_mobile BOOLEAN DEFAULT true,
    open_in_new_tab BOOLEAN DEFAULT false,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT navigation_items_route_check CHECK (item_type = 'dropdown' OR (route IS NOT NULL OR external_url IS NOT NULL))
);

ALTER TABLE public.navigation_items ADD COLUMN IF NOT EXISTS badge_text TEXT;
ALTER TABLE public.navigation_items ADD COLUMN IF NOT EXISTS badge_type TEXT;
ALTER TABLE public.navigation_items ADD COLUMN IF NOT EXISTS badge_is_active BOOLEAN DEFAULT false;
ALTER TABLE public.navigation_items ADD COLUMN IF NOT EXISTS mega_menu_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.navigation_items ADD COLUMN IF NOT EXISTS mega_menu_column INTEGER DEFAULT 1;
ALTER TABLE public.navigation_items ADD COLUMN IF NOT EXISTS visible_from TIMESTAMPTZ;
ALTER TABLE public.navigation_items ADD COLUMN IF NOT EXISTS visible_until TIMESTAMPTZ;
ALTER TABLE public.navigation_items ADD COLUMN IF NOT EXISTS visibility_role TEXT DEFAULT 'everyone';
ALTER TABLE public.navigation_items ADD COLUMN IF NOT EXISTS sort_group TEXT;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'navigation_items_badge_type_check') THEN
        ALTER TABLE public.navigation_items ADD CONSTRAINT navigation_items_badge_type_check CHECK (badge_type IN ('new', 'hot', 'sale', 'featured', 'custom'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'navigation_items_visibility_role_check') THEN
        ALTER TABLE public.navigation_items ADD CONSTRAINT navigation_items_visibility_role_check CHECK (visibility_role IN ('everyone', 'guest', 'user', 'admin'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'navigation_items_mega_menu_column_check') THEN
        ALTER TABLE public.navigation_items ADD CONSTRAINT navigation_items_mega_menu_column_check CHECK (mega_menu_column BETWEEN 1 AND 4);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'navigation_items_visible_until_check') THEN
        ALTER TABLE public.navigation_items ADD CONSTRAINT navigation_items_visible_until_check CHECK (visible_until > visible_from OR visible_until IS NULL OR visible_from IS NULL);
    END IF;
END $$;

DROP TRIGGER IF EXISTS trg_navigation_items_updated_at ON public.navigation_items;
CREATE TRIGGER trg_navigation_items_updated_at BEFORE UPDATE ON public.navigation_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure item cannot be its own parent (using a trigger since check constraint cannot easily reference itself dynamically without a function)
CREATE OR REPLACE FUNCTION check_navigation_parent()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_id = NEW.id THEN
        RAISE EXCEPTION 'An item cannot use itself as its own parent';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_navigation_parent ON public.navigation_items;
CREATE TRIGGER trg_check_navigation_parent
BEFORE INSERT OR UPDATE ON public.navigation_items
FOR EACH ROW EXECUTE FUNCTION check_navigation_parent();

-- Navigation Items safe seed data
INSERT INTO public.navigation_items (seed_key, label, route, item_type, location, display_order)
VALUES 
('nav_home', 'Home', '/', 'link', 'both', 1),
('nav_uttarakhand', 'Uttarakhand', '/destinations/uttarakhand', 'link', 'both', 2),
('nav_himachal', 'Himachal', '/destinations/himachal', 'link', 'both', 3),
('nav_rajasthan', 'Rajasthan', '/destinations/rajasthan', 'link', 'both', 4),
('nav_group_deps', 'Group Departures', '/trips/group-departures', 'link', 'both', 5),
('nav_trek', 'Trek', '/trips/trek', 'link', 'both', 6),
('nav_about', 'About Us', '/about', 'link', 'both', 7),
('nav_contact', 'Contact Us', '/contact', 'link', 'both', 8)
ON CONFLICT (seed_key) DO NOTHING;


-- ==========================================
-- RLS POLICIES
-- ==========================================

-- Promotional Banners
ALTER TABLE public.promotional_banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read - Promotional Banners" ON public.promotional_banners;
DROP POLICY IF EXISTS "Admin All - Promotional Banners" ON public.promotional_banners;
CREATE POLICY "Public Read - Promotional Banners" ON public.promotional_banners 
  FOR SELECT USING (is_active = true AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date >= now()));
CREATE POLICY "Admin All - Promotional Banners" ON public.promotional_banners 
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Destinations
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read - Destinations" ON public.destinations;
DROP POLICY IF EXISTS "Admin All - Destinations" ON public.destinations;
CREATE POLICY "Public Read - Destinations" ON public.destinations FOR SELECT USING (is_active = true);
CREATE POLICY "Admin All - Destinations" ON public.destinations FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Interest Categories
ALTER TABLE public.interest_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read - Interest Categories" ON public.interest_categories;
DROP POLICY IF EXISTS "Admin All - Interest Categories" ON public.interest_categories;
CREATE POLICY "Public Read - Interest Categories" ON public.interest_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Admin All - Interest Categories" ON public.interest_categories FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Homepage Sections
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read - Homepage Sections" ON public.homepage_sections;
DROP POLICY IF EXISTS "Admin All - Homepage Sections" ON public.homepage_sections;
CREATE POLICY "Public Read - Homepage Sections" ON public.homepage_sections FOR SELECT USING (is_active = true);
CREATE POLICY "Admin All - Homepage Sections" ON public.homepage_sections FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Website Pages
ALTER TABLE public.website_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read - Website Pages" ON public.website_pages;
DROP POLICY IF EXISTS "Admin All - Website Pages" ON public.website_pages;
CREATE POLICY "Public Read - Website Pages" ON public.website_pages FOR SELECT USING (is_active = true);
CREATE POLICY "Admin All - Website Pages" ON public.website_pages FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customer Read Own Bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admin All - Bookings" ON public.bookings;
CREATE POLICY "Customer Read Own Bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin All - Bookings" ON public.bookings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Site Settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read - Site Settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admin All - Site Settings" ON public.site_settings;
CREATE POLICY "Public Read - Site Settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admin All - Site Settings" ON public.site_settings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read - Approved Reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admin All - Reviews" ON public.reviews;
CREATE POLICY "Public Read - Approved Reviews" ON public.reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Admin All - Reviews" ON public.reviews FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Navigation Items
ALTER TABLE public.navigation_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read - Navigation Items" ON public.navigation_items;
DROP POLICY IF EXISTS "Admin All - Navigation Items" ON public.navigation_items;
CREATE POLICY "Public Read - Navigation Items" ON public.navigation_items 
  FOR SELECT USING (is_active = true AND (visible_from IS NULL OR visible_from <= now()) AND (visible_until IS NULL OR visible_until >= now()));
CREATE POLICY "Admin All - Navigation Items" ON public.navigation_items FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ==========================================
-- MULTIPLE TRAVELLERS & BOOKING ACTIVITY
-- ==========================================

CREATE TABLE IF NOT EXISTS public.booking_travellers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL CHECK (trim(full_name) <> ''),
    phone TEXT,
    email TEXT,
    age INTEGER CHECK (age >= 0 AND age <= 120),
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer-not-to-say')),
    is_primary BOOLEAN DEFAULT false,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    id_type TEXT,
    id_number TEXT,
    notes TEXT,
    display_order INTEGER DEFAULT 0 CHECK (display_order >= 0),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique index to prevent duplicate primary traveller per booking
CREATE UNIQUE INDEX IF NOT EXISTS unique_primary_traveller ON public.booking_travellers (booking_id) WHERE is_primary = true;

DROP TRIGGER IF EXISTS trg_booking_travellers_updated_at ON public.booking_travellers;
CREATE TRIGGER trg_booking_travellers_updated_at BEFORE UPDATE ON public.booking_travellers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Safe Backfill: Create one primary traveller from existing bookings if no travellers exist
INSERT INTO public.booking_travellers (booking_id, full_name, phone, email, is_primary)
SELECT b.id, COALESCE(b.customer_name, 'Unknown Traveller'), b.customer_phone, b.customer_email, true
FROM public.bookings b
WHERE NOT EXISTS (
    SELECT 1 FROM public.booking_travellers bt WHERE bt.booking_id = b.id
) AND b.customer_name IS NOT NULL;


CREATE TABLE IF NOT EXISTS public.booking_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    field_name TEXT,
    old_value TEXT,
    new_value TEXT,
    changed_by UUID,
    changed_at TIMESTAMPTZ DEFAULT now(),
    note TEXT
);

ALTER TABLE public.booking_travellers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customer Read Own Travellers" ON public.booking_travellers;
DROP POLICY IF EXISTS "Admin All - Booking Travellers" ON public.booking_travellers;
CREATE POLICY "Customer Read Own Travellers" ON public.booking_travellers 
  FOR SELECT USING (
    booking_id IN (SELECT id FROM public.bookings WHERE user_id = auth.uid())
  );
CREATE POLICY "Admin All - Booking Travellers" ON public.booking_travellers FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.booking_activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin All - Booking Activity Logs" ON public.booking_activity_logs;
CREATE POLICY "Admin All - Booking Activity Logs" ON public.booking_activity_logs FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ==========================================
-- ROOM ALLOCATION
-- ==========================================

CREATE TABLE IF NOT EXISTS public.booking_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    room_number TEXT NOT NULL,
    room_type TEXT NOT NULL CHECK (room_type IN ('Double', 'Triple', 'Quad')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.booking_rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customer Read Own Rooms" ON public.booking_rooms;
DROP POLICY IF EXISTS "Admin All - Booking Rooms" ON public.booking_rooms;
CREATE POLICY "Customer Read Own Rooms" ON public.booking_rooms 
  FOR SELECT USING (booking_id IN (SELECT id FROM public.bookings WHERE user_id = auth.uid()));
CREATE POLICY "Admin All - Booking Rooms" ON public.booking_rooms FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS trg_booking_rooms_updated_at ON public.booking_rooms;
CREATE TRIGGER trg_booking_rooms_updated_at BEFORE UPDATE ON public.booking_rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add room and future-ready fields to travellers
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS sharing_type TEXT;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES public.booking_rooms(id) ON DELETE SET NULL;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS bus_seat_number TEXT;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS pickup_point TEXT;
ALTER TABLE public.booking_travellers ADD COLUMN IF NOT EXISTS check_in_status TEXT DEFAULT 'pending';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_travellers_sharing_type_check') THEN
        ALTER TABLE public.booking_travellers ADD CONSTRAINT booking_travellers_sharing_type_check CHECK (sharing_type IN ('Double', 'Triple', 'Quad'));
    END IF;
END $$;

