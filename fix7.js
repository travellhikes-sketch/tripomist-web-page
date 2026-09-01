const fs = require('fs');
const p = 'react-app/src/pages/PackageCheckout.jsx';
let c = fs.readFileSync(p, 'utf8');

const proceedDisabledStr = /disabled=\{loading \|\| !selectedSharing \|\| checkoutBlocked\}/;
const enhancedProceedDisabledStr = `disabled={loading || !selectedSharing || checkoutBlocked || (tripDetails?.travellers > 15) || (Object.values(sharingAllocation).reduce((a,b)=>a+b,0) !== (tripDetails?.travellers || 1)) || (tripDetails?.travellers > 1 && additionalTravellers.filter(t => t.fullName && t.phone && t.email).length !== (tripDetails.travellers - 1))}`;
c = c.replace(proceedDisabledStr, enhancedProceedDisabledStr);

const buttonClassStr = /className="w-full bg-\[\#01AFD1\] hover:bg-\[\#0092b3\] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-\[\#01AFD1\]\/20 transition-all active:scale-\[0\.98\] flex items-center justify-center gap-2 text-lg"/;
const newButtonClass = `className="w-full bg-[#01AFD1] hover:bg-[#0092b3] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-full shadow-lg shadow-[#01AFD1]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-lg"`;
c = c.replace(buttonClassStr, newButtonClass);

fs.writeFileSync(p, c);
console.log('SUCCESS');
