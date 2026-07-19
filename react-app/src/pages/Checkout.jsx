import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import BookingModal from '../components/BookingModal'

export default function Checkout() {
  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState([])
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)

  useEffect(() => {
    const storedCart = localStorage.getItem('cart')
    if (storedCart) {
      setCartItems(JSON.parse(storedCart))
    }
  }, [])

  const subTotal = cartItems.reduce((acc, item) => acc + item.total, 0)
  const gst = Math.round(subTotal * 0.05) // 5% GST
  const convenienceFee = 0
  const billTotal = subTotal + gst + convenienceFee
  const totalTravellers = cartItems.reduce((acc, item) => acc + item.travellers, 0)

  const handleBookNow = () => {
    setIsBookingModalOpen(true)
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest font-sans">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 md:py-12 mt-20">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Checkout</h1>
          <p className="text-gray-500 mt-2">Review your packages before confirming your booking.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Cart Items */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {cartItems.length > 0 ? (
              cartItems.map((item, index) => (
                 <div key={index} className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-6">
                   {item.image && (
                     <div className="w-full sm:w-32 h-32 rounded-xl overflow-hidden shrink-0">
                       <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                     </div>
                   )}
                   <div className="flex-1">
                     <Link to={`/itinerary/${item.slug || item.title.toLowerCase().replace(/ /g, '-')}`} className="hover:underline">
                       <h3 className="text-xl font-bold text-[#136b8a] mb-2">{item.title}</h3>
                     </Link>
                     <p className="text-gray-600 text-sm mb-4">Duration: {item.duration}</p>
                     <div className="flex justify-between items-center text-sm font-semibold">
                       <span>{item.travellers} Traveller(s)</span>
                       <span className="text-[#136b8a] text-lg">₹{item.total.toLocaleString()}</span>
                     </div>
                   </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 text-center">
                <p className="text-gray-500 mb-4">Your cart is empty.</p>
                <button onClick={() => navigate('/')} className="bg-[#136b8a] text-white px-6 py-2 rounded-xl">Browse Packages</button>
              </div>
            )}
          </div>

          {/* Right Column: Payment Summary */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-[100px] bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
              
              <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Summary</h2>
              
              <div className="space-y-3 mb-6 border-b border-gray-100 pb-6">
                <div className="flex justify-between text-gray-600 font-medium text-sm">
                  <span>Subtotal ({cartItems.length} Packages)</span>
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
                onClick={handleBookNow}
                disabled={cartItems.length === 0}
                className="w-full bg-[#136b8a] hover:bg-[#0f556e] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98] text-lg"
              >
                Proceed and check out
              </button>

            </div>
          </div>
        </div>
      </main>
      
      <BookingModal 
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        tripTitle={cartItems.length === 1 ? cartItems[0].title : "Multiple Packages"}
        price={billTotal}
        travellers={totalTravellers}
        navigate={navigate}
        packageId={cartItems.length === 1 ? cartItems[0].slug : null}
        destination={cartItems.length === 1 ? cartItems[0].destination || cartItems[0].title : "Multiple Destinations"}
        costings={null}
      />
      
      <Footer />
    </div>
  )
}
