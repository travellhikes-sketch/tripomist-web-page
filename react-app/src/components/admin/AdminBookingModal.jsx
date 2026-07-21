import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { X, Check, Plus, Trash2, AlertCircle, RefreshCw, Printer } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const AdminBookingModal = ({ isOpen, onClose, onSuccess, bookingId = null }) => {
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState([]);
  const [error, setError] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [activeTab, setActiveTab] = useState('details'); // details, travellers, rooms, activity

  const initialFormState = {
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    package_id: '',
    package_title: '',
    travel_date: '',
    total_amount: 0,
    advance_payment: 0,
    remaining_payment: 0,
    payment_status: 'unpaid',
    booking_status: 'pending',
    payment_method: '',
    notes: '',
    booking_source: 'manual',
    booking_reference: ''
  };

  const initialTraveller = {
    id: null,
    full_name: '',
    phone: '',
    email: '',
    age: '',
    gender: '',
    is_primary: true,
    emergency_contact_name: '',
    emergency_contact_phone: '',
    id_type: '',
    id_number: '',
    notes: '',
    sharing_type: 'Double',
    room_id: null,
    bus_seat_number: '',
    pickup_point: '',
    check_in_status: 'pending',
    display_order: 0
  };

  const [formData, setFormData] = useState(initialFormState);
  const [originalData, setOriginalData] = useState(null); // for activity logs
  const [travellers, setTravellers] = useState([{ ...initialTraveller }]);

  useEffect(() => {
    if (isOpen) {
      loadPackages();
      if (bookingId) {
        loadBooking(bookingId);
      } else {
        setFormData({
          ...initialFormState,
          booking_reference: `MB-${Date.now().toString().slice(-6)}`
        });
        setTravellers([{ ...initialTraveller }]);
        setRooms([]);
        setOriginalData(null);
        setActivityLogs([]);
        setActiveTab('details');
      }
    }
  }, [isOpen, bookingId]);

  const loadPackages = async () => {
    const { data } = await supabase.from('Pakage').select('id, name, price');
    if (data) setPackages(data);
  };

  const loadBooking = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const { data: bookingData, error: bookingErr } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .single();
      if (bookingErr) throw bookingErr;
      
      setFormData(bookingData);
      setOriginalData(bookingData);

      const { data: travellersData, error: travErr } = await supabase
        .from('booking_travellers')
        .select('*')
        .eq('booking_id', id)
        .order('display_order', { ascending: true });
      
      if (travErr) throw travErr;
      if (travellersData && travellersData.length > 0) {
        setTravellers(travellersData);
      } else {
        // Safe fallback if no travellers exist yet
        setTravellers([{
          ...initialTraveller,
          full_name: bookingData.customer_name || '',
          phone: bookingData.customer_phone || '',
          email: bookingData.customer_email || ''
        }]);
      }

      const { data: logsData } = await supabase
        .from('booking_activity_logs')
        .select('*')
        .eq('booking_id', id)
        .order('changed_at', { ascending: false });
      
      if (logsData) setActivityLogs(logsData);

      const { data: roomsData } = await supabase
        .from('booking_rooms')
        .select('*')
        .eq('booking_id', id)
        .order('created_at', { ascending: true });
        
      if (roomsData) setRooms(roomsData);

    } catch (err) {
      setError('Failed to load booking details: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  useEffect(() => {
    const total = parseFloat(formData.total_amount) || 0;
    let advance = parseFloat(formData.advance_payment) || 0;
    if (advance < 0) advance = 0;
    if (advance > total) advance = total;
    const remaining = total - advance;

    let payStatus = 'unpaid';
    if (advance === 0) payStatus = 'unpaid';
    else if (advance > 0 && remaining > 0) payStatus = 'partially_paid';
    else if (remaining === 0 && total > 0) payStatus = 'paid';

    setFormData(prev => {
      if (prev.advance_payment === advance && prev.remaining_payment === remaining && prev.payment_status === payStatus) {
        return prev;
      }
      return {
        ...prev,
        advance_payment: advance,
        remaining_payment: remaining,
        payment_status: payStatus
      };
    });
  }, [formData.total_amount, formData.advance_payment]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'package_id') {
      const selectedPkg = packages.find(p => p.id === value);
      setFormData(prev => ({
        ...prev,
        package_id: value,
        package_title: selectedPkg ? selectedPkg.name : '',
        total_amount: selectedPkg && !prev.total_amount ? selectedPkg.price : prev.total_amount
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTravellerChange = (index, field, value) => {
    const updated = [...travellers];
    if (field === 'is_primary' && value === true) {
      updated.forEach(t => t.is_primary = false);
    }
    updated[index] = { ...updated[index], [field]: value };
    setTravellers(updated);
  };

  const addTraveller = () => {
    setTravellers([
      ...travellers,
      { ...initialTraveller, is_primary: travellers.length === 0, display_order: travellers.length }
    ]);
  };

  const removeTraveller = (index) => {
    const updated = travellers.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some(t => t.is_primary)) {
      updated[0].is_primary = true;
    }
    setTravellers(updated);
  };

  const logActivity = async (bookingId, action, fieldName, oldVal, newVal) => {
    const session = await supabase.auth.getSession();
    const userId = session.data?.session?.user?.id || null;
    await supabase.from('booking_activity_logs').insert([{
      booking_id: bookingId,
      action,
      field_name: fieldName,
      old_value: String(oldVal || ''),
      new_value: String(newVal || ''),
      changed_by: userId
    }]);
  };

  // --- Room Allocation Logic ---
  const autoGenerateRooms = () => {
    const newRooms = [...rooms];
    const newTravellers = [...travellers];

    ['Double', 'Triple', 'Quad'].forEach(type => {
      const capacity = type === 'Double' ? 2 : type === 'Triple' ? 3 : 4;
      const unassigned = newTravellers.filter(t => t.sharing_type === type && !t.room_id);
      
      let currentRoom = null;
      let countInRoom = 0;
      
      unassigned.forEach(t => {
        if (!currentRoom || countInRoom >= capacity) {
          const typeRoomsCount = newRooms.filter(r => r.room_type === type).length;
          currentRoom = {
            id: `temp-${Date.now()}-${Math.floor(Math.random()*1000)}`,
            room_number: `${type.charAt(0)}${typeRoomsCount + 1}`,
            room_type: type
          };
          newRooms.push(currentRoom);
          countInRoom = 0;
        }
        t.room_id = currentRoom.id;
        countInRoom++;
      });
    });

    setRooms(newRooms);
    setTravellers(newTravellers);
  };

  const addRoom = (type) => {
    const currentTypeRooms = rooms.filter(r => r.room_type === type);
    setRooms([...rooms, {
      id: `temp-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      room_number: `${type.charAt(0)}${currentTypeRooms.length + 1}`,
      room_type: type
    }]);
  };

  const renameRoom = (roomId, newName) => {
    setRooms(rooms.map(r => r.id === roomId ? { ...r, room_number: newName } : r));
  };

  const deleteRoom = (roomId) => {
    const occupants = travellers.filter(t => t.room_id === roomId);
    if (occupants.length > 0) {
      setError("Cannot delete room with assigned travellers. Remove them first.");
      setTimeout(() => setError(null), 3000);
      return;
    }
    setRooms(rooms.filter(r => r.id !== roomId));
  };

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;
    
    const updatedTravellers = [...travellers];
    const travellerIndex = updatedTravellers.findIndex(t => (t.id || `t-${updatedTravellers.indexOf(t)}`) === draggableId);
    
    if (travellerIndex === -1) return;
    
    const t = updatedTravellers[travellerIndex];
    
    if (destination.droppableId !== 'unassigned') {
      const targetRoom = rooms.find(r => r.id === destination.droppableId);
      if (!targetRoom) return;
      
      const capacity = targetRoom.room_type === 'Double' ? 2 : targetRoom.room_type === 'Triple' ? 3 : 4;
      const currentOccupants = updatedTravellers.filter(tr => tr.room_id === targetRoom.id).length;
      
      if (currentOccupants >= capacity) {
        setError(`Cannot add traveller. ${targetRoom.room_type} room maximum capacity is ${capacity}.`);
        setTimeout(() => setError(null), 3000);
        return;
      }
      
      t.room_id = targetRoom.id;
    } else {
      t.room_id = null;
    }
    
    setTravellers(updatedTravellers);
  };

  const handlePrintSheet = async () => {
    try {
      setLoading(true);
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');

      const doc = new jsPDF('p', 'pt', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header: Company Logo (Placeholder for now, just text if no image)
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("TripoMist", 40, 50);
      
      // QR Code Placeholder
      doc.setDrawColor(0);
      doc.setFillColor(240, 240, 240);
      doc.rect(pageWidth - 90, 30, 50, 50, 'FD'); // 50x50 square
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("QR Code", pageWidth - 83, 58);

      // Title
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Room Allocation Sheet", 40, 80);

      // Info Section
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const ref = formData.booking_reference || bookingId || 'N/A';
      const pkg = formData.package_title || 'N/A';
      const date = formData.travel_date || 'N/A';
      const batch = formData.batch_name || '______________';
      const captain = formData.trip_captain || '______________';

      doc.text(`Booking Ref: ${ref}`, 40, 100);
      doc.text(`Package: ${pkg}`, 40, 115);
      doc.text(`Departure Date: ${date}`, 40, 130);
      
      doc.text(`Batch: ${batch}`, 300, 100);
      doc.text(`Trip Captain: ${captain}`, 300, 115);

      // Summary
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Summary", 40, 160);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Total Pax: ${totalTravellers}`, 40, 175);
      doc.text(`Double: ${doubleCount} pax / ${doubleRooms} rm`, 150, 175);
      doc.text(`Triple: ${tripleCount} pax / ${tripleRooms} rm`, 300, 175);
      doc.text(`Quad: ${quadCount} pax / ${quadRooms} rm`, 450, 175);

      let currentY = 200;

      // Rooms Table
      if (rooms.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.text("No rooms allocated yet.", 40, currentY);
      } else {
        rooms.forEach((room) => {
          const occupants = travellers.filter(t => t.room_id === room.id);
          
          doc.autoTable({
            startY: currentY,
            theme: 'grid',
            headStyles: { fillColor: [19, 107, 138], textColor: 255, fontStyle: 'bold' },
            bodyStyles: { textColor: 50 },
            head: [[`Room: ${room.room_number} (${room.room_type}) - Occupancy: ${occupants.length}`]],
            body: [], 
            margin: { left: 40, right: 40 }
          });

          if (occupants.length > 0) {
            const tableData = occupants.map(t => [
              t.full_name || 'Unnamed',
              `${t.age || '-'} / ${t.gender ? t.gender.substring(0,1).toUpperCase() : '-'}`,
              t.phone || '-',
              `${t.bus_seat_number ? 'Seat ' + t.bus_seat_number : '-'} ${t.pickup_point ? '| ' + t.pickup_point : ''}`
            ]);

            doc.autoTable({
              startY: doc.lastAutoTable.finalY,
              theme: 'plain',
              headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
              head: [['Name', 'Age/Gender', 'Phone', 'Bus/Pickup']],
              body: tableData,
              margin: { left: 40, right: 40 }
            });
          } else {
            doc.autoTable({
              startY: doc.lastAutoTable.finalY,
              theme: 'plain',
              body: [['Empty Room']],
              margin: { left: 40, right: 40 },
              bodyStyles: { fontStyle: 'italic', halign: 'center' }
            });
          }
          currentY = doc.lastAutoTable.finalY + 15;
          
          if (currentY > doc.internal.pageSize.getHeight() - 50) {
             doc.addPage();
             currentY = 40;
          }
        });
      }

      doc.save(`Room_Allocation_${formData.booking_reference || bookingId || 'Sheet'}.pdf`);
      
    } catch (err) {
      console.error(err);
      setError('Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (travellers.length === 0) {
      setError('At least one traveller is required.');
      return;
    }
    if (!travellers.some(t => t.is_primary)) {
      setError('Exactly one traveller must be marked as primary.');
      return;
    }
    for (let i=0; i<travellers.length; i++) {
      if (!travellers[i].full_name.trim()) {
        setError(`Traveller ${i+1} must have a full name.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const isNew = !bookingId;
      const finalBookingData = {
        ...formData,
        travellers_count: travellers.length,
        updated_at: new Date().toISOString()
      };

      let currentBookingId = bookingId;

      if (isNew) {
        const { data: newBooking, error: insertError } = await supabase
          .from('bookings')
          .insert([finalBookingData])
          .select()
          .single();
        if (insertError) throw insertError;
        currentBookingId = newBooking.id;
        await logActivity(currentBookingId, 'Booking Created', null, null, null);
      } else {
        const { error: updateError } = await supabase
          .from('bookings')
          .update(finalBookingData)
          .eq('id', currentBookingId);
        if (updateError) throw updateError;
        
        // Log changes
        const fieldsToTrack = ['booking_status', 'payment_status', 'travel_date', 'total_amount', 'package_title'];
        for (const field of fieldsToTrack) {
          if (originalData[field] !== finalBookingData[field]) {
            await logActivity(currentBookingId, `Updated ${field.replace('_', ' ')}`, field, originalData[field], finalBookingData[field]);
          }
        }
      }

      // Sync Rooms
      const { error: deleteRoomsErr } = await supabase.from('booking_rooms').delete().eq('booking_id', currentBookingId);
      if (deleteRoomsErr) throw deleteRoomsErr;

      const roomsToInsert = rooms.map(r => ({
        booking_id: currentBookingId,
        room_number: r.room_number,
        room_type: r.room_type
      }));
      
      let insertedRooms = [];
      if (roomsToInsert.length > 0) {
        const { data, error: insertRoomsErr } = await supabase.from('booking_rooms').insert(roomsToInsert).select();
        if (insertRoomsErr) throw insertRoomsErr;
        insertedRooms = data;
      }

      // Map temp room IDs to new DB IDs
      const roomIdMap = {};
      rooms.forEach((r, idx) => {
        if (insertedRooms[idx]) roomIdMap[r.id] = insertedRooms[idx].id;
      });

      // Sync Travellers
      const { error: deleteTravErr } = await supabase.from('booking_travellers').delete().eq('booking_id', currentBookingId);
      if (deleteTravErr) throw deleteTravErr;

      const travellersToInsert = travellers.map((t, i) => {
        const payload = {
          ...t,
          id: undefined,
          booking_id: currentBookingId,
          display_order: i
        };
        if (payload.room_id && roomIdMap[payload.room_id]) {
          payload.room_id = roomIdMap[payload.room_id];
        }
        return payload;
      });

      const { error: insertTravErr } = await supabase.from('booking_travellers').insert(travellersToInsert);
      if (insertTravErr) throw insertTravErr;

      if (!isNew && travellers.length !== (originalData?.travellers_count || 1)) {
        await logActivity(currentBookingId, 'Travellers Updated', 'travellers_count', originalData?.travellers_count || 1, travellers.length);
      }

      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save booking.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalTravellers = travellers.length;
  const doubleCount = travellers.filter(t => t.sharing_type === 'Double').length;
  const tripleCount = travellers.filter(t => t.sharing_type === 'Triple').length;
  const quadCount = travellers.filter(t => t.sharing_type === 'Quad').length;
  const doubleRooms = rooms.filter(r => r.room_type === 'Double').length;
  const tripleRooms = rooms.filter(r => r.room_type === 'Triple').length;
  const quadRooms = rooms.filter(r => r.room_type === 'Quad').length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-xl animate-fade-in">
        
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-white z-10 shrink-0">
          <h2 className="text-xl font-bold text-gray-900">{bookingId ? 'Edit Booking' : 'New Manual Booking'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"><X size={20} /></button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 pt-2 shrink-0 bg-gray-50">
          <button onClick={() => setActiveTab('details')} className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'details' ? 'border-[#136b8a] text-[#136b8a]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Primary Details</button>
          <button onClick={() => setActiveTab('travellers')} className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'travellers' ? 'border-[#136b8a] text-[#136b8a]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Travellers <span className="bg-gray-200 text-gray-700 py-0.5 px-2 rounded-full text-xs">{travellers.length}</span>
          </button>
          <button onClick={() => setActiveTab('rooms')} className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'rooms' ? 'border-[#136b8a] text-[#136b8a]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Room Allocation <span className="bg-gray-200 text-gray-700 py-0.5 px-2 rounded-full text-xs">{rooms.length}</span>
          </button>
          {bookingId && (
            <button onClick={() => setActiveTab('activity')} className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'activity' ? 'border-[#136b8a] text-[#136b8a]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Activity Logs</button>
          )}
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2 mb-6"><AlertCircle size={18} /> {error}</div>}
          {loading && <div className="p-8 text-center text-gray-500">Loading booking...</div>}
          
          {!loading && (
            <form id="bookingForm" onSubmit={handleSubmit} className="space-y-8">
              
              {/* PRIMARY DETAILS TAB */}
              <div className={activeTab === 'details' ? 'block space-y-6' : 'hidden'}>
                
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 border-b pb-2 mb-4 uppercase tracking-wide">Legacy Customer Contact (Summary)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Customer Name *</label>
                      <input type="text" name="customer_name" required value={formData.customer_name || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg outline-none focus:border-[#136b8a] text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Phone *</label>
                      <input type="text" name="customer_phone" required value={formData.customer_phone || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg outline-none focus:border-[#136b8a] text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                      <input type="email" name="customer_email" value={formData.customer_email || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg outline-none focus:border-[#136b8a] text-sm" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 italic">Note: True traveller details are now managed in the Travellers tab. This section remains for summary and backwards compatibility.</p>
                </div>

                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 border-b pb-2 mb-4 uppercase tracking-wide">Trip Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Select Package</label>
                      <select name="package_id" value={formData.package_id || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg outline-none focus:border-[#136b8a] text-sm">
                        <option value="">-- Custom Package / None --</option>
                        {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Package Title (Editable) *</label>
                      <input type="text" name="package_title" required value={formData.package_title || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg outline-none focus:border-[#136b8a] text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Travel Date *</label>
                      <input type="date" name="travel_date" required value={formData.travel_date || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg outline-none focus:border-[#136b8a] text-sm" />
                    </div>
                    <div className="md:col-span-2 bg-white p-3 rounded border border-gray-200 shadow-sm">
                      <div className="text-xs font-bold text-gray-500 mb-2 uppercase">Booking Summary</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div className="flex flex-col">
                          <span className="text-gray-400 text-[10px] uppercase">Travellers</span>
                          <span className="font-semibold text-gray-800">{totalTravellers}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-400 text-[10px] uppercase">Double</span>
                          <span className="font-medium text-gray-700">{doubleCount} pax / {doubleRooms} rm</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-400 text-[10px] uppercase">Triple</span>
                          <span className="font-medium text-gray-700">{tripleCount} pax / {tripleRooms} rm</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-400 text-[10px] uppercase">Quad</span>
                          <span className="font-medium text-gray-700">{quadCount} pax / {quadRooms} rm</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Booking Source</label>
                      <select name="booking_source" value={formData.booking_source || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg outline-none focus:border-[#136b8a] text-sm">
                        <option value="manual">Manual / Offline</option>
                        <option value="website">Website</option>
                        <option value="whatsapp">WhatsApp</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 border-b pb-2 mb-4 uppercase tracking-wide">Payment & Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Total Amount (₹) *</label>
                      <input type="number" step="0.01" min="0" name="total_amount" required value={formData.total_amount} onChange={handleInputChange} className="w-full p-2 border rounded-lg outline-none focus:border-[#136b8a] text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Advance (₹)</label>
                      <input type="number" step="0.01" min="0" name="advance_payment" value={formData.advance_payment} onChange={handleInputChange} className="w-full p-2 border rounded-lg outline-none focus:border-[#136b8a] text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Remaining (₹)</label>
                      <input type="number" readOnly value={formData.remaining_payment} className="w-full p-2 border bg-gray-100 rounded-lg text-gray-500 font-mono text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method</label>
                      <input type="text" name="payment_method" placeholder="e.g. UPI, Cash" value={formData.payment_method || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg outline-none focus:border-[#136b8a] text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Payment Status</label>
                      <input type="text" readOnly value={formData.payment_status} className="w-full p-2 border bg-gray-100 rounded-lg text-gray-500 font-medium capitalize text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Booking Status</label>
                      <select name="booking_status" value={formData.booking_status} onChange={handleInputChange} className="w-full p-2 border rounded-lg outline-none focus:border-[#136b8a] text-sm">
                        <option value="enquiry">Enquiry</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                      <input type="text" name="notes" value={formData.notes || ''} onChange={handleInputChange} className="w-full p-2 border rounded-lg outline-none focus:border-[#136b8a] text-sm" />
                    </div>
                  </div>
                </div>
              </div>

              {/* TRAVELLERS TAB */}
              <div className={activeTab === 'travellers' ? 'block space-y-4' : 'hidden'}>
                {travellers.map((traveller, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative">
                    <div className="absolute top-4 right-4 flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 cursor-pointer">
                        <input 
                          type="radio" 
                          name="primary_traveller" 
                          checked={traveller.is_primary} 
                          onChange={() => handleTravellerChange(idx, 'is_primary', true)}
                          className="w-4 h-4 text-[#136b8a]"
                        />
                        Primary Traveller
                      </label>
                      {travellers.length > 1 && (
                        <button type="button" onClick={() => removeTraveller(idx)} className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-gray-800 mb-4">Traveller {idx + 1}</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                        <input type="text" required value={traveller.full_name} onChange={e=>handleTravellerChange(idx, 'full_name', e.target.value)} className="w-full p-2 border rounded-lg outline-none focus:border-[#136b8a] text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                        <input type="text" value={traveller.phone || ''} onChange={e=>handleTravellerChange(idx, 'phone', e.target.value)} className="w-full p-2 border rounded-lg outline-none focus:border-[#136b8a] text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                        <input type="email" value={traveller.email || ''} onChange={e=>handleTravellerChange(idx, 'email', e.target.value)} className="w-full p-2 border rounded-lg outline-none focus:border-[#136b8a] text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Age</label>
                        <input type="number" min="0" max="120" value={traveller.age || ''} onChange={e=>handleTravellerChange(idx, 'age', e.target.value)} className="w-full p-2 border rounded-lg outline-none focus:border-[#136b8a] text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Gender</label>
                        <select value={traveller.gender || ''} onChange={e=>handleTravellerChange(idx, 'gender', e.target.value)} className="w-full p-2 border rounded-lg outline-none focus:border-[#136b8a] text-sm">
                          <option value="">Select...</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">ID Document (Type & Number)</label>
                        <div className="flex gap-2">
                          <input type="text" placeholder="e.g. Aadhar" value={traveller.id_type || ''} onChange={e=>handleTravellerChange(idx, 'id_type', e.target.value)} className="w-1/3 p-2 border rounded-lg outline-none focus:border-[#136b8a] text-sm" />
                          <input type="text" placeholder="Number" value={traveller.id_number || ''} onChange={e=>handleTravellerChange(idx, 'id_number', e.target.value)} className="w-2/3 p-2 border rounded-lg outline-none focus:border-[#136b8a] text-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Sharing Type</label>
                        <select value={traveller.sharing_type || 'Double'} onChange={e=>handleTravellerChange(idx, 'sharing_type', e.target.value)} className="w-full p-2 border rounded-lg outline-none focus:border-[#136b8a] text-sm">
                          <option value="Double">Double</option>
                          <option value="Triple">Triple</option>
                          <option value="Quad">Quad</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Bus Seat / Pickup</label>
                        <div className="flex gap-2">
                          <input type="text" placeholder="Seat" value={traveller.bus_seat_number || ''} onChange={e=>handleTravellerChange(idx, 'bus_seat_number', e.target.value)} className="w-1/3 p-2 border rounded-lg outline-none focus:border-[#136b8a] text-sm" />
                          <input type="text" placeholder="Pickup Point" value={traveller.pickup_point || ''} onChange={e=>handleTravellerChange(idx, 'pickup_point', e.target.value)} className="w-2/3 p-2 border rounded-lg outline-none focus:border-[#136b8a] text-sm" />
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Emergency Contact (Name & Phone)</label>
                        <div className="flex gap-2">
                          <input type="text" placeholder="Name" value={traveller.emergency_contact_name || ''} onChange={e=>handleTravellerChange(idx, 'emergency_contact_name', e.target.value)} className="w-1/2 p-2 border rounded-lg outline-none focus:border-[#136b8a] text-sm" />
                          <input type="text" placeholder="Phone" value={traveller.emergency_contact_phone || ''} onChange={e=>handleTravellerChange(idx, 'emergency_contact_phone', e.target.value)} className="w-1/2 p-2 border rounded-lg outline-none focus:border-[#136b8a] text-sm" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addTraveller} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium text-sm flex items-center justify-center gap-2 hover:bg-gray-50 hover:text-[#136b8a] hover:border-[#136b8a] transition-all">
                  <Plus size={16} /> Add Another Traveller
                </button>
              </div>

              {/* ROOM ALLOCATION TAB */}
              <div className={activeTab === 'rooms' ? 'block space-y-6' : 'hidden'}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Room Assignments</h3>
                  <div className="flex gap-2">
                    <button type="button" onClick={handlePrintSheet} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg flex items-center gap-1 hover:bg-gray-200 transition-colors">
                      <Printer size={14} /> Print Sheet
                    </button>
                    <button type="button" onClick={autoGenerateRooms} className="px-3 py-1.5 bg-[#136b8a]/10 text-[#136b8a] text-xs font-bold rounded-lg flex items-center gap-1 hover:bg-[#136b8a]/20 transition-colors">
                      <RefreshCw size={14} /> Auto-Generate
                    </button>
                    {/* Add Room Dropdown or buttons */}
                    <button type="button" onClick={() => addRoom('Double')} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors">+ Double</button>
                    <button type="button" onClick={() => addRoom('Triple')} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors">+ Triple</button>
                    <button type="button" onClick={() => addRoom('Quad')} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors">+ Quad</button>
                  </div>
                </div>

                <DragDropContext onDragEnd={onDragEnd}>
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Unassigned Travellers Column */}
                    <div className="lg:col-span-1 flex flex-col h-full">
                      <div className="bg-gray-100 p-3 rounded-t-xl border border-gray-200 font-semibold text-sm text-gray-700 flex justify-between">
                        <span>Unassigned</span>
                        <span className="bg-white px-2 rounded-full text-xs flex items-center">{travellers.filter(t => !t.room_id).length}</span>
                      </div>
                      <Droppable droppableId="unassigned">
                        {(provided, snapshot) => (
                          <div 
                            {...provided.droppableProps} 
                            ref={provided.innerRef}
                            className={`bg-gray-50 border-x border-b border-gray-200 rounded-b-xl p-3 min-h-[300px] flex-1 transition-colors ${snapshot.isDraggingOver ? 'bg-[#136b8a]/5' : ''}`}
                          >
                            {travellers.filter(t => !t.room_id).map((t, idx) => (
                              <Draggable key={t.id || `t-${travellers.indexOf(t)}`} draggableId={t.id || `t-${travellers.indexOf(t)}`} index={idx}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`bg-white border border-gray-200 p-3 mb-2 rounded-lg shadow-sm text-sm ${snapshot.isDragging ? 'shadow-md border-[#136b8a]' : ''}`}
                                  >
                                    <div className="font-semibold text-gray-800">{t.full_name || 'Unnamed'}</div>
                                    <div className="text-xs text-gray-500 flex justify-between mt-1">
                                      <span>{t.gender ? t.gender.substring(0,1).toUpperCase() : '?'} - {t.age || '?'} yrs</span>
                                      <span className="font-medium bg-gray-100 px-1 rounded">{t.sharing_type}</span>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>

                    {/* Rooms Area */}
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-max">
                      {rooms.map((room) => {
                        const occupants = travellers.filter(t => t.room_id === room.id);
                        const capacity = room.room_type === 'Double' ? 2 : room.room_type === 'Triple' ? 3 : 4;
                        const isFull = occupants.length >= capacity;

                        return (
                          <div key={room.id} className="flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <div className={`p-3 border-b flex justify-between items-center ${isFull ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
                              <div className="flex flex-col w-2/3">
                                <input 
                                  type="text" 
                                  value={room.room_number} 
                                  onChange={(e) => renameRoom(room.id, e.target.value)}
                                  className="font-bold text-gray-900 bg-transparent outline-none focus:border-b focus:border-[#136b8a] text-sm w-full"
                                />
                                <span className="text-xs text-gray-500">{room.room_type} Room</span>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isFull ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-700'}`}>
                                  {occupants.length}/{capacity}
                                </span>
                                {occupants.length === 0 && (
                                  <button type="button" onClick={() => deleteRoom(room.id)} className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1">
                                    <Trash2 size={12}/> Del
                                  </button>
                                )}
                              </div>
                            </div>
                            <Droppable droppableId={room.id}>
                              {(provided, snapshot) => (
                                <div 
                                  {...provided.droppableProps} 
                                  ref={provided.innerRef}
                                  className={`p-3 min-h-[100px] flex-1 transition-colors ${snapshot.isDraggingOver ? 'bg-[#136b8a]/5' : ''}`}
                                >
                                  {occupants.map((t, idx) => (
                                    <Draggable key={t.id || `t-${travellers.indexOf(t)}`} draggableId={t.id || `t-${travellers.indexOf(t)}`} index={idx}>
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          className={`bg-white border border-gray-200 p-2 mb-2 rounded shadow-sm text-sm ${snapshot.isDragging ? 'shadow-md border-[#136b8a]' : ''}`}
                                        >
                                          <div className="font-semibold text-gray-800 text-xs">{t.full_name || 'Unnamed'}</div>
                                          <div className="text-[10px] text-gray-500">{t.sharing_type} • {t.gender ? t.gender.substring(0,1).toUpperCase() : '?'}</div>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                  {occupants.length === 0 && !snapshot.isDraggingOver && (
                                    <div className="text-xs text-gray-400 text-center mt-4">Empty</div>
                                  )}
                                </div>
                              )}
                            </Droppable>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </DragDropContext>
              </div>

              {/* ACTIVITY TAB */}
              <div className={activeTab === 'activity' ? 'block' : 'hidden'}>
                {activityLogs.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl">No activity recorded yet.</div>
                ) : (
                  <div className="space-y-4">
                    {activityLogs.map(log => (
                      <div key={log.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-start gap-3 text-sm">
                        <div className="bg-[#136b8a]/10 p-2 rounded-full text-[#136b8a] shrink-0">
                          <Check size={16} />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{log.action}</div>
                          {log.old_value || log.new_value ? (
                            <div className="text-gray-500 mt-1">
                              Changed <span className="font-mono text-gray-700 bg-gray-100 px-1 rounded">{log.field_name}</span> from <span className="line-through text-red-400">{log.old_value}</span> to <span className="text-emerald-600 font-medium">{log.new_value}</span>
                            </div>
                          ) : null}
                          <div className="text-xs text-gray-400 mt-2">{new Date(log.changed_at).toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </form>
          )}
        </div>
        
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0 rounded-b-2xl">
          <button type="button" onClick={onClose} className="px-5 py-2 font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors text-sm">Cancel</button>
          <button type="submit" form="bookingForm" disabled={submitting || loading} className="px-6 py-2 font-bold text-white bg-[#136b8a] hover:bg-[#0f556e] rounded-xl transition-colors text-sm disabled:opacity-50 flex items-center gap-2">
            {submitting ? 'Saving...' : 'Save Booking'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminBookingModal;
