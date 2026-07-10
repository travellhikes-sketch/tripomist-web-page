import React from 'react'
import { Link } from 'react-router-dom'

function RefundPolicy() {
  return (
    <div className="bg-surface text-on-surface antialiased font-body-md min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-outline-variant/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link className="font-bold tracking-tight text-primary flex items-center gap-2 hover:opacity-95 text-[#006591]" to="/">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            Back to Home
          </Link>
          <span className="text-on-surface-variant font-bold text-sm tracking-widest uppercase text-xs md:text-sm text-[#3e4850]">TripoMist Refunds</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-4xl mx-auto w-full px-6 py-12">
        <div className="bg-white border border-[#bec8d2]/30 rounded-2xl p-8 md:p-12 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#006591]"></div>
          
          <h1 className="text-3xl font-bold mb-2">Refund & Cancellation Policy</h1>
          <p className="text-xs text-[#3e4850] mb-8">Last Updated: July 9, 2026</p>

          <div className="space-y-6 text-[#3e4850] leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">1. Booking & Cancellation Terms</h2>
              <p>Since travel arrangements (accommodations, permits, local guides, and vehicle rentals) are made in advance, any booking cancellation by a traveler incurs fees. The cancellation charges are calculated as a percentage of the total package cost and depend on when the cancellation request is received.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">2. Cancellation Fee Slabs</h2>
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-left border-collapse border border-[#bec8d2]/30 text-sm">
                  <thead>
                    <tr className="bg-[#faf8ff] border-b border-[#bec8d2]/30">
                      <th className="p-3 font-semibold text-on-surface">Cancellation Timeframe</th>
                      <th className="p-3 font-semibold text-on-surface">Refundable Amount</th>
                      <th className="p-3 font-semibold text-on-surface">Cancellation Charges</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[#bec8d2]/20">
                      <td className="p-3">30 days or more before trip departure</td>
                      <td className="p-3 text-emerald-600 font-medium">90% of total trip cost</td>
                      <td className="p-3 text-red-600">10% of total package cost</td>
                    </tr>
                    <tr className="border-b border-[#bec8d2]/20">
                      <td className="p-3">15 to 29 days before trip departure</td>
                      <td className="p-3 text-emerald-600 font-medium">70% of total trip cost</td>
                      <td className="p-3 text-red-600">30% of total package cost</td>
                    </tr>
                    <tr className="border-b border-[#bec8d2]/20">
                      <td className="p-3">7 to 14 days before trip departure</td>
                      <td className="p-3 text-emerald-600 font-medium">50% of total trip cost</td>
                      <td className="p-3 text-red-600">50% of total package cost</td>
                    </tr>
                    <tr>
                      <td className="p-3">Less than 7 days before trip departure</td>
                      <td className="p-3 text-emerald-600 font-medium">No Refund</td>
                      <td className="p-3 text-red-600 font-medium">100% of total package cost</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">3. Force Majeure & Cancellations by TripoMist</h2>
              <p>In the event that TripoMist cancels a trip due to unforeseen circumstances beyond our control (such as heavy snowfall, landslides, road blocks, natural disasters, weather emergencies, or sudden government restrictions/permits withdrawal):</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>We will issue a <strong>Trip Voucher</strong> for the full paid amount, valid for any trip within the next 1 year.</li>
                <li>Alternatively, if a refund is requested, it will be processed after deducting actual expenses already incurred (like non-refundable permit fees or flight bookings).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">4. How to Request a Cancellation</h2>
              <p>To request a cancellation, please email us directly at <a href="mailto:contact@tripomist.com" className="text-[#006591] hover:underline font-semibold">contact@tripomist.com</a> from your registered email address with your booking ID and details. Phone/WhatsApp requests will not be considered official until followed up by email.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-on-surface mb-2">5. Refund Processing Timeline</h2>
              <p>Once a cancellation is approved, the refund is calculated per the policy and initiated back to the original source payment method (e.g. your credit card, debit card, bank account, or UPI app) via our payment gateway partner, <strong>Razorpay</strong>.</p>
              <p className="mt-2">Refunds typically take <strong>5 to 7 working days</strong> to reflect in your account, depending on your bank's processing cycle.</p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#bec8d2]/30 py-6 text-center">
        <p className="text-sm text-[#3e4850]">© 2026 TripoMist. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default RefundPolicy
