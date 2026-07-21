import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

function Footer() {
  const [footerSettings, setFooterSettings] = useState(null);
  const [contactSettings, setContactSettings] = useState(null);
  const [socialSettings, setSocialSettings] = useState(null);
  const [navItems, setNavItems] = useState([]);
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

  const filterVisibility = (item) => {
    if (item.visibility_role === 'everyone') return true;
    if (item.visibility_role === 'guest' && userRole === 'guest') return true;
    if (item.visibility_role === 'user' && userRole === 'user') return true;
    if (item.visibility_role === 'admin' && userRole === 'admin') return true;
    return false;
  };

  const renderBadge = (item) => {
    if (!item.badge_is_active || !item.badge_text) return null;
    const colors = {
      new: 'bg-green-100 text-green-700 border-green-200',
      hot: 'bg-red-100 text-red-700 border-red-200',
      sale: 'bg-orange-100 text-orange-700 border-orange-200',
      featured: 'bg-purple-100 text-purple-700 border-purple-200',
      custom: 'bg-primary/10 text-primary border-primary/20'
    };
    const cls = colors[item.badge_type] || colors.new;
    return <span className={`ml-1.5 text-[8px] uppercase font-bold tracking-wider px-1 py-0.5 rounded border ${cls} leading-none`}>{item.badge_text}</span>;
  };

  const renderDynamicLink = (link) => {
    const linkProps = {
      className: "text-sm font-medium text-on-surface-variant transition-colors hover:text-primary no-underline flex items-center gap-1",
      target: link.open_in_new_tab ? "_blank" : undefined,
      rel: link.open_in_new_tab ? "noopener noreferrer" : undefined
    };

    const content = (
      <>
        {link.icon && <span className="material-symbols-outlined text-[16px]">{link.icon}</span>}
        <span className="align-middle">{link.label}</span>
        {renderBadge(link)}
      </>
    );

    if (link.external_url) {
      return <a href={link.external_url} {...linkProps}>{content}</a>;
    }
    return <Link to={link.route || '#'} {...linkProps}>{content}</Link>;
  };

  const visibleNavItems = navItems.filter(filterVisibility);

  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant/30 text-on-surface w-full mt-auto">
      <div className="container mx-auto grid grid-cols-1 gap-8 px-4 py-16 md:grid-cols-2 lg:grid-cols-5 lg:gap-8 max-w-7xl">
        
        {/* Column 1: Company Info */}
        <div className="flex flex-col items-start gap-4 lg:col-span-2">
          <Link className="flex items-center gap-3 no-underline text-primary" to="/">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAf4iPOLD4TW-emcX7qi8W7qPZhFbm5OzAQitvDsMARyOfBuAo9ztt29roRULWmZnSZXWDU9C66-5CEUsII9ClNmyCllVfZSQsk_Zh8SNMinjoMc_fWjzIKKChJB0UTFRB6QTigHPgLb0E2DZsOlp_JhvJp0lXnbSsTzGVqfLBMNk-0_rDP3tmtkhWYAQN9_F1nRcn8PpFGemDTJHOLelhxsCRyeTqUu0-JvD0GzZAkXaVLereGaQFPqUxJgRLojmOnEGYfiVmgV8Js0WY" 
              alt="TripoMist Logo" 
              className="h-10 w-10 object-contain rounded-full shadow-sm" 
            />
            <span className="text-xl font-bold font-headline-md tracking-tight">TripoMist</span>
          </Link>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {companyDescription}
          </p>
          
          <div className="flex items-center gap-4 mt-2">
            {twitter && (
              <a href={twitter} className="w-10 h-10 rounded-full bg-[#1DA1F2] hover:bg-[#1a8cd8] flex items-center justify-center hover:scale-105 transition-transform shadow-sm" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/twitter.svg" alt="Twitter" className="w-5 h-5 filter invert" />
              </a>
            )}
            {instagram && (
              <a href={instagram} className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center hover:scale-105 transition-transform shadow-sm" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/instagram.svg" alt="Instagram" className="w-5 h-5 filter invert" />
              </a>
            )}
            {facebook && (
              <a href={facebook} className="w-10 h-10 rounded-full bg-[#1877F2] hover:bg-[#1565c0] flex items-center justify-center hover:scale-105 transition-transform shadow-sm" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/facebook.svg" alt="Facebook" className="w-5 h-5 filter invert" />
              </a>
            )}
            {youtube && (
              <a href={youtube} className="w-10 h-10 rounded-full bg-[#FF0000] hover:bg-[#cc0000] flex items-center justify-center hover:scale-105 transition-transform shadow-sm" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/youtube.svg" alt="YouTube" className="w-5 h-5 filter invert" />
              </a>
            )}
          </div>
        </div>

        {/* Dynamic Quick Links (Menu Manager) */}
        {visibleNavItems.length > 0 && (
          <div className="md:justify-self-start">
            <h3 className="mb-4 text-base font-bold text-on-surface">Quick Links</h3>
            <ul className="space-y-3 p-0 m-0 list-none">
              {visibleNavItems.filter(i => !i.parent_id).map((link, linkIdx) => (
                <li key={linkIdx}>
                  {renderDynamicLink(link)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Dynamic Columns (Website Pages System) */}
        {columns.map((col, idx) => (
          <div key={idx} className="md:justify-self-start">
            <h3 className="mb-4 text-base font-bold text-on-surface">{col.title}</h3>
            <ul className="space-y-3 p-0 m-0 list-none">
              {col.links.map((link, linkIdx) => (
                <li key={linkIdx}>
                  <Link
                    to={link.href}
                    className="text-sm font-medium text-on-surface-variant transition-colors hover:text-primary no-underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Contact Us */}
        <div className="md:justify-self-start">
          <h3 className="mb-4 text-base font-bold text-on-surface">Contact Us</h3>
          <ul className="space-y-3 p-0 m-0 list-none text-sm text-on-surface-variant font-medium">
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary shrink-0">location_on</span>
              <span>{address}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary shrink-0">mail</span>
              <a href={`mailto:${email}`} className="hover:text-primary transition-colors text-inherit no-underline">
                {email}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary shrink-0">call</span>
              <a href={`tel:+91${phone.replace(/\D/g,'')}`} className="hover:text-primary transition-colors text-inherit no-underline">
                {phone}
              </a>
            </li>
          </ul>
        </div>

      </div>

      <div className="border-t border-outline-variant/30 mt-4 py-6">
        <div className="container mx-auto max-w-7xl px-4 text-center">
          <p className="font-body-sm text-sm text-on-surface-variant m-0">
            {copyrightText}
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
