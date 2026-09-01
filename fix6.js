const fs = require('fs');
const p = 'react-app/src/pages/PackageCheckout.jsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/readOnly=\{!!bookingId\}\s*readOnly=\{true\}/g, 'readOnly={true}');

fs.writeFileSync(p, c);
console.log('SUCCESS');
