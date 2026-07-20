import React, { useState, useEffect } from 'react'
import { Routes, Route, useLocation, useNavigationType, Navigate } from 'react-router-dom'
import GroupTrips from './pages/GroupTrips'
import WeekendTrips from './pages/WeekendTrips'
import Treks from './pages/Treks'
import FamilyTours from './pages/FamilyTours'
import HoneymoonTrips from './pages/HoneymoonTrips'
import Home from './pages/Home'
import Domestic from './pages/Domestic'
import International from './pages/International'
import Review from './pages/Review'
import PackageDetail from './pages/PackageDetail'
import Checkout from './pages/Checkout'
import PackageCheckout from './pages/PackageCheckout'
import Cart from './pages/Cart'
import Payment from './pages/Payment'
import FeaturedGroupTrip from './pages/FeaturedGroupTrip'
import MostPopularPackages from './pages/MostPopularPackages'
import ItineraryManaliKasol from './pages/ItineraryManaliKasol'
import ItineraryJibhi from './pages/ItineraryJibhi'
import ItineraryChopta from './pages/ItineraryChopta'
import ItineraryKedarnath from './pages/ItineraryKedarnath'
import ItineraryMadhyameshwar from './pages/ItineraryMadhyameshwar'
import ItineraryUdaipurKumbhalgarh from './pages/ItineraryUdaipurKumbhalgarh'
import Search from './pages/Search'
import PrivacyPolicy from './pages/PrivacyPolicy'
import RefundPolicy from './pages/RefundPolicy'
import ShippingPolicy from './pages/ShippingPolicy'
import TermsConditions from './pages/TermsConditions'
import ContactUs from './pages/ContactUs'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import MyAccount from './pages/MyAccount'
import MyTrips from './pages/MyTrips'
import BookingDetail from './pages/BookingDetail'
import Uttarakhand from './pages/Uttarakhand'
import Himachal from './pages/Himachal'
import Kashmir from './pages/Kashmir'
import Rajasthan from './pages/Rajasthan'
import Meghalaya from './pages/Meghalaya'
import Ladakh from './pages/Ladakh'
import Spiti from './pages/Spiti'
import Kerala from './pages/Kerala'
import Goa from './pages/Goa'
import AboutUs from './pages/AboutUs'
import AllDepartures from './pages/AllDepartures'
import UpcomingDepartures from './pages/UpcomingDepartures'
import BottomDock from './components/BottomDock'
import Chatbot from './components/Chatbot'
import AdminLayout from './components/admin/AdminLayout'
import AdminRoute from './components/admin/AdminRoute'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminPackages from './pages/admin/AdminPackages'
import AdminBookings from './pages/admin/AdminBookings'
import AdminUsers from './pages/admin/AdminUsers'
import AdminCheckoutLeads from './pages/admin/AdminCheckoutLeads'

// Create a component that forces layout re-render on route change, but respects back button
function ScrollToTop() {
  const { pathname } = useLocation();
  const navType = useNavigationType();
  useEffect(() => {
    if (navType !== "POP") {
      window.scrollTo(0, 0);
    }
  }, [pathname, navType]);
  return null;
}

function App() {
  const [chatOpen, setChatOpen] = useState(false)
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  useEffect(() => {
    const handleOpenChat = () => setChatOpen(true);
    window.addEventListener('open-chatbot', handleOpenChat);
    return () => window.removeEventListener('open-chatbot', handleOpenChat);
  }, []);

  return (
    <>
      <ScrollToTop />
      <div className={isAdminRoute ? "" : "pb-36 md:pb-0"}>
        <Routes>
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="packages" element={<AdminPackages />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="checkout-leads" element={<AdminCheckoutLeads />} />
              <Route path="users" element={<AdminUsers />} />
            </Route>
          </Route>

          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/group-trips" element={<GroupTrips />} />
          <Route path="/weekend-trips" element={<WeekendTrips />} />
          <Route path="/treks" element={<Treks />} />
          <Route path="/family-tours" element={<FamilyTours />} />
          <Route path="/honeymoon-trips" element={<HoneymoonTrips />} />
          <Route path="/all-departures" element={<AllDepartures />} />
          <Route path="/upcoming-departures" element={<UpcomingDepartures />} />
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
          <Route path="/kerala" element={<Kerala />} />
          <Route path="/goa" element={<Goa />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/search" element={<Search />} />
          <Route path="/featured-group-trips" element={<FeaturedGroupTrip />} />
          <Route path="/most-popular-packages" element={<MostPopularPackages />} />
          <Route path="/itinerary/manali-kasol" element={<ItineraryManaliKasol />} />
          <Route path="/itinerary/jibhi" element={<ItineraryJibhi />} />
          <Route path="/itinerary/chopta" element={<ItineraryChopta />} />
          <Route path="/itinerary/kedarnath" element={<ItineraryKedarnath />} />
          <Route path="/itinerary/madhyameshwar" element={<ItineraryMadhyameshwar />} />
          <Route path="/itinerary/udaipur-and-kumbhalgarh" element={<ItineraryUdaipurKumbhalgarh />} />
          <Route path="/itinerary/:slug" element={<PackageDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/:packageSlug" element={<PackageCheckout />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/my-account" element={<MyAccount />} />
          <Route path="/my-trips" element={<MyTrips />} />
          <Route path="/my-trip/:slug" element={<BookingDetail />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/shipping-policy" element={<ShippingPolicy />} />
          <Route path="/terms-conditions" element={<TermsConditions />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </div>

      {/* Global Chatbot */}
      {!isAdminRoute && (
        <Chatbot isOpenExternal={chatOpen} onExternalClose={() => setChatOpen(false)} />
      )}

      {/* GooeyDock + AI pill */}
      {!isAdminRoute && (
        <BottomDock 
          isChatOpen={chatOpen}
          onOpenChat={() => setChatOpen(true)} 
          onCloseChat={() => setChatOpen(false)} 
        />
      )}
    </>
  )
}

export default App
