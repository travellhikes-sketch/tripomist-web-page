import fs from 'fs';
import path from 'path';

const filePath = 'src/pages/PackageDetail.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// The file currently imports things and defines `function ItinerarySpiti() {`
// Let's replace the whole top part of the function until the `return` statement.
// We'll use a regex to grab the component declaration and its static trip data.

const replacement = `import React, { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { supabase } from '../supabaseClient'

function PackageDetail() {
  const { id } = useParams()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('itinerary')
  const [travellers, setTravellers] = useState(2)
  const [isAddedToCart, setIsAddedToCart] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    async function fetchPackage() {
      const { data, error } = await supabase
        .from('Pakage')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        console.error('Error fetching package:', error)
      } else {
        // Map data to match the UI fields
        setTrip({
          title: data.title,
          badge: "Most Popular", // Default or you can add logic
          state: data.state,
          durationText: data.duration,
          numericPrice: data.price, // used for cart calculation
          price: \`₹\${data.price.toLocaleString('en-IN')}\`,
          originalPrice: \`₹\${data.original_price.toLocaleString('en-IN')}\`,
          discountText: data.discount_text,
          pickup: data.departure_from,
          heroImg: data.banner_image || data.image_url,
          overview: data.short_description,
          description: data.full_description,
          inclusions: data.inclusions || [],
          exclusions: data.exclusions || [],
          highlights: data.itinerary ? data.itinerary.map(item => item.title) : [],
          itinerary: data.itinerary || []
        })
      }
      setLoading(false)
    }
    if (id) {
      fetchPackage()
    }
  }, [id])

  useEffect(() => {
    if (!trip) return;
    const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
    const isAdded = cartItems.some(item => item.title === trip.title);
    setIsAddedToCart(isAdded);
  }, [trip]);

  const handleAddToCart = () => {
    if (!trip) return;
    let cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
    if (isAddedToCart) {
      cartItems = cartItems.filter(item => item.title !== trip.title);
      localStorage.setItem('cart', JSON.stringify(cartItems));
      setIsAddedToCart(false);
    } else {
      cartItems.push({
        id: Date.now(),
        title: trip.title,
        duration: trip.durationText || "Package",
        travellers: travellers,
        price: trip.numericPrice,
        total: trip.numericPrice * travellers
      });
      localStorage.setItem('cart', JSON.stringify(cartItems));
      setIsAddedToCart(true);
    }
    window.dispatchEvent(new Event('cartUpdated'));
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest">
        <p className="text-xl text-primary font-bold">Loading...</p>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest">
        <p className="text-xl text-red-500 font-bold">Package not found</p>
      </div>
    )
  }

  return (`;

// We'll replace everything from 'import React' down to 'return ('
// Assuming the first return is for the component rendering, but wait...
// There might be early returns, but we copied ItinerarySpiti which has a single main return.

const regex = /import React,[\s\S]*?return \(/;
content = content.replace(regex, replacement);

// And change export default ItinerarySpiti to export default PackageDetail
content = content.replace(/export default ItinerarySpiti/g, "export default PackageDetail");

fs.writeFileSync(filePath, content, 'utf8');
