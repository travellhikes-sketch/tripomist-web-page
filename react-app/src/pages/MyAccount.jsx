import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../utils/supabaseClient';

export default function MyAccount() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login');
      } else {
        setUser(session.user);
      }
      setLoading(false);
    });
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#136b8a] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!user) return null; // Handled by navigate

  const name = user.user_metadata?.full_name || 'Traveler';
  const email = user.email;
  const initial = name.charAt(0).toUpperCase();
  const joinedDate = new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const photoUrl = user.user_metadata?.avatar_url;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#136b8a] to-teal-600 pt-20 pb-28 relative">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-4xl mx-auto px-4 relative z-10 flex flex-col items-center text-center">
          <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center text-4xl font-bold text-[#136b8a] shadow-xl overflow-hidden border-4 border-white mb-4">
            {photoUrl ? (
              <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{name}</h1>
          <p className="text-teal-100 mt-1">{email}</p>
          <p className="text-white/80 text-sm mt-3 bg-black/20 px-4 py-1.5 rounded-full inline-flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
            Joined {joinedDate}
          </p>
        </div>
      </section>

      {/* Cards Grid */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 -mt-16 pb-20 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">

          {/* My Trips */}
          <Link to="/my-trips" className="bg-white rounded-[24px] p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 flex flex-col items-center text-center group">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <span className="material-symbols-outlined text-3xl">luggage</span>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">My Trips</h3>
            <p className="text-gray-500 text-sm">View and manage your bookings</p>
          </Link>

          {/* Profile */}
          <Link to="/profile" className="bg-white rounded-[24px] p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 flex flex-col items-center text-center group">
            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <span className="material-symbols-outlined text-3xl">person</span>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">Profile</h3>
            <p className="text-gray-500 text-sm">Edit your personal details</p>
          </Link>

          {/* Wishlist */}
          <Link to="/wishlist" className="bg-white rounded-[24px] p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 flex flex-col items-center text-center group">
            <div className="w-16 h-16 bg-pink-50 text-pink-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <span className="material-symbols-outlined text-3xl">favorite</span>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">Wishlist</h3>
            <p className="text-gray-500 text-sm">Your saved dream trips</p>
          </Link>

          {/* Support */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center col-span-1 sm:col-span-2 md:col-span-1">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-3xl">support_agent</span>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">Support</h3>
            <div className="flex gap-3 mt-3">
              <a href="mailto:support@tripomist.com" className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-700 transition-colors" title="Email Us">
                <span className="material-symbols-outlined text-[20px]">mail</span>
              </a>
              <a href="https://wa.me/919999999999" target="_blank" rel="noreferrer" className="w-10 h-10 bg-green-100 hover:bg-green-200 rounded-full flex items-center justify-center text-green-700 transition-colors" title="WhatsApp">
                <span className="material-symbols-outlined text-[20px]">chat</span>
              </a>
              <Link to="/contact" className="w-10 h-10 bg-[#136b8a]/10 hover:bg-[#136b8a]/20 rounded-full flex items-center justify-center text-[#136b8a] transition-colors" title="Contact Form">
                <span className="material-symbols-outlined text-[20px]">help</span>
              </Link>
            </div>
          </div>

          {/* Logout */}
          <button onClick={handleLogout} className="bg-white rounded-[24px] p-6 shadow-sm hover:shadow-md transition-all border border-red-50 flex flex-col items-center text-center group cursor-pointer sm:col-span-2 md:col-span-2 lg:col-span-2">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-red-500 group-hover:text-white transition-all duration-300">
              <span className="material-symbols-outlined text-3xl">logout</span>
            </div>
            <h3 className="font-bold text-red-600 text-lg mb-1">Logout</h3>
            <p className="text-gray-500 text-sm">Sign out of your account</p>
          </button>

        </div>
      </main>

      <Footer />
    </div>
  );
}
