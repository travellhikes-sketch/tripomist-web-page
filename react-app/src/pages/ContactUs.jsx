import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function ContactUs() {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-gray-800">
      <Navbar />
      
      <main className="flex-grow max-w-4xl mx-auto w-full px-6 py-16 md:py-24 mt-20">
        <h1 className="text-4xl md:text-5xl font-bold mb-12 text-gray-900 leading-tight">
          Contact Us
        </h1>
        
        <div className="prose prose-lg text-gray-700 max-w-none leading-relaxed">
          <p className="text-lg mb-8 max-w-4xl">
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
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default ContactUs
