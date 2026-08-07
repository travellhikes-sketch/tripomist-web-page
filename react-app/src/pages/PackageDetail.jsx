import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import BookingModal from '../components/BookingModal';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import DownloadItineraryModal from '../components/DownloadItineraryModal';
import ReviewsSection from '../components/ReviewsSection';
import { supabase } from '../utils/supabaseClient';
import { formatSlugToTitle } from '../utils/formatters';
import {
  Download,
  ShoppingCart,
  Share2,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
  XCircle,
  Info,
  Luggage,
  Check
} from 'lucide-react';

const cleanHeroTitle = (title) => {
  if (!title) return '';
  return title
    .replace(/\b\d+\s*(Nights?|N)\s*\/?\s*\d+\s*(Days?|D)\b/ig, '')
    .replace(/\b\d+\s*(Days?|D)\s*\/?\s*\d+\s*(Nights?|N)\b/ig, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

const DEFAULT_SECTIONS = [
  { id: 'overview', label: 'Overview', visible: true, order: 1 },
  { id: 'trip-cost', label: 'Trip Cost', visible: true, order: 2 },
  { id: 'itinerary', label: 'Itinerary', visible: true, order: 3 },
  { id: 'inclusions-exclusions', label: 'Inclusion & Exclusion', visible: true, order: 4 },
  { id: 'things-to-carry', label: 'Things to Carry', visible: true, order: 5 },
  { id: 'note', label: 'Note', visible: true, order: 6 }
];

export default function PackageDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [travellers, setTravellers] = useState(1);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReadMore, setIsReadMore] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [siteSettings, setSiteSettings] = useState(null);

  // Gallery & Lightbox
  const [galleryImages, setGalleryImages] = useState([]);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Section Navigation & Scroll Spy
  const [activeSection, setActiveSection] = useState('overview');
  const [isNavSticky, setIsNavSticky] = useState(false);
  const sectionNavRef = useRef(null);

  // Itinerary Accordion Expand All
  const [expandedDays, setExpandedDays] = useState(new Set([0]));
  const [allExpanded, setAllExpanded] = useState(false);

  useEffect(() => {
    async function fetchPackage() {
      const isBannerRoute = location.pathname.startsWith('/banner/');
      const table = isBannerRoute ? 'promotional_banners' : 'Pakage';

      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('slug', slug)
        .single();

      if (error || !data) {
        console.error('Error fetching package or not found, using dummy data:', error);
        const titleFallback = slug ? slug.replace(/-/g, ' ').toUpperCase() : 'AMAZING TRIP';
        const dummyImgs = [
          "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?q=80&w=1200&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1200&auto=format&fit=crop"
        ];
        setGalleryImages(dummyImgs);
        setTrip({
          title: titleFallback,
          badge: "Most Popular",
          state: "Adventure",
          durationText: "8 Days / 7 Nights",
          duration: "8 Days / 7 Nights",
          numericPrice: 19999,
          price: `₹19,999`,
          originalPrice: `₹24,999`,
          discountText: "20% OFF",
          pickup: "Delhi / Chandigarh",
          heroImg: dummyImgs[0],
          bg: dummyImgs[0],
          overview: "Prepare to embark on a journey of breathtaking landscapes, cultural immersion, and thrilling experiences as you explore the destination. Offering a perfect blend of tranquility, adventure, and natural beauty.",
          description: "Prepare to embark on a journey of breathtaking landscapes, cultural immersion, and thrilling experiences as you explore the destination. Offering a perfect blend of tranquility, adventure, and natural beauty.",
          inclusions: ["Accommodation in premium hotels & homestays", "Daily Breakfast & Dinner", "Sightseeing transfers in AC Vehicle", "Experienced Trip Captain"],
          exclusions: ["Flight / Train Tickets", "Personal Expenses", "Entry fees to monuments", "Travel Insurance"],
          thingsToCarry: ["Warm clothes & jacket", "Sturdy trekking shoes", "Personal water bottle", "Valid Government ID Proof", "Personal Medical Kit & Power Bank"],
          notes: "Please carry valid ID proof. Itinerary subject to weather conditions. Book your seat early for best availability.",
          itineraryPdfUrl: "",
          sectionSettings: DEFAULT_SECTIONS,
          days: [
            { num: "Day 01", title: "Arrival & Transfer", desc: "Arrive at pickup location, meet your trip leader, check into hotel and enjoy an evening orientation." },
            { num: "Day 02", title: "Sightseeing & Exploration", desc: "Full day excursion visiting key scenic attractions, local markets, and cultural landmarks." },
            { num: "Day 03", title: "Adventure & Outdoor Experience", desc: "Engage in outdoor activities, nature walks, and enjoy evening campfire with fellow travelers." },
            { num: "Day 04", title: "Departure & Return Journey", desc: "After breakfast, pack memories and drive back towards home destination." }
          ],
          costings: [
            { type: "Quad Sharing", price: "₹16,499 per person", details: "Best for groups" },
            { type: "Triple Sharing", price: "₹17,999 per person", details: "Comfortable" },
            { type: "Double Sharing", price: "₹18,999 per person", details: "Couples / Friends" }
          ]
        });
      } else {
        const isBannerRoute = location.pathname.startsWith('/banner/');
        const priceNum = isBannerRoute ? (data.price || 0) : data.price;
        const originalPriceNum = isBannerRoute ? (data.original_price || 0) : data.original_price;

        let imgs = [];
        if (data.gallery_images && Array.isArray(data.gallery_images) && data.gallery_images.length > 0) {
          imgs = data.gallery_images;
        } else {
          imgs = [data.banner_image, data.image_url].filter(Boolean);
        }
        if (imgs.length === 0) {
          imgs = ["https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop"];
        }
        const uniqueImgs = Array.from(new Set(imgs));
        setGalleryImages(uniqueImgs);

        // Parse days
        let parsedDays = [];
        if (data.itinerary && Array.isArray(data.itinerary)) {
          parsedDays = data.itinerary.map((item, idx) => {
            const rawVal = item.day || item.day_number || item.dayNumber || item.title || item.heading || item.description || item.details || '';
            let parsedLabel = String(rawVal).trim();
            if (/^[0-9]+$/.test(parsedLabel)) {
              parsedLabel = `Day ${parsedLabel}`;
            }
            return {
              num: parsedLabel || `Day ${idx + 1}`,
              title: item.title || item.heading || `Day ${idx + 1}`,
              desc: item.description || item.details || item.desc || ''
            };
          });
        }

        // Parse things to carry
        let parsedThings = [];
        if (data.things_to_carry) {
          if (Array.isArray(data.things_to_carry)) {
            parsedThings = data.things_to_carry;
          } else if (typeof data.things_to_carry === 'string') {
            try {
              parsedThings = JSON.parse(data.things_to_carry);
            } catch {
              parsedThings = data.things_to_carry.split('\n').filter(Boolean);
            }
          }
        }
        if (parsedThings.length === 0) {
          parsedThings = ["Warm Clothes & Layering", "Trekking / Comfortable Shoes", "Water Bottle & Reusable Flask", "Government ID Proof", "Personal Medicine Kit & Sunscreen"];
        }

        // Parse section settings
        let parsedSectionSettings = DEFAULT_SECTIONS;
        if (data.section_settings) {
          let rawSec = data.section_settings;
          if (typeof rawSec === 'string') {
            try { rawSec = JSON.parse(rawSec); } catch (e) { rawSec = null; }
          }
          if (Array.isArray(rawSec) && rawSec.length > 0) {
            parsedSectionSettings = rawSec;
          }
        }

        setTrip({
          id: data.id,
          title: data.title,
          badge: "Most Popular",
          state: data.state,
          durationText: data.duration || "Flexible Duration",
          duration: data.duration || "Flexible Duration",
          numericPrice: priceNum || 0,
          price: `₹${(priceNum || 0).toLocaleString('en-IN')}`,
          originalPrice: originalPriceNum ? `₹${originalPriceNum.toLocaleString('en-IN')}` : '',
          discountText: data.discount_text || '',
          pickup: isBannerRoute ? data.destination : data.departure_from,
          heroImg: uniqueImgs[0],
          bg: uniqueImgs[0],
          overview: data.short_description || data.full_description || '',
          description: data.full_description || data.short_description || '',
          inclusions: data.inclusions || [],
          exclusions: data.exclusions || [],
          thingsToCarry: parsedThings,
          notes: data.notes || "Carrying valid ID proof is mandatory. Travel itinerary schedule is subject to local weather and road conditions.",
          itineraryPdfUrl: data.itinerary_pdf_url || '',
          sectionSettings: parsedSectionSettings,
          days: parsedDays,
          costings: data.costings || []
        });
      }
      setLoading(false);
    }

    async function fetchSettings() {
      const { data } = await supabase.from('site_settings').select('setting_value').eq('setting_key', 'package_detail_settings').single();
      if (data) {
        setSiteSettings(data.setting_value);
      }
    }

    fetchSettings();

    if (slug) {
      fetchPackage();
    } else {
      setLoading(false);
    }
  }, [slug, location.pathname]);

  const visibleSections = (trip?.sectionSettings || DEFAULT_SECTIONS).filter(sec => sec.visible !== false);

  // Scroll listener for sticky package section nav & active section tracking
  useEffect(() => {
    const handleScroll = () => {
      if (sectionNavRef.current) {
        const rect = sectionNavRef.current.getBoundingClientRect();
        const stickyThreshold = 80;
        const isStickyNow = rect.top <= stickyThreshold;
        setIsNavSticky(isStickyNow);

        window.dispatchEvent(new CustomEvent('packageNavStickyChange', { detail: { isSticky: isStickyNow } }));
      }

      const activeSecList = visibleSections.map(s => s.id);
      const scrollPos = window.scrollY + 200;
      for (const secId of activeSecList) {
        const el = document.getElementById(secId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(secId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [visibleSections]);

  useEffect(() => {
    if (!trip) return;
    const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
    const isAdded = cartItems.some(item => item.title === trip.title);
    setIsAddedToCart(isAdded);
  }, [trip]);

  // Lightbox keyboard controls
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, galleryImages.length]);

  const openLightbox = (index) => {
    setActiveImageIndex(index);
    setIsLightboxOpen(true);
  };

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const handleAddToCart = () => {
    if (!trip) return;
    let cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
    if (isAddedToCart) {
      cartItems = cartItems.filter(item => item.title !== trip.title);
      localStorage.setItem('cart', JSON.stringify(cartItems));
      setIsAddedToCart(false);
    } else {
      cartItems.push({
        id: Date.now(),
        title: trip.title,
        duration: trip.durationText || trip.duration || "Package",
        travellers: travellers,
        price: trip.numericPrice,
        total: trip.numericPrice * travellers,
        image: trip.heroImg || trip.bg,
        slug: slug || trip.title.toLowerCase().replace(/ /g, '-')
      });
      localStorage.setItem('cart', JSON.stringify(cartItems));
      setIsAddedToCart(true);
    }
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: trip?.title || 'TripoMist Travel Package',
          url: window.location.href
        });
      } catch (err) {
        console.log('Share cancelled or unavailable:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Package URL copied to clipboard!');
    }
  };

  const handleBookNow = () => {
    setIsBookingModalOpen(true);
  };

  const toggleDayAccordion = (index) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      if (trip?.days) {
        setAllExpanded(next.size === trip.days.length);
      }
      return next;
    });
  };

  const toggleExpandAll = () => {
    if (!trip?.days) return;
    if (allExpanded) {
      setExpandedDays(new Set());
      setAllExpanded(false);
    } else {
      const allIndices = new Set(trip.days.map((_, i) => i));
      setExpandedDays(allIndices);
      setAllExpanded(true);
    }
  };

  const scrollToSection = (secId) => {
    setActiveSection(secId);
    const el = document.getElementById(secId);
    if (el) {
      const yOffset = -120;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleSendEnquiry = () => {
    if (!trip) return;
    let template = siteSettings?.whatsapp_template || "Hey *TripoMist* I'm interested in *{package_title}*\nMy Full Name: \nPrefer Travel date: \nDestination: {package_title}\nHow Many people travel with me : {travellers}";
    let message = template
      .replace(/{package_title}/g, trip.title)
      .replace(/{price}/g, `₹${trip.numericPrice * travellers}`)
      .replace(/{duration}/g, trip.duration || '')
      .replace(/{travellers}/g, travellers)
      .replace(/{departure_from}/g, trip.pickup || '');

    const phone = siteSettings?.whatsapp_number || "919990802608";
    const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest">
        <p className="text-xl text-primary font-bold">Loading package...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest">
        <p className="text-xl text-red-500 font-bold">Package not found</p>
      </div>
    );
  }

  const totalAmount = trip.numericPrice * travellers;

  // Format Duration Pills
  const durationStr = trip.durationText || trip.duration || '';
  const dMatch = durationStr.match(/(\d+)\s*(Days?|D)/i);
  const nMatch = durationStr.match(/(\d+)\s*(Nights?|N)/i);
  const daysVal = dMatch ? `${dMatch[1]} DAYS` : (durationStr.includes('Day') ? durationStr.toUpperCase() : 'DAYS');
  const nightsVal = nMatch ? `${nMatch[1]} NIGHTS` : 'NIGHTS';

  const NAV_ITEMS = visibleSections.map(sec => ({
    id: sec.id,
    label: sec.label || sec.id
  }));

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      <main className="w-full flex-grow">
        {/* ==================================================
            D. TOP PHOTO GALLERY GRID
        ================================================== */}
        <section className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-6 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 h-[320px] md:h-[450px] rounded-2xl overflow-hidden relative shadow-sm">
            {/* Main Primary Cover Image (Left side) */}
            <div
              onClick={() => openLightbox(0)}
              className="md:col-span-8 h-full relative cursor-pointer group overflow-hidden bg-gray-100"
            >
              <img
                src={galleryImages[0]}
                alt={trip.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
            </div>

            {/* Side Images Grid (Right side) */}
            <div className="hidden md:grid md:col-span-4 grid-cols-1 grid-rows-2 gap-3 h-full">
              {galleryImages.slice(1, 3).map((img, idx) => (
                <div
                  key={idx + 1}
                  onClick={() => openLightbox(idx + 1)}
                  className="relative cursor-pointer group overflow-hidden bg-gray-100 h-full rounded-xl"
                >
                  <img
                    src={img}
                    alt={`${trip.title} ${idx + 2}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                  {/* Badge overlay if more images exist */}
                  {idx === 1 && galleryImages.length > 3 && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center text-white font-bold text-lg">
                      +{galleryImages.length - 3} Photos
                    </div>
                  )}
                </div>
              ))}
              {galleryImages.length < 2 && (
                <div className="bg-slate-100 flex items-center justify-center text-slate-400 text-sm font-medium rounded-xl h-full">
                  TripoMist Experience
                </div>
              )}
            </div>

            {/* Mobile View Photos Badge */}
            <button
              onClick={() => openLightbox(0)}
              className="md:hidden absolute bottom-4 right-4 bg-black/70 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg"
            >
              <span className="material-symbols-outlined text-[16px]">photo_library</span>
              {galleryImages.length} Photos
            </button>
          </div>
        </section>

        {/* FULLSCREEN LIGHTBOX MODAL */}
        {isLightboxOpen && (
          <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex flex-col justify-between animate-in">
            {/* Header / Counter & Close */}
            <div className="flex items-center justify-between px-6 py-4 text-white z-10">
              <span className="text-sm font-bold tracking-widest uppercase opacity-80">
                {activeImageIndex + 1} / {galleryImages.length}
              </span>
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Main Image View */}
            <div className="relative flex-grow flex items-center justify-center px-4 sm:px-12 select-none">
              <button
                onClick={prevImage}
                className="absolute left-4 sm:left-8 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer z-10"
              >
                <ChevronLeft size={28} />
              </button>

              <img
                src={galleryImages[activeImageIndex]}
                alt={`Photo ${activeImageIndex + 1}`}
                className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl transition-all duration-300"
              />

              <button
                onClick={nextImage}
                className="absolute right-4 sm:right-8 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer z-10"
              >
                <ChevronRight size={28} />
              </button>
            </div>

            {/* Bottom Thumbnail Strip */}
            <div className="py-4 px-6 overflow-x-auto hide-scrollbar flex justify-center gap-3 bg-black/40">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                    activeImageIndex === idx ? 'border-[#136b8a] scale-105' : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================
            MAIN LAYOUT: CONTENT (LEFT) + BOOKING CARD (RIGHT)
        ================================================== */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LEFT COLUMN: Title, Actions, Section Nav & Vertical Sections */}
          <div className="lg:col-span-8 flex flex-col">

            {/* E & F. PROMINENT TITLE & OUTLINED DURATION PILLS */}
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-3 font-sans">
                {trip.title}
              </h1>

              {/* F. OUTLINED ROUNDED DURATION PILLS */}
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center px-3.5 py-1 rounded-full border border-[#136b8a]/40 bg-[#eff6f9] text-[#136b8a] text-xs font-bold tracking-wider uppercase shadow-xs">
                  {daysVal}
                </span>
                <span className="inline-flex items-center px-3.5 py-1 rounded-full border border-gray-300 bg-gray-50 text-gray-700 text-xs font-bold tracking-wider uppercase shadow-xs">
                  {nightsVal}
                </span>
              </div>
            </div>

            {/* G. ACTION ROW DIRECTLY BELOW TITLE AREA */}
            <div className="flex items-center gap-3 mb-8 overflow-x-auto hide-scrollbar pb-2 border-b border-gray-100">
              {/* 1. Download Itinerary */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 bg-[#136b8a] hover:bg-[#0f556e] text-white text-xs md:text-sm font-bold px-4 py-2.5 rounded-full transition-all shadow-sm active:scale-95 whitespace-nowrap cursor-pointer"
              >
                <Download size={16} />
                <span>Download Itinerary</span>
              </button>

              {/* 2. Add to Cart */}
              <button
                onClick={handleAddToCart}
                className={`inline-flex items-center gap-2 text-xs md:text-sm font-bold px-4 py-2.5 rounded-full transition-all border shadow-sm active:scale-95 whitespace-nowrap cursor-pointer ${
                  isAddedToCart
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-white text-gray-800 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                {isAddedToCart ? <Check size={16} /> : <ShoppingCart size={16} />}
                <span>{isAddedToCart ? 'Added to Cart' : 'Add to Cart'}</span>
              </button>

              {/* 3. Share (ONLY Share Icon, NO text) */}
              <button
                onClick={handleShare}
                title="Share Package"
                className="w-10 h-10 rounded-full border border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400 flex items-center justify-center text-gray-700 transition-all shadow-sm active:scale-95 shrink-0 cursor-pointer"
              >
                <Share2 size={18} />
              </button>
            </div>

            {/* ==================================================
                H, I, P. PACKAGE SECTION NAVIGATION (STICKY ROW)
            ================================================== */}
            <div
              ref={sectionNavRef}
              className={`w-full bg-white transition-all ${
                isNavSticky
                  ? 'fixed top-[70px] left-0 right-0 z-[90] shadow-md border-b border-gray-200 py-3 px-4 md:px-12 lg:px-20'
                  : 'relative mb-8 border-b border-gray-200 pb-1'
              }`}
            >
              <div className="max-w-7xl mx-auto flex items-center gap-4 md:gap-8 overflow-x-auto hide-scrollbar">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`pb-3 text-sm font-bold transition-all whitespace-nowrap border-b-2 cursor-pointer ${
                      activeSection === item.id
                        ? 'border-[#136b8a] text-[#136b8a]'
                        : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SPACER when sticky is active so page content doesn't jump */}
            {isNavSticky && <div className="h-12 w-full" />}

            {/* ==================================================
                J. VERTICAL SECTIONS CONTENT (DYNAMIC ORDER & VISIBILITY)
            ================================================== */}
            <div className="space-y-12">
              {visibleSections.map((sec) => {
                if (sec.id === 'overview') {
                  return (
                    <section key="overview" id="overview" className="scroll-mt-32 border-b border-gray-100 pb-10">
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 tracking-tight">Overview</h2>
                      <div className="prose max-w-none text-gray-700 text-sm md:text-base leading-relaxed space-y-4">
                        <p>
                          {isReadMore
                            ? (trip.overview || trip.description)
                            : `${(trip.overview || trip.description)?.slice(0, 260) || ''}...`
                          }
                        </p>
                        {(trip.overview || trip.description)?.length > 260 && (
                          <button
                            onClick={() => setIsReadMore(!isReadMore)}
                            className="text-[#136b8a] font-bold hover:underline text-sm inline-block cursor-pointer"
                          >
                            {isReadMore ? 'Show Less' : 'Read More'}
                          </button>
                        )}
                      </div>
                    </section>
                  );
                }

                if (sec.id === 'trip-cost') {
                  return (
                    <section key="trip-cost" id="trip-cost" className="scroll-mt-32 border-b border-gray-100 pb-10">
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 tracking-tight">Trip Cost</h2>
                      {trip.costings && trip.costings.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {trip.costings.map((c, i) => (
                            <div key={i} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 shadow-2xs text-center flex flex-col justify-between">
                              <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                                  {c.type || c.sharing || 'Sharing Option'}
                                </span>
                                <span className="text-lg md:text-xl font-extrabold text-[#136b8a] block">
                                  {c.price || `₹${trip.numericPrice.toLocaleString()}`}
                                </span>
                              </div>
                              {c.details && <p className="text-xs text-slate-500 mt-2">{c.details}</p>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 flex items-center justify-between">
                          <div>
                            <span className="text-sm font-bold text-gray-900 block">Starting Price Per Person</span>
                            <span className="text-xs text-gray-500">{siteSettings?.gst_label || '+ 5% GST applicable'}</span>
                          </div>
                          <span className="text-2xl font-extrabold text-[#136b8a]">{trip.price}</span>
                        </div>
                      )}
                    </section>
                  );
                }

                if (sec.id === 'itinerary') {
                  return (
                    <section key="itinerary" id="itinerary" className="scroll-mt-32 border-b border-gray-100 pb-10">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Itinerary</h2>
                        <button
                          onClick={toggleExpandAll}
                          className="text-xs md:text-sm font-bold text-[#136b8a] hover:text-[#0f556e] underline cursor-pointer"
                        >
                          {allExpanded ? 'Collapse All' : 'Expand All'}
                        </button>
                      </div>

                      <div className="space-y-4">
                        {trip.days && trip.days.map((day, idx) => {
                          const isOpen = expandedDays.has(idx);
                          return (
                            <div key={idx} className="bg-[#eff6f9] rounded-2xl overflow-hidden border border-[#b9dae6] transition-all">
                              <button
                                onClick={() => toggleDayAccordion(idx)}
                                className="w-full px-5 py-4 md:px-6 flex items-center justify-between text-left cursor-pointer hover:bg-[#deedf4] transition-colors"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-5 flex-grow pr-4">
                                  <div className="flex-shrink-0 bg-white border border-[#136b8a] text-gray-900 font-bold px-3.5 py-1 rounded-full text-xs uppercase tracking-wider w-fit">
                                    {day.num}
                                  </div>
                                  <h3 className="font-bold text-gray-900 text-sm md:text-base tracking-tight">{day.title}</h3>
                                </div>
                                <span
                                  className="material-symbols-outlined text-gray-700 transition-transform duration-300 flex-shrink-0 font-bold text-[20px]"
                                  style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                >
                                  expand_more
                                </span>
                              </button>
                              {isOpen && (
                                <div className="px-5 md:px-6 pb-5 pt-1 text-gray-700 text-xs md:text-sm leading-relaxed border-t border-black/5">
                                  <p>{day.desc}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                }

                if (sec.id === 'inclusions-exclusions') {
                  return (
                    <section key="inclusions-exclusions" id="inclusions-exclusions" className="scroll-mt-32 border-b border-gray-100 pb-10">
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 tracking-tight">Inclusion & Exclusion</h2>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Included */}
                        <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-6">
                          <h3 className="text-base font-bold text-emerald-800 mb-4 flex items-center gap-2">
                            <CheckCircle size={20} className="text-emerald-600" />
                            Inclusions
                          </h3>
                          <ul className="space-y-3 text-xs md:text-sm text-gray-700 font-medium">
                            {trip.inclusions && trip.inclusions.map((inc, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-emerald-600 font-bold mt-0.5">•</span>
                                <span>{inc}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Excluded */}
                        <div className="bg-rose-50/50 border border-rose-200/80 rounded-2xl p-6">
                          <h3 className="text-base font-bold text-rose-800 mb-4 flex items-center gap-2">
                            <XCircle size={20} className="text-rose-600" />
                            Exclusions
                          </h3>
                          <ul className="space-y-3 text-xs md:text-sm text-gray-700 font-medium">
                            {trip.exclusions && trip.exclusions.map((exc, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-rose-600 font-bold mt-0.5">•</span>
                                <span>{exc}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </section>
                  );
                }

                if (sec.id === 'things-to-carry') {
                  if (!trip.thingsToCarry || trip.thingsToCarry.length === 0) return null;
                  return (
                    <section key="things-to-carry" id="things-to-carry" className="scroll-mt-32 border-b border-gray-100 pb-10">
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 tracking-tight">Things to Carry</h2>

                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {trip.thingsToCarry.map((item, i) => (
                            <div key={i} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 text-xs md:text-sm text-slate-700 font-medium shadow-2xs">
                              <Luggage size={16} className="text-[#136b8a] shrink-0" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  );
                }

                if (sec.id === 'note') {
                  if (!trip.notes || !trip.notes.trim()) return null;
                  return (
                    <section key="note" id="note" className="scroll-mt-32 pb-6">
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 tracking-tight">Note</h2>
                      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-6 text-xs md:text-sm text-amber-900 leading-relaxed flex items-start gap-3">
                        <Info size={20} className="text-amber-700 shrink-0 mt-0.5" />
                        <p>{trip.notes}</p>
                      </div>
                    </section>
                  );
                }

                return null;
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: STICKY BOOKING CARD (DESKTOP) */}
          <div className="w-full lg:col-span-4 relative mt-8 lg:mt-0">
            <div className="sticky top-[100px] bg-white rounded-3xl border border-gray-200 p-6 shadow-lg shadow-gray-100">
              
              {/* Price Details */}
              <div className="mb-6 border-b border-gray-100 pb-5">
                <span className="font-semibold text-gray-900 text-sm block mb-1">Starting Price</span>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-[#136b8a] text-3xl font-bold">{trip.price} <span className="text-sm text-gray-500 font-medium">{siteSettings?.gst_label || '+ 5% GST'}</span></span>
                  <div className="flex items-center gap-1 text-xs font-semibold">
                    {trip.originalPrice && trip.originalPrice !== trip.price && trip.originalPrice !== '₹0' && (
                      <span className="line-through text-gray-500 font-normal">{trip.originalPrice}</span>
                    )}
                    {trip.discountText && (
                      <span className="text-red-500 font-bold">{trip.discountText}</span>
                    )}
                  </div>
                </div>
                <p className="text-gray-500 text-sm font-medium">Per Person</p>
              </div>

              {/* No of Travellers */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 font-semibold text-gray-800 text-sm">
                  <span className="material-symbols-outlined text-purple-600 text-[20px]">group</span>
                  No. of Travellers
                </div>
                <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-full px-2 py-1 shadow-sm">
                  <button onClick={() => setTravellers(Math.max(1, travellers - 1))} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full font-bold transition-colors text-lg cursor-pointer">-</button>
                  <span className="font-bold text-gray-900 text-base w-4 text-center">{travellers}</span>
                  <button onClick={() => setTravellers(travellers + 1)} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full font-bold transition-colors text-lg cursor-pointer">+</button>
                </div>
              </div>

              {/* Total Amount */}
              <div className="flex items-center justify-between mb-8 bg-[#eff6f9] px-4 py-3 rounded-xl border border-[#cde5ef]">
                <span className="font-bold text-gray-800 text-sm">Total Amount</span>
                <span className="font-extrabold text-[#136b8a] text-xl">₹{totalAmount.toLocaleString()}</span>
              </div>
              
              {/* Action Buttons */}
              <button
                onClick={handleBookNow}
                className="btn-shiny w-full bg-[#136b8a] hover:bg-[#0f556e] text-white font-bold py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98] mb-4 text-lg cursor-pointer"
              >
                <span className="relative z-10">Book Now</span>
              </button>
              <button
                onClick={handleSendEnquiry}
                className="w-full bg-[#25D366] hover:bg-[#20b858] text-white font-bold py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-base cursor-pointer"
              >
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/whatsapp.svg" alt="WhatsApp" className="w-5 h-5 filter invert" />
                {siteSettings?.default_enquiry_text || 'Send Enquiry to trip experts'}
              </button>
              <p className="text-center text-gray-500 text-[11px] font-medium mt-2 mb-2">
                fill the blanks to send enquiry to expert
              </p>
              
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        {trip.id && (
          <ReviewsSection packageId={trip.id} />
        )}
      </main>

      <DownloadItineraryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tripTitle={trip.title}
        pdfUrl={trip.itineraryPdfUrl}
      />
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        tripTitle={trip.title}
        price={totalAmount}
        travellers={travellers}
        navigate={navigate}
        packageId={slug}
        destination={formatSlugToTitle(trip.destination) || trip.title}
        costings={trip.costings}
      />

      <Footer />
    </div>
  );
}
