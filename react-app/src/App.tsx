import React, { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Domestic from './pages/Domestic'
import International from './pages/International'
import Review from './pages/Review'
import ItinerarySpiti from './pages/ItinerarySpiti'
import Checkout from './pages/Checkout'
import Cart from './pages/Cart'
import PrivacyPolicy from './pages/PrivacyPolicy'
import RefundPolicy from './pages/RefundPolicy'
import ShippingPolicy from './pages/ShippingPolicy'
import TermsConditions from './pages/TermsConditions'
import ContactUs from './pages/ContactUs'
import Login from './pages/Login'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import Uttarakhand from './pages/Uttarakhand'
import Himachal from './pages/Himachal'
import Kashmir from './pages/Kashmir'
import Rajasthan from './pages/Rajasthan'
import Meghalaya from './pages/Meghalaya'
import Ladakh from './pages/Ladakh'
import Spiti from './pages/Spiti'
import Andaman from './pages/Andaman'
import AboutUs from './pages/AboutUs'
import BottomDock from './components/BottomDock'
import Chatbot from './components/Chatbot'

// Create a component that forces layout re-render on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <>
      <ScrollToTop />
      <div className="pb-36 md:pb-0">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/international" element={<International />} />
          <Route path="/review" element={<Review />} />
          <Route path="/domestic" element={<Domestic />} />
          <Route path="/uttarakhand" element={<Uttarakhand />} />
          <Route path="/himachal" element={<Himachal />} />
          <Route path="/kashmir" element={<Kashmir />} />
          <Route path="/rajasthan" element={<Rajasthan />} />
          <Route path="/meghalaya" element={<Meghalaya />} />
          <Route path="/ladakh" element={<Ladakh />} />
          <Route path="/spiti" element={<Spiti />} />
          <Route path="/andaman" element={<Andaman />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/itinerary/:id" element={<ItinerarySpiti />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/shipping-policy" element={<ShippingPolicy />} />
          <Route path="/terms-conditions" element={<TermsConditions />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </div>

      {/* Global Chatbot */}
      <Chatbot isOpenExternal={chatOpen} onExternalClose={() => setChatOpen(false)} />

      {/* GooeyDock + AI pill */}
      <BottomDock 
        isChatOpen={chatOpen}
        onOpenChat={() => setChatOpen(true)} 
        onCloseChat={() => setChatOpen(false)} 
      />
    </>
  )
}

export default App
