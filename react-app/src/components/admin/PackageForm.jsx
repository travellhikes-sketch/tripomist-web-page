import React, { useState, useEffect } from 'react';
import { X, UploadCloud, FileText, Star, ArrowUp, ArrowDown, Trash2, Eye, EyeOff, Plus } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import RichTextEditor from './RichTextEditor';

const DEFAULT_SECTION_SETTINGS = [
  { id: 'overview', label: 'Overview', visible: true, order: 1 },
  { id: 'trip-cost', label: 'Trip Cost', visible: true, order: 2 },
  { id: 'itinerary', label: 'Itinerary', visible: true, order: 3 },
  { id: 'inclusions-exclusions', label: 'Inclusion & Exclusion', visible: true, order: 4 },
  { id: 'things-to-carry', label: 'Things to Carry', visible: true, order: 5 },
  { id: 'note', label: 'Note', visible: true, order: 6 },
  { id: 'faqs', label: "FAQ's", visible: true, order: 7 }
];

const PackageForm = ({ onCancel, onSubmit, initialData, saving }) => {
  const [title, setTitle] = useState('');
  const [listingCategories, setListingCategories] = useState([]);
  const [selectedPlacements, setSelectedPlacements] = useState([]);
  const [slug, setSlug] = useState('');
  const [state, setState] = useState('');
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountText, setDiscountText] = useState('');
  const [departureFrom, setDepartureFrom] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [itineraryPdfUrl, setItineraryPdfUrl] = useState('');
  const [downloadHeading, setDownloadHeading] = useState('Want to read it later ?');
  const [downloadSubtext, setDownloadSubtext] = useState("Download this tour's PDF brochure and start your planning offline.");
  const [downloadButtonLabel, setDownloadButtonLabel] = useState('Download PDF');
  const [thingsToCarryList, setThingsToCarryList] = useState([]);
  const [notes, setNotes] = useState('');
  const [tripInfoList, setTripInfoList] = useState([]);
  const [trustBenefitsList, setTrustBenefitsList] = useState([]);
  const [faqsList, setFaqsList] = useState([]);
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('active');
  const [itinerary, setItinerary] = useState('');
  const [inclusions, setInclusions] = useState('');
  const [exclusions, setExclusions] = useState('');
  const [costings, setCostings] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [primaryBadgeText, setPrimaryBadgeText] = useState('');
  const [secondaryBadgeText, setSecondaryBadgeText] = useState('');
  const [showPrimaryBadge, setShowPrimaryBadge] = useState(true);
  const [showSecondaryBadge, setShowSecondaryBadge] = useState(true);
  const [isClickable, setIsClickable] = useState(true);
  const [cardCtaText, setCardCtaText] = useState('Click');
  const [cardCtaAction, setCardCtaAction] = useState('open_package');
  const [cardCtaUrl, setCardCtaUrl] = useState('');

  // Section Visibility & Order Controls
  const [sectionSettings, setSectionSettings] = useState(DEFAULT_SECTION_SETTINGS);

  // Upload States
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const [dynamicSections, setDynamicSections] = useState([]);
  const [dynamicInterests, setDynamicInterests] = useState([]);
  const [dynamicDestinations, setDynamicDestinations] = useState([]);
  const [exploreDepartments, setExploreDepartments] = useState([]);
  const [promoStrips, setPromoStrips] = useState([]);

  // Fetch placement options
  useEffect(() => {
    const fetchPlacements = async () => {
      try {
        const [secRes, intRes, destRes, exploreRes, promoRes] = await Promise.all([
          supabase.from('homepage_sections').select('id, section_key, title').eq('is_active', true).not('section_key', 'in', '("destinations","interests")').order('display_order'),
          supabase.from('interest_categories').select('id, slug, name').eq('is_active', true).order('display_order'),
          supabase.from('destinations').select('id, slug, name').eq('is_active', true).order('display_order'),
          supabase.from('explore_departments').select('id, slug, title').eq('is_active', true).eq('allow_package_placement', true).order('display_order'),
          supabase.from('promo_strips').select('id, slug, text').eq('is_active', true).eq('allow_package_placement', true).order('display_order')
        ]);
        
        if (secRes.data) setDynamicSections(secRes.data);
        if (intRes.data) setDynamicInterests(intRes.data);
        if (destRes.data) setDynamicDestinations(destRes.data);
        if (exploreRes.data) setExploreDepartments(exploreRes.data);
        if (promoRes.data) setPromoStrips(promoRes.data);
      } catch (err) {
        console.error('Error fetching placements:', err);
      }
    };
    fetchPlacements();
  }, []);

  // Auto-generate slug from title
  useEffect(() => {
    if (!initialData && title) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  }, [title, initialData]);

  // Populate fields when editing
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setSlug(initialData.slug || '');
      setState(initialData.state || '');
      setDestination(initialData.destination || '');
      setDuration(initialData.duration || '');
      setPrice(initialData.price != null ? String(initialData.price) : '');
      setOriginalPrice(initialData.original_price != null ? String(initialData.original_price) : '');
      setDiscountText(initialData.discount_text || '');
      setDepartureFrom(initialData.departure_from || '');
      setImageUrl(initialData.image_url || '');
      setBannerImage(initialData.banner_image || '');
      setGalleryImages(initialData.gallery_images ? (Array.isArray(initialData.gallery_images) ? initialData.gallery_images : (typeof initialData.gallery_images === 'string' ? JSON.parse(initialData.gallery_images) : [])) : []);
      setItineraryPdfUrl(initialData.itinerary_pdf_url || '');
      setNotes(initialData.notes || '');

      // Parse things_to_carry
      let parsedThings = [];
      if (initialData.things_to_carry) {
        if (Array.isArray(initialData.things_to_carry)) {
          parsedThings = initialData.things_to_carry.map(item => typeof item === 'string' ? item : (item.text || item.title || ''));
        } else if (typeof initialData.things_to_carry === 'string') {
          try {
            const json = JSON.parse(initialData.things_to_carry);
            parsedThings = Array.isArray(json) ? json.map(item => typeof item === 'string' ? item : (item.text || item.title || '')) : [];
          } catch {
            parsedThings = initialData.things_to_carry.split('\n').filter(Boolean);
          }
        }
      }
      setThingsToCarryList(parsedThings);

      // Parse trip_info
      let parsedInfo = [];
      if (initialData.trip_info) {
        if (Array.isArray(initialData.trip_info)) {
          parsedInfo = initialData.trip_info;
        } else if (typeof initialData.trip_info === 'string') {
          try { parsedInfo = JSON.parse(initialData.trip_info); } catch (e) { parsedInfo = []; }
        }
      }
      setTripInfoList(parsedInfo);

      // Parse trust_benefits
      let parsedBenefits = [];
      if (initialData.trust_benefits) {
        if (Array.isArray(initialData.trust_benefits)) {
          parsedBenefits = initialData.trust_benefits.map(item => typeof item === 'string' ? item : (item.text || ''));
        } else if (typeof initialData.trust_benefits === 'string') {
          try {
            const json = JSON.parse(initialData.trust_benefits);
            parsedBenefits = Array.isArray(json) ? json.map(item => typeof item === 'string' ? item : (item.text || '')) : [];
          } catch {
            parsedBenefits = initialData.trust_benefits.split('\n').filter(Boolean);
          }
        }
      }
      setTrustBenefitsList(parsedBenefits);

      // Parse faqs
      let parsedFaqs = [];
      if (initialData.faqs) {
        if (Array.isArray(initialData.faqs)) {
          parsedFaqs = initialData.faqs;
        } else if (typeof initialData.faqs === 'string') {
          try { parsedFaqs = JSON.parse(initialData.faqs); } catch (e) { parsedFaqs = []; }
        }
      }
      setFaqsList(parsedFaqs);

      // Parse download_block
      if (initialData.download_block) {
        let db = initialData.download_block;
        if (typeof db === 'string') {
          try { db = JSON.parse(db); } catch (e) { db = {}; }
        }
        if (db.heading) setDownloadHeading(db.heading);
        if (db.subtext) setDownloadSubtext(db.subtext);
        if (db.button_label) setDownloadButtonLabel(db.button_label);
      }

      setShortDescription(initialData.short_description || '');
      setFullDescription(initialData.full_description || '');
      setCategory(initialData.category || '');
      setStatus(initialData.status || 'active');
      setItinerary(initialData.itinerary ? JSON.stringify(initialData.itinerary, null, 2) : '');
      setInclusions(initialData.inclusions ? JSON.stringify(initialData.inclusions, null, 2) : '');
      setExclusions(initialData.exclusions ? JSON.stringify(initialData.exclusions, null, 2) : '');
      setCostings(initialData.costings ? JSON.stringify(initialData.costings, null, 2) : '');
      setListingCategories(initialData.listing_categories || []);
      setPrimaryBadgeText(initialData.primary_badge_text || '');
      setSecondaryBadgeText(initialData.secondary_badge_text || '');
      setShowPrimaryBadge(initialData.show_primary_badge ?? true);
      setShowSecondaryBadge(initialData.show_secondary_badge ?? true);
      setIsClickable(initialData.is_clickable ?? true);
      setCardCtaText(initialData.card_cta_text || 'Click');
      setCardCtaAction(initialData.card_cta_action || 'open_package');
      setCardCtaUrl(initialData.card_cta_url || '');

      // Parse section_settings
      if (initialData.section_settings) {
        let raw = initialData.section_settings;
        if (typeof raw === 'string') {
          try { raw = JSON.parse(raw); } catch (e) { raw = null; }
        }
        if (Array.isArray(raw) && raw.length > 0) {
          setSectionSettings(raw);
        } else {
          setSectionSettings(DEFAULT_SECTION_SETTINGS);
        }
      } else {
        setSectionSettings(DEFAULT_SECTION_SETTINGS);
      }

      const fetchExistingPlacements = async () => {
        try {
          const { data, error } = await supabase
            .from('package_placements')
            .select('*')
            .eq('package_id', initialData.id);
          if (!error && data) {
            setSelectedPlacements(data.map(p => ({ type: p.placement_type, id: p.placement_id, slug: p.placement_slug })));
          }
        } catch(err) {
          console.error(err);
        }
      };
      if (initialData.id) fetchExistingPlacements();
    }
  }, [initialData]);

  const toggleListingCategory = (val) => {
    setListingCategories(prev => prev.includes(val) ? prev.filter(c => c !== val) : [...prev, val]);
  };

  const togglePlacement = (type, id, slug) => {
    setSelectedPlacements(prev => {
      const exists = prev.find(p => p.type === type && p.id === id);
      if (exists) return prev.filter(p => !(p.type === type && p.id === id));
      return [...prev, { type, id, slug }];
    });
  };

  // Gallery Storage File Upload
  const handleGalleryFileUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploadingGallery(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `gallery_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `packages/gallery/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('website-assets')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('website-assets')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }
      setGalleryImages(prev => [...prev, ...uploadedUrls]);
      if (!imageUrl && uploadedUrls.length > 0) {
        setImageUrl(uploadedUrls[0]);
      }
    } catch (err) {
      alert('Error uploading gallery image(s): ' + err.message);
      console.error('Gallery Upload Error:', err);
    } finally {
      setUploadingGallery(false);
      event.target.value = '';
    }
  };

  // Itinerary PDF Storage Upload
  const handlePdfFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingPdf(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `itinerary_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `packages/itineraries/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('website-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('website-assets')
        .getPublicUrl(filePath);

      setItineraryPdfUrl(publicUrl);
    } catch (err) {
      alert('Error uploading itinerary PDF: ' + err.message);
      console.error('PDF Upload Error:', err);
    } finally {
      setUploadingPdf(false);
      event.target.value = '';
    }
  };

  const addGalleryImageByUrl = () => {
    if (!newGalleryUrl.trim()) return;
    setGalleryImages(prev => [...prev, newGalleryUrl.trim()]);
    setNewGalleryUrl('');
  };

  const removeGalleryImage = (index) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
  };

  const setAsCoverImage = (index) => {
    const selectedUrl = galleryImages[index];
    if (!selectedUrl) return;
    const newList = galleryImages.filter((_, i) => i !== index);
    newList.unshift(selectedUrl);
    setGalleryImages(newList);
    setImageUrl(selectedUrl);
  };

  const moveGalleryImage = (index, dir) => {
    if (dir === 'up' && index === 0) return;
    if (dir === 'down' && index === galleryImages.length - 1) return;
    const newList = [...galleryImages];
    const targetIdx = dir === 'up' ? index - 1 : index + 1;
    const temp = newList[index];
    newList[index] = newList[targetIdx];
    newList[targetIdx] = temp;
    setGalleryImages(newList);
  };

  // Section Order & Visibility handlers
  const toggleSectionVisibility = (secId) => {
    setSectionSettings(prev => prev.map(s => s.id === secId ? { ...s, visible: !s.visible } : s));
  };

  const moveSection = (index, dir) => {
    if (dir === 'up' && index === 0) return;
    if (dir === 'down' && index === sectionSettings.length - 1) return;
    const list = [...sectionSettings];
    const targetIdx = dir === 'up' ? index - 1 : index + 1;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    const reordered = list.map((item, idx) => ({ ...item, order: idx + 1 }));
    setSectionSettings(reordered);
  };

  const resetSectionSettings = () => {
    setSectionSettings(DEFAULT_SECTION_SETTINGS);
  };

  // Structured List Handlers: Things to Carry
  const handleAddThingToCarry = () => {
    setThingsToCarryList(prev => [...prev, '']);
  };
  const handleUpdateThingToCarry = (idx, val) => {
    setThingsToCarryList(prev => {
      const copy = [...prev];
      copy[idx] = val;
      return copy;
    });
  };
  const handleRemoveThingToCarry = (idx) => {
    setThingsToCarryList(prev => prev.filter((_, i) => i !== idx));
  };
  const handleMoveThingToCarry = (idx, direction) => {
    setThingsToCarryList(prev => {
      const targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  // Structured List Handlers: Trip Info
  const handleAddTripInfo = () => {
    setTripInfoList(prev => [...prev, { icon: 'Bus', label: '', value: '' }]);
  };
  const handleUpdateTripInfo = (idx, field, val) => {
    setTripInfoList(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };
  const handleRemoveTripInfo = (idx) => {
    setTripInfoList(prev => prev.filter((_, i) => i !== idx));
  };
  const handleMoveTripInfo = (idx, direction) => {
    setTripInfoList(prev => {
      const targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  // Structured List Handlers: Trust Benefits
  const handleAddTrustBenefit = () => {
    setTrustBenefitsList(prev => [...prev, '']);
  };
  const handleUpdateTrustBenefit = (idx, val) => {
    setTrustBenefitsList(prev => {
      const copy = [...prev];
      copy[idx] = val;
      return copy;
    });
  };
  const handleRemoveTrustBenefit = (idx) => {
    setTrustBenefitsList(prev => prev.filter((_, i) => i !== idx));
  };
  const handleMoveTrustBenefit = (idx, direction) => {
    setTrustBenefitsList(prev => {
      const targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  // Structured List Handlers: FAQ's
  const handleAddFaq = () => {
    setFaqsList(prev => [...prev, { question: '', answer: '' }]);
  };
  const handleUpdateFaq = (idx, field, val) => {
    setFaqsList(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };
  const handleRemoveFaq = (idx) => {
    setFaqsList(prev => prev.filter((_, i) => i !== idx));
  };
  const handleMoveFaq = (idx, direction) => {
    setFaqsList(prev => {
      const targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setJsonError('');

    if (!title.trim() || !slug.trim()) {
      setJsonError('Title and Slug are required.');
      return;
    }

    let parsedItinerary = null,
      parsedInclusions = null,
      parsedExclusions = null,
      parsedCostings = null;

    try {
      if (itinerary.trim()) parsedItinerary = JSON.parse(itinerary);
      if (inclusions.trim()) parsedInclusions = JSON.parse(inclusions);
      if (exclusions.trim()) parsedExclusions = JSON.parse(exclusions);
      if (costings.trim()) parsedCostings = JSON.parse(costings);
    } catch (err) {
      setJsonError('Invalid JSON in one of the fields: ' + err.message);
      return;
    }

    const cleanThingsToCarry = thingsToCarryList.map(t => t.trim()).filter(Boolean);
    const cleanTripInfo = tripInfoList.filter(item => item.label && item.label.trim());
    const cleanTrustBenefits = trustBenefitsList.map(b => b.trim()).filter(Boolean);
    const cleanFaqs = faqsList.filter(item => item.question && item.question.trim());

    const pkg = {
      title: title.trim(),
      slug: slug.trim(),
      listing_categories: listingCategories,
      state: state.trim() ? state.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : null,
      destination: destination.trim() ? destination.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : null,
      duration: duration.trim() || null,
      price: price ? Number(price) : null,
      original_price: originalPrice ? Number(originalPrice) : null,
      discount_text: discountText.trim() || null,
      departure_from: departureFrom.trim() || null,
      image_url: imageUrl.trim() || null,
      banner_image: bannerImage.trim() || null,
      gallery_images: galleryImages,
      itinerary_pdf_url: itineraryPdfUrl.trim() || null,
      download_block: {
        heading: downloadHeading.trim(),
        subtext: downloadSubtext.trim(),
        button_label: downloadButtonLabel.trim()
      },
      section_settings: sectionSettings,
      things_to_carry: cleanThingsToCarry,
      notes: notes.trim() || null,
      trip_info: cleanTripInfo,
      trust_benefits: cleanTrustBenefits,
      faqs: cleanFaqs,
      short_description: shortDescription.trim() || null,
      full_description: fullDescription.trim() || null,
      category: category.trim() ? category.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : null,
      status,
      itinerary: parsedItinerary,
      inclusions: parsedInclusions,
      exclusions: parsedExclusions,
      costings: parsedCostings,
      package_placements: selectedPlacements,
      primary_badge_text: primaryBadgeText.trim() || null,
      secondary_badge_text: secondaryBadgeText.trim() || null,
      show_primary_badge: showPrimaryBadge,
      show_secondary_badge: showSecondaryBadge,
      is_clickable: isClickable,
      card_cta_text: cardCtaText.trim() || 'Click',
      card_cta_action: cardCtaAction,
      card_cta_url: cardCtaUrl.trim() || null,
    };
    onSubmit(pkg);
  };

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
          <h2 className="text-xl font-bold text-gray-900">
            {initialData ? 'Edit Package' : 'Create New Package'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {jsonError && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">
              {jsonError}
            </div>
          )}

          {/* Title & Slug */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Title <span className="text-red-500">*</span></label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputClass} placeholder="Spiti Valley Adventure" required />
            </div>
            <div>
              <label className={labelClass}>Slug <span className="text-red-500">*</span></label>
              <input type="text" value={slug} onChange={e => setSlug(e.target.value)} className={inputClass} placeholder="spiti-valley-adventure" required />
            </div>
          </div>

          {/* State & Destination */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>State</label>
              <input type="text" value={state} onChange={e => setState(e.target.value)} className={inputClass} placeholder="Himachal Pradesh" />
            </div>
            <div>
              <label className={labelClass}>Destination</label>
              <input type="text" value={destination} onChange={e => setDestination(e.target.value)} className={inputClass} placeholder="Spiti Valley" />
            </div>
          </div>

          {/* Duration & Price */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Duration</label>
              <input type="text" value={duration} onChange={e => setDuration(e.target.value)} className={inputClass} placeholder="6N 7D" />
            </div>
            <div>
              <label className={labelClass}>Price (₹)</label>
              <input type="number" step="1" value={price} onChange={e => setPrice(e.target.value)} className={inputClass} placeholder="19999" />
            </div>
            <div>
              <label className={labelClass}>Original Price (₹)</label>
              <input type="number" step="1" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} className={inputClass} placeholder="24999" />
            </div>
          </div>

          {/* Discount & Departure */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Discount Text</label>
              <input type="text" value={discountText} onChange={e => setDiscountText(e.target.value)} className={inputClass} placeholder="20% OFF" />
            </div>
            <div>
              <label className={labelClass}>Departure From</label>
              <input type="text" value={departureFrom} onChange={e => setDepartureFrom(e.target.value)} className={inputClass} placeholder="Delhi / Chandigarh" />
            </div>
          </div>

          {/* Main Cover & Banner URLs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Main Image URL (Cover)</label>
              <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className={inputClass} placeholder="https://..." />
            </div>
            <div>
              <label className={labelClass}>Banner Image URL</label>
              <input type="text" value={bannerImage} onChange={e => setBannerImage(e.target.value)} className={inputClass} placeholder="https://..." />
            </div>
          </div>

          {/* ==================================================
              1. PACKAGE GALLERY (UPLOAD + MANAGE + REORDER + COVER)
          ================================================== */}
          <div className="border border-slate-200 bg-slate-50/70 p-4 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <label className={`${labelClass} text-slate-900 font-bold mb-0`}>
                Package Photo Gallery ({galleryImages.length})
              </label>
              <label className="bg-[#136b8a] hover:bg-[#0f556e] text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-colors">
                {uploadingGallery ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <UploadCloud size={15} />
                )}
                Upload Image(s)
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryFileUpload}
                  disabled={uploadingGallery}
                  className="hidden"
                />
              </label>
            </div>

            {/* URL Fallback */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newGalleryUrl}
                onChange={e => setNewGalleryUrl(e.target.value)}
                className={inputClass}
                placeholder="Or paste image URL (https://...)"
              />
              <button
                type="button"
                onClick={addGalleryImageByUrl}
                className="px-3.5 py-2 bg-slate-200 text-slate-800 rounded-lg text-xs font-bold hover:bg-slate-300 whitespace-nowrap"
              >
                + Add URL
              </button>
            </div>

            {/* Gallery Image Cards Grid */}
            {galleryImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                {galleryImages.map((img, idx) => (
                  <div key={idx} className="relative group bg-white border border-slate-200 rounded-xl p-2 flex flex-col items-center shadow-2xs">
                    <img src={img} alt={`Gallery ${idx}`} className="w-full h-24 object-cover rounded-lg mb-2" />
                    {idx === 0 && (
                      <span className="absolute top-3 left-3 bg-[#136b8a] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
                        Cover
                      </span>
                    )}

                    <div className="flex items-center justify-between w-full gap-1 pt-1 border-t border-slate-100">
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => setAsCoverImage(idx)}
                          title="Set as cover image"
                          className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                        >
                          <Star size={14} />
                        </button>
                      )}
                      <div className="flex items-center gap-1 ml-auto">
                        <button
                          type="button"
                          onClick={() => moveGalleryImage(idx, 'up')}
                          disabled={idx === 0}
                          title="Move left"
                          className="p-1 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-30"
                        >
                          <ArrowUp size={14} className="-rotate-90" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveGalleryImage(idx, 'down')}
                          disabled={idx === galleryImages.length - 1}
                          title="Move right"
                          className="p-1 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-30"
                        >
                          <ArrowDown size={14} className="-rotate-90" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(idx)}
                          title="Remove image"
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded font-bold"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No gallery photos added yet. Upload files or paste image URLs above.</p>
            )}
          </div>

          {/* ==================================================
              2. ITINERARY PDF UPLOAD & FILE MANAGEMENT
          ================================================== */}
          <div className="border border-slate-200 bg-slate-50/70 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className={`${labelClass} text-slate-900 font-bold mb-0 flex items-center gap-2`}>
                <FileText size={18} className="text-[#136b8a]" />
                <span>Downloadable Itinerary PDF</span>
              </label>

              <label className="bg-[#136b8a] hover:bg-[#0f556e] text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-colors">
                {uploadingPdf ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <UploadCloud size={15} />
                )}
                {itineraryPdfUrl ? 'Replace PDF' : 'Upload PDF'}
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handlePdfFileUpload}
                  disabled={uploadingPdf}
                  className="hidden"
                />
              </label>
            </div>

            {itineraryPdfUrl ? (
              <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs">
                <div className="flex items-center gap-2 truncate pr-2">
                  <FileText size={16} className="text-rose-600 shrink-0" />
                  <a href={itineraryPdfUrl} target="_blank" rel="noopener noreferrer" className="text-[#136b8a] font-bold hover:underline truncate">
                    {itineraryPdfUrl.split('/').pop()}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => setItineraryPdfUrl('')}
                  className="text-rose-600 hover:text-rose-800 font-bold shrink-0 ml-2"
                >
                  Remove
                </button>
              </div>
            ) : null}

            {/* URL Fallback */}
            <input
              type="text"
              value={itineraryPdfUrl}
              onChange={e => setItineraryPdfUrl(e.target.value)}
              className={inputClass}
              placeholder="Or paste direct PDF URL (https://...)"
            />
          </div>

          {/* ==================================================
              3. PACKAGE SECTION CONTROLS (SHOW/HIDE + DISPLAY ORDER)
          ================================================== */}
          <div className="border border-slate-200 bg-slate-50/70 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <label className={`${labelClass} text-slate-900 font-bold mb-0`}>
                Package Section Display & Visibility
              </label>
              <button
                type="button"
                onClick={resetSectionSettings}
                className="text-xs text-[#136b8a] hover:underline font-semibold"
              >
                Reset Default Order
              </button>
            </div>

            <div className="space-y-2">
              {sectionSettings.map((sec, idx) => (
                <div
                  key={sec.id}
                  className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-2.5 shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleSectionVisibility(sec.id)}
                      className={`p-1 rounded cursor-pointer transition-colors ${
                        sec.visible !== false ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'
                      }`}
                      title={sec.visible !== false ? 'Hide section' : 'Show section'}
                    >
                      {sec.visible !== false ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>

                    <span className={`text-sm font-bold ${sec.visible !== false ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                      {sec.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveSection(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-20"
                      title="Move up"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(idx, 'down')}
                      disabled={idx === sectionSettings.length - 1}
                      className="p-1 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-20"
                      title="Move down"
                    >
                      <ArrowDown size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className={labelClass}>Category</label>
            <input type="text" value={category} onChange={e => setCategory(e.target.value)} className={inputClass} placeholder="group-trips, weekend, honeymoon, treks, family" />
          </div>

          {/* Short Description */}
          <div>
            <label className={labelClass}>Short Description (Overview text)</label>
            <textarea value={shortDescription} onChange={e => setShortDescription(e.target.value)} className={inputClass} rows={2} placeholder="Brief overview shown in cards and top section..." />
          </div>

          {/* Full Description (Rich Text Overview) */}
          <div>
            <label className={labelClass}>Full Description (Overview Rich Text)</label>
            <RichTextEditor value={fullDescription} onChange={setFullDescription} placeholder="Detailed overview for the package..." />
          </div>

          {/* Status and Clickable */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className={labelClass}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className={inputClass}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Card Clickable</label>
              <div className="flex items-center h-[38px] px-3 border border-gray-300 rounded-lg bg-gray-50">
                <input 
                  type="checkbox" 
                  checked={isClickable} 
                  onChange={e => setIsClickable(e.target.checked)} 
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-2" 
                />
                <span className="text-sm text-gray-700 font-medium">
                  {isClickable ? 'ON (Normal Package)' : 'OFF (Card Only, Non-clickable)'}
                </span>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="border-t border-gray-200 pt-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Manual Badges</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Primary Badge Text</label>
                <input type="text" value={primaryBadgeText} onChange={e => setPrimaryBadgeText(e.target.value)} className={inputClass} placeholder="e.g. Destination, Recommended, Limited Seats" />
                <div className="flex items-center mt-2">
                  <input type="checkbox" checked={showPrimaryBadge} onChange={e => setShowPrimaryBadge(e.target.checked)} className="w-4 h-4 mr-2" />
                  <label className="text-sm font-medium text-gray-700">Show Primary Badge</label>
                </div>
              </div>
              <div>
                <label className={labelClass}>Secondary Badge Text</label>
                <input type="text" value={secondaryBadgeText} onChange={e => setSecondaryBadgeText(e.target.value)} className={inputClass} placeholder="e.g. Trek, Weekend Special, Group Departure" />
                <div className="flex items-center mt-2">
                  <input type="checkbox" checked={showSecondaryBadge} onChange={e => setShowSecondaryBadge(e.target.checked)} className="w-4 h-4 mr-2" />
                  <label className="text-sm font-medium text-gray-700">Show Secondary Badge</label>
                </div>
              </div>
            </div>
          </div>

          {/* Card Button */}
          <div className="border-t border-gray-200 pt-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Card Button Customization</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Button Text</label>
                <input type="text" value={cardCtaText} onChange={e => setCardCtaText(e.target.value)} className={inputClass} placeholder="Default: Click" />
              </div>
              <div>
                <label className={labelClass}>Button Action</label>
                <select value={cardCtaAction} onChange={e => setCardCtaAction(e.target.value)} className={inputClass}>
                  <option value="open_package">Open Package Page</option>
                  <option value="coming_soon">Coming Soon / Disabled</option>
                  <option value="custom_url">Custom URL</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Custom URL</label>
                <input type="text" value={cardCtaUrl} onChange={e => setCardCtaUrl(e.target.value)} className={inputClass} placeholder="https://..." disabled={cardCtaAction !== 'custom_url'} />
              </div>
            </div>
          </div>

          {/* Placements */}
          <div className="border-t border-gray-200 pt-5 space-y-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Package Placements</h3>
            
            {/* Homepage Sections */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Homepage Sections</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {dynamicSections.length === 0 && <div className="text-sm text-gray-500">No active homepage sections.</div>}
                {dynamicSections.map(sec => {
                  const isChecked = selectedPlacements.some(p => p.type === 'homepage_section' && p.id === sec.id);
                  return (
                    <label key={sec.id} className="flex items-center gap-3 cursor-pointer group relative">
                      <input type="checkbox" className="absolute opacity-0 w-0 h-0" checked={isChecked} onChange={() => togglePlacement('homepage_section', sec.id, sec.section_key)} />
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-blue-500'}`}>
                        {isChecked && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className="text-sm text-gray-700 select-none">{sec.title}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Interests */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Interests</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {dynamicInterests.length === 0 && <div className="text-sm text-gray-500">No active interests.</div>}
                {dynamicInterests.map(int => {
                  const isChecked = selectedPlacements.some(p => p.type === 'interest' && p.id === int.id);
                  return (
                    <label key={int.id} className="flex items-center gap-3 cursor-pointer group relative">
                      <input type="checkbox" className="absolute opacity-0 w-0 h-0" checked={isChecked} onChange={() => togglePlacement('interest', int.id, int.slug)} />
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-blue-500'}`}>
                        {isChecked && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className="text-sm text-gray-700 select-none">{int.name}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Destinations */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Destinations</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {dynamicDestinations.length === 0 && <div className="text-sm text-gray-500">No active destinations.</div>}
                {dynamicDestinations.map(dest => {
                  const isChecked = selectedPlacements.some(p => p.type === 'destination' && p.id === dest.id);
                  return (
                    <label key={dest.id} className="flex items-center gap-3 cursor-pointer group relative">
                      <input type="checkbox" className="absolute opacity-0 w-0 h-0" checked={isChecked} onChange={() => togglePlacement('destination', dest.id, dest.slug)} />
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-blue-500'}`}>
                        {isChecked && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className="text-sm text-gray-700 select-none">{dest.name}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Explore Departments */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Explore Departments</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {exploreDepartments.length === 0 && <div className="text-sm text-gray-500">No active explore departments.</div>}
                {exploreDepartments.map(dept => {
                  const isChecked = selectedPlacements.some(p => p.type === 'explore_department' && p.id === dept.id);
                  return (
                    <label key={dept.id} className="flex items-center gap-3 cursor-pointer group relative">
                      <input type="checkbox" className="absolute opacity-0 w-0 h-0" checked={isChecked} onChange={() => togglePlacement('explore_department', dept.id, dept.slug)} />
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-blue-500'}`}>
                        {isChecked && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className="text-sm text-gray-700 select-none">{dept.title}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Promo Pages */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Promo Pages</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {promoStrips.length === 0 && <div className="text-sm text-gray-500">No active promo pages.</div>}
                {promoStrips.map(promo => {
                  const isChecked = selectedPlacements.some(p => p.type === 'promo_strip' && p.id === promo.id);
                  return (
                    <label key={promo.id} className="flex items-center gap-3 cursor-pointer group relative">
                      <input type="checkbox" className="absolute opacity-0 w-0 h-0" checked={isChecked} onChange={() => togglePlacement('promo_strip', promo.id, promo.slug)} />
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-blue-500'}`}>
                        {isChecked && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className="text-sm text-gray-700 select-none">{promo.text}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Section Data Content Fields */}
          <div className="border-t border-gray-200 pt-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Package Content Data</h3>
            <div>
              <label className={labelClass}>Itinerary (JSON array)</label>
              <textarea value={itinerary} onChange={e => setItinerary(e.target.value)} className={`${inputClass} font-mono text-xs`} rows={5} placeholder={'[\n  { "title": "Day 1 - Arrival", "description": "Arrive and check in..." },\n  { "title": "Day 2 - Sightseeing", "description": "Visit local spots..." }\n]'} />
            </div>
            <div>
              <label className={labelClass}>Inclusions (JSON array)</label>
              <textarea value={inclusions} onChange={e => setInclusions(e.target.value)} className={`${inputClass} font-mono text-xs`} rows={3} placeholder={'["Accommodation", "Meals", "Transport", "Guide"]'} />
            </div>
            <div>
              <label className={labelClass}>Exclusions (JSON array)</label>
              <textarea value={exclusions} onChange={e => setExclusions(e.target.value)} className={`${inputClass} font-mono text-xs`} rows={3} placeholder={'["Flights", "Personal expenses", "Insurance"]'} />
            </div>
            <div>
              <label className={labelClass}>Costings (JSON array)</label>
              <textarea value={costings} onChange={e => setCostings(e.target.value)} className={`${inputClass} font-mono text-xs`} rows={3} placeholder={'[\n  { "type": "Double Sharing", "price": "₹19,999 per person" }\n]'} />
            </div>
            {/* Structured Repeatable Control: Things to Carry */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-gray-800">Things to Carry List</label>
                <button
                  type="button"
                  onClick={handleAddThingToCarry}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-white border border-blue-200 px-3 py-1 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus size={14} /> Add Item
                </button>
              </div>
              {thingsToCarryList.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No items added yet. Click "+ Add Item" above.</p>
              ) : (
                <div className="space-y-2">
                  {thingsToCarryList.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white p-2 border border-gray-200 rounded-lg shadow-2xs">
                      <span className="text-xs font-bold text-gray-400 w-5 text-center">{idx + 1}.</span>
                      <input
                        type="text"
                        value={item}
                        onChange={e => handleUpdateThingToCarry(idx, e.target.value)}
                        className="flex-grow border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-800 focus:ring-1 focus:ring-blue-500 outline-none"
                        placeholder="e.g. Warm Clothes & Layering"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveThingToCarry(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveThingToCarry(idx, 1)}
                          disabled={idx === thingsToCarryList.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveThingToCarry(idx)}
                          className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Note / Advisory Information (Rich Text) */}
            <div>
              <label className={labelClass}>Note / Advisory Information (Rich Text)</label>
              <RichTextEditor value={notes} onChange={setNotes} placeholder="Important note, age guidelines, or cancellation policy highlights..." />
            </div>

            {/* Structured Repeatable Control: Trip Info Grid */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-gray-800">Trip Info Grid Items</label>
                <button
                  type="button"
                  onClick={handleAddTripInfo}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-white border border-blue-200 px-3 py-1 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus size={14} /> Add Info Item
                </button>
              </div>
              {tripInfoList.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No trip info items. Click "+ Add Info Item" above.</p>
              ) : (
                <div className="space-y-2">
                  {tripInfoList.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-2.5 border border-gray-200 rounded-lg shadow-2xs">
                      <select
                        value={item.icon || 'Bus'}
                        onChange={e => handleUpdateTripInfo(idx, 'icon', e.target.value)}
                        className="border border-gray-200 rounded-md px-2 py-1.5 text-xs text-gray-800 font-semibold focus:ring-1 focus:ring-blue-500 outline-none"
                      >
                        <option value="Bus">Bus / Transport</option>
                        <option value="Users">Users / Group</option>
                        <option value="Mountain">Mountain / Altitude</option>
                        <option value="Bed">Bed / Hotel</option>
                        <option value="Sun">Sun / Season</option>
                        <option value="UserCheck">UserCheck / Guide</option>
                        <option value="Compass">Compass / Tour</option>
                        <option value="Utensils">Utensils / Meals</option>
                        <option value="FileCheck">FileCheck / Permits</option>
                      </select>
                      <input
                        type="text"
                        value={item.label || ''}
                        onChange={e => handleUpdateTripInfo(idx, 'label', e.target.value)}
                        className="w-full sm:w-1/3 border border-gray-200 rounded-md px-2.5 py-1.5 text-xs text-gray-800 focus:ring-1 focus:ring-blue-500 outline-none"
                        placeholder="Label (e.g. Group Size)"
                      />
                      <input
                        type="text"
                        value={item.value || ''}
                        onChange={e => handleUpdateTripInfo(idx, 'value', e.target.value)}
                        className="w-full sm:w-1/2 border border-gray-200 rounded-md px-2.5 py-1.5 text-xs text-gray-800 focus:ring-1 focus:ring-blue-500 outline-none"
                        placeholder="Value (e.g. 12 - 15)"
                      />
                      <div className="flex items-center justify-end gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveTripInfo(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveTripInfo(idx, 1)}
                          disabled={idx === tripInfoList.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveTripInfo(idx)}
                          className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Structured Repeatable Control: Sidebar Trust Benefits */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-gray-800">Sidebar Trust Benefits (Below Price)</label>
                <button
                  type="button"
                  onClick={handleAddTrustBenefit}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-white border border-blue-200 px-3 py-1 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus size={14} /> Add Benefit
                </button>
              </div>
              {trustBenefitsList.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No trust benefits added. Click "+ Add Benefit" above.</p>
              ) : (
                <div className="space-y-2">
                  {trustBenefitsList.map((benefit, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white p-2 border border-gray-200 rounded-lg shadow-2xs">
                      <span className="text-xs font-bold text-gray-400 w-5 text-center">{idx + 1}.</span>
                      <input
                        type="text"
                        value={benefit}
                        onChange={e => handleUpdateTrustBenefit(idx, e.target.value)}
                        className="flex-grow border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-800 focus:ring-1 focus:ring-blue-500 outline-none"
                        placeholder="e.g. Best for Solo Travelers"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveTrustBenefit(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveTrustBenefit(idx, 1)}
                          disabled={idx === trustBenefitsList.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveTrustBenefit(idx)}
                          className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Structured Repeatable Control: FAQ's */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-gray-800">Package FAQ's</label>
                <button
                  type="button"
                  onClick={handleAddFaq}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-white border border-blue-200 px-3 py-1 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus size={14} /> Add FAQ
                </button>
              </div>
              {faqsList.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No FAQ items. Click "+ Add FAQ" above.</p>
              ) : (
                <div className="space-y-3">
                  {faqsList.map((faq, idx) => (
                    <div key={idx} className="bg-white p-3 border border-gray-200 rounded-lg shadow-2xs space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-gray-500">FAQ #{idx + 1}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveFaq(idx, -1)}
                            disabled={idx === 0}
                            className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveFaq(idx, 1)}
                            disabled={idx === faqsList.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveFaq(idx)}
                            className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={faq.question || ''}
                        onChange={e => handleUpdateFaq(idx, 'question', e.target.value)}
                        className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-800 font-semibold focus:ring-1 focus:ring-blue-500 outline-none"
                        placeholder="Question (e.g. Is this trip suitable for beginners?)"
                      />
                      <RichTextEditor
                        value={faq.answer || ''}
                        onChange={val => handleUpdateFaq(idx, 'answer', val)}
                        placeholder="Answer details..."
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Download Itinerary Card Customization */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <label className="text-sm font-bold text-gray-800">Download Itinerary Brochure Card Customization</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Card Heading</label>
                  <input
                    type="text"
                    value={downloadHeading}
                    onChange={e => setDownloadHeading(e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-800"
                    placeholder="Want to read it later ?"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Button Text</label>
                  <input
                    type="text"
                    value={downloadButtonLabel}
                    onChange={e => setDownloadButtonLabel(e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-800"
                    placeholder="Download PDF"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Card Supporting Text</label>
                <input
                  type="text"
                  value={downloadSubtext}
                  onChange={e => setDownloadSubtext(e.target.value)}
                  className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-800"
                  placeholder="Download this tour's PDF brochure and start your planning offline."
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {initialData ? 'Update Package' : 'Create Package'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PackageForm;
