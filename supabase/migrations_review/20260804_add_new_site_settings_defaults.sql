-- Migration: Add UI settings defaults to site_settings
-- File: supabase/migrations_review/20260804_add_new_site_settings_defaults.sql

BEGIN;

-- 1. Extend or ensure 'navbar' contains Instagram badge settings
INSERT INTO public.site_settings (setting_key, setting_value)
VALUES ('navbar', '{
  "logo_text": "TripoMist",
  "logo_image_url": "",
  "search_placeholder": "Search destinations...",
  "login_button_text": "Login",
  "login_route": "/login",
  "menu_button_text": "Menu",
  "main_links": [],
  "show_instagram_badge": true,
  "instagram_follower_count": "248k",
  "instagram_url": "https://www.instagram.com/travellhikes"
}'::jsonb)
ON CONFLICT (setting_key) DO UPDATE
SET setting_value = public.site_settings.setting_value || '{
  "show_instagram_badge": true,
  "instagram_follower_count": "248k",
  "instagram_url": "https://www.instagram.com/travellhikes"
}'::jsonb;

-- 2. Extend or ensure 'footer' settings contain custom company links and colors
INSERT INTO public.site_settings (setting_key, setting_value)
VALUES ('footer', '{
  "bg_color": "#CAEBE8",
  "text_color": "#0f3a46",
  "company_description": "Creating extraordinary adventures, from mountain trails to dream destinations, designed for explorers who seek more than just a trip.",
  "copyright_text": "TripoMist © {year} All Rights Reserved.",
  "show_footer": true,
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
}'::jsonb)
ON CONFLICT (setting_key) DO UPDATE
SET setting_value = public.site_settings.setting_value || '{
  "bg_color": "#CAEBE8",
  "text_color": "#0f3a46",
  "show_footer": true
}'::jsonb;

-- 3. Add default 'trust_benefits' settings
INSERT INTO public.site_settings (setting_key, setting_value)
VALUES ('trust_benefits', '{
  "is_active": true,
  "bg_color": "#CAEBE8",
  "title": "Why Travel With Us",
  "cards": [
    {
      "id": "1",
      "icon": "Heart",
      "heading": "Young-Hearted Travelers",
      "description": "Age is just a number when you''re young at heart. Our trips are perfect for those who love fun, laughter, and creating connections that turn into unforgettable memories."
    },
    {
      "id": "2",
      "icon": "User",
      "heading": "Best for Solo Travelers",
      "description": "Travel solo, but never alone. Join a group of like-minded travellers—many of whom are solo—and turn strangers into lifelong friends."
    },
    {
      "id": "3",
      "icon": "Shield",
      "heading": "Safe for Girls",
      "description": "Your safety is our top priority. With experienced guides and a supportive group, girls can travel confidently and focus on enjoying the journey."
    }
  ]
}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- 4. Add default 'stats_strip' settings
INSERT INTO public.site_settings (setting_key, setting_value)
VALUES ('stats_strip', '{
  "is_active": true,
  "bg_color": "#CAEBE8",
  "text_color": "#0f3a46",
  "cards": [
    {
      "id": "1",
      "number": 500,
      "label": "Trips and Tours",
      "icon": "Map",
      "is_active": true
    },
    {
      "id": "2",
      "number": 150,
      "label": "Destinations Covered",
      "icon": "Compass",
      "is_active": true
    },
    {
      "id": "3",
      "number": 8,
      "label": "Years of Experience",
      "icon": "Calendar",
      "is_active": true
    },
    {
      "id": "4",
      "number": 15000,
      "label": "Happy Travelers",
      "icon": "Users",
      "is_active": true
    }
  ]
}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- 5. Add default 'testimonials_section' settings
INSERT INTO public.site_settings (setting_key, setting_value)
VALUES ('testimonials_section', '{
  "is_active": true,
  "heading": "Client testimonials",
  "subtext": "Real travelers. Real stories. Real opinions to help you make the right choice.",
  "see_all_link": "/reviews",
  "enable_autoscroll": true,
  "bg_color": "#ffffff",
  "text_color": "#1f2937"
}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

COMMIT;
