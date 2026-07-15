import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../utils/supabaseClient'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function Checkout() {
  const [searchParams] = useSearchParams()

  const [activeTrip, setActiveTrip] = useState("Your Selected Trip")
  const [basePrice, setBasePrice] = useState(24999) // default Quad sharing price
  const [sharingType, setSharingType] = useState('quad') // quad | triple | double
  const [travellers, setTravellers] = useState(1)
  
  const [travelerName, setTravelerName] = useState('')
  const [travelerEmail, setTravelerEmail] = useState('')
  const [travelerPhone, setTravelerPhone] = useState('')
  const [travelerDate, setTravelerDate] = useState('')
  
  const [showSuccess, setShowSuccess] = useState(false)
  const [bookingId, setBookingId] = useState('')

  useEffect(() => {
    const tripParam = searchParams.get('trip')
    const priceParam = searchParams.get('price')
    const nameParam = searchParams.get('name')
    const emailParam = searchParams.get('email')
    const phoneParam = searchParams.get('phone')
    const dateParam = searchParams.get('date')

    if (tripParam) setActiveTrip(tripParam)
    if (priceParam) setBasePrice(parseInt(priceParam))
    if (nameParam) setTravelerName(nameParam)
    if (emailParam) setTravelerEmail(emailParam)
    if (phoneParam) setTravelerPhone(phoneParam)
    if (dateParam) setTravelerDate(new Date(dateParam).toLocaleDateString())
  }, [searchParams])

  // Pricing Logic
  const quadPrice = basePrice;
  const triplePrice = basePrice + 2000;
  const doublePrice = basePrice + 5000;

  const currentPersonPrice = sharingType === 'quad' ? quadPrice : sharingType === 'triple' ? triplePrice : doublePrice;
  const subTotal = currentPersonPrice * travellers;
  const gst = Math.round(subTotal * 0.05); // 5% GST
  const convenienceFee = 0;
  const billTotal = subTotal + gst + convenienceFee;

  const handleSharingSelect = (type) => {
    setSharingType(type);
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_TBICP09xzQRaAw"
    const amountInPaise = billTotal * 100
    
    const options = {
      key: razorpayKey,
      amount: amountInPaise.toString(),
      currency: "INR",
      name: "TripoMist",
      description: `Payment for ${activeTrip} (${sharingType} sharing)`,
      image: "https://tripo-mist-v2.vercel.app/logo.png",
      handler: function (response) {
        setBookingId(response.razorpay_payment_id)
        setShowSuccess(true)
      },
      prefill: {
        name: travelerName,
        email: travelerEmail,
        contact: travelerPhone
      },
      theme: { color: "#136b8a" }
    }
    
    if (window.Razorpay) {
      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', function (response){
        alert("Payment failed: " + response.error.description)
      })
      rzp.open()
    } else {
      alert("Payment gateway is loading, please try again in a moment.")
    }
  }

  useEffect(() => {
    if (!window.Razorpay) {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      document.body.appendChild(script)
    }
  }, [])

  if (showSuccess) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-4 pt-32 pb-20">
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 p-8 md:p-12 text-center max-w-lg w-full animate-scale-in">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
              <span className="material-symbols-outlined text-4xl font-bold">check</span>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Booking Confirmed!</h1>
            <p className="text-gray-600 mb-6 font-medium">Thank you for booking with TripoMist. Your adventure awaits.</p>
            <div className="bg-gray-50 rounded-2xl p-4 mb-8 border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Booking ID</p>
              <p className="font-mono font-bold text-gray-900 text-lg">{bookingId || 'TRP-892374'}</p>
            </div>
            <Link to="/profile" className="inline-block bg-[#136b8a] hover:bg-[#0f556e] text-white font-bold px-8 py-3.5 rounded-xl transition-colors w-full">
              Go to Profile
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <Navbar />
      <main className="flex-grow pt-32 pb-20 px-4 md:px-8 lg:px-20 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Checkout</h1>
          <p className="text-gray-500 font-medium">Complete your booking for {activeTrip}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Sharing Options & Traveller Info */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Occupancy according to your requirement,</h2>
              <p className="text-gray-500 text-sm font-medium mb-6"></p>
              
              <div className="flex flex-col gap-4">
                {/* Quad Sharing */}
                <div 
                  onClick={() => handleSharingSelect('quad')}
                  className={`border-2 rounded-2xl p-4 md:p-6 cursor-pointer flex justify-between items-center transition-all ${sharingType === 'quad' ? 'border-[#136b8a] bg-[#eff6f9]' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">Quad Sharing</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 font-medium text-sm">₹{quadPrice.toLocaleString()} / Person</span>
                      <span className="line-through text-gray-400 text-xs">₹{(quadPrice + 3000).toLocaleString()}</span>
                    </div>
                  </div>
                  {sharingType === 'quad' && (
                    <div className="w-6 h-6 rounded-full bg-[#136b8a] flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                    </div>
                  )}
                </div>

                {/* Triple Sharing */}
                <div 
                  onClick={() => handleSharingSelect('triple')}
                  className={`border-2 rounded-2xl p-4 md:p-6 cursor-pointer flex justify-between items-center transition-all ${sharingType === 'triple' ? 'border-[#136b8a] bg-[#eff6f9]' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">Triple Sharing</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 font-medium text-sm">₹{triplePrice.toLocaleString()} / Person</span>
                      <span className="line-through text-gray-400 text-xs">₹{(triplePrice + 3000).toLocaleString()}</span>
                    </div>
                  </div>
                  {sharingType === 'triple' && (
                    <div className="w-6 h-6 rounded-full bg-[#136b8a] flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                    </div>
                  )}
                </div>

                {/* Double Sharing */}
                <div 
                  onClick={() => handleSharingSelect('double')}
                  className={`border-2 rounded-2xl p-4 md:p-6 cursor-pointer flex justify-between items-center transition-all ${sharingType === 'double' ? 'border-[#136b8a] bg-[#eff6f9]' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">Double Sharing</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 font-medium text-sm">₹{doublePrice.toLocaleString()} / Person</span>
                      <span className="line-through text-gray-400 text-xs">₹{(doublePrice + 3000).toLocaleString()}</span>
                    </div>
                  </div>
                  {sharingType === 'double' && (
                    <div className="w-6 h-6 rounded-full bg-[#136b8a] flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
               <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Booking Details</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                   <input type="text" readOnly value={travelerName} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 text-gray-600" />
                 </div>
                 <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                   <input type="text" readOnly value={travelerEmail} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 text-gray-600" />
                 </div>
                 <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                   <input type="text" readOnly value={travelerPhone} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 text-gray-600" />
                 </div>
                 <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-1">Travel Date</label>
                   <input type="text" readOnly value={travelerDate} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 text-gray-600" />
                 </div>
               </div>
            </div>
          </div>

          {/* Right Column: Payment Summary */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-[100px] bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
              
              <div className="flex gap-4 mb-6 border-b border-gray-100 pb-6">
                <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                  <img src="https://images.unsplash.com/photo-1549257850-25e24bcf0e13?w=400&q=80" alt="Trip" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{activeTrip}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-500 font-medium">
                    <span className="material-symbols-outlined text-[16px]">flight_takeoff</span>
                    Starts at Delhi → Ends at Delhi
                  </div>
                </div>
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Summary</h2>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 font-semibold text-gray-800">
                  No. of Travellers
                </div>
                <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-full px-2 py-1 shadow-sm">
                  <button onClick={() => setTravellers(Math.max(1, travellers - 1))} className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full font-bold transition-colors cursor-pointer">-</button>
                  <span className="font-bold text-gray-900 text-sm w-4 text-center">{travellers}</span>
                  <button onClick={() => setTravellers(travellers + 1)} className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full font-bold transition-colors cursor-pointer">+</button>
                </div>
              </div>

              <div className="space-y-3 mb-6 border-b border-gray-100 pb-6">
                <div className="flex justify-between text-gray-600 font-medium text-sm">
                  <span>₹{currentPersonPrice.toLocaleString()} x {travellers} Guest(s) ({sharingType === 'quad' ? 'Quad' : sharingType === 'triple' ? 'Triple' : 'Double'} Sharing)</span>
                  <span>₹{subTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600 font-medium text-sm">
                  <span>Tax (GST 5%)</span>
                  <span>₹{gst.toLocaleString()}</span>
                </div>
                
              </div>

              <div className="flex justify-between items-end mb-8">
                <div>
                  <span className="font-bold text-gray-900 text-base block mb-0.5">Trip Total</span>
                </div>
                <span className="font-extrabold text-[#136b8a] text-2xl">₹{billTotal.toLocaleString()}</span>
              </div>

              <button 
                onClick={handleSubmit}
                className="w-full bg-[#136b8a] hover:bg-[#0f556e] text-white font-bold py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98] text-lg"
              >
                Book Now
              </button>

            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
