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
import CategoryPackages from './pages/CategoryPackages'
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
import ShippingPolicy from './pages/ShippingPolicy'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import MyAccount from './pages/MyAccount'
import MyTrips from './pages/MyTrips'
import BookingDetail from './pages/BookingDetail'
// Removed legacy hardcoded destination imports
import DynamicPage from './pages/DynamicPage'
import AllDepartures from './pages/AllDepartures'
import UpcomingDepartures from './pages/UpcomingDepartures'
import BottomDock from './components/BottomDock'
import Chatbot from './components/Chatbot'
const AdminLayout = React.lazy(() => import('./components/admin/AdminLayout'));
const AdminRoute = React.lazy(() => import('./components/admin/AdminRoute'));
const AdminLogin = React.lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminPackages = React.lazy(() => import('./pages/admin/AdminPackages'));
const AdminBookings = React.lazy(() => import('./pages/admin/AdminBookings'));
const AdminUsers = React.lazy(() => import('./pages/admin/AdminUsers'));
const AdminCheckoutLeads = React.lazy(() => import('./pages/admin/AdminCheckoutLeads'));
const AdminRoomAllocation = React.lazy(() => import('./pages/admin/AdminRoomAllocation'));
const AdminBookingActivityLogs = React.lazy(() => import('./pages/admin/AdminBookingActivityLogs'));
const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings'));
import AdminSiteSettings from './pages/admin/AdminSiteSettings';
const AdminBanners = React.lazy(() => import('./pages/admin/AdminBanners'));
const AdminDestinations = React.lazy(() => import('./pages/admin/AdminDestinations'));
const AdminInterests = React.lazy(() => import('./pages/admin/AdminInterests'));
const AdminHomepageSections = React.lazy(() => import('./pages/admin/AdminHomepageSections'));
const AdminManualBookings = React.lazy(() => import('./pages/admin/AdminManualBookings'));
const AdminWebsitePages = React.lazy(() => import('./pages/admin/AdminWebsitePages'));
const AdminMenuManager = React.lazy(() => import('./pages/admin/AdminMenuManager'));
const AdminReviews = React.lazy(() => import('./pages/admin/AdminReviews'));
const DestinationPackages = React.lazy(() => import('./pages/DestinationPackages'));
const CustomerLayout = React.lazy(() => import('./components/customer/CustomerLayout'));
const CustomerRoute = React.lazy(() => import('./components/customer/CustomerRoute'));
const CustomerDashboard = React.lazy(() => import('./pages/customer/CustomerDashboard'));
const CustomerTrips = React.lazy(() => import('./pages/customer/CustomerTrips'));
const CustomerTripDetails = React.lazy(() => import('./pages/customer/CustomerTripDetails'));
const CustomerPayments = React.lazy(() => import('./pages/customer/CustomerPayments'));
const CustomerProfile = React.lazy(() => import('./pages/customer/CustomerProfile'));
const CustomerSupport = React.lazy(() => import('./pages/customer/CustomerSupport'));

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
          <Route path="/admin/login" element={
            <React.Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-[#136b8a] border-t-transparent rounded-full animate-spin"></div></div>}>
              <AdminLogin />
            </React.Suspense>
          } />
          <Route path="/admin" element={
            <React.Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-[#136b8a] border-t-transparent rounded-full animate-spin"></div></div>}>
              <AdminRoute />
            </React.Suspense>
          }>
            <Route element={
              <React.Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-[#136b8a] border-t-transparent rounded-full animate-spin"></div></div>}>
                <AdminLayout />
              </React.Suspense>
            }>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="packages" element={<AdminPackages />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="manual-bookings" element={
                <React.Suspense fallback={<div>Loading...</div>}><AdminManualBookings /></React.Suspense>
              } />
              <Route path="checkout-leads" element={<AdminCheckoutLeads />} />
              <Route path="room-allocation" element={
                <React.Suspense fallback={<div>Loading...</div>}><AdminRoomAllocation /></React.Suspense>
              } />
              <Route path="booking-activity-logs" element={
                <React.Suspense fallback={<div>Loading...</div>}><AdminBookingActivityLogs /></React.Suspense>
              } />
              <Route path="users" element={<AdminUsers />} />
              <Route path="settings" element={
                <React.Suspense fallback={<div>Loading...</div>}><AdminSettings /></React.Suspense>
              } />
              <Route path="site-settings" element={<AdminSiteSettings />} />
              <Route path="banners" element={
                <React.Suspense fallback={<div>Loading...</div>}><AdminBanners /></React.Suspense>
              } />
              <Route path="destinations" element={
                <React.Suspense fallback={<div>Loading...</div>}><AdminDestinations /></React.Suspense>
              } />
              <Route path="interests" element={
                <React.Suspense fallback={<div>Loading...</div>}><AdminInterests /></React.Suspense>
              } />
              <Route path="sections" element={
                <React.Suspense fallback={<div>Loading...</div>}><AdminHomepageSections /></React.Suspense>
              } />
              <Route path="website-pages/:pageKey" element={
                <React.Suspense fallback={<div>Loading...</div>}><AdminWebsitePages /></React.Suspense>
              } />
              <Route path="website-pages/menu-manager" element={
                <React.Suspense fallback={<div>Loading...</div>}><AdminMenuManager /></React.Suspense>
              } />
              <Route path="reviews" element={
                <React.Suspense fallback={<div>Loading...</div>}><AdminReviews /></React.Suspense>
              } />
            </Route>
          </Route>

          {/* Customer Portal Routes */}
          <Route path="/account" element={
            <React.Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-[#136b8a] border-t-transparent rounded-full animate-spin"></div></div>}>
              <CustomerRoute />
            </React.Suspense>
          }>
            <Route element={
              <React.Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-[#136b8a] border-t-transparent rounded-full animate-spin"></div></div>}>
                <CustomerLayout />
              </React.Suspense>
            }>
              <Route index element={
                <React.Suspense fallback={<div>Loading...</div>}>
                  <CustomerDashboard />
                </React.Suspense>
              } />
              <Route path="trips" element={
                <React.Suspense fallback={<div>Loading...</div>}>
                  <CustomerTrips />
                </React.Suspense>
              } />
              <Route path="trips/:id" element={
                <React.Suspense fallback={<div>Loading...</div>}>
                  <CustomerTripDetails />
                </React.Suspense>
              } />
              <Route path="payments" element={
                <React.Suspense fallback={<div>Loading...</div>}>
                  <CustomerPayments />
                </React.Suspense>
              } />
              <Route path="profile" element={
                <React.Suspense fallback={<div>Loading...</div>}>
                  <CustomerProfile />
                </React.Suspense>
              } />
              <Route path="support" element={
                <React.Suspense fallback={<div>Loading...</div>}>
                  <CustomerSupport />
                </React.Suspense>
              } />
            </Route>
          </Route>

          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/trips/:categorySlug" element={<CategoryPackages />} />
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
          <Route path="/destinations/:destinationSlug" element={
            <React.Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-[#136b8a] border-t-transparent rounded-full animate-spin"></div></div>}>
              <DestinationPackages />
            </React.Suspense>
          } />
          {/* Legacy Redirects */}
          <Route path="/uttarakhand" element={<Navigate to="/destinations/uttarakhand" replace />} />
          <Route path="/himachal" element={<Navigate to="/destinations/himachal" replace />} />
          <Route path="/kashmir" element={<Navigate to="/destinations/kashmir" replace />} />
          <Route path="/rajasthan" element={<Navigate to="/destinations/rajasthan" replace />} />
          <Route path="/meghalaya" element={<Navigate to="/destinations/meghalaya" replace />} />
          <Route path="/ladakh" element={<Navigate to="/destinations/ladakh" replace />} />
          <Route path="/spiti" element={<Navigate to="/destinations/spiti-valley" replace />} />
          <Route path="/kerala" element={<Navigate to="/destinations/kerala" replace />} />
          <Route path="/goa" element={<Navigate to="/destinations/goa" replace />} />
          <Route path="/about" element={<DynamicPage pageKey="about-us" />} />
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
          <Route path="/privacy-policy" element={<DynamicPage pageKey="privacy-policy" />} />
          <Route path="/refund-policy" element={<DynamicPage pageKey="cancellation-refund" />} />
          <Route path="/shipping-policy" element={<ShippingPolicy />} />
          <Route path="/terms-conditions" element={<DynamicPage pageKey="terms-conditions" />} />
          <Route path="/contact" element={<DynamicPage pageKey="contact-us" />} />
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
