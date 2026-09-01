import re

with open('src/pages/PackageCheckout.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. State Additions
content = content.replace(
    "const [selectedSharing, setSelectedSharing] = useState('');\n  const [computedPrice, setComputedPrice] = useState(0);",
    "const [selectedSharing, setSelectedSharing] = useState('');\n  const [sharingAllocation, setSharingAllocation] = useState({ 'Quad Sharing': 0, 'Triple Sharing': 0, 'Double Sharing': 0 });\n  const [additionalTravellers, setAdditionalTravellers] = useState([]);\n  const [computedPrice, setComputedPrice] = useState(0);"
)

# 2. Update sharingOptions capacity
content = content.replace(
    "const rawOptions = [\n          { type: 'Quad Sharing', pricePerPerson: quadBasePrice, label: 'Quad Sharing' },\n          { type: 'Triple Sharing', pricePerPerson: quadBasePrice + tripleUpgrade, label: 'Triple Sharing' },\n          { type: 'Double Sharing', pricePerPerson: quadBasePrice + doubleUpgrade, label: 'Double Sharing' }\n        ];",
    "const rawOptions = [\n          { type: 'Quad Sharing', pricePerPerson: quadBasePrice, label: 'Quad Sharing', capacity: 4 },\n          { type: 'Triple Sharing', pricePerPerson: quadBasePrice + tripleUpgrade, label: 'Triple Sharing', capacity: 3 },\n          { type: 'Double Sharing', pricePerPerson: quadBasePrice + doubleUpgrade, label: 'Double Sharing', capacity: 2 }\n        ];"
)

# 3. Dynamic price calculation & Additional Travellers sync
content = content.replace(
    "const travellerCount = Math.max(1, Number(tripDetails?.travellers) || 1);",
    """const travellerCount = Math.max(1, Number(tripDetails?.travellers) || 1);

  useEffect(() => {
    let newPrice = 0;
    sharingOptions.forEach(opt => {
      newPrice += (sharingAllocation[opt.type] || 0) * opt.pricePerPerson;
    });
    setComputedPrice(newPrice);
  }, [sharingAllocation, sharingOptions]);

  useEffect(() => {
    const requiredExtra = Math.max(0, travellerCount - 1);
    setAdditionalTravellers(prev => {
      if (prev.length === requiredExtra) return prev;
      const updated = [...prev];
      while (updated.length < requiredExtra) {
        updated.push({ fullName: '', phone: '', email: '' });
      }
      return updated.slice(0, requiredExtra);
    });
  }, [travellerCount]);

  const allocatedTravellers = Object.values(sharingAllocation).reduce((sum, val) => sum + (val || 0), 0);
  const remainingToAllocate = travellerCount - allocatedTravellers;
"""
)

# 4. Remove automatic selection of first option setting price
content = content.replace(
    "const firstOpt = options.find(o => o.type === 'Quad Sharing') || options[0];\n          setSelectedSharing(firstOpt.type);\n          setComputedPrice(firstOpt.pricePerPerson * (data.tripDetails.travellers || 1));",
    "const firstOpt = options.find(o => o.type === 'Quad Sharing') || options[0];\n          setSelectedSharing(firstOpt.type);"
)

# 5. UI Polish - Remove shadows and rounded-3xl
content = content.replace("rounded-3xl", "rounded-lg")
content = content.replace("shadow-sm", "")
content = content.replace("shadow-xl", "")

# 6. Phone/Email Read Only
content = content.replace(
    "readOnly={profileLocked.phone}",
    "readOnly={true}"
)
content = content.replace(
    "readOnly={profileLocked.email}",
    "readOnly={true}"
)

# 7. Max 15 Travellers
content = re.sub(
    r'<input\s+type="number"\s+min="1"\s+value=\{tripDetails\.travellers\}',
    '<input type="number" min="1" max="15" value={tripDetails.travellers}',
    content
)

# 8. Proceed to payment validation
proceed_val_old = """      if (!selectedSharing || !['Quad Sharing', 'Triple Sharing', 'Double Sharing'].includes(selectedSharing)) {
        throw new Error('Please select a valid room sharing occupancy.');
      }"""
proceed_val_new = """      if (travellerCount > 15) {
        throw new Error('For more than 15 travellers, please contact our travel expert.');
      }
      if (remainingToAllocate !== 0) {
        throw new Error('Sharing allocation must exactly match the total number of travellers.');
      }
      const incompleteExtra = additionalTravellers.some(t => !t.fullName.trim() || !t.phone.trim() || !t.email.trim());
      if (incompleteExtra) {
        throw new Error('Please fill all remaining traveller details before proceeding to payment.');
      }
      
      const sharingStr = Object.entries(sharingAllocation).filter(([k,v]) => v > 0).map(([k,v]) => `${k}: ${v}`).join(', ');
      """
content = content.replace(proceed_val_old, proceed_val_new)

# Fix selectedSharing in edge function call
content = content.replace("selectedSharing,", "selectedSharing: sharingStr,")
content = content.replace("p_selected_sharing: selectedSharing,", "p_selected_sharing: sharingStr,")

# 9. Modify UI flow
# Replace Occupancy Section
occupancy_old = """<section className="bg-white rounded-lg p-6 md:p-8   border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-[#01AFD1] text-2xl">bed</span>
                <h2 className="text-2xl font-bold text-gray-900">Occupancy</h2>
              </div>
              <p className="text-gray-500 mb-6 border-b border-gray-100 pb-4">Select room sharing type</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sharingOptions.map((option) => {
                  const pricePerPerson = Number(option.pricePerPerson ?? option.price ?? 0);
                  if (!Number.isFinite(pricePerPerson) || pricePerPerson <= 0) return null;
                  const isActive = selectedSharing === option.type;
                  const isOccupancyDisabled = !!bookingId;
                  return (
                    <div
                      key={option.type}
                      onClick={() => !isOccupancyDisabled && handleSharingSelect(option)}
                      className={`rounded-2xl p-5 border-2 transition-all flex flex-col gap-2 ${
                        isOccupancyDisabled
                          ? 'cursor-not-allowed opacity-60'
                          : 'cursor-pointer'
                      } ${
                        isActive
                          ? 'border-[#01AFD1] bg-[#eff6f9]  scale-[1.02]'
                          : 'border-gray-200 bg-white hover:border-[#01AFD1]/50 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isActive ? 'border-[#01AFD1]' : 'border-gray-300'}`}>
                          {isActive && <div className="w-2.5 h-2.5 rounded-full bg-[#01AFD1]"></div>}
                        </div>
                        {isActive && <span className="bg-[#01AFD1] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Selected</span>}
                      </div>
                      <h3 className={`font-bold text-lg ${isActive ? 'text-[#01AFD1]' : 'text-gray-800'}`}>{option.label}</h3>
                      <div className="mt-auto">
                        <span className={`font-extrabold text-xl ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>₹{formatMoney(pricePerPerson)}</span>
                        <span className="text-xs text-gray-500 font-medium ml-1">/ person</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>"""

occupancy_new = """<section className="bg-white rounded-lg p-6 md:p-8 border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-gray-700 text-2xl">bed</span>
                <h2 className="text-xl font-semibold text-gray-800">Room Sharing</h2>
              </div>
              <p className="text-gray-600 mb-6 border-b border-gray-200 pb-4 text-sm">Allocate travellers to their preferred room sharing type.</p>

              <div className="space-y-4">
                {sharingOptions.map((option) => {
                  const pricePerPerson = Number(option.pricePerPerson ?? option.price ?? 0);
                  if (!Number.isFinite(pricePerPerson) || pricePerPerson <= 0) return null;
                  const currentAllocated = sharingAllocation[option.type] || 0;
                  return (
                    <div key={option.type} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-semibold text-gray-800">{option.label}</h3>
                        <p className="text-sm text-gray-500">₹{formatMoney(pricePerPerson)} / person</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          disabled={!!bookingId || currentAllocated === 0}
                          onClick={() => setSharingAllocation(prev => ({...prev, [option.type]: Math.max(0, currentAllocated - 1)}))}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                        >-</button>
                        <span className="font-medium w-4 text-center">{currentAllocated}</span>
                        <button 
                          disabled={!!bookingId || remainingToAllocate <= 0}
                          onClick={() => setSharingAllocation(prev => ({...prev, [option.type]: currentAllocated + 1}))}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                        >+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 flex justify-between">
                <span>Total Allocated: <strong>{allocatedTravellers}</strong></span>
                {remainingToAllocate > 0 ? (
                  <span className="text-amber-600 font-medium">Remaining to assign: {remainingToAllocate}</span>
                ) : remainingToAllocate < 0 ? (
                  <span className="text-red-600 font-medium">Over-allocated by {Math.abs(remainingToAllocate)}</span>
                ) : (
                  <span className="text-green-600 font-medium">All travellers assigned</span>
                )}
              </div>
            </section>
            
            {additionalTravellers.length > 0 && (
              <section className="bg-white rounded-lg p-6 md:p-8 border border-gray-200">
                <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-gray-700 text-2xl">group_add</span>
                    <h2 className="text-xl font-semibold text-gray-800">Add Traveller Details</h2>
                  </div>
                  <span className="text-sm text-gray-500">
                    Remaining travellers to assign: {additionalTravellers.filter(t => !t.fullName || !t.phone || !t.email).length}
                  </span>
                </div>
                
                <div className="space-y-6">
                  {additionalTravellers.map((traveller, index) => (
                    <div key={index} className="p-4 border border-gray-100 bg-gray-50 rounded-lg">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Traveller {index + 2}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <input
                            type="text"
                            placeholder="Full Name"
                            value={traveller.fullName}
                            disabled={!!bookingId}
                            onChange={(e) => {
                              const newArr = [...additionalTravellers];
                              newArr[index].fullName = e.target.value;
                              setAdditionalTravellers(newArr);
                            }}
                            className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-gray-400 outline-none"
                          />
                        </div>
                        <div>
                          <input
                            type="tel"
                            placeholder="Phone (WhatsApp)"
                            value={traveller.phone}
                            disabled={!!bookingId}
                            onChange={(e) => {
                              const newArr = [...additionalTravellers];
                              newArr[index].phone = e.target.value;
                              setAdditionalTravellers(newArr);
                            }}
                            className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-gray-400 outline-none"
                          />
                        </div>
                        <div>
                          <input
                            type="email"
                            placeholder="Email Address"
                            value={traveller.email}
                            disabled={!!bookingId}
                            onChange={(e) => {
                              const newArr = [...additionalTravellers];
                              newArr[index].email = e.target.value;
                              setAdditionalTravellers(newArr);
                            }}
                            className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-gray-400 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}"""
content = re.sub(
    r'<section className="bg-white rounded-lg p-6 md:p-8\s*border border-gray-100">\s*<div className="flex items-center gap-3 mb-2">\s*<span className="material-symbols-outlined text-\[#01AFD1\] text-2xl">bed</span>\s*<h2 className="text-2xl font-bold text-gray-900">Occupancy</h2>.*?</section>',
    occupancy_new,
    content,
    flags=re.DOTALL
)

# Move Special Request
sr_old = """<div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Special Request (Optional)</label>
                  <textarea
                    value={formData.specialRequest || ''}
                    disabled={!!bookingId}
                    onChange={(e) => setFormData({...formData, specialRequest: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#01AFD1] outline-none text-gray-700 bg-gray-50 focus:bg-white transition-colors disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                    rows="3"
                    placeholder="Any dietary requirements or special requests..."
                  ></textarea>
                </div>"""
content = content.replace(sr_old, "")

sr_new = """{additionalTravellers.length > 0 && (
              <section className="bg-white rounded-lg p-6 md:p-8 border border-gray-200">"""
content = content.replace(sr_new, """<section className="bg-white rounded-lg p-6 md:p-8 border border-gray-200">
              <div className="flex items-center gap-3 mb-4 border-b border-gray-200 pb-4">
                <span className="material-symbols-outlined text-gray-700 text-2xl">note_alt</span>
                <h2 className="text-xl font-semibold text-gray-800">Special Request</h2>
              </div>
              <textarea
                value={formData.specialRequest || ''}
                disabled={!!bookingId}
                onChange={(e) => setFormData({...formData, specialRequest: e.target.value})}
                className="w-full border border-gray-200 rounded px-4 py-3 focus:border-gray-400 outline-none text-gray-700 text-sm"
                rows="3"
                placeholder="Any dietary requirements or special requests (Optional)..."
              ></textarea>
            </section>
            
            {additionalTravellers.length > 0 && (
              <section className="bg-white rounded-lg p-6 md:p-8 border border-gray-200">""")


# Payment Summary UI
ps_old = """<div className="flex gap-4 mb-6 pb-6 border-b border-gray-100">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1 leading-tight">{tripDetails.tripTitle}</h3>
                  <div className="flex flex-col gap-1 text-sm text-gray-500 mt-3">
                    <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">calendar_month</span> {new Date(formData.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">group</span> {tripDetails.travellers} Traveller(s)</div>
                    <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">bed</span> {selectedSharing}</div>
                  </div>
                </div>
              </div>"""

ps_new = """<div className="flex gap-4 mb-6 pb-6 border-b border-gray-200">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-2 leading-tight">{tripDetails.tripTitle}</h3>
                  <div className="flex flex-col gap-1 text-sm text-gray-600 mt-3">
                    <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">calendar_month</span> {new Date(formData.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">group</span> {tripDetails.travellers} Traveller(s)</div>
                    {Object.entries(sharingAllocation).map(([type, count]) => count > 0 && (
                      <div key={type} className="flex items-center gap-2 ml-6 text-xs text-gray-500">• {type}: {count}</div>
                    ))}
                  </div>
                </div>
              </div>"""
content = content.replace(ps_old, ps_new)

# Total Payable BG & Button restyle
button_old = """<div className="flex justify-between items-end mb-8 bg-[#eff6f9] p-4 rounded-lg border border-[#cde5ef]">
                <div>
                  <span className="font-bold text-gray-900 text-base block mb-0.5">Total Payable</span>
                </div>
                <span className="font-extrabold text-[#01AFD1] text-2xl">₹{formatMoney(safeFinalPayable)}</span>
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={loading || !selectedSharing || checkoutBlocked}
                className="w-full bg-[#01AFD1] hover:bg-[#0092b3] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg   transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-lg"
              >"""

button_new = """<div className="flex justify-between items-center mb-6 pt-4 border-t border-gray-200">
                <span className="font-semibold text-gray-800 text-base">Total Payable</span>
                <span className="font-bold text-gray-900 text-xl">₹{formatMoney(safeFinalPayable)}</span>
              </div>

              {tripDetails.travellers > 15 && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded">
                  For more than 15 travellers, please contact our travel expert.
                </div>
              )}

              <button
                onClick={handleProceedToPayment}
                disabled={loading || remainingToAllocate !== 0 || travellerCount > 15 || checkoutBlocked}
                className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-medium py-3 rounded transition-colors flex items-center justify-center gap-2"
              >"""
content = content.replace(button_old, button_new)


with open('src/pages/PackageCheckout.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
