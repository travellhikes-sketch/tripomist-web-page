import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function ExploreNavbar() {
  const [departments, setDepartments] = useState([]);
  const [isHidden, setIsHidden] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const fetchDepartments = async () => {
      const { data } = await supabase
        .from('explore_departments')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (data) {
        setDepartments(data);
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    const handleStickyChange = (e) => {
      setIsHidden(!!e.detail?.isSticky);
    };
    window.addEventListener('packageNavStickyChange', handleStickyChange);
    return () => {
      window.removeEventListener('packageNavStickyChange', handleStickyChange);
    };
  }, []);

  useEffect(() => {
    // Reset hidden state on page navigate
    setIsHidden(false);
  }, [location.pathname]);

  if (departments.length === 0 || isHidden) return null;

  const topLevel = departments.filter(d => !d.parent_id);
  
  const isActive = (path) => {
    if (!path) return false;
    return location.pathname === path;
  };

  return (
    <div className="bg-[#f8f9fa] border-b border-gray-100 overflow-x-auto scrollbar-hide py-2 transition-all duration-200">
      <div className="flex items-center md:justify-center gap-6 md:gap-8 lg:gap-12 px-4 md:px-12 lg:px-20 min-w-max w-full">
        {topLevel.map(dept => {
          const children = departments.filter(d => d.parent_id === dept.id);
          const hasChildren = children.length > 0;
          const route = dept.route || `/explore/${dept.slug}`;
          
          return (
            <div key={dept.id} className="relative group">
              {hasChildren ? (
                <div className={`flex items-center gap-1.5 text-sm font-medium transition-colors cursor-pointer py-1 ${isActive(route) || children.some(c => isActive(c.route || `/explore/${c.slug}`)) ? 'text-[#136b8a] font-bold' : 'text-gray-700 hover:text-[#136b8a]'}`}>
                  {dept.icon && <span className="material-symbols-outlined text-[18px]">{dept.icon}</span>}
                  <span>{dept.title}</span>
                  <span className="material-symbols-outlined text-[16px] group-hover:rotate-180 transition-transform duration-200">expand_more</span>
                </div>
              ) : (
                <Link to={route} className={`flex items-center gap-1.5 text-sm font-medium transition-colors py-1 ${isActive(route) ? 'text-[#136b8a] font-bold' : 'text-gray-700 hover:text-[#136b8a]'}`}>
                  {dept.icon && <span className="material-symbols-outlined text-[18px]">{dept.icon}</span>}
                  <span>{dept.title}</span>
                </Link>
              )}
              
              {hasChildren && (
                <div className="absolute top-full left-0 mt-0 pt-2 min-w-[200px] z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-2">
                    {children.map(child => (
                      <Link 
                        key={child.id} 
                        to={child.route || `/explore/${child.slug}`}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${isActive(child.route || `/explore/${child.slug}`) ? 'bg-[#136b8a]/5 text-[#136b8a] font-bold' : 'text-gray-700 hover:bg-gray-50 hover:text-black'}`}
                      >
                        {child.icon && <span className="material-symbols-outlined text-[16px]">{child.icon}</span>}
                        {child.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ExploreNavbar;
