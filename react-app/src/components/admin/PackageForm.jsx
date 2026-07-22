import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

import { supabase } from '../../supabaseClient';
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
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('active');
  const [itinerary, setItinerary] = useState('');
  const [inclusions, setInclusions] = useState('');
  const [exclusions, setExclusions] = useState('');
  const [costings, setCostings] = useState('');
  const [jsonError, setJsonError] = useState('');

  const [dynamicSections, setDynamicSections] = useState([]);
  const [dynamicInterests, setDynamicInterests] = useState([]);
  const [dynamicDestinations, setDynamicDestinations] = useState([]);

  // Fetch all placement options
  useEffect(() => {
    const fetchPlacements = async () => {
      try {
        const [secRes, intRes, destRes] = await Promise.all([
          supabase.from('homepage_sections').select('id, section_key, title').eq('is_active', true).not('section_key', 'in', '("destinations","interests")').order('display_order'),
          supabase.from('interest_categories').select('id, slug, name').eq('is_active', true).order('display_order'),
          supabase.from('destinations').select('id, slug, name').eq('is_active', true).order('display_order')
        ]);
        
        if (secRes.data) setDynamicSections(secRes.data);
        if (intRes.data) setDynamicInterests(intRes.data);
        if (destRes.data) setDynamicDestinations(destRes.data);
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
      setShortDescription(initialData.short_description || '');
      setFullDescription(initialData.full_description || '');
      setCategory(initialData.category || '');
      setStatus(initialData.status || 'active');
      setItinerary(initialData.itinerary ? JSON.stringify(initialData.itinerary, null, 2) : '');
      setInclusions(initialData.inclusions ? JSON.stringify(initialData.inclusions, null, 2) : '');
      setExclusions(initialData.exclusions ? JSON.stringify(initialData.exclusions, null, 2) : '');
      setCostings(initialData.costings ? JSON.stringify(initialData.costings, null, 2) : '');
      setListingCategories(initialData.listing_categories || []);

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
      short_description: shortDescription.trim() || null,
      full_description: fullDescription.trim() || null,
      category: category.trim() ? category.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : null,
      status,
      itinerary: parsedItinerary,
      inclusions: parsedInclusions,
      exclusions: parsedExclusions,
      costings: parsedCostings,
      package_placements: selectedPlacements,
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
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

          {/* Image URLs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Image URL</label>
              <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className={inputClass} placeholder="https://..." />
            </div>
            <div>
              <label className={labelClass}>Banner Image URL</label>
              <input type="text" value={bannerImage} onChange={e => setBannerImage(e.target.value)} className={inputClass} placeholder="https://..." />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className={labelClass}>Category</label>
            <input type="text" value={category} onChange={e => setCategory(e.target.value)} className={inputClass} placeholder="group-trips, weekend, honeymoon, treks, family" />
          </div>

          {/* Short Description */}
          <div>
            <label className={labelClass}>Short Description</label>
            <textarea value={shortDescription} onChange={e => setShortDescription(e.target.value)} className={inputClass} rows={2} placeholder="Brief overview shown in cards..." />
          </div>

          {/* Full Description */}
          <div>
            <label className={labelClass}>Full Description</label>
            <textarea value={fullDescription} onChange={e => setFullDescription(e.target.value)} className={inputClass} rows={4} placeholder="Detailed description for the package page..." />
          </div>

          {/* Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className={labelClass}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className={inputClass}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
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
          </div>

          {/* JSON Fields */}
          <div className="border-t border-gray-200 pt-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">JSON Data Fields</h3>
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
