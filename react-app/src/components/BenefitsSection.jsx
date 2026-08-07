import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import {
  Heart, User, Shield, Compass, Star, Smile, Sparkles, Award,
  Home, Building, Users, MapPin, ThumbsUp, CheckCircle, ShieldCheck
} from 'lucide-react';

const ICON_MAP = {
  Heart,
  User,
  Shield,
  Compass,
  Star,
  Smile,
  Sparkles,
  Award,
  Home,
  Building,
  Users,
  MapPin,
  ThumbsUp,
  CheckCircle,
  ShieldCheck
};

const DEFAULT_CARDS = [
  { id: '1', heading: 'Handpicked Stays', description: 'We personally verify every hotel, homestay, and camp to ensure premium comfort and safety.', icon: 'Home', is_active: true },
  { id: '2', heading: 'Certified Guides', description: 'Travel with experienced trip captains who know the mountains like the back of their hand.', icon: 'Shield', is_active: true },
  { id: '3', heading: 'Small Groups', description: 'Intimate group sizes (12-16 pax) ensure personal attention and stronger bonds among travellers.', icon: 'Users', is_active: true },
  { id: '4', heading: 'Local Community', description: 'Start your journey from Delhi with like-minded locals. Pre-trip meetups to break the ice.', icon: 'Sparkles', is_active: true }
];

export default function BenefitsSection() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    async function fetchBenefits() {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', 'trust_benefits')
          .single();
        if (data && data.setting_value) {
          setSettings(data.setting_value);
        } else {
          setSettings({
            is_active: true,
            title: 'The TripoMist Experience',
            subtitle: "We don't just organize trips; we curate experiences. Here's why 50,000+ travellers choose us",
            cards: DEFAULT_CARDS
          });
        }
      } catch (err) {
        setSettings({
          is_active: true,
          title: 'The TripoMist Experience',
          subtitle: "We don't just organize trips; we curate experiences. Here's why 50,000+ travellers choose us",
          cards: DEFAULT_CARDS
        });
      }
    }
    fetchBenefits();
  }, []);

  if (!settings || settings.is_active === false) {
    return null;
  }

  const title = settings.title ?? 'The TripoMist Experience';
  const subtitle = settings.subtitle ?? "We don't just organize trips; we curate experiences. Here's why 50,000+ travellers choose us";
  const rawCards = settings.cards && settings.cards.length > 0 ? settings.cards : DEFAULT_CARDS;
  const cards = rawCards.filter(c => c.is_active !== false);

  if (cards.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-16 md:py-20 px-4 md:px-12 lg:px-20 bg-slate-50/60 border-t border-b border-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-14">
          <h2 className="font-bold text-2xl md:text-3xl lg:text-4xl text-gray-900 tracking-tight mb-3">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm md:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, idx) => {
            const IconComponent = ICON_MAP[card.icon] || Heart;
            return (
              <div
                key={card.id || idx}
                className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-7 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] hover:shadow-md transition-all duration-300 flex flex-col items-start"
              >
                <div className="w-11 h-11 rounded-full bg-[#e8f4f8] text-[#136b8a] flex items-center justify-center mb-5 shrink-0">
                  <IconComponent className="w-5.5 h-5.5" />
                </div>
                <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2 leading-snug">
                  {card.heading || card.title}
                </h3>
                <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
