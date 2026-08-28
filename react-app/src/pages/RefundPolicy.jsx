import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function RefundPolicy() {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-gray-800">
      <Navbar />
      
      <main className="flex-grow max-w-4xl mx-auto w-full px-6 py-16 md:py-24 mt-20">
        <h1 className="text-4xl md:text-5xl font-bold mb-12 text-gray-900 leading-tight">
          Cancellation & Refund Policy
        </h1>

        <div className="prose prose-lg text-gray-700 max-w-none leading-relaxed space-y-6">
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
