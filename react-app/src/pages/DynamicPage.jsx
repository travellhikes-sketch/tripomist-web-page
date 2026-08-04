import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PremiumPageTemplate from '../components/PremiumPageTemplate';

const DynamicPage = ({ pageKey }) => {
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPageData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('website_pages')
          .select('*')
          .eq('page_key', pageKey)
          .eq('is_active', true)
          .single();

        if (error) {
          if (error.code !== 'PGRST116') console.error('Error fetching page:', error);
          setPageData(null);
        } else {
          setPageData(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPageData();
  }, [pageKey]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-gray-500">The page you are looking for does not exist or is currently inactive.</p>
        </div>
        <Footer />
      </div>
    );
  }

  const { title, subtitle, hero_image_url, mobile_banner_image, content, seo_title } = pageData;

  return (
    <PremiumPageTemplate
      title={title}
      subtitle={subtitle}
      hero_image_url={hero_image_url}
      mobile_banner_image={mobile_banner_image}
      seo_title={seo_title}
      content={content}
    />
  );
};

export default DynamicPage;
