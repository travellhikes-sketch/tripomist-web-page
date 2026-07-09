import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../utils/supabaseClient'

function Checkout() {
  const [searchParams] = useSearchParams()

  const tripDetailsMap = {
    "Spiti Valley Expedition": {
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDiD2GO7fIb1ciUdWe0odOedfkhJIm1ur64B1iKghZ8eMdF66RoOvQDTrZz1L1nfURfVdMroAzsjyFtv85EjcF8NXBkccIFhdalQolBp9Yar92MT8MtrG9wQGjuK5B7wctNIUhR54TEU7PYNv323Svs0dPfNfV6sfFdjHZinMcri0e9lDmEaHhHTP1F5YA25LoETYvVR1Dnn-8UNP4ShswwHgnmwn3Pw1YqRx1ECDm16ijYYriT-jcGpT9--pyJ_OQkKTc7lwXlnByS",
      base: 21500,
      gst: 3870,
      disc: 371
    },
    "Ladakh Himalayan Expedition": {
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAj_2vbbw_s3xz1DiSwdLIPB91UjIk6PDZxdsBnYm814_77Jzqvfd2kWMUeOvj3AEjF3S4r4H15YwByYU97r8Fu7ILdgtSJ7U5xniKZmkdCoaFd_qnmf7-3V7Arh2PPk6Q87ghzBZjDLQe2VR7QRLwWpmocIiBZeT0Jfr7z12eP6njmtr_SiXnTl4Xo5Kodp5oHyjSeZ-7Z8cS6quHT4VhEBpHASzD0tOUoSMVb_xNsQhzdUiwWoLW4I37lVfc5kAK_dtkYWb5NmnPq",
      base: 18900,
      gst: 3402,
      disc: 303
    },
    "The Ultimate Ladakh Expedition": {
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAj_2vbbw_s3xz1DiSwdLIPB91UjIk6PDZxdsBnYm814_77Jzqvfd2kWMUeOvj3AEjF3S4r4H15YwByYU97r8Fu7ILdgtSJ7U5xniKZmkdCoaFd_qnmf7-3V7Arh2PPk6Q87ghzBZjDLQe2VR7QRLwWpmocIiBZeT0Jfr7z12eP6njmtr_SiXnTl4Xo5Kodp5oHyjSeZ-7Z8cS6quHT4VhEBpHASzD0tOUoSMVb_xNsQhzdUiwWoLW4I37lVfc5kAK_dtkYWb5NmnPq",
      base: 21500,
      gst: 3870,
      disc: 371
    },
    "Kashmir Valley Paradise": {
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCoZ_1M6Zk0HMDhTpKzxMQgQnTBWH9nJlDxVZ3z680TUyTZDm2k0r8nZLugA9SsMmSxZwBQNlP0RqL0o_pN3y8oodeLuZrAMK_BT5g3TtjjmMuq2qryknNF_eDajNtaJ0lhkNCoTDd0wvhRvqO6r6FQKYgQY2G1jrrxLxKfk3vfLTyv4stEcsTeJNnx4i_IeZlGcu5QAISZR2l1bfUnCU3NRglStiKpz8VEJh6Ac0yEugDurHd9RpWrIHVqOg_8q7TXhns1RLgQNPd3",
      base: 15500,
      gst: 2790,
      disc: 291
    },
    "Rishikesh Retreat": {
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDoS-vg_XCH-xHOowgbNVmjJoAj5bJzHN-NPmV15QY-39UHQ4IJCCau_MiOWaK22x0EQGXjpHPcG2QGgkKDzSYzBJx8NUxIR9YhsWYoHhlYXkLlrJCpNeIP2t-yraYqChgdzbvZ0nGOLpUJ0VddALLKLT6LTp-ubk4ne5mb3HfmzUjVL-QQSjGtWIWjpx5VSNdg8NsWROo7n0GwTuaQ34eUIF46J9WrGRE7AQv48QIDQEQ00msw8gCETVFWwU1ocB7f_cNGaUtJoHbC",
      base: 4700,
      gst: 846,
      disc: 47
    },
    "Jaipur Heritage": {
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCIbezhhDn6kVeW-bPt5ihoXXxovwztmJdRitP6cpomnc6_qKxsrtuE2LhA1aSGmpzTbQudel1DreoXcgnvtkKQmeiBfKJxvofcpCiS7qc3FXI_lccCF_1b6rvlVhBJtMrR9emJS43N7lV6K_Z7QZdUbbi1FPjn0tzA8AdHDWSxhkSh2XuAh2cU1EryOd0XjSy5tm_OJig6fy7VhWecFwm4iaMhwI5EKYwed_ZTIbb8bKGhuZNTjk3Gy2rmZQ44qUr6PyNBUCW1JWs1",
      base: 5300,
      gst: 954,
      disc: 54
    },
    "Kasol Escape": {
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDgL7yO6p43o1i054rIF_OdRwkt9E0P7hMyeB6NFyOy2o5oP-iEfAu5VOXXj0dJwSfmmHayKsaBdsqjzBCCh6ubtd1OKaawRppWYX17Gzeu0-Sv7lPMFcNqaocrNbrvF17LuiLKZe5DXB9_Kd79Tkt1qu6U2vzOv0I1Q67Lg00tvJ1l0X70b1XkJXKviwSlXqAvAotXrB5taNSnfDXZsS-xo17TS1ugN4jzzPPbD8CO-gdnG6u9TTfVkAoAe41xxdMvAitdhXP0CfY8",
      base: 4300,
      gst: 774,
      disc: 75
    }
  }

  const [activeTrip, setActiveTrip] = useState("Spiti Valley Expedition")
  const [rates, setRates] = useState({ base: 21500, gst: 3870, disc: 371, img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDiD2GO7fIb1ciUdWe0odOedfkhJIm1ur64B1iKghZ8eMdF66RoOvQDTrZz1L1nfURfVdMroAzsjyFtv85EjcF8NXBkccIFhdalQolBp9Yar92MT8MtrG9wQGjuK5B7wctNIUhR54TEU7PYNv323Svs0dPfNfV6sfFdjHZinMcri0e9lDmEaHhHTP1F5YA25LoETYvVR1Dnn-8UNP4ShswwHgnmwn3Pw1YqRx1ECDm16ijYYriT-jcGpT9--pyJ_OQkKTc7lwXlnByS" })
  
  const [travelerName, setTravelerName] = useState('')
  const [travelerEmail, setTravelerEmail] = useState('')
  const [travelerPhone, setTravelerPhone] = useState('')
  
  const [couponCode, setCouponCode] = useState('')
  const [discountAmount, setDiscountAmount] = useState(0)
  const [appliedCoupon, setAppliedCoupon] = useState('')
  const [couponMessage, setCouponMessage] = useState('')
  const [couponStatus, setCouponStatus] = useState('')

  const [showSuccess, setShowSuccess] = useState(false)
  const [bookingId, setBookingId] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setTravelerName(user.user_metadata?.full_name || '')
        setTravelerEmail(user.email || '')
      }
    })
  }, [])

  useEffect(() => {
    const tripParam = searchParams.get('trip')
    const priceParam = searchParams.get('price')

    if (tripParam) {
      const keys = Object.keys(tripDetailsMap)
      const matchedKey = keys.find(k => k.toLowerCase().includes(tripParam.toLowerCase()) || tripParam.toLowerCase().includes(k.toLowerCase()))
      
      if (matchedKey) {
        setActiveTrip(matchedKey)
        const config = tripDetailsMap[matchedKey]
        setRates({
          base: config.base,
          gst: config.gst,
          disc: config.disc,
          img: config.img
        })
      } else {
        setActiveTrip(tripParam)
        if (priceParam) {
          const totalVal = parseInt(priceParam)
          const calcBase = Math.round(totalVal / 1.16)
          const calcGst = Math.round(calcBase * 0.18)
          const calcDisc = Math.round((calcBase + calcGst) - totalVal)
          setRates({
            base: calcBase,
            gst: calcGst,
            disc: calcDisc,
            img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDiD2GO7fIb1ciUdWe0odOedfkhJIm1ur64B1iKghZ8eMdF66RoOvQDTrZz1L1nfURfVdMroAzsjyFtv85EjcF8NXBkccIFhdalQolBp9Yar92MT8MtrG9wQGjuK5B7wctNIUhR54TEU7PYNv323Svs0dPfNfV6sfFdjHZinMcri0e9lDmEaHhHTP1F5YA25LoETYvVR1Dnn-8UNP4ShswwHgnmwn3Pw1YqRx1ECDm16ijYYriT-jcGpT9--pyJ_OQkKTc7lwXlnByS"
          })
        }
      }
    }
  }, [searchParams])

  const billBase = rates.base
  const billGst = rates.gst
  const billTotal = (billBase + billGst) - discountAmount

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase()
    if (code === 'EARLYBIRD') {
      setDiscountAmount(2000)
      setAppliedCoupon(code)
      setCouponMessage("Coupon applied successfully!")
      setCouponStatus("success")
    } else if (code === "") {
      setCouponMessage("Please enter a coupon code.")
      setCouponStatus("error")
    } else {
      setCouponMessage("Invalid coupon code.")
      setCouponStatus("error")
    }
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
      description: `Booking for ${activeTrip}`,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAf4iPOLD4TW-emcX7qi8W7qPZhFbm5OzAQitvDsMARyOfBuAo9ztt29roRULWmZnSZXWDU9C66-5CEUsII9ClNmyCllVfZSQsk_Zh8SNMinjoMc_fWjzIKKChJB0UTFRB6QTigHPgLb0E2DZsOlp_JhvJp0lXnbSsTzGVqfLBMNk-0_rDP3tmtkhWYAQN9_F1nRcn8PpFGemDTJHOLelhxsCRyeTqUu0-JvD0GzZAkXaVLereGaQFPqUxJgRLojmOnEGYfiVmgV8Js0WY",
      handler: function (response) {
        // Generate Booking reference ID and attach payment ID
        const randomRef = 'TM-' + Math.floor(100000 + Math.random() * 900000).toString(16).toUpperCase()
        setBookingId(randomRef + ` (Pay ID: ${response.razorpay_payment_id})`)
        setShowSuccess(true)
      },
      prefill: {
        name: travelerName,
        email: travelerEmail,
        contact: travelerPhone
      },
      theme: {
        color: "#006591" // TripoMist primary color
      }
    };
    
    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        alert(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (err) {
      console.error("Razorpay error: ", err);
      alert("Failed to initialize payment gateway. Please try again.");
    }
  }

  return (
    <div className="bg-surface text-on-surface antialiased font-body-md selection:bg-primary-container selection:text-on-primary-container min-h-screen flex flex-col">
      {/* Top Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-outline-variant/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link className="font-headline-md text-headline-md font-bold tracking-tight text-primary flex items-center gap-2 hover:opacity-95" to="/">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            Back to Home
          </Link>
          <span className="text-on-surface-variant font-bold text-sm tracking-widest uppercase text-xs md:text-sm">TripoMist Secure Pay</span>
        </div>
      </header>

      <main className="flex-grow pt-lg pb-xl px-4 md:px-8 max-w-7xl mx-auto w-full">
        {/* Title */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="font-display-lg text-display-lg text-on-surface mb-xs font-bold leading-tight">Payment</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Complete your booking securely.</p>
        </div>

        <form className="grid grid-cols-1 lg:grid-cols-12 gap-margin" onSubmit={handleSubmit}>
          {/* Left panel inputs */}
          <div className="lg:col-span-6 space-y-lg">
            {/* Traveler details */}
            <section className="glass-panel rounded-[1.25rem] p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-container"></div>
              <div className="flex items-center gap-sm mb-6 border-b border-outline-variant/30 pb-3">
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold text-lg md:text-xl">Traveller Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block font-bold text-xs">Primary Traveler Name *</label>
                  <input 
                    required 
                    value={travelerName}
                    onChange={(e) => setTravelerName(e.target.value)}
                    className="input-glass w-full rounded-lg px-4 py-2.5 font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none" 
                    placeholder="First and Last Name" 
                    type="text" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block font-bold text-xs">Email Address *</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[20px]">mail</span>
                    <input 
                      required 
                      value={travelerEmail}
                      onChange={(e) => setTravelerEmail(e.target.value)}
                      className="input-glass w-full rounded-lg pl-[46px] pr-4 py-2.5 font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none" 
                      placeholder="john@example.com" 
                      type="email" 
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block font-bold text-xs">Phone Number *</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[20px]">phone</span>
                    <input 
                      required 
                      value={travelerPhone}
                      onChange={(e) => setTravelerPhone(e.target.value)}
                      className="input-glass w-full rounded-lg pl-[46px] pr-4 py-2.5 font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none" 
                      placeholder="+91 98765 43210" 
                      type="tel" 
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right side billing details */}
          <div className="lg:col-span-6">
            <div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto pr-1 hide-scrollbar">
              <section className="glass-panel rounded-[1.25rem] p-6 flex flex-col gap-6">
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold text-lg border-b border-outline-variant/30 pb-3">Your total bill</h2>
                
                {/* Trip mini info stacked */}
                <div className="space-y-sm">
                  <div className="w-full h-48 rounded-xl bg-surface-container-high overflow-hidden shrink-0">
                    <img alt={activeTrip} className="w-full h-full object-cover" src={rates.img} />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-headline-md text-headline-md text-on-surface font-bold text-xl">{activeTrip}</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-1 mt-1 text-sm">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span> Oct 15 - 20
                    </p>
                  </div>
                </div>

                <div className="h-px bg-outline-variant/30 w-full"></div>

                {/* Breakdowns */}
                <div className="space-y-3 text-xs md:text-sm">
                  <div className="flex justify-between items-center text-on-surface-variant">
                    <span>Base Fare</span>
                    <span>₹{billBase.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-on-surface-variant">
                    <span>Taxes &amp; Fees (18% GST)</span>
                    <span>₹{billGst.toLocaleString('en-IN')}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-primary-container font-semibold pt-1">
                      <span>Promo Code ({appliedCoupon})</span>
                      <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>

                {/* Coupon Code Section */}
                <div className="space-y-xs py-sm border-t border-b border-outline-variant/30 my-xs">
                  <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block font-bold text-xs">Have a Coupon?</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="input-glass flex-grow rounded-lg px-3 py-2 text-sm focus:outline-none placeholder:text-outline" 
                      placeholder="Enter Coupon Code (e.g. EARLYBIRD)" 
                    />
                    <button 
                      type="button" 
                      onClick={handleApplyCoupon}
                      className="bg-primary hover:bg-primary/95 text-white px-4 py-2 rounded-lg font-bold text-sm cursor-pointer transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  {couponMessage && (
                    <p className={`text-xs font-semibold mt-1 ${couponStatus === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {couponMessage}
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-end">
                  <span className="font-headline-md text-headline-md text-on-surface font-bold text-lg">Total</span>
                  <span className="font-display-lg text-display-lg text-primary text-[28px] font-bold">₹{billTotal.toLocaleString('en-IN')}</span>
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant/70 text-center text-[10px]">
                  Prices include all applicable taxes.
                </p>

                {/* Submit button */}
                <button type="submit" className="btn-gradient w-full py-4 rounded-xl font-headline-md text-headline-md font-bold text-[16px] flex justify-center items-center gap-2 cursor-pointer shadow-md">
                  <span className="material-symbols-outlined text-[20px]">lock</span> Pay Securely
                </button>

                {/* Encryption tag */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-2 text-on-surface-variant/60 text-xs">
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                    <span className="font-label-sm text-label-sm uppercase font-bold tracking-wider text-[10px]">256-bit Secure Encryption</span>
                  </div>
                  <Link className="font-label-sm text-label-sm text-primary underline hover:text-primary-container transition-colors text-xs" to="/refund-policy">View Cancellation Policy</Link>
                </div>
              </section>
            </div>
          </div>
        </form>
      </main>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-on-surface/50 backdrop-blur-md"></div>
          <div className="relative bg-white w-full max-w-md rounded-[1.5rem] shadow-2xl p-8 text-center flex flex-col items-center gap-5 z-10">
            <span className="material-symbols-outlined text-6xl text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            <h2 className="font-headline-lg text-headline-lg font-bold text-2xl text-on-surface">Booking Confirmed!</h2>
            
            <div className="bg-surface-container-low p-4 rounded-xl w-full text-left space-y-2 text-sm border border-outline-variant/20">
              <div className="flex justify-between"><span className="text-on-surface-variant font-medium">Trip:</span><strong className="text-on-surface">{activeTrip}</strong></div>
              <div className="flex justify-between"><span className="text-on-surface-variant font-medium">Travelers:</span><strong className="text-on-surface">1 Adult</strong></div>
              <div className="flex justify-between"><span className="text-on-surface-variant font-medium">Booking Reference:</span><strong className="text-primary font-mono uppercase">{bookingId}</strong></div>
              <div className="flex justify-between"><span className="text-on-surface-variant font-medium">Total Paid:</span><strong className="text-on-surface">₹{billTotal.toLocaleString('en-IN')}</strong></div>
            </div>
            
            <p className="text-on-surface-variant text-sm text-center">A confirmation email has been sent to <strong>{travelerEmail}</strong>. You'll receive your WhatsApp group invite 48 hours prior to departures.</p>
            
            <Link to="/" className="w-full bg-primary hover:opacity-95 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">home</span> Back to Homepage
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default Checkout
