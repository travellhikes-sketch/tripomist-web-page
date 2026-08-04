import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

function Footer() {
  const [footerSettings, setFooterSettings] = useState(null);
  const [contactSettings, setContactSettings] = useState(null);
  const [socialSettings, setSocialSettings] = useState(null);
  const [navItems, setNavItems] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [interests, setInterests] = useState([]);
  const [userRole, setUserRole] = useState('guest');

  const checkUserRole = async (currentUser) => {
    if (!currentUser) {
      setUserRole('guest');
      return;
    }
    try {
      const { data } = await supabase.from('profiles').select('role').eq('id', currentUser.id).single();
      setUserRole(data?.role || 'user');
    } catch (err) {
      setUserRole('user');
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      checkUserRole(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkUserRole(session?.user || null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function fetchFooterData() {
      const { data } = await supabase.from('site_settings').select('*').in('setting_key', ['footer', 'contact', 'social_links']);
      if (data) {
        data.forEach(item => {
          if (item.setting_key === 'footer') setFooterSettings(item.setting_value);
          if (item.setting_key === 'contact') setContactSettings(item.setting_value);
          if (item.setting_key === 'social_links') setSocialSettings(item.setting_value);
        });
      }

      const { data: dests } = await supabase
        .from('destinations')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (dests) setDestinations(dests);

      const { data: ints } = await supabase
        .from('interest_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (ints) setInterests(ints);

      const { data: navData } = await supabase
        .from('navigation_items')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (navData) {
        setNavItems(navData.filter(item => item.location === 'footer' || item.location === 'both'));
      }
    }
    fetchFooterData();
  }, []);

  const companyDescription = footerSettings?.company_description || "Creating extraordinary adventures, from mountain trails to dream destinations, designed for explorers who seek more than just a trip.";
  const copyrightText = footerSettings?.copyright_text?.replace('{year}', new Date().getFullYear().toString()) || `TripoMist © ${new Date().getFullYear()} All Rights Reserved.`;

  const columns = footerSettings?.columns || [
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'Cancellation & Refund', href: '/refund-policy' },
        { label: 'Terms & Conditions', href: '/terms-conditions' },
        { label: 'Privacy Policy', href: '/privacy-policy' },
        { label: 'Contact Us', href: '/contact' }
      ]
    }
  ];

  const phone = contactSettings?.phone || "9990802608";
  const email = contactSettings?.email || "info@tripomist.com";
  const address = contactSettings?.address || "New Kondli, Mayur Vihar Phase-3, Delhi 110096";

  const twitter = socialSettings?.twitter || "https://twitter.com";
  const instagram = socialSettings?.instagram || "https://www.instagram.com/travellhikes?igsh=dDIxcmJvbmRkemlj";
  const facebook = socialSettings?.facebook || "https://www.facebook.com/share/1BWhe7V5V3/";
  const youtube = socialSettings?.youtube || "";

  const bgColor = footerSettings?.bg_color || '#CAEBE8';
  const textColor = footerSettings?.text_color || '#0f3a46';

  if (footerSettings?.show_footer === false) return null;

  return (
    <footer style={{ backgroundColor: bgColor, color: textColor }} className="w-full mt-auto border-t border-black/10 transition-colors">
      <div className="container mx-auto grid grid-cols-1 gap-8 px-4 py-16 md:grid-cols-2 lg:grid-cols-4 lg:gap-8 max-w-7xl">

        {/* Column A: Contact Info */}
        <div className="flex flex-col items-start gap-4">
          <Link className="flex items-center gap-3 no-underline" style={{ color: textColor }} to="/">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAf4iPOLD4TW-emcX7qi8W7qPZhFbm5OzAQitvDsMARyOfBuAo9ztt29roRULWmZnSZXWDU9C66-5CEUsII9ClNmyCllVfZSQsk_Zh8SNMinjoMc_fWjzIKKChJB0UTFRB6QTigHPgLb0E2DZsOlp_JhvJp0lXnbSsTzGVqfLBMNk-0_rDP3tmtkhWYAQN9_F1nRcn8PpFGemDTJHOLelhxsCRyeTqUu0-JvD0GzZAkXaVLereGaQFPqUxJgRLojmOnEGYfiVmgV8Js0WY"
              alt="TripoMist Logo"
              className="h-10 w-10 object-contain rounded-full shadow-sm"
            />
            <span className="text-xl font-bold tracking-tight">TripoMist</span>
          </Link>
          <p className="text-sm opacity-80 leading-relaxed max-w-sm">
            {companyDescription}
          </p>

          <ul className="space-y-3 p-0 m-0 list-none text-sm font-medium opacity-90">
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] shrink-0">location_on</span>
              <span>{address}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] shrink-0">mail</span>
              <a href={`mailto:${email}`} className="hover:underline transition-all text-inherit no-underline">
                {email}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] shrink-0">call</span>
              <a href={`tel:+91${phone.replace(/\D/g,'')}`} className="hover:underline transition-all text-inherit no-underline">
                {phone}
              </a>
            </li>
          </ul>

          <div className="flex items-center gap-3 mt-3">
            {twitter && (
              <a href={twitter} className="w-8 h-8 rounded-full bg-[#1DA1F2] hover:bg-[#1a8cd8] flex items-center justify-center hover:scale-105 transition-transform shadow-sm" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/twitter.svg" alt="Twitter" className="w-4 h-4 filter invert" />
              </a>
            )}
            {instagram && (
              <a href={instagram} className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center hover:scale-105 transition-transform shadow-sm" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/instagram.svg" alt="Instagram" className="w-4 h-4 filter invert" />
              </a>
            )}
            {facebook && (
              <a href={facebook} className="w-8 h-8 rounded-full bg-[#1877F2] hover:bg-[#1565c0] flex items-center justify-center hover:scale-105 transition-transform shadow-sm" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/facebook.svg" alt="Facebook" className="w-4 h-4 filter invert" />
              </a>
            )}
            {youtube && (
              <a href={youtube} className="w-8 h-8 rounded-full bg-[#FF0000] hover:bg-[#cc0000] flex items-center justify-center hover:scale-105 transition-transform shadow-sm" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/youtube.svg" alt="YouTube" className="w-4 h-4 filter invert" />
              </a>
            )}
          </div>
        </div>

        {/* Column B: Destinations */}
        <div className="md:justify-self-start">
          <h3 className="mb-4 text-base font-bold uppercase tracking-wider">Destination</h3>
          <ul className="space-y-3.5 p-0 m-0 list-none text-sm font-medium">
            {destinations.slice(0, 7).map((dest) => (
              <li key={dest.id}>
                <Link
                  to={`/destinations/${dest.slug}`}
                  className="opacity-80 hover:opacity-100 hover:underline transition-all no-underline"
                  style={{ color: textColor }}
                >
                  {dest.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column C: Trip Types */}
        <div className="md:justify-self-start">
          <h3 className="mb-4 text-base font-bold uppercase tracking-wider">Trip Type</h3>
          <ul className="space-y-3.5 p-0 m-0 list-none text-sm font-medium">
            {interests.slice(0, 7).map((interest) => (
              <li key={interest.id}>
                <Link
                  to={interest.route}
                  className="opacity-80 hover:opacity-100 hover:underline transition-all no-underline"
                  style={{ color: textColor }}
                >
                  {interest.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column D: Company / Custom Links */}
        <div className="md:justify-self-start">
          {columns.map((col, idx) => (
            <div key={idx}>
              <h3 className="mb-4 text-base font-bold uppercase tracking-wider">{col.title}</h3>
              <ul className="space-y-3.5 p-0 m-0 list-none text-sm font-medium">
                {col.links.map((link, linkIdx) => (
                  <li key={linkIdx}>
                    <Link
                      to={link.href}
                      className="opacity-80 hover:opacity-100 hover:underline transition-all no-underline"
                      style={{ color: textColor }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>

      <div className="border-t border-black/10 py-6">
        <div className="container mx-auto max-w-7xl px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs opacity-80 font-medium">
          <p className="m-0">
            {copyrightText}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 items-center justify-center">
            {(footerSettings?.bottom_links || [
              { label: 'Cancellation Policy', href: '/refund-policy' },
              { label: 'Privacy Policy', href: '/privacy-policy' },
              { label: 'Payment Policy', href: '/payment-policy' },
              { label: 'Terms of Service', href: '/terms-conditions' },
              { label: 'Sitemap', href: '/sitemap' },
              { label: 'Employment policy', href: '/employment-policy' }
            ]).map((link, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="opacity-40">|</span>}
                <Link to={link.href} className="hover:underline transition-all" style={{ color: textColor }}>
                  {link.label}
                </Link>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
