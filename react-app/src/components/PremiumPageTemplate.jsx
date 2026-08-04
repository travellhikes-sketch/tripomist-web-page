import React, { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const PremiumPageTemplate = ({
  title,
  subtitle,
  hero_image_url,
  mobile_banner_image,
  seo_title,
  content,
  children
}) => {
  useEffect(() => {
    if (seo_title) {
      document.title = seo_title;
    } else if (title) {
      document.title = `${title} | TripoMist`;
    }
  }, [seo_title, title]);

  const isHtml = typeof content === 'string';

  const sanitizeHtml = (html) => {
    if (!html) return '';
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
      .replace(/on\w+\s*=\s*'[^']*'/gi, '')
      .replace(/on\w+\s*=\s*\w+/gi, '')
      .replace(/javascript:/gi, '#');
  };

  const renderLegacyContent = (contentObj) => {
    const data = contentObj || {};
    const paragraphs = data.paragraphs || [];
    const sections = data.sections || [];
    const contact = data.contact || null;

    return (
      <div className="space-y-6 text-[#3e4850] text-base md:text-lg leading-relaxed text-left">
        {paragraphs.map((p, idx) => (
          <p key={`p-${idx}`}>{p}</p>
        ))}

        {sections.map((sec, idx) => (
          <section key={`sec-${idx}`} className="mt-8">
            {sec.heading && <h2 className="text-xl font-bold text-gray-900 mb-3">{sec.heading}</h2>}
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

        {contact && (contact.email || contact.phone) && (
          <section className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Contact Information</h2>
            <div className="bg-slate-50 rounded-lg p-4 mt-2 border border-gray-200">
              {contact.email && <div className="mb-1"><strong>Email:</strong> <a href={`mailto:${contact.email}`} className="text-primary hover:underline">{contact.email}</a></div>}
              {contact.phone && <div><strong>Phone:</strong> <a href={`tel:${contact.phone.replace(/\D/g,'')}`} className="text-primary hover:underline">{contact.phone}</a></div>}
            </div>
          </section>
        )}
      </div>
    );
  };

  return (
    <div className="bg-surface-container-lowest text-gray-800 antialiased min-h-screen flex flex-col">
      <Navbar />

      {/* HERO BANNER SECTION (FULL-WIDTH, NO ROUNDING/PADDING) */}
      {hero_image_url ? (
        <section className="relative w-full h-[45vh] md:h-[50vh] min-h-[350px] overflow-hidden bg-black flex-shrink-0">
          <picture>
            {mobile_banner_image ? (
              <source media="(max-width: 640px)" srcSet={mobile_banner_image} />
            ) : (
              <source media="(max-width: 640px)" srcSet={hero_image_url} />
            )}
            <img
              src={hero_image_url}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

          <div className="absolute bottom-10 left-0 right-0 z-10 flex flex-col items-center justify-end px-4">
            <h1 className="text-white text-3xl md:text-5xl font-bold text-center tracking-tight drop-shadow-md select-none">
              {title}
            </h1>
            {subtitle && (
              <p className="text-white/95 text-xs md:text-sm max-w-xl text-center select-none font-medium mt-1 opacity-90">
                {subtitle}
              </p>
            )}
          </div>
        </section>
      ) : (
        /* Fallback section if there is no hero image */
        <div className="w-full h-12 bg-gray-50 border-b border-gray-100" />
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 md:px-12 lg:px-20 py-12">
        <div className="bg-white rounded-2xl p-6 md:p-12 shadow-sm border border-gray-100">
          {/* Fallback title rendering if no banner exists */}
          {!hero_image_url && (
            <div className="mb-10 border-b border-gray-100 pb-8 text-left">
              <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-lg md:text-xl text-gray-500 font-medium leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {content && (
            isHtml ? (
              <div
                className="prose max-w-none text-left text-base md:text-lg leading-relaxed text-[#3e4850]"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
              />
            ) : (
              renderLegacyContent(content)
            )
          )}

          {/* Children components (e.g. reviews page extra grids) */}
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PremiumPageTemplate;
