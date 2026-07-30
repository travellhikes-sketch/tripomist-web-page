import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';

export default function PromoStrip() {
  const [promo, setPromo] = useState(null);

  useEffect(() => {
    fetchPromo();
  }, []);

  const fetchPromo = async () => {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('promotional_banners')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (!error && data && data.length > 0) {
      const validPromo = data.find(p => {
        if (!p.promo_stripe_text) return false;
        if (p.start_date && new Date(p.start_date) > new Date()) return false;
        if (p.end_date && new Date(p.end_date) < new Date()) return false;
        return true;
      });
      if (validPromo) {
        setPromo(validPromo);
      }
    }
  };

  if (!promo) return null;

  const content = (
    <div 
      className={`relative overflow-hidden text-xs sm:text-sm font-medium py-2 px-4 text-center w-full cursor-pointer hover:opacity-90 transition-opacity`}
      style={{ backgroundColor: promo.bg_color || '#0b1b32', color: promo.text_color || '#ffffff' }}
    >
      <span className="relative z-10">{promo.promo_stripe_text}</span>
      
      {/* Shine animation effect */}
      <div 
        className="absolute top-0 -inset-full h-full w-1/2 z-0 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-70 motion-safe:animate-shine"
        style={{ animationDuration: '3s' }}
      />
    </div>
  );

  const destinationUrl = `/offers/${promo.slug}`;

  return (
    <Link to={destinationUrl} className="block w-full">
      {content}
    </Link>
  );
}
