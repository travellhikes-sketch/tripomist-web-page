const fs = require('fs');
let c = fs.readFileSync('react-app/src/pages/Domestic.jsx', 'utf8');
c = c.replace(/import Footer from '\.\.\/components\/Footer'/, "import Footer from '../components/Footer'\nimport PackageCard from '../components/PackageCard'");
c = c.replace(/<Link key=\{trip\.id\}[\s\S]*?<\/Link>/g, "<PackageCard key={trip.id} tripTitle={trip.name} price={`₹${trip.price.toLocaleString('en-IN')}`} duration={trip.durationText} bg={trip.img} link={`/itinerary/${trip.name.toLowerCase().replace(/\\s+/g, '-')}`} label={trip.style === 'Mountains' ? 'Popular' : ''} />");
fs.writeFileSync('react-app/src/pages/Domestic.jsx', c);
