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
  Check,
  Bus,
  Users,
  Mountain,
  Bed,
  Sun,
  UserCheck,
  Compass,
  Utensils,
  FileCheck,
  MessageCircle,
  ShieldCheck,
  Heart
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
  { id: 'note', label: 'Note', visible: true, order: 6 },
  { id: 'faqs', label: "FAQ's", visible: true, order: 7 }
];

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview' },
  { id: 'trip-cost', label: 'Trip Cost' },
  { id: 'itinerary', label: 'Itinerary' },
  { id: 'inclusions-exclusions', label: 'Inclusion & Exclusion' },
  { id: 'things-to-carry', label: 'Things to Carry' },
  { id: 'note', label: 'Note' },
  { id: 'faqs', label: "FAQ's" }
];

const DEFAULT_TRIP_INFO = [
  { icon: 'Bus', label: 'Transportation', value: 'Tempo Traveller / Volvo Bus' },
  { icon: 'Users', label: 'Group Size', value: '12 - 15' },
  { icon: 'Mountain', label: 'Maximum Altitude', value: '12,073 ft' },
  { icon: 'Bed', label: 'Accommodation', value: 'Hotel / Homestay / Campstay' },
  { icon: 'Sun', label: 'Best Season', value: 'May & Sept - Oct' },
  { icon: 'UserCheck', label: 'Guiding Method', value: 'Experienced Tour Captain' },
  { icon: 'Compass', label: 'Tour Type', value: 'Group Tour' },
  { icon: 'Utensils', label: 'Meals', value: 'Breakfast & Dinner' },
  { icon: 'FileCheck', label: 'Permits', value: 'All necessary forest permits' }
];

const DEFAULT_TRUST_BENEFITS = [
  'Best for Solo Travelers',
  'Safe for Girls',
  'Highly Enthusiastic Trip Leaders'
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
  const navSentinelRef = useRef(null);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

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
          thingsToCarry: ["Warm Clothes & Layering", "Trekking / Comfortable Shoes", "Water Bottle & Reusable Flask", "Government ID Proof", "Personal Medicine Kit & Sunscreen"],
          notes: "Carrying valid ID proof is mandatory. Travel itinerary schedule is subject to local weather and road conditions.",
          itineraryPdfUrl: "",
          sectionSettings: DEFAULT_SECTIONS,
          tripInfo: DEFAULT_TRIP_INFO,
          trustBenefits: DEFAULT_TRUST_BENEFITS,
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

        // Parse trip_info
        let parsedTripInfo = [];
        if (data.trip_info) {
          if (Array.isArray(data.trip_info)) {
            parsedTripInfo = data.trip_info;
          } else if (typeof data.trip_info === 'string') {
            try { parsedTripInfo = JSON.parse(data.trip_info); } catch (e) { parsedTripInfo = []; }
          }
        }
        if (parsedTripInfo.length === 0) {
          parsedTripInfo = DEFAULT_TRIP_INFO;
        }

        // Parse trust_benefits
        let parsedTrustBenefits = [];
        if (data.trust_benefits) {
          if (Array.isArray(data.trust_benefits)) {
            parsedTrustBenefits = data.trust_benefits;
          } else if (typeof data.trust_benefits === 'string') {
            try { parsedTrustBenefits = JSON.parse(data.trust_benefits); } catch (e) { parsedTrustBenefits = data.trust_benefits.split('\n').filter(Boolean); }
          }
        }
        if (parsedTrustBenefits.length === 0) {
          parsedTrustBenefits = DEFAULT_TRUST_BENEFITS;
        }

        // Parse faqs
        let parsedFaqs = [];
        if (data.faqs) {
          if (Array.isArray(data.faqs)) {
            parsedFaqs = data.faqs;
          } else if (typeof data.faqs === 'string') {
            try { parsedFaqs = JSON.parse(data.faqs); } catch (e) { parsedFaqs = []; }
          }
        }

        // Parse download_block
        let parsedDownloadBlock = {};
        if (data.download_block) {
          if (typeof data.download_block === 'object') {
            parsedDownloadBlock = data.download_block;
          } else if (typeof data.download_block === 'string') {
            try { parsedDownloadBlock = JSON.parse(data.download_block); } catch (e) { parsedDownloadBlock = {}; }
          }
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
          downloadBlock: parsedDownloadBlock,
          sectionSettings: parsedSectionSettings,
          tripInfo: parsedTripInfo,
          trustBenefits: parsedTrustBenefits,
          faqs: parsedFaqs,
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
      if (navSentinelRef.current) {
        const sentinelRect = navSentinelRef.current.getBoundingClientRect();
        const stickyThreshold = 70;
        const shouldBeSticky = sentinelRect.top <= stickyThreshold;

        setIsNavSticky(prev => {
          if (prev !== shouldBeSticky) {
            window.dispatchEvent(new CustomEvent('packageNavStickyChange', {
              detail: { isSticky: shouldBeSticky }
            }));
          }
          return shouldBeSticky;
        });
      }

      // Scroll Spy Active Section
      const scrollPos = window.scrollY + 140;
      for (const sec of visibleSections) {
        const secId = sec.id;
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
      window.dispatchEvent(new CustomEvent('packageNavStickyChange', {
        detail: { isSticky: false }
      }));
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

  const renderIcon = (iconName) => {
    switch (iconName?.toLowerCase()) {
      case 'bus': return <Bus size={20} />;
      case 'users': return <Users size={20} />;
      case 'mountain': return <Mountain size={20} />;
      case 'bed': return <Bed size={20} />;
      case 'sun': return <Sun size={20} />;
      case 'usercheck': return <UserCheck size={20} />;
      case 'compass': return <Compass size={20} />;
      case 'utensils': return <Utensils size={20} />;
      case 'filecheck': return <FileCheck size={20} />;
      default: return <Compass size={20} />;
    }
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
            D. TOP PHOTO GALLERY GRID (UNIFORM CROP & EQUAL SIZE)
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

            {/* 2.2 PROMINENT TITLE & ALIGNED DAYS/NIGHTS PILLS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight font-sans uppercase">
                {trip.title}
              </h1>

              {/* OUTLINED ROUNDED DURATION PILLS */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center px-3.5 py-1 rounded-full border border-[#136b8a]/40 bg-[#eff6f9] text-[#136b8a] text-xs font-bold tracking-wider uppercase shadow-xs">
                  {daysVal}
                </span>
                <span className="inline-flex items-center px-3.5 py-1 rounded-full border border-gray-300 bg-gray-50 text-gray-700 text-xs font-bold tracking-wider uppercase shadow-xs">
                  {nightsVal}
                </span>
              </div>
            </div>

            {/* 2.4 ACTION ROW DIRECTLY BELOW TITLE AREA */}
            <div className="flex items-center gap-3 mb-8 overflow-x-auto hide-scrollbar pb-2 border-b border-gray-100">
              {/* 1. Download Itinerary */}
              {trip.itineraryPdfUrl ? (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-[#136b8a] hover:bg-[#0f556e] text-white text-xs md:text-sm font-bold px-4 py-2.5 rounded-full transition-all shadow-sm active:scale-95 whitespace-nowrap cursor-pointer"
                >
                  <Download size={16} />
                  <span>Download Itinerary</span>
                </button>
              ) : null}

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

            {/* Sentinel div for accurate sticky scroll detection */}
            <div ref={navSentinelRef} className="w-full h-px" />

            {/* ==================================================
                3. PACKAGE SECTION NAVIGATION (STICKY ROW)
            ================================================== */}
            <div
              ref={sectionNavRef}
              className={`w-full bg-white transition-all ${
                isNavSticky
                  ? 'fixed top-[70px] left-0 right-0 z-[90] shadow-md border-b border-gray-200 py-3 px-4 md:px-12 lg:px-20'
                  : 'relative mb-8 border-b border-gray-200 py-2'
              }`}
            >
              <div className="max-w-7xl mx-auto flex items-center gap-2.5 overflow-x-auto hide-scrollbar py-1">
                {NAV_ITEMS.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={`px-4 md:px-5 py-2 rounded-full text-xs md:text-sm font-bold transition-all whitespace-nowrap border cursor-pointer ${
                        isActive
                          ? 'bg-[#eff6f9] border-[#136b8a] text-[#136b8a] shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-[#136b8a] hover:text-[#136b8a]'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SPACER when sticky is active so page content doesn't jump */}
            {isNavSticky && <div className="h-12 w-full" />}

            {/* ==================================================
                VERTICAL SECTIONS CONTENT (DYNAMIC ORDER & VISIBILITY)
            ================================================== */}
            <div className="space-y-12">
              {visibleSections.map((sec) => {
                if (sec.id === 'overview') {
                  return (
                    <section key="overview" id="overview" className="scroll-mt-32 border-b border-gray-100 pb-10">
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 tracking-tight">Overview</h2>
                      <div
                        className="prose max-w-none text-gray-700 text-sm md:text-base leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: trip.overview || trip.description }}
                      />

                      {/* 4. TRIP INFO GRID BLOCK */}
                      <div className="mt-8 pt-8 border-t border-slate-100">
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-6 tracking-tight">Trip Info</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                          {(trip.tripInfo || DEFAULT_TRIP_INFO).map((item, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#eff6f9] text-[#136b8a] flex items-center justify-center shrink-0">
                                {renderIcon(item.icon)}
                              </div>
                              <div>
                                <span className="text-xs font-medium text-slate-500 block">{item.label}</span>
                                <span className="text-sm font-bold text-slate-900 block leading-snug">{item.value}</span>
                              </div>
                            </div>
                          ))}
                        </div>
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
                          {trip.costings.map((c, i) => {
                            const typeStr = (c.type || c.sharing || 'Sharing Option').toUpperCase();
                            let priceVal = c.price != null ? String(c.price).trim() : `₹${trip.numericPrice.toLocaleString()}`;
                            // Format Quad as base and Triple/Double with '+' prefix if numeric add-on
                            if (!priceVal.startsWith('₹') && !priceVal.startsWith('+')) {
                              if (/^\d+$/.test(priceVal)) {
                                const num = Number(priceVal);
                                if (typeStr.includes('QUAD')) {
                                  priceVal = `₹${num.toLocaleString('en-IN')}`;
                                } else {
                                  priceVal = `+ ₹${num.toLocaleString('en-IN')}`;
                                }
                              }
                            } else if (priceVal.startsWith('+') && !priceVal.includes('₹')) {
                              priceVal = `+ ₹${priceVal.replace(/^\+\s*/, '')}`;
                            }

                            return (
                              <div key={i} className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-6 text-center shadow-2xs flex flex-col justify-between hover:border-[#136b8a] transition-all">
                                <div>
                                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block mb-2">
                                    {typeStr}
                                  </span>
                                  <span className="text-2xl font-extrabold text-[#136b8a] block">
                                    {priceVal}
                                  </span>
                                </div>
                                {c.details && <p className="text-xs text-slate-500 mt-2 font-medium">{c.details}</p>}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-6 flex items-center justify-between shadow-2xs">
                          <span className="text-sm font-bold text-gray-900 block">Per Person</span>
                          <span className="text-xl md:text-2xl font-extrabold text-[#136b8a]">{trip.price} + 5% GST</span>
                        </div>
                      )}
                    </section>
                  );
                }

                if (sec.id === 'itinerary') {
                  return (
                    <section key="itinerary" id="itinerary" className="scroll-mt-32 border-b border-gray-100 pb-10">
                      {/* 6. EXPAND ALL TOGGLE SWITCH */}
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Itinerary</h2>
                        <div className="flex items-center gap-3">
                          <span className="text-xs md:text-sm font-bold text-slate-700">Expand all</span>
                          <button
                            type="button"
                            onClick={toggleExpandAll}
                            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                              allExpanded ? 'bg-[#136b8a]' : 'bg-slate-300'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 shadow-sm ${
                                allExpanded ? 'translate-x-6' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
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

                      {/* 7. DOWNLOAD ITINERARY BLOCK AFTER ITINERARY */}
                      {trip.itineraryPdfUrl && (
                        <div className="mt-8 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-14 bg-rose-50 border border-rose-200 rounded-lg flex flex-col items-center justify-center shrink-0">
                              <span className="text-[10px] font-extrabold bg-rose-600 text-white px-1.5 py-0.5 rounded-xs uppercase">PDF</span>
                            </div>
                            <div>
                              <h4 className="text-base font-bold text-slate-900">{trip.downloadBlock?.heading || "Want to read it later ?"}</h4>
                              <p className="text-xs md:text-sm text-slate-500 mt-0.5">{trip.downloadBlock?.subtext || "Download this tour's PDF brochure and start your planning offline."}</p>
                            </div>
                          </div>
                          <a
                            href={trip.itineraryPdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#136b8a] hover:bg-[#0f556e] text-white text-xs md:text-sm font-bold px-6 py-3 rounded-full transition-all shadow-md active:scale-95 shrink-0 whitespace-nowrap"
                          >
                            {trip.downloadBlock?.button_label || "Download PDF"}
                          </a>
                        </div>
                      )}
                    </section>
                  );
                }

                if (sec.id === 'inclusions-exclusions') {
                  return (
                    <section key="inclusions-exclusions" id="inclusions-exclusions" className="scroll-mt-32 border-b border-gray-100 pb-10">
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 tracking-tight">Inclusion & Exclusion</h2>

                      <div className="space-y-8">
                        {/* Cost Includes FIRST */}
                        <div>
                          <h3 className="text-base font-bold text-gray-900 mb-4">Cost Includes</h3>
                          <ul className="space-y-3">
                            {trip.inclusions && trip.inclusions.map((inc, i) => (
                              <li key={i} className="flex items-start gap-3 text-xs md:text-sm text-slate-700 font-medium">
                                <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                                  ✓
                                </span>
                                <span>{inc}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Cost Excludes BELOW */}
                        <div>
                          <h3 className="text-base font-bold text-gray-900 mb-4">Cost Excludes</h3>
                          <ul className="space-y-3">
                            {trip.exclusions && trip.exclusions.map((exc, i) => (
                              <li key={i} className="flex items-start gap-3 text-xs md:text-sm text-slate-700 font-medium">
                                <span className="w-5 h-5 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                                  ✕
                                </span>
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

                      <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-6">
                        <ul className="space-y-3 text-xs md:text-sm text-slate-800 font-semibold">
                          {trip.thingsToCarry.map((item, i) => {
                            const text = typeof item === 'string' ? item : (item.text || item.title || '');
                            if (!text) return null;
                            return (
                              <li key={i} className="flex items-start gap-3">
                                <span className="w-2 h-2 rounded-full bg-[#136b8a] mt-1.5 shrink-0" />
                                <span>{text}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </section>
                  );
                }

                if (sec.id === 'note') {
                  if (!trip.notes || (Array.isArray(trip.notes) && trip.notes.length === 0)) return null;
                  const isNoteHtml = typeof trip.notes === 'string' && (trip.notes.includes('<') || trip.notes.includes('>'));
                  const noteList = Array.isArray(trip.notes) ? trip.notes : (typeof trip.notes === 'string' ? trip.notes.split('\n').filter(Boolean) : []);
                  return (
                    <section key="note" id="note" className="scroll-mt-32 border-b border-gray-100 pb-10">
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 tracking-tight">Note</h2>
                      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-6 text-xs md:text-sm text-amber-950 leading-relaxed">
                        {isNoteHtml ? (
                          <div dangerouslySetInnerHTML={{ __html: trip.notes }} className="prose max-w-none text-xs md:text-sm text-amber-950" />
                        ) : (
                          <ul className="space-y-2.5">
                            {noteList.map((item, i) => (
                              <li key={i} className="flex items-start gap-2.5 font-medium">
                                <Info size={18} className="text-amber-700 shrink-0 mt-0.5" />
                                <span dangerouslySetInnerHTML={{ __html: item }} />
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </section>
                  );
                }

                if (sec.id === 'faqs') {
                  const faqsList = trip.faqs || [];
                  if (faqsList.length === 0) return null;
                  return (
                    <section key="faqs" id="faqs" className="scroll-mt-32 pb-6">
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 tracking-tight">FAQ's</h2>
                      <div className="space-y-3">
                        {faqsList.map((faq, idx) => {
                          const isFaqOpen = openFaqIndex === idx;
                          const qText = typeof faq === 'string' ? faq : (faq.question || faq.q || '');
                          const aText = typeof faq === 'string' ? '' : (faq.answer || faq.a || '');
                          if (!qText) return null;

                          return (
                            <div key={idx} className="border border-slate-200/90 rounded-2xl bg-white overflow-hidden shadow-2xs transition-all">
                              <button
                                type="button"
                                onClick={() => setOpenFaqIndex(isFaqOpen ? null : idx)}
                                className="w-full text-left p-5 font-bold text-slate-900 text-sm md:text-base flex items-center justify-between gap-4 cursor-pointer hover:text-[#136b8a]"
                              >
                                <span>{qText}</span>
                                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 font-extrabold text-sm">
                                  {isFaqOpen ? '−' : '+'}
                                </span>
                              </button>
                              {isFaqOpen && aText && (
                                <div
                                  className="px-5 pb-5 pt-1 text-slate-600 text-xs md:text-sm leading-relaxed border-t border-slate-100 prose max-w-none"
                                  dangerouslySetInnerHTML={{ __html: aText }}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                }

                return null;
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: STICKY BOOKING CARD */}
          <div className="lg:col-span-4">
            <div className="sticky top-28 bg-white border border-gray-200 rounded-3xl p-6 shadow-xl space-y-6">
              
              {/* Starting Price & GST */}
              <div className="space-y-1 pb-4 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Starting Price</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl md:text-4xl font-extrabold text-[#136b8a] tracking-tight">
                    {trip.price}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    {siteSettings?.gst_label || '+ 5% GST'}
                  </span>
                  {trip.originalPrice && (
                    <span className="text-xs text-gray-400 line-through ml-auto">
                      {trip.originalPrice}
                    </span>
                  )}
                  {trip.discountText && (
                    <span className="text-xs font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                      {trip.discountText}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400 block font-medium">Per Person</span>
              </div>

              {/* Sidebar Trust Benefits */}
              {(trip.trustBenefits || DEFAULT_TRUST_BENEFITS).length > 0 && (
                <div className="space-y-2 py-2">
                  {(trip.trustBenefits || DEFAULT_TRUST_BENEFITS).map((benefit, bIdx) => (
                    <div key={bIdx} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <ShieldCheck size={16} className="text-[#136b8a] shrink-0" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Travellers Counter */}
              <div className="flex items-center justify-between py-2 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-gray-500 text-xl">group</span>
                  <span className="text-sm font-bold text-gray-700">No. of Travellers</span>
                </div>
                <div className="flex items-center border border-gray-200 rounded-full p-1 bg-gray-50">
                  <button
                    onClick={() => setTravellers(Math.max(1, travellers - 1))}
                    className="w-8 h-8 rounded-full bg-white hover:bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-base shadow-2xs transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-extrabold text-sm text-gray-900">{travellers}</span>
                  <button
                    onClick={() => setTravellers(travellers + 1)}
                    className="w-8 h-8 rounded-full bg-white hover:bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-base shadow-2xs transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Total Amount */}
              <div className="bg-[#eff6f9] border border-[#b9dae6] rounded-2xl p-4 flex items-center justify-between">
                <span className="text-xs md:text-sm font-bold text-gray-700">Total Amount</span>
                <span className="text-xl md:text-2xl font-extrabold text-[#136b8a]">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Buttons: Book Now & Send Enquiry */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleBookNow}
                  className="w-full bg-[#136b8a] hover:bg-[#0f556e] text-white font-extrabold py-4 rounded-2xl shadow-md hover:shadow-lg transition-all text-base tracking-wide cursor-pointer active:scale-98"
                >
                  Book Now
                </button>
                <button
                  onClick={handleSendEnquiry}
                  className="w-full bg-[#25D366] hover:bg-[#20b858] text-white font-extrabold py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all text-sm tracking-wide cursor-pointer active:scale-98 flex items-center justify-center gap-2"
                >
                  <MessageCircle size={18} />
                  <span>Send Enquiry</span>
                </button>
                <p className="text-[11px] text-slate-400 text-center font-medium">fill the blanks to send enquiry to expert</p>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        packageData={trip}
        initialTravellers={travellers}
      />

      {/* Download Itinerary Modal */}
      <DownloadItineraryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tripTitle={trip.title}
        pdfUrl={trip.itineraryPdfUrl}
      />
    </div>
  );
}
