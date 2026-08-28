import React from 'react'
import ReadMoreText from '../components/ReadMoreText'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'



export default function AboutUs() {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-gray-800">
      <Navbar />

      <main className="flex-grow max-w-4xl mx-auto w-full px-6 py-16 md:py-24 mt-20">
        <h1 className="text-4xl md:text-5xl font-bold mb-12 text-gray-900 leading-tight">
          About Us
        </h1>

        <div className="prose prose-lg text-gray-700 max-w-none leading-relaxed">
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
