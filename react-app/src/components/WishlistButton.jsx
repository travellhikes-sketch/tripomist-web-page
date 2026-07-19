import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function WishlistButton({ packageSlug, className }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkWishlist() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.user_metadata?.wishlist) {
        setIsWishlisted(session.user.user_metadata.wishlist.includes(packageSlug));
      }
    }
    checkWishlist();
  }, [packageSlug]);

  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    setLoading(true);
    try {
      const currentWishlist = session.user.user_metadata?.wishlist || [];
      let newWishlist;
      
      if (currentWishlist.includes(packageSlug)) {
        newWishlist = currentWishlist.filter(slug => slug !== packageSlug);
        setIsWishlisted(false);
      } else {
        newWishlist = [...currentWishlist, packageSlug];
        setIsWishlisted(true);
      }

      await supabase.auth.updateUser({
        data: { wishlist: newWishlist }
      });
    } catch (err) {
      console.error('Wishlist error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleWishlist}
      disabled={loading}
      className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md shadow-sm transition-all z-20 ${
        isWishlisted 
          ? 'bg-pink-50 text-pink-500 border border-pink-200' 
          : 'bg-white/30 text-white hover:bg-white border border-white/50 hover:text-pink-500'
      } ${className || ''}`}
      title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
    >
      <span className={`material-symbols-outlined text-[20px] transition-transform ${isWishlisted ? 'scale-110' : ''}`} style={isWishlisted ? {fontVariationSettings: "'FILL' 1"} : {}}>
        favorite
      </span>
    </button>
  );
}
