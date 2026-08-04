import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Heart, User, Shield, Compass, Star, Smile, Sparkles, Award } from 'lucide-react';

const ICON_MAP = {
  Heart,
  User,
  Shield,
  Compass,
  Star,
  Smile,
  Sparkles,
  Award
};

export default function BenefitsSection() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    async function fetchBenefits() {
      const { data } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'trust_benefits')
        .single();
      if (data) {
        setSettings(data.setting_value);
      }
    }
    fetchBenefits();
  }, []);

  if (!settings || !settings.is_active || !settings.cards || settings.cards.length === 0) {
    return null;
  }

  const bgColor = settings.bg_color || '#CAEBE8';
  const textColor = settings.text_color || '#0f3a46';

  return (
    <section
      style={{ backgroundColor: bgColor, color: textColor }}
      className="w-full py-16 px-4 md:px-12 lg:px-20 border-t border-black/5"
    >
      <div className="max-w-7xl mx-auto">
        {settings.title && (
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-12 uppercase tracking-wider">
            {settings.title}
          </h2>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {settings.cards.map((card) => {
            const IconComponent = ICON_MAP[card.icon] || Heart;
            return (
              <div key={card.id} className="flex flex-col items-center text-center px-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4 shadow-sm border border-white/30 hover:scale-110 duration-200 transition-transform">
                  <IconComponent className="w-6 h-6" style={{ color: textColor }} />
                </div>
                <h3 className="text-lg font-bold mb-2 tracking-tight">{card.heading}</h3>
                <p className="text-sm opacity-80 leading-relaxed max-w-sm">{card.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
