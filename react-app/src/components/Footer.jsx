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
          <h3 className="text-base font-bold uppercase tracking-wider">Contact Info</h3>
          <p className="text-sm opacity-80 leading-relaxed max-w-sm m-0 font-medium">
            {contactSettings?.open_hours || "Open from 11 AM to 9 PM Monday to Saturday."}
          </p>

          <ul className="space-y-3.5 p-0 m-0 list-none text-sm font-semibold opacity-90">
            <li className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px] shrink-0 text-inherit">call</span>
              <a href={`tel:+91${phone.replace(/\D/g,'')}`} className="hover:underline transition-all text-inherit no-underline">
                {phone}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px] shrink-0 text-inherit">mail</span>
              <a href={`mailto:${email}`} className="hover:underline transition-all text-inherit no-underline">
                {email}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[18px] shrink-0 text-inherit mt-0.5">location_on</span>
              <span className="leading-relaxed">{address}</span>
            </li>
          </ul>

          <div className="flex items-center gap-4 mt-3">
            {facebook && (
              <a href={facebook} className="opacity-80 hover:opacity-100 transition-opacity text-inherit" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
              </a>
            )}
            {twitter && (
              <a href={twitter} className="opacity-80 hover:opacity-100 transition-opacity text-inherit" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
            )}
            {instagram && (
              <a href={instagram} className="opacity-80 hover:opacity-100 transition-opacity text-inherit" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
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
        <div className="flex items-center justify-center border-t border-white/10 pt-6 text-xs font-semibold opacity-70 w-full">
          <p className="m-0 text-center">
            {copyrightText}
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
