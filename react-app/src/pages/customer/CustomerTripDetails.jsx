import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Users,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  CreditCard,
  Download,
  CheckCircle,
  AlertCircle,
  Check
} from 'lucide-react';
import { getStatusBadge, getPaymentBadge } from '../../utils/statusHelpers';

const CustomerTripDetails = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .eq('user_id', session.user.id)
        .single();

      if (error || !data) {
        setError('Booking not found or you do not have permission to view it.');
      } else {
        setBooking(data);
      }
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#01AFD1]"></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center animate-fade-in">
        <AlertCircle size={48} className="text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Trip Not Found</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <Link to="/account/trips" className="text-[#01AFD1] font-bold hover:underline">
          &larr; Back to My Trips
        </Link>
      </div>
    );
  }

  const totalAmount = Number(booking.total_amount || 0);
  const discountAmount = Number(booking.manual_discount_amount || 0);
  const discountPercentage = totalAmount > 0 ? ((discountAmount / totalAmount) * 100).toFixed(2) : 0;
  const finalPayable = Number(booking.final_amount || totalAmount);

  const amountPaid = booking.payment_status === 'paid'
    ? finalPayable
    : Number(booking.advance_payment || 0);
  const pendingAmount = Math.max(0, finalPayable - amountPaid);

  const getTimelineSteps = () => {
    const isPast = new Date(booking.travel_date) < new Date();
    const isConfirmed = booking.booking_status === 'confirmed' || booking.booking_status === 'completed';
    const isCompleted = booking.booking_status === 'completed';
    const isPaid = booking.payment_status === 'paid';
    const isHalfPaid = booking.payment_status === 'pending' && amountPaid > 0;

    if (booking.booking_status === 'cancelled') {
      return [
        { label: 'Booking Placed', done: true },
        { label: 'Cancelled', done: true, isError: true }
      ];
    }

    const steps = [
      { label: 'Booking Placed', done: true },
      { label: 'Booking Confirmed', done: isConfirmed },
      { label: isPaid ? 'Payment Received' : 'Half Payment Received', done: isPaid || isHalfPaid },
      { label: 'Trip Scheduled', done: isConfirmed && booking.travel_date },
    ];

    if (!isPaid) {
      steps.push({ label: 'Remaining Payment On Board', done: false });
    }

    steps.push({ label: 'Trip Completed', done: isCompleted });

    return steps;
  };

  const steps = getTimelineSteps();

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-6">

      <div className="flex items-center gap-3">
        <Link to="/account/trips" className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trip Details</h1>
          <p className="text-sm  text-gray-500 font-bold mt-1">ID: {booking.booking_id || booking.booking_reference || booking.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">

          {/* Trip Header Card */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="bg-[#01AFD1] p-6 text-white">
              <div className="flex justify-between items-start mb-4">
                {getStatusBadge(booking.booking_status)}
              </div>
              <h2 className="text-2xl font-bold mb-2">{booking.package_title}</h2>
              <div className="flex flex-wrap gap-4 text-white/80 text-sm font-medium">
                <span className="flex items-center gap-1.5"><Calendar size={16}/> {new Date(booking.travel_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <span className="flex items-center gap-1.5"><Users size={16}/> {booking.travellers} Person(s)</span>
              </div>
            </div>

            <div className="p-6 grid grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Lead Traveller</p>
                <p className="font-semibold text-gray-900">{booking.customer_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Contact Details</p>
                <p className="font-semibold text-gray-900">{booking.phone}</p>
                <p className="text-sm text-gray-600">{booking.email}</p>
              </div>

              {(booking.pickup_point || booking.reporting_time) && (
                <div className="col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-100 flex gap-4">
                  <MapPin size={24} className="text-slate-400 shrink-0" />
                  <div>
                    <p className="font-bold text-gray-900 mb-1">Boarding Details</p>
                    {booking.pickup_point && <p className="text-sm text-gray-600"><span className="font-semibold text-gray-700">Point:</span> {booking.pickup_point}</p>}
                    {booking.reporting_time && <p className="text-sm text-gray-600"><span className="font-semibold text-gray-700">Reporting Time:</span> {booking.reporting_time}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Trip Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-6">Trip Progress</h3>
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-200" />
              <div className="space-y-6 relative">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 border-2 ${step.isError ? 'bg-rose-100 border-rose-500 text-rose-600' : step.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-gray-300 text-transparent'}`}>
                      {(step.done || step.isError) && <Check size={12} strokeWidth={3} />}
                    </div>
                    <div className="pt-0.5">
                      <p className={`text-sm font-semibold ${step.isError ? 'text-rose-600' : step.done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Need Help */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><MessageCircle size={18} className="text-[#01AFD1]"/> Need Help with this Trip?</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="tel:+918800626084" className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                <Phone size={16} /> Call Us
              </a>
              <a href="https://wa.me/918800626084" target="_blank" rel="noreferrer" className="flex-1 bg-[#25D366] text-white py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#1ebd5a] transition-colors">
                <MessageCircle size={16} /> WhatsApp
              </a>
            </div>
          </div>

        </div>

        {/* Sidebar - Payment Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><CreditCard size={18} className="text-[#01AFD1]"/> Payment Summary</h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Total Price</span>
                <span className="font-bold text-gray-900">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-sm text-emerald-600">
                  <span>Discount Allowed ({discountPercentage}%)</span>
                  <span className="font-bold">-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
                  <span className="font-semibold text-gray-700">Final Payable</span>
                  <span className="font-bold text-gray-900">₹{finalPayable.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm mt-3">
                <span className="text-gray-500">Amount Paid</span>
                <span className="font-bold text-emerald-600">₹{amountPaid.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-sm pt-3 border-t border-gray-100">
                <span className="font-bold text-gray-700">Remaining To Pay On Board</span>
                <span className="font-bold text-rose-600">₹{pendingAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-center mb-4">
                {getPaymentBadge(booking.payment_status, booking.advance_payment)}
              </div>

              {booking.payment_status?.toLowerCase() !== 'paid' && (
                <button disabled className="w-full bg-[#01AFD1] text-white py-2.5 rounded-lg font-bold text-sm opacity-50 cursor-not-allowed">
                  Pay Now (Coming Soon)
                </button>
              )}

              <button disabled className="w-full bg-white border border-gray-200 text-gray-500 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
                <Download size={16} /> Download Voucher
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default CustomerTripDetails;
