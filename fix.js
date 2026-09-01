const fs = require('fs');
const p = 'react-app/src/pages/PackageCheckout.jsx';
let c = fs.readFileSync(p, 'utf8');

// Flatten the UI
c = c.replace(/rounded-3xl/g, 'rounded-sm')
     .replace(/rounded-2xl/g, 'rounded-sm')
     .replace(/rounded-xl/g, 'rounded-sm')
     .replace(/border-2/g, 'border')
     .replace(/shadow-xl/g, 'shadow-sm')
     .replace(/shadow-md/g, 'shadow-sm');

// Fix button
c = c.replace(
  'className="w-full bg-[#01AFD1] hover:bg-[#0092b3] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-sm shadow-sm shadow-[#01AFD1]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-lg"',
  'className="w-full bg-[#01AFD1] hover:bg-[#0092b3] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-full shadow-lg shadow-[#01AFD1]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-lg"'
);

// Add states
c = c.replace(
  'const [computedPrice, setComputedPrice] = useState(0);',
  'const [computedPrice, setComputedPrice] = useState(0);\n  const [sharingAllocation, setSharingAllocation] = useState({});\n  const [additionalTravellers, setAdditionalTravellers] = useState([]);'
);

// Add logic
c = c.replace(
  '    fetchSettings();\n  }, []);',
  `    fetchSettings();\n  }, []);\n\n  useEffect(() => {\n    const count = Math.max(1, parseInt(tripDetails?.travellers) || 1) - 1;\n    if (count > 0) {\n      setAdditionalTravellers(prev => {\n        const arr = [...prev];\n        while (arr.length < count) arr.push({ fullName: '', age: '', gender: '' });\n        return arr.slice(0, count);\n      });\n    } else {\n      setAdditionalTravellers([]);\n    }\n  }, [tripDetails?.travellers]);\n\n  const handleAllocationChange = (type, delta) => {\n    setSharingAllocation(prev => {\n      const current = prev[type] || 0;\n      const newVal = Math.max(0, current + delta);\n      const newAlloc = { ...prev, [type]: newVal };\n      if (newAlloc[type] === 0) delete newAlloc[type];\n\n      let mixedSubtotal = 0;\n      Object.keys(newAlloc).forEach(k => {\n        const count = newAlloc[k];\n        const opt = sharingOptions.find(o => o.type === k || o.label === k);\n        if (opt && count > 0) mixedSubtotal += count * opt.pricePerPerson;\n      });\n      if (Object.keys(newAlloc).length > 0) {\n        setComputedPrice(mixedSubtotal);\n        setSelectedSharing('Mixed');\n      } else {\n        const opt = sharingOptions.find(o => o.type === selectedSharing);\n        if (opt) setComputedPrice(opt.pricePerPerson * (tripDetails?.travellers || 1));\n      }\n      return newAlloc;\n    });\n  };`
);

// Update payload
c = c.replace(
  'specialRequest: formData.specialRequest || null,',
  'specialRequest: formData.specialRequest || null,\n            sharingAllocation: Object.keys(sharingAllocation).length > 0 ? sharingAllocation : null,\n            additionalTravellers: additionalTravellers.length > 0 ? additionalTravellers : null,'
);

// Room Sharing UI modification
const oldRoomUI = `
                      <div className="flex justify-between items-start mb-2">
                        <div className={\`w-5 h-5 rounded-full border flex items-center justify-center \${isActive ? 'border-[#01AFD1]' : 'border-gray-300'}\`}>
                          {isActive && <div className="w-2.5 h-2.5 rounded-full bg-[#01AFD1]"></div>}
                        </div>
                        {isActive && <span className="bg-[#01AFD1] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Selected</span>}
                      </div>
                      <h3 className={\`font-bold text-lg \${isActive ? 'text-[#01AFD1]' : 'text-gray-800'}\`}>{option.label}</h3>
                      <div className="mt-auto">
                        <span className={\`font-extrabold text-xl \${isActive ? 'text-gray-900' : 'text-gray-600'}\`}>₹{formatMoney(pricePerPerson)}</span>
                        <span className="text-xs text-gray-500 font-medium ml-1">/ person</span>
                      </div>
`;

const newRoomUI = `
                      <h3 className={\`font-bold text-lg text-gray-800\`}>{option.label}</h3>
                      <div className="mt-auto flex items-center justify-between">
                        <div>
                          <span className={\`font-extrabold text-xl \${isActive ? 'text-gray-900' : 'text-gray-600'}\`}>₹{formatMoney(pricePerPerson)}</span>
                          <span className="text-xs text-gray-500 font-medium ml-1">/ person</span>
                        </div>
                        {!isOccupancyDisabled && (
                          <div className="flex items-center gap-3 bg-white rounded-full border border-gray-200 px-3 py-1.5 shadow-sm">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleAllocationChange(option.label || option.type, -1); }}
                              className="w-6 h-6 flex items-center justify-center font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
                            >-</button>
                            <span className="font-bold text-gray-900 text-sm w-4 text-center">{sharingAllocation[option.label || option.type] || 0}</span>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleAllocationChange(option.label || option.type, 1); }}
                              className="w-6 h-6 flex items-center justify-center font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
                            >+</button>
                          </div>
                        )}
                      </div>
`;

c = c.replace(oldRoomUI.trim(), newRoomUI.trim());

const addTravellersUI = `
            {/* Section: Additional Travellers */}
            {additionalTravellers.length > 0 && (
              <section className="p-6 md:p-8 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#01AFD1] text-2xl">group_add</span>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Additional Travellers</h2>
                      <p className="text-xs text-gray-500 mt-0.5">{additionalTravellers.filter(t => t.fullName).length} of {additionalTravellers.length} completed</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  {additionalTravellers.map((traveller, index) => (
                    <div key={index} className="bg-gray-50 rounded-sm border border-gray-200 p-5">
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="bg-[#01AFD1] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">{index + 2}</span>
                        Traveller {index + 2}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                          <input
                            type="text"
                            value={traveller.fullName}
                            onChange={(e) => {
                              const newArr = [...additionalTravellers];
                              newArr[index].fullName = e.target.value;
                              setAdditionalTravellers(newArr);
                            }}
                            className="w-full border border-gray-200 rounded-sm px-4 py-2 focus:ring-2 focus:ring-[#01AFD1] outline-none text-gray-700 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Age</label>
                          <input
                            type="number"
                            min="1"
                            value={traveller.age}
                            onChange={(e) => {
                              const newArr = [...additionalTravellers];
                              newArr[index].age = e.target.value;
                              setAdditionalTravellers(newArr);
                            }}
                            className="w-full border border-gray-200 rounded-sm px-4 py-2 focus:ring-2 focus:ring-[#01AFD1] outline-none text-gray-700 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                          <select
                            value={traveller.gender}
                            onChange={(e) => {
                              const newArr = [...additionalTravellers];
                              newArr[index].gender = e.target.value;
                              setAdditionalTravellers(newArr);
                            }}
                            className="w-full border border-gray-200 rounded-sm px-4 py-2 focus:ring-2 focus:ring-[#01AFD1] outline-none text-gray-700 bg-white"
                          >
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
`;

c = c.replace('            </section>', '            </section>\n' + addTravellersUI);

fs.writeFileSync(p, c);
console.log("Success");
