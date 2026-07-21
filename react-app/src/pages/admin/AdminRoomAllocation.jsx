import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Bed, Users, Search, AlertCircle } from 'lucide-react';
import AdminBookingModal from '../../components/admin/AdminBookingModal';

const AdminRoomAllocation = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      // Fetch bookings with their travellers and rooms
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          id, 
          booking_reference, 
          package_title, 
          travel_date, 
          status,
          booking_travellers (id, sharing_type, room_id),
          booking_rooms (id, room_number, room_type)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Process the data to calculate stats per booking
      const processedBookings = (data || []).map(b => {
        const travellers = b.booking_travellers || [];
        const rooms = b.booking_rooms || [];
        
        const totalTravellers = travellers.length;
        const doubleTravellers = travellers.filter(t => t.sharing_type === 'Double').length;
        const tripleTravellers = travellers.filter(t => t.sharing_type === 'Triple').length;
        const quadTravellers = travellers.filter(t => t.sharing_type === 'Quad').length;
        
        const allocatedTravellers = travellers.filter(t => t.room_id !== null).length;
        const unallocatedTravellers = totalTravellers - allocatedTravellers;

        return {
          ...b,
          stats: {
            total: totalTravellers,
            double: doubleTravellers,
            triple: tripleTravellers,
            quad: quadTravellers,
            allocated: allocatedTravellers,
            unallocated: unallocatedTravellers,
            roomsTotal: rooms.length
          }
        };
      });

      setBookings(processedBookings);
    } catch (err) {
      console.error('Error fetching room allocations:', err);
      setError('Failed to load room allocations');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (bookingId) => {
    setSelectedBookingId(bookingId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBookingId(null);
    fetchBookings(); // Refresh data in case changes were made
  };

  const filteredBookings = bookings.filter(b => 
    (b.booking_reference?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (b.package_title?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bed className="text-[#136b8a]" /> Room Allocation Manager
          </h1>
          <p className="text-gray-500 mt-1">Manage and track room assignments for all bookings.</p>
        </div>
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Search reference or package..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#136b8a]/20 focus:border-[#136b8a] outline-none transition-all"
          />
          <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-[#136b8a] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Booking</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Trip Details</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Pax Breakdown</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Allocation Status</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">No bookings found matching your search.</td>
                  </tr>
                ) : (
                  filteredBookings.map(booking => (
                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{booking.booking_reference || 'N/A'}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          <span className={`px-2 py-0.5 rounded-full inline-block mt-1 ${
                            booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                            booking.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-gray-800 line-clamp-1">{booking.package_title}</div>
                        <div className="text-sm text-gray-500">{booking.travel_date}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 font-bold text-gray-800" title="Total Travellers">
                            <Users size={14} className="text-[#136b8a]" /> {booking.stats.total}
                          </div>
                          <div className="flex gap-2 text-xs text-gray-500">
                            <span title="Double">D:{booking.stats.double}</span>
                            <span title="Triple">T:{booking.stats.triple}</span>
                            <span title="Quad">Q:{booking.stats.quad}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-gray-200 rounded-full h-1.5 max-w-[100px]">
                              <div 
                                className={`h-1.5 rounded-full ${booking.stats.unallocated === 0 && booking.stats.total > 0 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                style={{ width: `${booking.stats.total > 0 ? (booking.stats.allocated / booking.stats.total) * 100 : 0}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium text-gray-600">
                              {booking.stats.allocated}/{booking.stats.total}
                            </span>
                          </div>
                          {booking.stats.unallocated > 0 ? (
                            <span className="text-xs text-amber-600 font-medium">{booking.stats.unallocated} Unallocated</span>
                          ) : booking.stats.total > 0 ? (
                            <span className="text-xs text-emerald-600 font-medium">Fully Allocated</span>
                          ) : (
                            <span className="text-xs text-gray-400">No Travellers</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleOpenModal(booking.id)}
                          className="px-4 py-2 bg-[#136b8a] text-white text-sm font-semibold rounded-lg hover:bg-[#0f556e] transition-colors"
                        >
                          Manage Rooms
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <AdminBookingModal
          bookingId={selectedBookingId}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default AdminRoomAllocation;
