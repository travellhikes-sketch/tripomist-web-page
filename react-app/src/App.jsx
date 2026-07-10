import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import WeekendTrips from './pages/WeekendTrips'
import UpcomingTrips from './pages/UpcomingTrips'
import GroupTrips from './pages/GroupTrips'
import ItinerarySpiti from './pages/ItinerarySpiti'
import Checkout from './pages/Checkout'
import PrivacyPolicy from './pages/PrivacyPolicy'
import RefundPolicy from './pages/RefundPolicy'
import ShippingPolicy from './pages/ShippingPolicy'
import TermsConditions from './pages/TermsConditions'
import ContactUs from './pages/ContactUs'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Search from './pages/Search'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/weekend-trips" element={<WeekendTrips />} />
      <Route path="/upcoming-trips" element={<UpcomingTrips />} />
      <Route path="/group-trips" element={<GroupTrips />} />
      <Route path="/itinerary/:id" element={<ItinerarySpiti />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/login" element={<Login />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/search" element={<Search />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/refund-policy" element={<RefundPolicy />} />
      <Route path="/shipping-policy" element={<ShippingPolicy />} />
      <Route path="/terms-conditions" element={<TermsConditions />} />
      <Route path="/contact" element={<ContactUs />} />
      {/* Fallback route */}
      <Route path="*" element={<Home />} />
    </Routes>
  )
}

export default App
