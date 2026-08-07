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
    <section className="w-full py-8 md:py-12 px-4 md:px-12 lg:px-20 bg-transparent">
      <div className="max-w-6xl mx-auto bg-slate-100/90 border border-slate-200/90 rounded-2xl py-6 md:py-8 px-6 md:px-12 shadow-sm flex flex-col sm:flex-row items-center justify-around gap-6 sm:gap-8 text-center">
        {cards.map((card, idx) => {
          const val = card.value || (card.number ? `${card.number}+` : '');
          const label = card.label || '';
          const IconComponent = ICON_MAP[card.icon];
          return (
            <div key={card.id || idx} className="flex flex-col items-center justify-center min-w-[120px]">
              {IconComponent && (
                <div className="mb-2 text-indigo-600">
                  <IconComponent size={24} />
                </div>
              )}
              <div className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-1.5">
                <span>{val}</span>
              </div>
              {label && (
                <div className="text-xs md:text-sm font-bold tracking-wider uppercase text-slate-600 mt-1.5">
                  {label}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
