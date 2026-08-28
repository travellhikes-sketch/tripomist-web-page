import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

function DropdownMenu({ dept, loadingDeptId, packagesMap, packagesPerColumn, setOpenDropdownId }) {
  const dropdownRef = useRef(null);
  const [shift, setShift] = useState(0);

  useEffect(() => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const padding = 16;
      let newShift = 0;
      if (rect.left < padding) {
        newShift = padding - rect.left;
      } else if (rect.right > window.innerWidth - padding) {
        newShift = window.innerWidth - padding - rect.right;
      }
      setShift(newShift);
    }
  }, []);

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full mt-2 w-max max-w-[95vw] md:max-w-[800px] z-[110]"
      style={{ left: '50%', transform: `translateX(calc(-50% + ${shift}px))` }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative"
      >
        {/* Top Caret Pointer */}
        <div 
          className="absolute -top-2 w-4 h-4 bg-white border-t border-l border-gray-100 rotate-45 z-[-1] rounded-sm shadow-[-2px_-2px_4px_rgba(0,0,0,0.02)]"
          style={{ left: `calc(50% - ${shift}px)`, transform: 'translateX(-50%)' }}
        ></div>
        
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-6 max-h-[85vh] overflow-y-auto custom-scrollbar relative">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
          {dept.title}
        </h3>
        
        {loadingDeptId === dept.id ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#01AFD1]"></div>
          </div>
        ) : packagesMap[dept.id] && packagesMap[dept.id].length > 0 ? (
          <div 
            className="grid gap-x-6 gap-y-2 auto-cols-max overflow-x-auto custom-scrollbar" 
            style={{ 
              gridTemplateRows: `repeat(${packagesPerColumn}, minmax(0, 1fr))`,
              gridAutoFlow: 'column'
            }}
          >
            {packagesMap[dept.id].map(pkg => (
              <Link
                key={pkg.id}
                to={`/itinerary/${pkg.slug}`}
                onClick={() => setOpenDropdownId(null)}
                className="flex items-center gap-2.5 group/link py-1 w-56"
              >
                {pkg.image_url || pkg.banner_image ? (
                  <img src={pkg.image_url || pkg.banner_image} alt={pkg.title} className="w-8 h-8 rounded-full object-cover border border-gray-100 flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                  </div>
                )}
                <span className="text-[13px] font-medium text-gray-700 group-hover/link:text-[#01AFD1] transition-colors line-clamp-1 leading-snug">
                  {pkg.title}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500 py-4 text-center">
            No packages assigned yet.
          </div>
        )}
      </div>
      </motion.div>
    </div>
  );
}

function ExploreNavbar() {
  const [departments, setDepartments] = useState([]);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [packagesMap, setPackagesMap] = useState({});
  const [loadingDeptId, setLoadingDeptId] = useState(null);
  const [packagesPerColumn, setPackagesPerColumn] = useState(5);
  const location = useLocation();
  const navRef = useRef(null);
  useEffect(() => {
    const fetchDepartmentsAndSettings = async () => {
      // Fetch departments
      const { data: deptData } = await supabase
        .from('explore_departments')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (deptData) {
        setDepartments(deptData);
      }

      // Fetch site settings
      const { data: settingsData } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value')
        .eq('setting_key', 'seasonal_dropdown_packages_per_column')
        .maybeSingle();

      if (settingsData && settingsData.setting_value) {
        setPackagesPerColumn(parseInt(settingsData.setting_value) || 5);
      }
    };
    fetchDepartmentsAndSettings();
  }, []);

  useEffect(() => {
    // Reset dropdown state on page navigate
    setOpenDropdownId(null);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    };
    
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const fetchPackagesForDepartment = async (deptId) => {
    if (packagesMap[deptId]) return; // already fetched
    
    setLoadingDeptId(deptId);
    try {
      // 1. Get package IDs plotted to this department
      const { data: deptPlacements, error: deptErr } = await supabase
        .from('package_placements')
        .select('package_id')
        .eq('placement_type', 'explore_department')
        .eq('placement_id', deptId);

      if (deptErr) throw deptErr;
      if (!deptPlacements || deptPlacements.length === 0) {
        setPackagesMap(prev => ({ ...prev, [deptId]: [] }));
        return;
      }

      const packageIds = [...new Set(deptPlacements.map(p => p.package_id))];

      // 2. Fetch actual packages
      const { data: packages, error: finalErr } = await supabase
        .from('Pakage')
        .select('id, slug, title, image_url, banner_image')
        .in('id', packageIds)
        .eq('status', 'active');
        
      if (finalErr) throw finalErr;
      setPackagesMap(prev => ({ ...prev, [deptId]: packages || [] }));
    } catch (error) {
      console.error("Error fetching packages for department:", error);
      setPackagesMap(prev => ({ ...prev, [deptId]: [] }));
    } finally {
      setLoadingDeptId(null);
    }
  };

  const handleDepartmentClick = (e, dept) => {
    // Testimonials should just navigate, don't open dropdown
    if (dept.slug === 'testimonials') {
      return; 
    }
    
    e.preventDefault();
    
    if (openDropdownId === dept.id) {
      setOpenDropdownId(null);
    } else {
      setOpenDropdownId(dept.id);
      fetchPackagesForDepartment(dept.id);
    }
  };

  if (departments.length === 0) return null;

  const topLevel = departments.filter(d => !d.parent_id);

  return (
    <div
      id="explore-navbar"
      ref={navRef}
      className="bg-[#01AFD1] border-y border-black/10 overflow-x-auto md:overflow-visible scrollbar-hide transition-all duration-200 z-[100] sticky top-0"
    >
      <div className="flex items-center md:justify-center gap-6 md:gap-8 lg:gap-12 px-4 md:px-12 lg:px-20 min-w-max w-full">
        {topLevel.map(dept => {
          const isDropdownOpen = openDropdownId === dept.id;
          const route = dept.route || `/explore/${dept.slug}`;
          
          return (
            <div key={dept.id} className="relative group/dept py-2">
              <Link 
                to={route} 
                onClick={(e) => handleDepartmentClick(e, dept)}
                className="flex items-center gap-1.5 text-[15px] font-semibold transition-colors py-1 text-white hover:text-white/90"
              >
                {dept.icon && <span className="material-symbols-outlined text-[18px] text-white">{dept.icon}</span>}
                <span className={isDropdownOpen ? 'border-b-[1.5px] border-white' : 'border-b-[1.5px] border-transparent'}>{dept.title}</span>
                {dept.slug !== 'testimonials' && (
                  <span className={`material-symbols-outlined text-[16px] text-white transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                )}
              </Link>
              
              {dept.slug !== 'testimonials' && (
                <AnimatePresence>
                  {isDropdownOpen && (
                    <DropdownMenu dept={dept} loadingDeptId={loadingDeptId} packagesMap={packagesMap} packagesPerColumn={packagesPerColumn} setOpenDropdownId={setOpenDropdownId} />
                  )}
                </AnimatePresence>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ExploreNavbar;
