import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function TermsConditions() {
  return (
    <div className="bg-surface text-on-surface antialiased font-body-md min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Video/Image Banner */}
      <section className="relative w-full h-[50vh] min-h-[400px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80"
          alt="Terms & Conditions"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        <div className="absolute bottom-10 left-0 right-0 z-10 flex flex-col items-center justify-end px-4">
          <h1 className="text-white text-3xl md:text-5xl font-bold text-center tracking-tight">
            Terms & Conditions
          </h1>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-grow max-w-4xl mx-auto w-full px-6 py-12">
        <div className="bg-white border border-[#bec8d2]/30 rounded-2xl p-8 md:p-12 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#006591]"></div>
          
          <h1 className="text-3xl font-bold mb-8 uppercase text-on-surface">Terms & Conditions</h1>

          <div className="space-y-6 text-[#3e4850] leading-relaxed">
            <p>These Terms and Conditions (“Agreement”) constitute a legally binding contract between you (“User” or “You”) and TripoMist, governing your access to and use of the website <a href="http://www.tripomist.com" className="text-primary hover:underline">www.tripomist.com</a> (“Website”) and the services provided thereon.</p>
            <p>By accessing, browsing, or using the Website or availing any services offered by TripoMist, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree, you must refrain from using the Website or availing our services.</p>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">1. User Agreement</h2>
              <p>TripoMist operates from:<br />
              New Kondli, Mayur Vihar Phase-3, Delhi – 110096, India.</p>
              <p className="mt-2">The Website facilitates bookings for travel-related services including, but not limited to, accommodation, adventure activities, holiday packages, and transportation services across India. Certain services may be provided by independent third-party vendors (“Service Providers”), and TripoMist acts solely as a facilitator in such cases.</p>
              <p className="mt-2">These Terms apply to all services offered by TripoMist. Some services may be subject to additional service-specific terms, which shall prevail in the event of any conflict with this Agreement.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">2. Acceptance and Modification of Terms</h2>
              <p>Use of TripoMist's services constitutes unconditional acceptance of this Agreement and all related policies.</p>
              <p className="mt-2">TripoMist reserves the right to amend, modify, or update these Terms, the Privacy Policy, or any service-related conditions at any time without prior notice. Users are advised to review these Terms periodically.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">3. Booking and Confirmation</h2>
              <p>All bookings are considered confirmed only upon receipt of full payment and explicit acceptance by TripoMist.</p>
              <p className="mt-2">Users are responsible for checking their registered email address (including spam/junk folders) or contacting TripoMist's support team to verify booking confirmation.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">4. Delivery of Services</h2>
              <p>Booking confirmations and service details shall be communicated via email and/or WhatsApp using the contact information provided by the User.</p>
              <p className="mt-2">TripoMist shall not be responsible for failure or delay in service delivery arising from inaccurate, incomplete, or incorrect user details.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">5. Assumption of Risk and Liability Waiver</h2>
              <p>By participating in any trip, trek, or activity arranged by TripoMist, the User voluntarily assumes all risks associated with such participation, whether known or unknown.</p>
              <p className="mt-2">TripoMist, including its owners, employees, affiliates, officers, directors, agents, and volunteers, shall not be liable for any injury, loss, damage, accident, delay, or expense arising directly or indirectly from participation in any activity or service.</p>
              <p className="mt-2">The User agrees to indemnify and hold harmless TripoMist against any claims arising from their conduct or omissions during the trip, including claims involving minors or accompanying third parties.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">6. Personal Belongings and Refund Policy</h2>
              <p>TripoMist shall not be responsible for loss, theft, or damage to personal belongings including cash, electronics, or vehicles.</p>
              <p className="mt-2">In the event a participant voluntarily withdraws from a trip before completion, no refund shall be provided. Any assistance offered for early return shall be at TripoMist's discretion and at the participant's sole expense.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">7. Force Majeure</h2>
              <p>TripoMist shall not be liable for failure or delay in performance caused by events beyond its reasonable control, including but not limited to natural disasters, extreme weather, strikes, pandemics, government restrictions, or transportation disruptions.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">8. Intellectual Property Rights</h2>
              <p>All content on the Website, including text, graphics, images, videos, logos, and software, is the property of TripoMist or its licensors and is protected under applicable copyright and trademark laws.</p>
              <p className="mt-2">Unauthorized reproduction, modification, distribution, or commercial use of such content is strictly prohibited.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">9. User Conduct</h2>
              <p>Users agree not to upload, post, or transmit any content that:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Violates intellectual property rights</li>
                <li>Is unlawful, defamatory, or harmful</li>
                <li>Infringes upon third-party rights</li>
              </ul>
              <p className="mt-2">Violation of this clause may result in immediate termination of services and legal action.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">10. Termination</h2>
              <p>TripoMist reserves the right, at its sole discretion and without prior notice, to suspend or terminate a User's access to the Website and services for reasons including but not limited to:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Breach of these Terms</li>
                <li>Non-payment</li>
                <li>Requests from legal or regulatory authorities</li>
              </ul>
              <p className="mt-2">Upon termination, all User rights under this Agreement shall cease immediately.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">11. Governing Law and Jurisdiction</h2>
              <p>This Agreement shall be governed by and construed in accordance with the laws of India.</p>
              <p className="mt-2">All disputes shall be subject to the exclusive jurisdiction of the competent courts of Delhi, India.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">12. Contact Information</h2>
              <p>For any queries, complaints, or legal correspondence, please contact:</p>
              <div className="bg-[#faf8ff] rounded-lg p-4 mt-2 border border-[#bec8d2]/30 text-on-surface">
                <strong>TripoMist</strong><br />
                New Kondli, Mayur Vihar Phase-3<br />
                Delhi – 110096, India<br /><br />
                Email: info@tripomist.com<br />
                Phone: +91 9990802608<br />
                Website: <a href="http://www.tripomist.com" className="text-primary hover:underline">www.tripomist.com</a>
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
