import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import PackageCard from '../components/PackageCard';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function ExploreDepartment() {
  const { slug } = useParams();
  const [department, setDepartment] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFullDesc, setShowFullDesc] = useState(false);

  useEffect(() => {
    const fetchDepartmentData = async () => {
      setLoading(true);
      try {
        // Fetch department
        const { data: deptData, error: deptError } = await supabase
          .from('explore_departments')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .single();

        if (deptError || !deptData) {
          setDepartment(null);
          return;
        }
        setDepartment(deptData);

        // Fetch packages
        const { data: placements, error: placeErr } = await supabase
          .from('package_placements')
          .select('package_id')
          .eq('placement_type', 'explore_department')
          .eq('placement_id', deptData.id);

        if (placements && placements.length > 0) {
          const packageIds = placements.map(p => p.package_id);
          const { data: pkgData, error: pkgErr } = await supabase
            .from('Pakage')
            .select('*')
            .in('id', packageIds)
            .eq('status', 'active');
          
          if (pkgData) {
            setPackages(pkgData);
          }
        } else {
          setPackages([]);
        }
      } catch (error) {
        console.error('Error fetching department:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartmentData();
  }, [slug]);

  useEffect(() => {
    if (department) {
      document.title = `${department.title} - TripoMist`;
    }
  }, [department]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Department Not Found</h1>
        <p className="text-gray-600 mb-8">The section you are looking for does not exist or has been removed.</p>
        <Link to="/" className="bg-[#01AFD1] text-white px-6 py-3 rounded-full font-semibold hover:bg-opacity-90 transition">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow pb-20">
        {/* Hero Section */}
      {department.hero_banner_url && (
        <div className="relative w-full h-[40vh] md:h-[50vh] lg:h-[60vh] overflow-hidden">
          {department.hero_media_type === 'video' ? (
            <video 
              src={department.hero_banner_url}
              autoPlay loop muted playsInline
              className="absolute top-0 left-0 w-full h-full object-cover"
            />
          ) : (
            <img 
              src={department.hero_banner_url} 
              alt={department.title} 
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white text-center uppercase tracking-wide">
              {department.title}
            </h1>
            {department.subtitle && (
              <p className="text-white/90 text-lg md:text-xl mt-4 text-center max-w-2xl">
                {department.subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Title if no Hero */}
      {!department.hero_banner_url && (
        <div className="bg-[#01AFD1] py-12 md:py-20 text-center px-4">
          <h1 className="text-3xl md:text-5xl font-bold text-white uppercase tracking-wide">
            {department.title}
          </h1>
          {department.subtitle && (
            <p className="text-white/90 text-lg mt-4 max-w-2xl mx-auto">
              {department.subtitle}
            </p>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12">
        {/* About Section */}
        {department.description && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About {department.title}</h2>
            <div className="text-gray-700 text-base md:text-lg leading-relaxed whitespace-pre-wrap">
              {showFullDesc ? department.description : department.description.slice(0, 300) + (department.description.length > 300 ? '...' : '')}
            </div>
            {department.description.length > 300 && (
              <button 
                onClick={() => setShowFullDesc(!showFullDesc)}
                className="mt-3 text-[#01AFD1] font-semibold hover:underline"
              >
                {showFullDesc ? 'Read Less' : 'Read More'}
              </button>
            )}
          </div>
        )}

        {/* Packages Grid */}
        {packages.length > 0 ? (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Explore Packages</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {packages.map(pkg => (
                <PackageCard destination={pkg.destination} state={pkg.state}  key={pkg.id} pkg={pkg} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-lg">No packages currently available for this section.</p>
          </div>
        )}
      </div>
      </div>
      <Footer />
    </div>
  );
}

export default ExploreDepartment;
