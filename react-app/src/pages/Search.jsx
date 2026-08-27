import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PackageCard from '../components/PackageCard'
import RecommendedExtraPackages from '../components/RecommendedExtraPackages'
import { supabase } from '../utils/supabaseClient'

function Search() {
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [heroSettings, setHeroSettings] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const query = params.get('search') || ''
    setSearchQuery(query)

    async function fetchSearchResults() {
      if (!query.trim()) {
        setPackages([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const { data, error: fetchErr } = await supabase
          .from('Pakage')
          .select('*, package_placements(placement_type, placement_slug)')
          .eq('status', 'active')
          .or(`title.ilike.%${query}%,destination.ilike.%${query}%,state.ilike.%${query}%,short_description.ilike.%${query}%`)
        
        if (fetchErr) throw fetchErr
        setPackages(data || [])
      } catch (err) {
        console.error('Search error:', err)
        setError('Failed to fetch search results. Please try again.')
      } finally {
        setLoading(false)
      }

      try {
        const { data: heroData } = await supabase.from('site_settings').select('setting_value').eq('setting_key', 'search_page_hero').single()
        if (heroData) {
          setHeroSettings(heroData.setting_value)
        }
      } catch (err) {
        // Ignore error
      }
    }

    fetchSearchResults()
  }, [location.search])

  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest">
      <Navbar />

      {/* Hero Banner Section */}
      <section className="relative w-full h-[40vh] min-h-[300px] md:h-[50vh] md:min-h-[400px] overflow-hidden bg-black">
        {heroSettings?.hero_image ? (
          <img
            src={heroSettings.hero_image}
            alt={heroSettings.title || 'Search Trips'}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <img
            src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1"
            alt="Search Trips"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        <div className="absolute bottom-10 left-0 right-0 z-10 flex flex-col items-center justify-end px-4">
          <h1 className="text-white text-3xl md:text-5xl font-bold text-center tracking-tight drop-shadow-md">
            {heroSettings?.title || 'Find Your Next Adventure'}
          </h1>
          {heroSettings?.subtitle && (
            <p className="text-white/90 text-sm md:text-lg mt-3 max-w-2xl text-center">
              {heroSettings.subtitle}
            </p>
          )}
        </div>
      </section>

      <main className="w-full flex-grow pt-16 pb-16 px-4 md:px-12 lg:px-20 max-w-[1600px] mx-auto">
        <div className="mb-8 md:mb-12">
          {searchQuery && (
            <p className="text-on-surface-variant text-lg">
              Showing results for <span className="font-semibold text-primary">"{searchQuery}"</span>
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
            <p className="font-medium">Searching for trips...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-red-500">
            <span className="material-symbols-outlined text-5xl mb-4">error</span>
            <p className="font-medium text-lg">{error}</p>
          </div>
        ) : packages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-surface-container-low rounded-3xl border border-outline-variant/30 text-center px-4">
            <span className="material-symbols-outlined text-6xl text-outline mb-4">search_off</span>
            <h2 className="text-2xl font-bold text-on-surface mb-2">No results found</h2>
            <p className="text-on-surface-variant max-w-md">
              We couldn't find any packages matching "{searchQuery}". Try checking for typos or searching for a different destination.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {packages.map((pkg) => (
              <PackageCard destination={pkg.destination} state={pkg.state} 
                key={pkg.id}
                tripTitle={pkg.title}
                price={pkg.price != null && pkg.price !== '' ? `₹${Number(pkg.price).toLocaleString('en-IN')}` : 'Price on request'}
                duration={pkg.duration || 'Flexible'}
                description={pkg.short_description || pkg.destination || ''}
                bg={pkg.image_url || pkg.banner_image || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1"}
                link={`/itinerary/${pkg.slug}`}
                bestSeller={pkg.best_seller}
                primaryBadgeText={pkg.primary_badge_text}
                secondaryBadgeText={pkg.secondary_badge_text}
                showPrimaryBadge={pkg.show_primary_badge}
                showSecondaryBadge={pkg.show_secondary_badge}
              />
            ))}
          </div>
        )}
        
        <RecommendedExtraPackages
          placementType="recommendation_listing"
          placementId="ffffffff-ffff-ffff-ffff-ffffffffffff"
          excludePackageIds={packages.map(p => p.id)}
        />
      </main>

      <Footer />
    </div>
  )
}

export default Search

