import React, { useState } from 'react'

function DownloadItineraryModal({ isOpen, onClose, tripTitle, pdfUrl }) {
  const [submitted, setSubmitted] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [callback, setCallback] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log(`Itinerary download requested: Name=${name}, Phone=${phone}, Trip=${tripTitle}, Callback=${callback}`)
    if (pdfUrl) {
      window.open(pdfUrl, '_blank')
    }
    setSubmitted(true)
  }

  const handleClose = () => {
    setSubmitted(false)
    setName('')
    setPhone('')
    setCallback(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose}></div>
      
      {/* Modal Card */}
      <div className="relative bg-[#f8f9fa] w-full max-w-md rounded-[2rem] shadow-xl overflow-hidden z-10 p-8 flex flex-col items-center">
        {/* Close Button */}
        <button className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors" onClick={handleClose}>
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>

        {!submitted ? (
          <>
            {/* Header matching Photo 4 */}
            <h2 className="text-[28px] font-bold text-gray-900 mb-1 tracking-tight text-center mt-2">Download Itinerary</h2>
            <p className="text-gray-500 text-sm mb-8 text-center">Please fill in your details to finish</p>
            
            {/* Form Content */}
            <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
              
              {/* Full Name Input (like Photo 4) */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-gray-400 text-xl">person</span>
                </div>
                <input 
                  required 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 pl-12 pr-4 text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400 font-medium" 
                  placeholder="Full Name" 
                />
              </div>

              {/* Phone Input (like Photo 4 style but 3rd photo elements) */}
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-gray-400 text-xl">phone_iphone</span>
                </div>
                <div className="absolute inset-y-0 left-11 flex items-center pointer-events-none text-gray-500 font-medium">
                  <span className="text-sm mr-1">+91</span> <span className="text-gray-300">|</span>
                </div>
                <input 
                  required 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 pl-[84px] pr-4 text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400 font-medium tracking-wide" 
                  placeholder="WhatsApp Number" 
                />
              </div>

              {/* Checkbox */}
              <div className="flex items-center gap-3 py-1 px-1">
                <input 
                  id="callback-checkbox" 
                  type="checkbox" 
                  checked={callback}
                  onChange={(e) => setCallback(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#136b8a] focus:ring-[#136b8a] cursor-pointer" 
                />
                <label className="text-gray-500 text-sm cursor-pointer font-medium" htmlFor="callback-checkbox">Expecting a callback?</label>
              </div>

              {/* Submit Button (like Photo 4) */}
              <button className="w-full bg-[#136b8a] hover:bg-[#0f556e] text-white font-bold py-4 rounded-2xl shadow-md transition-all mt-4 cursor-pointer text-base active:scale-[0.98]" type="submit">
                Submit & Download
              </button>
            </form>
          </>
        ) : (
          /* Success Content */
          <div className="py-6 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-4xl text-green-500 font-bold">check</span>
            </div>
            <h3 className="font-bold text-gray-900 text-2xl">Download Started!</h3>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">We have sent the PDF itinerary for <strong className="text-gray-800">{tripTitle}</strong> to your WhatsApp number. Our Kaptain will contact you shortly.</p>
            <button className="bg-[#136b8a] text-white font-semibold px-8 py-3 rounded-xl hover:bg-[#0f556e] transition-colors cursor-pointer w-full" onClick={handleClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default DownloadItineraryModal
