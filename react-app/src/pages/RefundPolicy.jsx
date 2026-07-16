import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function RefundPolicy() {
  return (
    <div className="bg-surface text-on-surface antialiased font-body-md min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Video/Image Banner */}
      <section className="relative w-full h-[50vh] min-h-[400px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80"
          alt="Cancellation & Refund Policy"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        <div className="absolute bottom-10 left-0 right-0 z-10 flex flex-col items-center justify-end px-4">
          <h1 className="text-white text-3xl md:text-5xl font-bold text-center tracking-tight">
            Cancellation & Refund Policy
          </h1>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-grow max-w-4xl mx-auto w-full px-6 py-12">
        <div className="bg-white border border-[#bec8d2]/30 rounded-2xl p-8 md:p-12 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#006591]"></div>
          
          <h1 className="text-3xl font-bold mb-8 uppercase text-on-surface">Cancellation & Refund</h1>

          <div className="space-y-6 text-[#3e4850] leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">1. Non-Refundable Booking Amount</h2>
              <p>The booking amount paid at the time of reservation is strictly non-refundable under all circumstances.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">2. Non-Cancellable / Non-Amendable Packages</h2>
              <p>All bookings are non-cancellable and non-amendable. In the event of cancellation, modification, or no-show, the entire advance payment shall be retained as cancellation charges.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">3. No-Show & Early Departure</h2>
              <p>No refund shall be provided in case of no-show or if the participant voluntarily leaves the tour before completion.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">4. Unforeseen Circumstances</h2>
              <p>No refund shall be applicable for cancellations arising due to government orders, natural calamities, protests, strikes, weather conditions, or any other unforeseen events.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">5. Activity Cancellation</h2>
              <p>If any activity is cancelled due to circumstances beyond the control of <strong>TripoMist</strong> or its partners, the booking amount shall remain non-refundable.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">6. Trek Cancellation (Last-Minute)</h2>
              <p>If a trek is cancelled due to natural calamities or unforeseen circumstances, participants will be issued a travel voucher equivalent to the booking amount, valid for a period of three (3) months, subject to availability.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">7. Trek Abortion (Midway)</h2>
              <p>If a trek or tour is discontinued midway due to natural calamities or unforeseen circumstances, no refund shall be applicable.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">8. Additional Expenses</h2>
              <p><strong>TripoMist</strong> or its respective third-party operators shall not be liable for any additional expenses incurred by participants due to natural calamities, delays, or unforeseen circumstances, including but not limited to accommodation, transport, or food expenses.</p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default RefundPolicy
