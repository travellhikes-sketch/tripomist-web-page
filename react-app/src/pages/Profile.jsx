import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase, safeStorage } from '../utils/supabaseClient'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function Profile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [updateMessage, setUpdateMessage] = useState('')
  const [updateError, setUpdateError] = useState('')
  const [updating, setUpdating] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate('/login')
      } else {
        setUser(user)
        setEditName(user.user_metadata?.full_name || '')
        setEditEmail(user.email || '')
      }
      setLoading(false)
    })
  }, [navigate])

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setUpdating(true)
    setUpdateMessage('')
    setUpdateError('')

    if (supabase.isMock) {
      // Mock flow
      const updatedUser = {
        ...user,
        email: editEmail,
        user_metadata: {
          ...user.user_metadata,
          full_name: editName
        }
      }
      safeStorage.setItem('mock_current_user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      setUpdateMessage('Profile updated successfully! (Mock)')
      window.dispatchEvent(new Event('auth-state-change'))
    } else {
      // Supabase flow
      try {
        const { data, error } = await supabase.auth.updateUser({
          email: editEmail,
          data: { full_name: editName }
        })

        if (error) {
          setUpdateError(error.message)
        } else {
          setUpdateMessage('Profile updated successfully! Check your email for confirmation.')
          safeStorage.setItem('mock_current_user', JSON.stringify(data.user))
          setUser(data.user)
          window.dispatchEvent(new Event('auth-state-change'))
        }
      } catch (err) {
        setUpdateError('An unexpected error occurred.')
      }
    }
    setUpdating(false)
  }

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-background min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">hourglass_empty</span>
          <span className="font-semibold text-slate-600">Loading your profile...</span>
        </div>
      </div>
    )
  }

  if (!user) return null

  const displayName = user.user_metadata?.full_name || user.email.split('@')[0]
  const displayPhone = user.user_metadata?.phone || 'Not provided'

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-8 py-10 bg-background">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-[32px] text-primary">dashboard</span>
            Customer Dashboard
          </h1>
          <p className="text-slate-500 mt-1">Manage your traveler details, active packages, and secret expeditions here.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Personal details & Edit form */}
          <aside className="space-y-6">
            
            {/* Live Profile Card */}
            <div className="bg-white/85 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-outline-variant/30 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl">person</span>
              </div>
              <h2 className="text-xl font-bold text-slate-800">{displayName}</h2>
              <p className="text-xs bg-primary/15 text-primary font-bold px-2.5 py-0.5 rounded-full mt-1.5 tracking-wider uppercase">Premium Traveler</p>
              
              <div className="w-full mt-6 space-y-4 border-t border-slate-100 pt-6 text-left">
                <div>
                  <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider">Email Address</span>
                  <span className="text-sm font-semibold text-slate-700 block truncate">{user.email}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider">Phone Number</span>
                  <span className="text-sm font-semibold text-slate-700 block truncate">{displayPhone}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider">Member Since</span>
                  <span className="text-sm font-semibold text-slate-700 block">July 2024</span>
                </div>
              </div>
            </div>

            {/* Edit Profile Form */}
            <div className="bg-white/85 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-outline-variant/30">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <span className="material-symbols-outlined text-primary text-[18px]">manage_accounts</span>
                Edit Travel Profile
              </h3>
              <form onSubmit={handleUpdateProfile} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                  <input 
                    required 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary/20" 
                    type="text" 
                    placeholder="Update full name" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                  <input 
                    required 
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary/20" 
                    type="email" 
                    placeholder="Update email" 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={updating}
                  className="w-full bg-primary hover:bg-[#004e72] text-white text-xs font-bold py-3 rounded-xl transition-colors cursor-pointer border-none flex items-center justify-center gap-1.5 mt-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span> 
                  {updating ? 'Updating...' : 'Update Profile'}
                </button>
              </form>
              {updateMessage && (
                <div className="mt-3 p-2.5 text-xs rounded-xl text-center font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 block">
                  {updateMessage}
                </div>
              )}
              {updateError && (
                <div className="mt-3 p-2.5 text-xs rounded-xl text-center font-semibold bg-red-50 text-red-600 border border-red-100 block">
                  {updateError}
                </div>
              )}
            </div>

            {/* Travel Perks Banner */}
            <div className="bg-gradient-to-br from-primary to-[#004e72] text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <span className="material-symbols-outlined text-9xl">flight_takeoff</span>
              </div>
              <h3 className="text-lg font-bold mb-2">TripoMist Club</h3>
              <p className="text-xs text-white/80 leading-relaxed mb-4">Get access to secret departures, special weekend trip cashbacks, and dedicated 24/7 travel coordinators.</p>
              <div className="flex items-center gap-1.5 text-xs font-bold text-white/95 uppercase tracking-wider">
                <span className="material-symbols-outlined text-sm">verified_user</span> Verified Explorer
              </div>
            </div>
          </aside>

          {/* Right Columns: Bookings and Cart */}
          <section className="lg:col-span-2 space-y-8">
            
            {/* Booking History (Professional ticket-like design) */}
            <div className="bg-white/85 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-outline-variant/30">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="material-symbols-outlined text-primary text-xl">history</span>
                My Bookings & Expeditions
              </h3>

              <div className="space-y-4">
                {/* Ticket 1: Andaman */}
                <div className="relative bg-white border border-dashed border-slate-300 rounded-2xl p-5 hover:shadow-md transition-shadow before:content-[''] before:absolute before:w-4 before:h-4 before:bg-background before:rounded-full before:top-1/2 before:-translate-y-1/2 before:-left-2 before:border-r before:border-dashed before:border-slate-300 after:content-[''] after:absolute after:w-4 after:h-4 after:bg-background after:rounded-full after:top-1/2 after:-translate-y-1/2 after:-right-2 after:border-l after:border-dashed after:border-slate-300">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-primary flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-[24px]">luggage</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-base">Andaman Escape</h4>
                        <span className="text-xs text-slate-400 font-mono block mt-0.5">Booking ID: TM-BK-40912</span>
                        <span className="text-xs text-slate-500 font-medium block mt-1">4N/5D Departure • Confirmed departure</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-row md:flex-col justify-between items-center md:items-end border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Confirmed
                      </span>
                      <div className="text-right mt-2">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Paid Amount</span>
                        <span className="font-bold text-slate-800 text-lg">₹18,500</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ticket 2: Rishikesh */}
                <div className="relative bg-white border border-dashed border-slate-300 rounded-2xl p-5 hover:shadow-md transition-shadow before:content-[''] before:absolute before:w-4 before:h-4 before:bg-background before:rounded-full before:top-1/2 before:-translate-y-1/2 before:-left-2 before:border-r before:border-dashed before:border-slate-300 after:content-[''] after:absolute after:w-4 after:h-4 after:bg-background after:rounded-full after:top-1/2 after:-translate-y-1/2 after:-right-2 after:border-l after:border-dashed after:border-slate-300">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-[24px]">done_all</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-base">Rishikesh Retreat</h4>
                        <span className="text-xs text-slate-400 font-mono block mt-0.5">Booking ID: TM-BK-38761</span>
                        <span className="text-xs text-slate-500 font-medium block mt-1">1N/2D Weekend Getaway • Travel Completed</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-row md:flex-col justify-between items-center md:items-end border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Completed
                      </span>
                      <div className="text-right mt-2">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Paid Amount</span>
                        <span className="font-bold text-slate-800 text-lg">₹5,499</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Saved Packages & Cart */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-outline-variant/30">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="material-symbols-outlined text-primary text-xl">favorite</span>
                Saved Packages & Cart
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Saved Item 1: Ladakh */}
                <div className="flex flex-col bg-slate-50/50 hover:bg-slate-50 border border-slate-200/60 rounded-xl overflow-hidden transition-all hover:shadow-sm">
                  <img className="h-32 w-full object-cover" alt="Ladakh" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCE6p_UF0GujYyL7QDuZtoqzEShR-1wG1cgQi_O9hq38FgS581MFo2tgdKmqcWlbrQv9BdUpqpfR3vThFmanWNkaQRl4F0B3TKW2esN658tI0CjH-96Uh4B0SFJGOihOlNRXGuNeTj7DuNQKJh7n4WL1N1nlIj9od50ycbUf85JmEIJnOVNdc--S1p5-ZvcYwdCh35eyB9Y9_0MF0m9e0LoIC9-kWldVdViKnfzZc-H1YQF1JrBHOfUx0TWmgKVKuqtnJQv7mNresai" />
                  <div class="p-4 flex flex-col flex-grow">
                    <h4 className="font-bold text-slate-800 text-base">Ladakh Expedition</h4>
                    <span className="text-xs text-slate-500 font-semibold mt-0.5">6N/7D • Mountains</span>
                    <div className="flex items-center justify-between mt-4 border-t border-slate-100 pt-3">
                      <span className="font-bold text-primary text-base">₹21,999</span>
                      <Link to="/checkout?trip=Ladakh%20Expedition&price=21999" className="bg-primary text-white text-[11px] font-bold px-3.5 py-1.5 rounded-lg hover:bg-[#004e72] transition-colors no-underline">Checkout</Link>
                    </div>
                  </div>
                </div>

                {/* Saved Item 2: Spiti Valley */}
                <div className="flex flex-col bg-slate-50/50 hover:bg-slate-50 border border-slate-200/60 rounded-xl overflow-hidden transition-all hover:shadow-sm">
                  <img className="h-32 w-full object-cover" alt="Spiti Valley" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCoJR3BpNyP1i1mPJq3X3jHeXOGmBJ_nQl0snOauAWZkJyJOg4Qba33jURx3B9X94_hsmX9bQh19tDtOJfrT3q37LwYx1Wk_xHMqdEMpCT-wV0fYyopsVjDHjfEIAByBgaDpOOK4g7rOmJx9hzCkMHvbE5VLyDYJYys6hvDlZDthNmF-hNbppnYt9xZRw2g5SDGcNW0_VtWjgiCuQXPg2kY1pF1L1cJHMQ_NyzQ3t5UBG48pm5tsjfp5ydUvO2rOmPvEZgATszcYDG-" />
                  <div class="p-4 flex flex-col flex-grow">
                    <h4 className="font-bold text-slate-800 text-base">Spiti Valley Adventure</h4>
                    <span className="text-xs text-slate-500 font-semibold mt-0.5">5N/6D • Mountains</span>
                    <div className="flex items-center justify-between mt-4 border-t border-slate-100 pt-3">
                      <span className="font-bold text-primary text-base">₹14,500</span>
                      <Link to="/checkout?trip=Spiti%20Valley%20Adventure&price=14500" className="bg-primary text-white text-[11px] font-bold px-3.5 py-1.5 rounded-lg hover:bg-[#004e72] transition-colors no-underline">Checkout</Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default Profile
