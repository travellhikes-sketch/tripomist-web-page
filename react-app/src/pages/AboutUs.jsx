import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const stats = [
  { value: '10K+', label: 'Happy Travellers' },
  { value: '4.9★', label: 'Google Rating' },
  { value: '100+', label: 'Domestic Trips' },
  { value: '5+', label: 'Years Experience' },
]

const team = [
  {
    name: 'Rahul Sharma',
    role: 'Founder & Chief Explorer',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    bio: 'Avid trekker with 15+ years exploring the Himalayas.',
  },
  {
    name: 'Priya Singh',
    role: 'Head of Travel Operations',
    img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    bio: 'Ensuring every TripoMist journey runs flawlessly.',
  },
  {
    name: 'Arjun Mehta',
    role: 'Lead Adventure Guide',
    img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
    bio: 'Certified mountaineer and wilderness survival expert.',
  },
]

export default function AboutUs() {
  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest">
      <Navbar />

      {/* Hero */}
      <section className="relative w-full h-72 md:h-96 flex items-end pb-10 px-6 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80"
          alt="TripoMist journey"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
        <div className="relative z-10">
          <p className="text-primary-container text-sm font-semibold tracking-widest uppercase mb-1">Our Story</p>
          <h1 className="text-white text-4xl md:text-5xl font-bold leading-tight">About TripoMist</h1>
          <p className="text-white/80 mt-2 text-base max-w-md">Your Safe Travel, Our Responsibility.</p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 py-10 w-full pb-36">

        {/* Mission */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-on-surface mb-4">Our Mission</h2>
          <p className="text-on-surface-variant leading-relaxed text-base">
            TripoMist was born from a simple idea — travel should be accessible, safe, and deeply enriching. 
            We curate immersive group travel experiences across India's most breathtaking destinations, 
            connecting like-minded explorers and creating memories that last a lifetime.
          </p>
          <p className="text-on-surface-variant leading-relaxed text-base mt-4">
            From the snow-capped peaks of Spiti Valley to the serene backwaters of Kerala, 
            we handle every detail so you can focus on what truly matters — the journey.
          </p>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-5 text-center shadow-sm border border-outline-variant/20">
              <p className="text-2xl font-bold text-primary">{s.value}</p>
              <p className="text-xs text-on-surface-variant mt-1 font-medium uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </section>

        {/* Team */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-on-surface mb-6">Meet the Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {team.map((m) => (
              <div key={m.name} className="bg-white rounded-2xl p-5 text-center shadow-sm border border-outline-variant/20">
                <img
                  src={m.img}
                  alt={m.name}
                  className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-2 border-primary/20"
                />
                <h3 className="font-bold text-on-surface">{m.name}</h3>
                <p className="text-primary text-xs font-semibold mt-0.5">{m.role}</p>
                <p className="text-on-surface-variant text-sm mt-2">{m.bio}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-primary to-[#004e72] rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">Ready to Explore?</h2>
          <p className="text-white/80 mb-6">Join thousands of happy travellers on their next adventure.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/uttarakhand"
              className="bg-white text-primary font-bold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors no-underline"
            >
              Explore Uttarakhand
            </Link>
            <Link
              to="/himachal"
              className="border border-white/50 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors no-underline"
            >
              Explore Himachal
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
