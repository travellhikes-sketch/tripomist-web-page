import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Map, Compass, Calendar, Users, Award, Briefcase, Heart, Smile } from 'lucide-react';

const ICON_MAP = {
  Map,
  Compass,
  Calendar,
  Users,
  Award,
  Briefcase,
  Heart,
  Smile
};

function Counter({ targetNumber }) {
  const [count, setCount] = useState(0);
  const elementRef = useRef(null);
  const animatedRef = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !animatedRef.current) {
          animatedRef.current = true;
          let start = 0;
          const end = parseInt(targetNumber, 10);
          if (isNaN(end) || end <= 0) {
            setCount(targetNumber);
            return;
          }
          const duration = 2000; // 2 seconds
          const stepTime = Math.max(Math.floor(duration / end), 10);

          const timer = setInterval(() => {
            start += Math.ceil(end / 100); // Increment proportionally
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(start);
            }
          }, stepTime);

          return () => clearInterval(timer);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [targetNumber]);

  return (
    <span ref={elementRef} className="font-extrabold text-2xl md:text-4xl transition-all">
      {typeof count === 'number' ? count.toLocaleString('en-IN') : count}+
    </span>
  );
}

export default function StatsStrip() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      const { data } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'stats_strip')
        .single();
      if (data) {
        setSettings(data.setting_value);
      }
    }
    fetchStats();
  }, []);

  if (!settings || !settings.is_active || !settings.cards || settings.cards.length === 0) {
    return null;
  }

  const bgColor = settings.bg_color || '#CAEBE8';
  const textColor = settings.text_color || '#0f3a46';

  return (
    <section
      style={{ backgroundColor: bgColor, color: textColor }}
      className="w-full py-10 px-4 md:px-12 lg:px-20 border-t border-b border-black/5"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {settings.cards.filter(c => c.is_active !== false).map((card) => {
          const IconComponent = ICON_MAP[card.icon] || Map;
          return (
            <div key={card.id} className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-1">
                <IconComponent className="w-5 h-5" style={{ color: textColor }} />
              </div>
              <Counter targetNumber={card.number} />
              <span className="text-xs md:text-sm font-semibold opacity-80 uppercase tracking-wider">
                {card.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
