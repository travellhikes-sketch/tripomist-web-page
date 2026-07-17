import fs from 'fs';
import path from 'path';

const pages = [
  {
    file: 'src/pages/GroupTrips.jsx',
    component: 'GroupTrips',
    title: 'Group Departures',
    img: 'https://images.unsplash.com/photo-1523592121529-f6dde35f079e?w=1200&q=80',
    about: "Looking for an adventure with like-minded travelers? Our Group Departures offer the perfect blend of exploration, fun, and safety. Join us and make memories that will last a lifetime.",
    filterLogic: "pkg.category === 'Group Trip' || pkg.title.toLowerCase().includes('group')" // Adjust as needed
  },
  {
    file: 'src/pages/WeekendTrips.jsx',
    component: 'WeekendTrips',
    title: 'Weekend Departures',
    img: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80',
    about: "Short on time but big on wanderlust? Our Weekend Departures are designed for the perfect quick getaway to refresh and recharge your spirit without the hassle of long planning.",
    filterLogic: "pkg.duration && (pkg.duration.includes('1N') || pkg.duration.includes('2N') || pkg.duration.includes('3N'))"
  },
  {
    file: 'src/pages/Treks.jsx',
    component: 'Treks',
    title: 'Trekking Departure',
    img: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=80',
    about: "Conquer the peaks and explore the unseen with our Trekking Departures. Whether you are a beginner or a seasoned trekker, we have the perfect trail waiting for you.",
    filterLogic: "pkg.category === 'Trek' || pkg.title.toLowerCase().includes('trek')"
  },
  {
    file: 'src/pages/FamilyTours.jsx',
    component: 'FamilyTours',
    title: 'Family Destinations',
    img: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1200&q=80',
    about: "Create unforgettable moments with your loved ones. Our Family Destinations are carefully curated to ensure comfort, safety, and fun activities for all age groups.",
    filterLogic: "pkg.category === 'Family Tour' || pkg.title.toLowerCase().includes('family')"
  },
  {
    file: 'src/pages/HoneymoonTrips.jsx',
    component: 'HoneymoonTrips',
    title: 'Honeymoon Trips',
    img: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=1200&q=80',
    about: "Celebrate your love in the world's most romantic destinations. Our Honeymoon Trips offer luxurious stays, breathtaking views, and intimate experiences to start your new journey together.",
    filterLogic: "pkg.category === 'Honeymoon' || pkg.title.toLowerCase().includes('honeymoon')"
  }
];

for (const page of pages) {
  const content = `import React, { useState, useEffect } from 'react'
import PackageCard from '../components/PackageCard'
import ReadMoreText from '../components/ReadMoreText'
import { Link, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { supabase } from '../supabaseClient'

export default function ${page.component}() {
  const [tripsList, setTripsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPackages() {
      const { data, error } = await supabase
        .from('Pakage')
        .select('*');
      
      if (error) {
        console.error('Error fetching packages:', error);
      } else {
        const activePackages = data.filter(pkg => pkg.status && pkg.status.includes('active'));
        // Try to filter by specific logic if matches, else fallback to all active
        let categoryPackages = activePackages.filter(pkg => ${page.filterLogic});
        if (categoryPackages.length === 0) categoryPackages = activePackages; // Fallback if no specific packages found
        
        const mappedTrips = categoryPackages.map(pkg => ({
          id: pkg.id,
          name: pkg.title,
          location: pkg.destination || pkg.state,
          style: pkg.category === 'International' ? 'International Trips' : 'Domestic Trips',
          durationText: pkg.duration,
          price: pkg.price,
          isFav: false,
          tagline: pkg.short_description ? pkg.short_description.substring(0, 80) + '...' : pkg.title,
          img: pkg.image_url || pkg.banner_image
        }));
        setTripsList(mappedTrips);
      }
      setLoading(false);
    }
    fetchPackages();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest">
      <Navbar />

      {/* Hero Video/Image Banner */}
      <section className="relative w-full h-[50vh] min-h-[400px] overflow-hidden">
        <img
          src="${page.img}"
          alt="${page.title}"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        <div className="absolute bottom-10 left-0 right-0 z-10 flex flex-col items-center justify-end px-4">
          <h1 className="text-white text-3xl md:text-5xl font-bold text-center tracking-tight">
            ${page.title}
          </h1>
        </div>
      </section>

      {/* About Section */}
      <section className="w-full max-w-6xl mx-auto px-4 pt-12 pb-6">
        <div className="flex-1">
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-4">
            About ${page.title}
          </h2>
          <ReadMoreText text="${page.about}" />
        </div>
      </section>

      {/* Destinations Grid */}
      <main className="max-w-6xl mx-auto px-4 pb-36 w-full flex-grow">
        {loading ? (
           <p className="text-center font-bold text-primary mt-10">Loading packages...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tripsList.map((dest) => (
              <PackageCard 
                key={dest.id}
                tripTitle={dest.name} 
                price={"₹" + dest.price.toLocaleString('en-IN')}
                duration={dest.durationText} 
                description={dest.tagline}
                bg={dest.img}
                link={\`/itinerary/\${dest.id}\`} 
                blueText={true}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
`;
  fs.writeFileSync(page.file, content, 'utf8');
}
console.log("Rewrite completed.");
