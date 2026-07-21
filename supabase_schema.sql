-- ==========================================
-- Supabase Schema Updates for Tripomist
-- ==========================================

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
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Example Insert for Banners
INSERT INTO public.promotional_banners (label, title, highlighted_text, subtitle, price_text, desktop_image, button_text, button_link)
VALUES 
('Special Summer Offer', 'BURNT OUT?', 'ESCAPE TO CHANDRATAAL', 'THIS SUMMER', 'Trips starting at Rs 17,999', 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=1200&q=80', 'Explore Now', '/itinerary/spiti-valley'),
('Best Seller', 'EXPLORE THE MIDDLE LAND:', 'SPITI VALLEY', 'WINTER EXPEDITION', 'starting at Rs 16,999', 'https://images.unsplash.com/photo-1549257850-25e24bcf0e13?w=1200&q=80', 'Explore Now', '/itinerary/spiti-valley'),
('Adventure Guide', 'LADAKH:', 'LAND OF HIGH PASSES', 'ROAD TRIP OF A LIFETIME', 'starting at Rs 21,999', 'https://images.unsplash.com/photo-1581793746485-04698e79a4e8?w=1200&q=80', 'Explore Now', '/itinerary/ladakh');


-- 2. DESTINATIONS
CREATE TABLE IF NOT EXISTS public.destinations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    image_url TEXT,
    region TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Example Insert for Destinations
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
('Goa', 'goa', 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=80', 9);


-- 3. INTEREST CATEGORIES
CREATE TABLE IF NOT EXISTS public.interest_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    image_url TEXT,
    route TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Example Insert for Interests
INSERT INTO public.interest_categories (name, slug, route, image_url, display_order)
VALUES 
('Only Trek', 'trek', '/trips/trek', 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?q=80&w=600&auto=format&fit=crop', 1),
('Group Departures', 'group-departures', '/trips/group-departures', 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=600&auto=format&fit=crop', 2),
('Weekend Departures', 'weekend-departures', '/trips/weekend-departures', 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=600&auto=format&fit=crop', 3),
('Family Destination', 'family-trips', '/trips/family-trips', 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=600&auto=format&fit=crop', 4),
('Honeymoon Trips', 'honeymoon-trips', '/trips/honeymoon-trips', 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=600&q=80', 5);


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
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Example Insert for Sections
INSERT INTO public.homepage_sections (section_key, title, subtitle, icon, view_all_text, view_all_route, display_order)
VALUES
('destinations', 'Destinations', '', '', '', '', 1),
('interests', 'Destination According To Interest', '', '', '', '', 2),
('recommended', 'Recommended Packages', 'Hot Selling', 'local_fire_department', 'View All Packages', '/trips/recommended', 3),
('best_seller', 'Best Seller', 'Top Choice', 'award_star', 'View All Sellers', '/trips/best-seller', 4),
('upcoming', 'Upcoming Trips', 'Plan Ahead', 'event_upcoming', 'View All', '/trips/upcoming-trips', 5),
('international', 'Soon you can plan abroad trips with us', 'International', 'flight_takeoff', 'View All Destinations', '/trips/international', 6);

-- Allow public read access to all these tables
ALTER TABLE public.promotional_banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access." ON public.promotional_banners FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access." ON public.promotional_banners FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access." ON public.destinations FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access." ON public.destinations FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE public.interest_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access." ON public.interest_categories FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access." ON public.interest_categories FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access." ON public.homepage_sections FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access." ON public.homepage_sections FOR ALL USING (auth.role() = 'authenticated');

-- 5. SITE SETTINGS
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Example Insert for Site Settings
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
  "main_links": [
    {"label": "Uttarakhand", "route": "/destinations/uttarakhand"},
    {"label": "Himachal", "route": "/destinations/himachal"},
    {"label": "About Us", "route": "/about"}
  ]
}'::jsonb),
('footer', '{
  "company_description": "Creating extraordinary adventures, from mountain trails to dream destinations, designed for explorers who seek more than just a trip.",
  "copyright_text": "TripoMist © {year} All Rights Reserved.",
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
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access." ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access." ON public.site_settings FOR ALL USING (auth.role() = 'authenticated');
