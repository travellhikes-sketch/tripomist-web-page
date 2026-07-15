import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  const companyLinks = [
    { label: 'About Us', href: '/about' },
    { label: 'Cancellation & Refund', href: '/refund-policy' },
    { label: 'Terms & Conditions', href: '/terms-conditions' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Contact Us', href: '/contact' },
  ];

  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant/30 text-on-surface w-full mt-auto">
      <div className="container mx-auto grid grid-cols-1 gap-8 px-4 py-16 md:grid-cols-2 lg:grid-cols-4 lg:gap-12 max-w-7xl">
        
        {/* Column 1: Company Info */}
        <div className="flex flex-col items-start gap-4">
          <Link className="flex items-center gap-3 no-underline text-primary" to="/">
            <img 
              src="/logo.png" 
              alt="TripoMist Logo" 
              className="h-10 w-10 object-contain rounded-full shadow-sm" 
            />
            <span className="text-xl font-bold font-headline-md tracking-tight">TripoMist</span>
          </Link>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Creating extraordinary adventures, from mountain trails to dream destinations, designed for explorers who seek more than just a trip.
          </p>
        </div>

        {/* Column 2: Company */}
        <div className="md:justify-self-start lg:justify-self-center">
          <h3 className="mb-4 text-base font-bold text-on-surface">Company</h3>
          <ul className="space-y-3 p-0 m-0 list-none">
            {companyLinks.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.href}
                  className="text-sm font-medium text-on-surface-variant transition-colors hover:text-primary no-underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Contact Us */}
        <div className="md:justify-self-start lg:justify-self-center">
          <h3 className="mb-4 text-base font-bold text-on-surface">Contact Us</h3>
          <ul className="space-y-3 p-0 m-0 list-none text-sm text-on-surface-variant font-medium">
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary shrink-0">location_on</span>
              <span>New Kondli, Mayur Vihar Phase-3, Delhi 110096</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary shrink-0">mail</span>
              <a href="mailto:info@tripomist.com" className="hover:text-primary transition-colors text-inherit no-underline">
                info@tripomist.com
              </a>
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary shrink-0">call</span>
              <a href="tel:+919990802608" className="hover:text-primary transition-colors text-inherit no-underline">
                9990802608
              </a>
            </li>
          </ul>
        </div>

        {/* Column 4: Follow Us */}
        <div className="md:justify-self-start lg:justify-self-center">
          <h3 className="mb-4 text-base font-bold text-on-surface">Follow Us</h3>
          <div className="flex items-center gap-4">
            {/* WhatsApp */}
            <a href="https://wa.me/919990802608" className="w-12 h-12 rounded-full bg-[#25D366] hover:bg-[#20b858] flex items-center justify-center hover:scale-105 transition-transform shadow-sm" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
              <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/whatsapp.svg" alt="WhatsApp" className="w-6 h-6 filter invert" />
            </a>
            {/* Instagram */}
            <a href="https://www.instagram.com/travellhikes?igsh=dDIxcmJvbmRkemlj" className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center hover:scale-105 transition-transform shadow-sm" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/instagram.svg" alt="Instagram" className="w-6 h-6 filter invert" />
            </a>
            {/* Facebook */}
            <a href="https://www.facebook.com/share/1BWhe7V5V3/" className="w-12 h-12 rounded-full bg-[#1877F2] hover:bg-[#1565c0] flex items-center justify-center hover:scale-105 transition-transform shadow-sm" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/facebook.svg" alt="Facebook" className="w-6 h-6 filter invert" />
            </a>
          </div>
        </div>

      </div>

      <div className="border-t border-outline-variant/30 mt-8 py-6">
        <div className="container mx-auto max-w-7xl px-4 text-center">
          <p className="font-body-sm text-sm text-on-surface-variant m-0">
            TripoMist © {new Date().getFullYear()} All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
