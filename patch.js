const fs = require('fs');
let c = fs.readFileSync('react-app/src/pages/International.jsx', 'utf8');
c = c.replace(/import Footer from '\.\.\/components\/Footer'/, "import Footer from '../components/Footer'\nimport PackageCard from '../components/PackageCard'");
c = c.replace(/<Link key=\{trip\.id\}[\s\S]*?<\/Link>/g, "<PackageCard key={trip.id} tripTitle={trip.name} price={`₹${trip.price.toLocaleString('en-IN')}`} duration={trip.duration} bg={trip.img} link={`/itinerary/${trip.name.toLowerCase().replace(/\\s+/g, '-')}`} label='International' />");
fs.writeFileSync('react-app/src/pages/International.jsx', c);
