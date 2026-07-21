import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const LISTING_CATEGORIES = [
  { label: 'Recommended Packages', value: 'recommended' },
  { label: 'Best Seller', value: 'best-seller' },
  { label: 'Trek', value: 'trek' },
  { label: 'Group Departures', value: 'group-departures' },
  { label: 'Weekend Departures', value: 'weekend-departures' },
  { label: 'Family Trips', value: 'family-trips' },
  { label: 'Honeymoon Trips', value: 'honeymoon-trips' },
  { label: 'Upcoming Trips', value: 'upcoming-trips' },
  { label: 'Domestic Trips', value: 'domestic' },
  { label: 'International Trips', value: 'international' }
];

const PackageForm = ({ onCancel, onSubmit, initialData, saving }) => {
  const [title, setTitle] = useState('');
  const [listingCategories, setListingCategories] = useState([]);
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
  const [featured, setFeatured] = useState(false);
  const [bestSeller, setBestSeller] = useState(false);
  const [itinerary, setItinerary] = useState('');
  const [inclusions, setInclusions] = useState('');
  const [exclusions, setExclusions] = useState('');
  const [costings, setCostings] = useState('');
  const [jsonError, setJsonError] = useState('');

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
      setFeatured(!!initialData.featured);
      setBestSeller(!!initialData.best_seller);
      setItinerary(initialData.itinerary ? JSON.stringify(initialData.itinerary, null, 2) : '');
      setInclusions(initialData.inclusions ? JSON.stringify(initialData.inclusions, null, 2) : '');
      setExclusions(initialData.exclusions ? JSON.stringify(initialData.exclusions, null, 2) : '');
      setCostings(initialData.costings ? JSON.stringify(initialData.costings, null, 2) : '');
      setListingCategories(initialData.listing_categories || []);
    }
  }, [initialData]);

  const toggleListingCategory = (val) => {
    setListingCategories(prev =>
      prev.includes(val)
        ? prev.filter(c => c !== val)
        : [...prev, val]
    );
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
      state: state.trim() || null,
      destination: destination.trim() || null,
      duration: duration.trim() || null,
      price: price ? Number(price) : null,
      original_price: originalPrice ? Number(originalPrice) : null,
      discount_text: discountText.trim() || null,
      departure_from: departureFrom.trim() || null,
      image_url: imageUrl.trim() || null,
      banner_image: bannerImage.trim() || null,
      short_description: shortDescription.trim() || null,
      full_description: fullDescription.trim() || null,
      category: category.trim() || null,
      status,
      featured,
      best_seller: bestSeller,
      itinerary: parsedItinerary,
      inclusions: parsedInclusions,
      exclusions: parsedExclusions,
      costings: parsedCostings,
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

          {/* Status, Featured, Best Seller */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className={labelClass}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className={inputClass}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex items-center gap-3 py-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-2 text-sm font-medium text-gray-700">Featured</span>
              </label>
            </div>
            <div className="flex items-center gap-3 py-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={bestSeller} onChange={e => setBestSeller(e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                <span className="ml-2 text-sm font-medium text-gray-700">Best Seller</span>
              </label>
            </div>
          </div>

          {/* Package Listing Categories */}
          <div className="border-t border-gray-200 pt-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Package Listing Categories</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {LISTING_CATEGORIES.map(cat => (
                <label key={cat.value} className="flex items-center gap-3 cursor-pointer group relative">
                  <input 
                    type="checkbox" 
                    className="absolute opacity-0 w-0 h-0" 
                    checked={listingCategories.includes(cat.value)} 
                    onChange={() => toggleListingCategory(cat.value)} 
                  />
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    listingCategories.includes(cat.value)
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-300 group-hover:border-blue-500'
                  }`}>
                    {listingCategories.includes(cat.value) && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-gray-700 select-none">{cat.label}</span>
                </label>
              ))}
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
