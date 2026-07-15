import React from 'react'
import ReadMoreText from '../components/ReadMoreText'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const reviews = [
  {
    id: 1,
    name: "Rahul Sharma",
    location: "Mumbai",
    rating: 5,
    text: "The Ladakh expedition was absolutely breathtaking. The Tripomist team arranged everything perfectly from acclimatization to the Pangong Tso visit. Highly recommend!",
    date: "12 Aug 2025"
  },
  {
    id: 2,
    name: "Priya Patel",
    location: "Ahmedabad",
    rating: 5,
    text: "Our family trip to Kerala was wonderfully organized. The houseboat stay was the highlight of our vacation. Thanks for the memories!",
    date: "03 Sep 2025"
  },
  {
    id: 3,
    name: "Vikram Singh",
    location: "Delhi",
    rating: 4,
    text: "Great experience in Spiti Valley. The roads were tough but the driver was very experienced. The homestays provided authentic local experiences.",
    date: "28 Jul 2025"
  },
  {
    id: 4,
    name: "Ananya Desai",
    location: "Pune",
    rating: 5,
    text: "Meghalaya in monsoon is magical! The guides knew all the best spots for the living root bridges. Everything was flawless.",
    date: "15 Sep 2025"
  },
  {
    id: 5,
    name: "Siddharth Rao",
    location: "Bangalore",
    rating: 5,
    text: "International trip to Bali was super smooth. Visa, flights, and hotels were all handled so well. We just had to relax and enjoy.",
    date: "22 Oct 2025"
  },
  {
    id: 6,
    name: "Neha Gupta",
    location: "Kolkata",
    rating: 4,
    text: "The Kashmir valley tour was beautiful. Only minor issue was a delay with one hotel check-in, but the support team resolved it quickly.",
    date: "05 Nov 2025"
  }
];

export default function Review() {
  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest">
      <Navbar />

      {/* Hero Video/Image Banner */}
      <section className="relative w-full h-[50vh] min-h-[400px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1517840901100-8179e982acb7?w=1200&q=80"
          alt="Customer Reviews"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        <div className="absolute bottom-10 left-0 right-0 z-10 flex flex-col items-center justify-end px-4">
          <h1 className="text-white text-3xl md:text-5xl font-bold text-center tracking-tight">
            Customer Reviews
          </h1>
        </div>

        
      </section>

      {/* About Section */}
      <section className="w-full max-w-6xl mx-auto px-4 pt-12 pb-6">
        <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-4">
          What Our Travelers Say
        </h2>
        <ReadMoreText text="What if we say to you that there's a place wherein the clouds came down to greet the mountains, where rivers whisper the old secrets, and where time slows down just to make you able to take it all in? Read the experiences of those who have explored these magical places with us." />
        
        
      </section>

      {/* Reviews Grid */}
      <main className="max-w-6xl mx-auto px-4 pb-36 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/20 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-lg">
                  {review.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">{review.name}</h3>
                  <p className="text-xs text-on-surface-variant">{review.location} • {review.date}</p>
                </div>
              </div>
              <div className="flex gap-1 mb-3 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: i < review.rating ? "'FILL' 1" : "'FILL' 0" }}>
                    star
                  </span>
                ))}
              </div>
              <p className="text-on-surface-variant text-sm leading-relaxed italic">
                "{review.text}"
              </p>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}
