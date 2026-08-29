import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { Search, Link as LinkIcon, ExternalLink, FileText, MapPin, Grid, Layers, X } from 'lucide-react';

const STATIC_ROUTES = [
  { label: 'Home', route: '/', type: 'static', icon: <FileText size={14} /> },
  { label: 'Reviews', route: '/reviews', type: 'static', icon: <FileText size={14} /> },
  { label: 'All Departures', route: '/all-departures', type: 'static', icon: <FileText size={14} /> },
  { label: 'Upcoming Departures', route: '/upcoming-departures', type: 'static', icon: <FileText size={14} /> },
  { label: 'Group Trips', route: '/group-trips', type: 'static', icon: <FileText size={14} /> },
  { label: 'Weekend Trips', route: '/weekend-trips', type: 'static', icon: <FileText size={14} /> },
  { label: 'Treks', route: '/treks', type: 'static', icon: <FileText size={14} /> },
  { label: 'Family Tours', route: '/family-tours', type: 'static', icon: <FileText size={14} /> },
  { label: 'Honeymoon Trips', route: '/honeymoon-trips', type: 'static', icon: <FileText size={14} /> },
  { label: 'International', route: '/international', type: 'static', icon: <FileText size={14} /> },
  { label: 'Domestic', route: '/domestic', type: 'static', icon: <FileText size={14} /> },
  { label: 'About Us', route: '/about', type: 'static', icon: <FileText size={14} /> },
  { label: 'Contact', route: '/contact', type: 'static', icon: <FileText size={14} /> },
  { label: 'Search', route: '/search', type: 'static', icon: <FileText size={14} /> },
  { label: 'Privacy Policy', route: '/privacy-policy', type: 'static', icon: <FileText size={14} /> },
  { label: 'Refund Policy', route: '/refund-policy', type: 'static', icon: <FileText size={14} /> },
  { label: 'Terms & Conditions', route: '/terms-conditions', type: 'static', icon: <FileText size={14} /> },
];

function isValidCustomTarget(value) {
  const v = value.toLowerCase().trim();
  return v.startsWith('/') || 
         v.startsWith('http://') || 
         v.startsWith('https://') || 
         v.startsWith('mailto:') || 
         v.startsWith('tel:') || 
         v.startsWith('#') || 
         v.includes('.com') || 
         v.includes('.org') || 
         v.includes('.net') || 
         v.includes('.io');
}

export default function WebsiteLinkPicker({ value, onChange, label = "CTA Link / URL", placeholder = "Search page or paste URL..." }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState(STATIC_ROUTES);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const fetchDynamicRoutes = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        supabase.from('homepage_sections').select('title, section_key, view_all_route').eq('is_active', true),
        supabase.from('Pakage').select('name, slug').eq('status', 'active'),
        supabase.from('destinations').select('name, slug').eq('is_active', true),
        supabase.from('interest_categories').select('name, route').eq('is_active', true)
      ]);

      const dynamicOptions = [];

      // Packages
      if (results[1].status === 'fulfilled' && results[1].value.data) {
        results[1].value.data.forEach(pkg => {
          if (pkg.slug) {
            dynamicOptions.push({
              label: pkg.name,
              route: `/itinerary/${pkg.slug}`,
              type: 'PACKAGES',
              icon: <MapPin size={14} />
            });
          }
        });
      }

      // Listing Pages (homepage_sections)
      if (results[0].status === 'fulfilled' && results[0].value.data) {
        results[0].value.data.forEach(sec => {
          const route = sec.view_all_route || `/trips/${sec.section_key}`;
          dynamicOptions.push({
            label: sec.title || 'Untitled Section',
            route: route,
            type: 'LISTING PAGES',
            icon: <Layers size={14} />
          });
        });
      }

      // Destinations
      if (results[2].status === 'fulfilled' && results[2].value.data) {
        results[2].value.data.forEach(dest => {
          if (dest.slug) {
            dynamicOptions.push({
              label: dest.name,
              route: `/destinations/${dest.slug}`,
              type: 'DESTINATIONS',
              icon: <MapPin size={14} />
            });
          }
        });
      }

      // Interests
      if (results[3].status === 'fulfilled' && results[3].value.data) {
        results[3].value.data.forEach(int => {
          if (int.route) {
            dynamicOptions.push({
              label: int.name,
              route: int.route,
              type: 'INTERESTS',
              icon: <Grid size={14} />
            });
          }
        });
      }
      
      const staticFormatted = STATIC_ROUTES.map(s => ({...s, type: 'WEBSITE PAGES'}));

      // Deduplicate options by route (prefer dynamic human readable)
      const allOptions = [...dynamicOptions, ...staticFormatted];
      const uniqueOptions = Array.from(new Map(allOptions.map(item => [item.route, item])).values());

      setOptions(uniqueOptions);
      
      // Log errors if any
      results.forEach((res, index) => {
        if (res.status === 'rejected') {
          console.error(`Error fetching dynamic routes for index ${index}:`, res.reason);
        }
      });
      
    } catch (err) {
      console.error('Error in fetchDynamicRoutes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDynamicRoutes();
    }
  }, [isOpen]);

  const getFilteredOptions = () => {
    if (!searchTerm) return options;
    const lowerTerm = searchTerm.toLowerCase();
    
    const isUrl = isValidCustomTarget(searchTerm);
    const filtered = options.filter(opt => 
      (opt.label && opt.label.toLowerCase().includes(lowerTerm)) || 
      (opt.route && opt.route.toLowerCase().includes(lowerTerm)) ||
      (opt.type && opt.type.toLowerCase().includes(lowerTerm)) ||
      (opt.route && opt.route.includes(lowerTerm.replace(/\s+/g, '-')))
    );

    let results = [];

    // Prioritize "Create Package Page" for plain text
    if (searchTerm && !isUrl && !filtered.some(f => f.label?.toLowerCase() === lowerTerm || f.route?.toLowerCase() === lowerTerm)) {
       results.push({
         label: `+ Create Package Page "${searchTerm}"`,
         route: `CREATE_PACKAGE:${searchTerm}`,
         type: 'ACTION',
         icon: <Layers size={14} />
       });
    }

    if (isUrl) {
      results.push({
        label: 'Use Custom URL / Route',
        route: searchTerm,
        type: 'CUSTOM',
        icon: (searchTerm.startsWith('http') || searchTerm.includes('.com')) ? <ExternalLink size={14} /> : <LinkIcon size={14} />
      });
    }

    results = [...results, ...filtered];

    return results;
  };

  const filteredOptions = getFilteredOptions();
  
  // Find matching option for current value to show human readable label
  const selectedOption = options.find(opt => opt.route === value);

  return (
    <div className="relative" ref={wrapperRef}>
      {label && <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>}
      
      {/* Read-only view when a value is selected but not editing */}
      {value && !isOpen ? (
        <div 
          onClick={() => { setIsOpen(true); setSearchTerm(''); }}
          className="w-full p-2.5 border border-gray-300 rounded-lg cursor-text hover:border-blue-400 bg-gray-50 flex items-center justify-between transition-colors"
        >
          <div className="flex flex-col overflow-hidden mr-2">
            <span className="text-sm font-medium text-gray-800 truncate">
              {selectedOption ? selectedOption.label : 'Custom URL'}
            </span>
            <span className="text-xs text-gray-500 truncate">{value}</span>
          </div>
          <button 
            type="button" 
            onClick={(e) => { e.stopPropagation(); onChange(''); setIsOpen(true); }}
            className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-gray-200 transition-colors"
            title="Clear"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsOpen(true)}
            className="w-full pl-10 p-2.5 border border-blue-400 rounded-lg focus:ring-2 focus:ring-[#01AFD1] focus:border-[#01AFD1] outline-none text-sm shadow-sm"
            placeholder={placeholder}
            autoFocus={isOpen && !value}
          />
        </div>
      )}

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading && options.length === STATIC_ROUTES.length ? (
            <div className="p-3 text-sm text-gray-500 text-center">Loading website routes...</div>
          ) : filteredOptions.length === 0 ? (
            <div className="p-3 text-sm text-gray-500 text-center">No matches found</div>
          ) : (
            <ul className="py-1">
              {filteredOptions.map((opt, idx) => (
                <li 
                  key={`${opt.route}-${idx}`}
                  onClick={async () => {
                    if (opt.route.startsWith('CREATE_PACKAGE:')) {
                      const title = opt.label.replace(/^Create Package Page '(.+)'$/, '$1');
                      const section_key = title.toLowerCase().replace(/[^a-z0-9]/g, '_');
                      const view_all_route = `/trips/${section_key}`;
                      
                      try {
                        setLoading(true);
                        const { data, error } = await supabase.from('homepage_sections').insert([
                          {
                            title: title,
                            section_key: section_key,
                            view_all_route: view_all_route,
                            is_active: true,
                            display_style: 'simple',
                            max_cards: 10,
                            display_order: 99
                          }
                        ]).select();
                        
                        if (error) throw error;
                        
                        onChange(view_all_route);
                        setIsOpen(false);
                        setSearchTerm('');
                        fetchDynamicRoutes(); // refresh list
                      } catch (err) {
                        console.error('Error creating package page:', err);
                        alert('Failed to create package page. ' + err.message);
                      } finally {
                        setLoading(false);
                      }
                      return;
                    }

                    onChange(opt.route);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className="px-4 py-2 hover:bg-[#01AFD1]/10 cursor-pointer flex flex-col transition-colors border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                    <span className="text-gray-400">{opt.icon}</span>
                    {opt.label}
                    <span className="ml-auto text-[10px] uppercase tracking-wider bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                      {opt.type}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 ml-6 truncate">{opt.route.startsWith('CREATE_PACKAGE:') ? `/trips/${opt.label.replace(/^Create Package Page '(.+)'$/, '$1').toLowerCase().replace(/[^a-z0-9]/g, '_')}` : opt.route}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
