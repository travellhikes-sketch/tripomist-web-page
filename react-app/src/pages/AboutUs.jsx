import React from 'react'
import ReadMoreText from '../components/ReadMoreText'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'



export default function AboutUs() {
  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest">
      <Navbar />

      {/* Hero Video/Image Banner */}
      <section className="relative w-full h-[50vh] min-h-[400px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80"
          alt="TripoMist journey"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        <div className="absolute bottom-10 left-0 right-0 z-10 flex flex-col items-center justify-end px-4">
          <h1 className="text-white text-3xl md:text-5xl font-bold text-center tracking-tight">
            About TripoMist
          </h1>
        </div>
      </section>

      {/* About Section */}
      <main className="w-full max-w-4xl mx-auto px-4 pt-12 pb-24">
        <div className="prose prose-lg text-on-surface-variant">
          <p className="mb-4">
            TripoMist was created by Amin Khan and Mohd Wasim with a clear mission: to bridge the gaps that often exist in the travel industry and deliver experiences that travelers can truly rely on.
          </p>
          <p className="mb-4">
            While pursuing a Bachelor's in Tourism & Travel Management (BTTM) from Jamia Millia Islamia, Mohd Wasim gained a deeper understanding of the tourism industry and noticed a common challenge. Many travel companies are successful at winning a customer's trust during the booking process, but often struggle to deliver the promised experience on the ground. Together, Amin Khan and Mohd Wasim envisioned a travel brand that would focus not just on selling trips, but on fulfilling every commitment made to travelers.
          </p>
          <p className="mb-4">
            At TripoMist, we believe that a journey should be smooth, transparent, safe, and memorable from start to finish. Whether it's a weekend getaway, a trekking expedition, a college trip, a family vacation, or a customized travel experience, our goal is to ensure that every traveler enjoys a hassle-free and well-organized adventure.
          </p>
          <p className="mb-4">
            From the breathtaking landscapes of Spiti Valley and Ladakh to the serene beauty of Kashmir, Manali, Jibhi, Chopta, Kedarnath, and beyond, we carefully design experiences that combine comfort, adventure, and authentic local culture.
          </p>
          <p className="mb-4">
            Our mission is simple: to provide honest travel experiences, deliver on our promises, and create journeys that travelers remember for a lifetime.
          </p>
          <p className="font-bold text-on-surface text-xl mt-6">
            At TripoMist, we don't just plan trips we build trust, create memories, and help people explore the world with confidence.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
