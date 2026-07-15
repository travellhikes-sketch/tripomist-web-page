import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function TermsConditions() {
  return (
    <div className="bg-surface text-on-surface antialiased font-body-md min-h-screen flex flex-col">
      <Navbar />
      
      {/* Grey Banner */}
      <div className="bg-gray-300 py-16 text-center w-full">
        <h1 className="font-display-lg text-4xl md:text-5xl font-bold text-white uppercase tracking-wider">Terms & Conditions</h1>
      </div>

      {/* Main Content */}
      <main className="flex-grow max-w-4xl mx-auto w-full px-6 py-12">
        <div className="bg-white border border-[#bec8d2]/30 rounded-2xl p-8 md:p-12 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#006591]"></div>
          
          <h1 className="text-3xl font-bold mb-2">Terms & Conditions</h1>
          <p className="text-xs text-[#3e4850] mb-8">Last Updated: July 9, 2026</p>

          <div className="space-y-6 text-[#3e4850] leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">1. Agreement to Terms</h2>
              <p>By browsing, accessing, or booking any trip or package through TripoMist ("we," "our," "us"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please refrain from using our website or booking our services.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">2. Booking & Payment Policy</h2>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Bookings are confirmed only upon receipt of the full payment or specified advance amount.</li>
                <li>All transactions are processed in Indian Rupees (INR) using secure payment partners (Razorpay).</li>
                <li>Any applicable transaction charges, taxes (GST), or gateway fees are disclosed at checkout.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">3. User Responsibility & Conduct</h2>
              <p>Travelers are expected to behave responsibly and respect local cultures, guidelines, guides, and other travelers during the trips. Any misconduct, damage to property, illegal substance possession, or non-cooperation may lead to immediate termination from the group tour with no refund.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">4. Medical Condition & Safety</h2>
              <p>Our trips (especially mountain expeditions or treks) might require physical fitness. By booking, you represent that you are physically fit and have disclosed any pre-existing medical conditions. TripoMist is not liable for health issues arising during trips.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">5. Limitation of Liability</h2>
              <p>TripoMist coordinates lodging, transportation, and activities with third-party partners. We are not liable for any injuries, delays, accidents, or personal losses caused by third-party services, weather anomalies, road blocks, natural disasters, or government directives.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">6. Intellectual Property</h2>
              <p>All content on the website (logos, design assets, text, photography, and codes) is owned by TripoMist and protected under intellectual property laws. Copying or modifying them without permission is prohibited.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">7. Jurisdiction</h2>
              <p>These terms and conditions are governed by and construed in accordance with the laws of India. Any disputes arising out of bookings or website usage shall be subject to the exclusive jurisdiction of the courts in **New Delhi, India**.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">8. Contact Information</h2>
              <p>For any inquiries regarding these terms, please contact us at:</p>
              <div className="bg-[#faf8ff] rounded-lg p-4 mt-2 border border-[#bec8d2]/30 text-on-surface">
                <strong>TripoMist Travel Agency</strong><br />
                Email: info@tripomist.com<br />
                Phone: +91 9990802608<br />
                Address: New Kondli, Mayur Vihar Phase-3, Delhi 110096, India
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default TermsConditions
