import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function PrivacyPolicy() {
  return (
    <div className="bg-surface text-on-surface antialiased font-body-md min-h-screen flex flex-col">
      <Navbar />
      
      {/* Grey Banner */}
      <div className="bg-gray-300 py-16 text-center w-full">
        <h1 className="font-display-lg text-4xl md:text-5xl font-bold text-white uppercase tracking-wider">Privacy Policy</h1>
      </div>

      {/* Main Content */}
      <main className="flex-grow max-w-4xl mx-auto w-full px-6 py-12">
        <div className="bg-white border border-[#bec8d2]/30 rounded-2xl p-8 md:p-12 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#006591]"></div>
          
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-xs text-[#3e4850] mb-8">Last Updated: July 9, 2026</p>

          <div className="space-y-6 text-[#3e4850] leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">1. Introduction</h2>
              <p>Welcome to TripoMist ("we," "our," "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy describes how we collect, use, and share your information when you visit our website or book trip packages with us.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">2. Information We Collect</h2>
              <p>We collect personal information that you voluntarily provide to us when you register on our website, make an enquiry, or complete a booking. This information includes:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Personal details:</strong> Name, age, gender.</li>
                <li><strong>Contact details:</strong> Email address, mobile phone number, WhatsApp number.</li>
                <li><strong>Billing details:</strong> Address and transaction details. Payment methods details are directly collected by our secure payment gateway partner (Razorpay).</li>
                <li><strong>Trip preferences:</strong> Booking details, medical history (for extreme treks/expeditions if required), emergency contact details.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">3. How We Use Your Information</h2>
              <p>We use the collected information for the following purposes:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>To process your bookings and confirmation vouchers.</li>
                <li>To communicate with you regarding your upcoming departures, changes in itinerary, or requirements.</li>
                <li>To facilitate payments via Razorpay.</li>
                <li>To share required coordination details with hotels, local tour Kaptains, and transportation operators.</li>
                <li>To comply with regulatory or legal requirements.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">4. Data Security</h2>
              <p>We implement appropriate technical and organizational security measures to protect your personal data from unauthorized access, loss, or alteration. All payments are processed using industry-standard SSL encryption through our partner, Razorpay. We do not store credit card, debit card, or banking credentials on our servers.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">5. Data Sharing with Third Parties</h2>
              <p>We share information only to the extent necessary to deliver the services. This includes hotels, travel guides/Kaptains, adventure partners, and payment processors. We do not sell, rent, or trade your personal data with third-party marketers.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">6. Cookies & Tracking Technologies</h2>
              <p>We may use cookies and similar tracking technologies to analyze site traffic, improve user interface, and customize your experience. You can manage cookie settings in your browser at any time.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">7. Your Rights</h2>
              <p>You have the right to request access to your personal data, request corrections, or request deletion of your information from our active databases by emailing us. Please note that certain booking details must be retained for legal/tax accounting purposes.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">8. Contact Us & Grievances</h2>
              <p>If you have any questions or concerns about this policy or our data practices, please contact us at:</p>
              <div className="bg-[#faf8ff] rounded-lg p-4 mt-2 border border-[#bec8d2]/30 text-on-surface">
                <strong>TripoMist Travel Agency</strong><br />
                Email: <a href="mailto:info@tripomist.com" className="text-[#006591] hover:underline">info@tripomist.com</a><br />
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

export default PrivacyPolicy
