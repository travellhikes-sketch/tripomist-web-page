import React, { useState } from 'react'
import { Link } from 'react-router-dom'

function ContactUs() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="bg-surface text-on-surface antialiased font-body-md min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-outline-variant/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link className="font-bold tracking-tight text-primary flex items-center gap-2 hover:opacity-95 text-[#006591]" to="/">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            Back to Home
          </Link>
          <span className="text-on-surface-variant font-bold text-sm tracking-widest uppercase text-xs md:text-sm text-[#3e4850]">TripoMist Travel</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="font-display-lg text-4xl md:text-5xl font-bold text-on-surface mb-4">Contact Us</h1>
          <p className="text-[#3e4850] max-w-2xl mx-auto text-lg">Have any queries, suggestions, or need customized trip planning? Get in touch with our team.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Contact Info Cards */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-[#bec8d2]/30 rounded-2xl p-6 relative overflow-hidden flex gap-4 shadow-sm">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#006591]"></div>
              <span className="material-symbols-outlined text-[#006591] text-3xl">store</span>
              <div>
                <h3 className="font-bold text-lg mb-1 text-on-surface">Trade Name</h3>
                <p className="text-[#3e4850]">TripoMist (TripoMist Travel Agency)</p>
              </div>
            </div>

            <div className="bg-white border border-[#bec8d2]/30 rounded-2xl p-6 relative overflow-hidden flex gap-4 shadow-sm">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#006591]"></div>
              <span className="material-symbols-outlined text-[#006591] text-3xl">location_on</span>
              <div>
                <h3 className="font-bold text-lg mb-1 text-on-surface">Registered Address</h3>
                <p className="text-[#3e4850] leading-relaxed">
                  3rd Floor, Main Ring Road,<br />
                  Rajouri Garden, New Delhi,<br />
                  Delhi, 110027, India
                </p>
              </div>
            </div>

            <div className="bg-white border border-[#bec8d2]/30 rounded-2xl p-6 relative overflow-hidden flex gap-4 shadow-sm">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#006591]"></div>
              <span className="material-symbols-outlined text-[#006591] text-3xl">call</span>
              <div>
                <h3 className="font-bold text-lg mb-1 text-on-surface">Phone Number</h3>
                <a href="tel:+919990802608" className="text-[#006591] font-semibold hover:underline">+91 9990802608</a>
                <p className="text-xs text-[#3e4850] mt-1">Available 10:00 AM - 7:00 PM (Mon-Sat)</p>
              </div>
            </div>

            <div className="bg-white border border-[#bec8d2]/30 rounded-2xl p-6 relative overflow-hidden flex gap-4 shadow-sm">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#006591]"></div>
              <span className="material-symbols-outlined text-[#006591] text-3xl">mail</span>
              <div>
                <h3 className="font-bold text-lg mb-1 text-on-surface">Email Address</h3>
                <a href="mailto:contact@tripomist.com" className="text-[#006591] font-semibold hover:underline">contact@tripomist.com</a>
                <p className="text-xs text-[#3e4850] mt-1">We typically reply within 24 hours.</p>
              </div>
            </div>
          </div>

          {/* Quick Message Form */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-[#bec8d2]/30 rounded-2xl p-8 relative overflow-hidden shadow-sm animate-fade-in">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#006591] to-[#0ea5e9]"></div>
              <h2 className="text-2xl font-bold text-on-surface mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006591]">send</span> Send a Message
              </h2>
              
              {!submitted ? (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-1" htmlFor="name">Your Name</label>
                    <input 
                      required 
                      id="name" 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-lg px-4 py-2.5 text-on-surface border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white focus:border-[#0EA5E9] focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]" 
                      placeholder="Rahul Sharma" 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-on-surface mb-1" htmlFor="email">Email Address</label>
                      <input 
                        required 
                        id="email" 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-lg px-4 py-2.5 text-on-surface border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white focus:border-[#0EA5E9] focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]" 
                        placeholder="rahul@example.com" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-on-surface mb-1" htmlFor="phone">Phone Number</label>
                      <input 
                        required 
                        id="phone" 
                        type="tel" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-lg px-4 py-2.5 text-on-surface border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white focus:border-[#0EA5E9] focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]" 
                        placeholder="+91 9990802608" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-1" htmlFor="message">Message</label>
                    <textarea 
                      required 
                      id="message" 
                      rows="4" 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full rounded-lg px-4 py-2.5 text-on-surface border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white focus:border-[#0EA5E9] focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]" 
                      placeholder="Tell us about your requirements..."
                    ></textarea>
                  </div>

                  <button type="submit" className="w-full bg-[#006591] hover:bg-[#004e72] text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md">
                    <span className="material-symbols-outlined text-base">send</span> Send Message
                  </button>
                </form>
              ) : (
                <div className="text-center p-6 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="material-symbols-outlined text-emerald-500 text-4xl mb-2 block">check_circle</span>
                  <h3 className="text-lg font-bold text-emerald-700">Thank you!</h3>
                  <p className="text-emerald-600 text-sm">Your message has been received. Our team will get back to you shortly.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#bec8d2]/30 py-6 text-center">
        <p className="text-sm text-[#3e4850]">© 2026 TripoMist. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default ContactUs
