import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Map, Compass, Calendar, Users, Award, Briefcase, Heart, Smile, Star, ThumbsUp, CheckCircle } from 'lucide-react';

const ICON_MAP = {
  Map,
  Compass,
  Calendar,
  Users,
  Award,
  Briefcase,
  Heart,
  Smile,
  Star,
  ThumbsUp,
  CheckCircle
};

const DEFAULT_STATS = [
  { id: '1', value: '4.9 ★', label: 'GOOGLE REVIEWS', icon: 'Star', is_active: true },
  { id: '2', value: '10K+', label: 'HAPPY TRAVELLERS', icon: 'Users', is_active: true },
  { id: '3', value: '100+', label: 'COMPLETED TRIPS', icon: 'Map', is_active: true }
];

export default function StatsStrip() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', 'stats_strip')
          .single();
        if (data && data.setting_value) {
          setSettings(data.setting_value);
        } else {
          setSettings({
            is_active: true,
            cards: DEFAULT_STATS
          });
        }
      } catch (err) {
        setSettings({
          is_active: true,
          cards: DEFAULT_STATS
        });
      }
    }
    fetchStats();
  }, []);

  if (!settings || settings.is_active === false) {
    return null;
  }

  const rawCards = settings.cards && settings.cards.length > 0 ? settings.cards : DEFAULT_STATS;
  const cards = rawCards.filter(c => c.is_active !== false);

  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-[1550px] mx-auto px-4 md:px-12 lg:px-20 my-6 md:my-8">
      <div 
        className="relative flex items-center overflow-hidden w-full bg-slate-100 h-[80px] sm:h-[100px] md:h-[120px] lg:h-[140px] rounded-lg border border-gray-100/50 shadow-none bg-cover bg-center"
        style={settings.background_image ? { backgroundImage: `url('${settings.background_image}')` } : {}}
      >
        {settings.background_image && <div className="absolute inset-0 bg-black/40"></div>}
        <div className={`relative z-10 w-full flex flex-row items-center justify-around gap-2 md:gap-4 text-center px-2 sm:px-6 ${settings.background_image ? 'text-white' : 'text-slate-900'}`}>
          {cards.map((card, idx) => {
            const val = card.value || (card.number ? `${card.number}+` : '');
            const label = card.label || '';
            const IconComponent = ICON_MAP[card.icon];
            return (
              <div key={card.id || idx} className="flex flex-col items-center justify-center min-w-[60px] sm:min-w-[80px] md:min-w-[100px]">
                {IconComponent && (
                  <div className={`mb-0.5 md:mb-1 ${settings.background_image ? 'text-white' : 'text-[#01AFD1]'}`}>
                    <IconComponent size={16} className="sm:w-5 sm:h-5" />
                  </div>
                )}
                <div className={`text-sm sm:text-lg md:text-xl lg:text-2xl font-extrabold tracking-tight flex items-center justify-center gap-1`}>
                  <span>{val}</span>
                </div>
                {label && (
                  <div className={`text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs font-extrabold tracking-wider uppercase mt-0.5 ${settings.background_image ? 'text-white/80' : 'text-slate-500'}`}>
                    {label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
