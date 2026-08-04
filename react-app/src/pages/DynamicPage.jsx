import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

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
          if (data.seo_title) document.title = data.seo_title;
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
      <div className="flex flex-col min-h-screen bg-surface-container-lowest">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="flex flex-col min-h-screen bg-surface-container-lowest">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-3xl font-bold text-on-surface mb-2">Page Not Found</h1>
          <p className="text-on-surface-variant">The page you are looking for does not exist or is currently inactive.</p>
        </div>
        <Footer />
      </div>
    );
  }

  const { title, subtitle, hero_image_url, mobile_banner_image, content } = pageData;
  const contentObj = content || {};
  const paragraphs = contentObj.paragraphs || [];
  const sections = contentObj.sections || [];
  const contact = contentObj.contact || null;

  // Use explicit banner fields, fallback to a default
  const finalDesktopBanner = hero_image_url || "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80";
  const finalMobileBanner = mobile_banner_image || finalDesktopBanner;

  // Use title/subtitle for the heading section
  const finalHeading = title;
  const finalSubheading = subtitle;

  return (
    <div className="bg-surface text-on-surface antialiased font-body-md min-h-screen flex flex-col">
      <Navbar />

      {/* Optional Top Banner */}
      <div className="w-full max-w-6xl mx-auto px-4 md:px-6 lg:px-8 pt-6 pb-2">
        <div className="relative w-full h-[250px] md:h-[350px] rounded-[24px] overflow-hidden shadow-md">
          {/* Mobile Banner */}
          <img
            src={finalMobileBanner}
            alt={finalHeading}
            className="md:hidden absolute inset-0 w-full h-full object-cover"
          />
          {/* Desktop Banner */}
          <img
            src={finalDesktopBanner}
            alt={finalHeading}
            className="hidden md:block absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 md:px-8 py-8 md:py-12">
        <div className="bg-white rounded-2xl p-6 md:p-12 shadow-sm border border-gray-100">

          <div className="mb-10 border-b border-gray-100 pb-8 text-left">
            <h1 className="text-3xl md:text-5xl font-bold text-on-surface mb-4 tracking-tight leading-tight">
              {finalHeading}
            </h1>
            {finalSubheading && (
              <p className="text-lg md:text-xl text-gray-500 font-medium leading-relaxed">
                {finalSubheading}
              </p>
            )}
          </div>

          <div className="space-y-6 text-[#3e4850] text-base md:text-lg leading-relaxed text-left">
            {/* Render Paragraphs */}
            {paragraphs.map((p, idx) => (
              <p key={`p-${idx}`}>{p}</p>
            ))}

            {/* Render Sections */}
            {sections.map((sec, idx) => (
              <section key={`sec-${idx}`} className="mt-8">
                {sec.heading && <h2 className="text-xl font-bold text-on-surface mb-3">{sec.heading}</h2>}
                {sec.text && <p className="mb-3">{sec.text}</p>}
                {sec.bullets && sec.bullets.length > 0 && (
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    {sec.bullets.map((b, bIdx) => (
                      <li key={bIdx}>{b}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            {/* Render Contact Block if exists */}
            {contact && (contact.email || contact.phone) && (
              <section className="mt-8">
                <h2 className="text-xl font-bold text-on-surface mb-3">Contact Information</h2>
                <div className="bg-[#faf8ff] rounded-lg p-4 mt-2 border border-[#bec8d2]/30 text-on-surface">
                  {contact.email && <div className="mb-1"><strong>Email:</strong> <a href={`mailto:${contact.email}`} className="text-primary hover:underline">{contact.email}</a></div>}
                  {contact.phone && <div><strong>Phone:</strong> <a href={`tel:${contact.phone.replace(/\D/g,'')}`} className="text-primary hover:underline">{contact.phone}</a></div>}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DynamicPage;
