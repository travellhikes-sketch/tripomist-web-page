import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function ContactUs() {
  return (
    <div className="bg-surface text-on-surface antialiased font-body-md min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Video/Image Banner */}
      <section className="relative w-full h-[50vh] min-h-[400px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80"
          alt="Contact Us"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        <div className="absolute bottom-10 left-0 right-0 z-10 flex flex-col items-center justify-end px-4">
          <h1 className="text-white text-3xl md:text-5xl font-bold text-center tracking-tight">
            Contact Us
          </h1>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-12">
        <h2 className="text-3xl font-bold text-on-surface mb-4 uppercase">Contact Us</h2>
        
        <p className="text-[#3e4850] text-lg mb-8 max-w-4xl">
          Get in Touch with TripoMist! We would love to hear from you! Whether you're looking to plan your next unforgettable adventure or need more information about our services, our team at TripoMist is here to help. Reach out to us through the following channels:
        </p>

        <div className="space-y-3 mb-8 text-[#3e4850] text-[15px] leading-relaxed">
          <p>
            <strong>Address</strong><br />
            New Kondli, Mayur Vihar Phase-3, Delhi 110096, India.
          </p>
          <p>
            <strong>Email:</strong> <a href="mailto:info@tripomist.com" className="text-[#006591] hover:underline">info@tripomist.com</a>
          </p>
          <p>
            <strong>Phone:</strong> <a href="tel:+919990802608" className="text-[#3e4850] hover:underline">+91 9990802608</a>
          </p>
          <p className="pt-2">We look forward to assisting you on your next travel journey!</p>
        </div>

        <div className="flex gap-3">
          {/* Instagram */}
          <a href="https://www.instagram.com/travellhikes?igsh=dDIxcmJvbmRkemlj" className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center hover:opacity-90" target="_blank" rel="noopener noreferrer">
             <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/instagram.svg" alt="Instagram" className="w-4 h-4 filter invert" />
          </a>
          {/* Facebook */}
          <a href="https://www.facebook.com/share/1BWhe7V5V3/" className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center hover:opacity-90" target="_blank" rel="noopener noreferrer">
             <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/facebook.svg" alt="Facebook" className="w-4 h-4 filter invert" />
          </a>
          {/* WhatsApp */}
          <a href="https://wa.me/919990802608" className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center hover:opacity-90" target="_blank" rel="noopener noreferrer">
             <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/whatsapp.svg" alt="WhatsApp" className="w-4 h-4 filter invert" />
          </a>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default ContactUs
