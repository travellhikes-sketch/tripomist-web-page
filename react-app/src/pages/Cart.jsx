import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';

function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      setCartItems(JSON.parse(storedCart));
    }
  }, []);

  const handleRemoveItem = (idToRemove) => {
    const updatedCart = cartItems.filter(item => item.id !== idToRemove);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.total, 0);
  const taxesAndFees = cartItems.length > 0 ? 1250 : 0;
  const grandTotal = subtotal + taxesAndFees;

  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest">
      <Navbar />

      {/* Hero Video/Image Banner */}
      <section className="relative w-full h-[50vh] min-h-[400px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80"
          alt="Your Cart"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        <div className="absolute bottom-10 left-0 right-0 z-10 flex flex-col items-center justify-end px-4">
          <h1 className="text-white text-3xl md:text-5xl font-bold text-center tracking-tight">
            Your Cart
          </h1>
        </div>
      </section>

      {/* About Section */}
      <section className="w-full max-w-6xl mx-auto px-4 pt-12 pb-6">
        <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-4">
          Review Your Trip Packages
        </h2>
        <p className="text-on-surface-variant font-body-md text-body-md leading-relaxed">
          You are one step closer to your dream destination. Review the packages you've selected and proceed to checkout when you are ready. We ensure a seamless booking experience.
        </p>
      </section>

      {/* Cart Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pb-36 pt-4">
        <div className="bg-white rounded-xl shadow-sm border border-outline-variant/30 p-6 flex flex-col gap-6">
          
          {cartItems.length === 0 ? (
            <div className="text-center py-10">
              <span className="material-symbols-outlined text-[64px] text-gray-300 mb-4">shopping_cart</span>
              <h3 className="font-bold text-xl text-gray-800 mb-2">Your cart is empty</h3>
              <p className="text-gray-500 mb-6">Looks like you haven't added any trips yet.</p>
              <button 
                onClick={() => navigate('/')}
                className="bg-primary text-white px-6 py-2.5 rounded-full font-bold hover:opacity-90 transition-opacity"
              >
                Explore Packages
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-slate-400">landscape</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-on-surface">{item.title}</h3>
                        <p className="text-on-surface-variant text-sm">{item.duration} • {item.travellers} {item.travellers > 1 ? 'Travellers' : 'Traveller'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="font-bold text-lg text-primary">₹{item.total.toLocaleString()}</span>
                      <button 
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-error hover:bg-error-container p-2 rounded-full transition-colors flex items-center justify-center"
                        title="Remove item"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Summary */}
              <div className="mt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-on-surface-variant">Subtotal</span>
                  <span className="font-medium">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-on-surface-variant">Taxes & Fees</span>
                  <span className="font-medium">₹{taxesAndFees.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mt-4 pt-4 border-t border-outline-variant/30">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-xl text-primary">₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8">
                <button 
                  onClick={() => navigate('/')}
                  className="flex-1 py-3 px-4 rounded-xl border border-outline-variant text-on-surface font-semibold hover:bg-surface-container transition-colors"
                >
                  Continue Browsing
                </button>
                <button 
                  onClick={() => navigate('/checkout')}
                  className="flex-1 py-3 px-4 rounded-xl bg-primary text-white font-semibold hover:opacity-90 transition-opacity shadow-md"
                >
                  Proceed to Checkout
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Cart;
