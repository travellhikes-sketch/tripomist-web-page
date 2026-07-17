import React from 'react'
import ReadMoreText from '../components/ReadMoreText'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PackageCard from '../components/PackageCard'

const destinations = [
  {
    tripTitle: "Ladakh",
    price: "₹21,999",
    duration: "6N/7D",
    bg: "https://images.unsplash.com/photo-1581793746485-04698e79a4e8?w=1600&q=80",
    link: "/itinerary/Ladakh"
  },
  {
    tripTitle: "Spiti Valley",
    price: "₹16,999",
    duration: "5N/6D",
    bg: "https://images.unsplash.com/photo-1549257850-25e24bcf0e13?w=1600&q=80",
    link: "/itinerary/Spiti Valley"
  },
  {
    tripTitle: "Kashmir",
    price: "₹17,999",
    duration: "4N/5D",
    bg: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=1600&q=80",
    link: "/itinerary/Kashmir"
  },
  {
    tripTitle: "Andaman Retreat",
    price: "₹25,999",
    duration: "5N/6D",
    bg: "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=1600&q=80",
    link: "/group-trips"
  },
  {
    tripTitle: "Meghalaya Expedition",
    price: "₹18,999",
    duration: "6N/7D",
    bg: "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=1600&q=80",
    link: "/group-trips"
  },
  {
    tripTitle: "Udaipur",
    price: "₹6,999",
    duration: "2N/3D",
    bg: "/udaipur.jpg",
    link: "/itinerary/udaipur-and-kumbhalgarh"
  },
  {
    tripTitle: "Manali Kasol",
    price: "₹10,999",
    duration: "4N/5D",
    bg: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=1600&q=80",
    link: "/group-trips"
  },
  {
    tripTitle: "Jibhi Tirthan",
    price: "₹9,999",
    duration: "3N/4D",
    bg: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1600&q=80",
    link: "/group-trips"
  },
  {
    tripTitle: "Chopta Tungnath",
    price: "₹11,999",
    duration: "4N/5D",
    bg: "https://images.unsplash.com/photo-1610212594957-c5332fc39634?w=1600&q=80",
    link: "/group-trips"
  },
  {
    tripTitle: "Kedarnath",
    price: "₹14,999",
    duration: "5N/6D",
    bg: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=1600&q=80",
    link: "/group-trips"
  },
  {
    tripTitle: "Madhyameshwar",
    price: "₹12,999",
    duration: "4N/5D",
    bg: "https://images.unsplash.com/photo-1614531341773-3bff8b7cb3fc?w=1600&q=80",
    link: "/group-trips"
  }
]

export default function AllDepartures() {
  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest">
      <Navbar />

      <section className="relative w-full h-[50vh] min-h-[400px] overflow-hidden">
        <img
          src={destinations[0]?.bg || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80"}
          alt="All Departures"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        <div className="absolute bottom-10 left-0 right-0 z-10 flex flex-col items-center justify-end px-4">
          <h1 className="text-white text-3xl md:text-5xl font-bold text-center tracking-tight">
            All Departures
          </h1>
        </div>
      </section>

      <section className="w-full max-w-6xl mx-auto px-4 pt-12 pb-6">
        <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-4">
          About All Departures Tour Packages
        </h2>
        <ReadMoreText text="What if we say to you that there's a place wherein the clouds came down to greet the mountains, where rivers whisper the old secrets, and where time slows down just to make you able to take it all in? All Departures is that magical place, waiting for you to explore its untouched beauty." />
      </section>

      <main className="max-w-6xl mx-auto px-4 pb-36 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((dest, i) => (
            <PackageCard 
              key={i}
              className="w-full h-[340px] md:h-[360px]" 
              tripTitle={dest.tripTitle} 
              price={dest.price} 
              duration={dest.duration} 
              bg={dest.bg}
              link={dest.link}
              blueText={true}
            />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}
