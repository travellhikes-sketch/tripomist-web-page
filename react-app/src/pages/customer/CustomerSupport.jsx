import React from 'react';
import { Phone, Mail, MessageCircle, MapPin, ExternalLink, HelpCircle } from 'lucide-react';

const CustomerSupport = () => {
  const faqs = [
    {
      q: "How can I check my pickup details?",
      a: "Your pickup point and reporting time are available in the 'My Trips' section under 'Trip Details'. If they are not updated yet, our team will contact you 24 hours before departure."
    },
    {
      q: "Can I change my boarding point?",
      a: "Changes to boarding points must be requested at least 48 hours before departure. Please contact us via WhatsApp to request a change."
    },
    {
      q: "How do I pay my pending balance?",
      a: "Currently, online payments for pending balances are being upgraded. Please contact our support team via WhatsApp or Call to complete your payment securely."
    },
    {
      q: "What is the cancellation policy?",
      a: "Cancellations made 15 days before departure incur a 25% fee. Cancellations within 15 days are non-refundable. Please refer to our Refund Policy for more details."
    }
  ];

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Support & Contact</h1>
        <p className="text-gray-500 mt-1">We're here to help make your journey smooth and memorable.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Contact Cards */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone size={24} />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Call Us</h3>
            <p className="text-sm text-gray-500 mb-4">Available 10 AM to 7 PM</p>
            <a href="tel:+918800626084" className="inline-block bg-gray-100 text-gray-900 font-bold py-2 px-6 rounded-lg hover:bg-gray-200 transition-colors">
              +91 8800626084
            </a>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
            <div className="w-12 h-12 bg-[#25D366]/10 text-[#25D366] rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle size={24} />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">WhatsApp Support</h3>
            <p className="text-sm text-gray-500 mb-4">Quickest way to reach us</p>
            <a href="https://wa.me/918800626084" target="_blank" rel="noreferrer" className="inline-block bg-[#25D366] text-white font-bold py-2 px-6 rounded-lg hover:bg-[#1ebd5a] transition-colors">
              Chat on WhatsApp
            </a>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center shrink-0">
              <Mail size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Email</h3>
              <a href="mailto:support@tripomist.com" className="text-sm text-[#136b8a] hover:underline font-medium">support@tripomist.com</a>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center shrink-0">
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Office</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                New Delhi, India
              </p>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 shadow-sm h-fit">
          <h2 className="font-bold text-gray-900 text-lg mb-6 flex items-center gap-2">
            <HelpCircle size={20} className="text-[#136b8a]"/> Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                <h3 className="font-bold text-gray-800 text-sm mb-2">{faq.q}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-3">Need more information?</p>
            <div className="flex flex-wrap gap-3">
              <a href="/terms-conditions" target="_blank" className="text-xs font-bold text-[#136b8a] bg-blue-50 px-3 py-1.5 rounded flex items-center gap-1 hover:bg-blue-100 transition-colors">
                Terms & Conditions <ExternalLink size={10} />
              </a>
              <a href="/refund-policy" target="_blank" className="text-xs font-bold text-[#136b8a] bg-blue-50 px-3 py-1.5 rounded flex items-center gap-1 hover:bg-blue-100 transition-colors">
                Refund Policy <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CustomerSupport;
