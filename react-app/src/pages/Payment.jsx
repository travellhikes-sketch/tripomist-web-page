import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Payment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tripTitle = searchParams.get('trip');
  const price = searchParams.get('price');

  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    // Simulate payment processing
    const timer = setTimeout(() => {
      setIsProcessing(false);

      // Clear cart on successful payment
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cartUpdated'));
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest ">
      <Navbar />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-16 md:py-24 mt-20 text-center">
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center gap-6 animate-pulse">
            <div className="w-24 h-24 border-4 border-[#136b8a] border-t-transparent rounded-full animate-spin"></div>
            <h2 className="text-2xl font-bold text-gray-900">Processing Payment...</h2>
            <p className="text-gray-500">Please do not close this window.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-6 animate-fade-in">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-lg mb-4">
              <span className="material-symbols-outlined text-[60px]">check_circle</span>
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Payment Successful!</h1>
            <p className="text-gray-600 text-lg">
              Your booking for <strong className="text-[#136b8a]">{tripTitle}</strong> has been confirmed.
              Amount paid: <strong>₹{Number(price).toLocaleString()}</strong>.
            </p>
            <p className="text-gray-500 mt-2 mb-8">
              We have sent the booking details and invoice to your registered email address and WhatsApp.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-[#136b8a] hover:bg-[#0f556e] text-white font-bold py-3.5 px-8 rounded-xl shadow-md transition-all active:scale-[0.98] text-lg"
            >
              Back to Home
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
