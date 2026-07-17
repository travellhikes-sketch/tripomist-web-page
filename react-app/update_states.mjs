import fs from 'fs';
import path from 'path';

const fileGroup = 'src/pages/GroupTrips.jsx';
const fileRaj = 'src/pages/Rajasthan.jsx';

// 1. Process GroupTrips.jsx
let gtContent = fs.readFileSync(fileGroup, 'utf8');
const gtRegex = /const \[tripsList, setTripsList\] = useState\(\[[\s\S]*?\]\)/;
const gtReplacement = `const [tripsList, setTripsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPackages() {
      const { data, error } = await supabase
        .from('Pakage')
        .select('*');
      
      if (error) {
        console.error('Error fetching packages:', error);
      } else {
        const activePackages = data.filter(pkg => pkg.status && pkg.status.includes('active'));
        const mappedTrips = activePackages.map(pkg => ({
          id: pkg.id,
          name: pkg.title,
          location: pkg.destination || pkg.state,
          style: pkg.category === 'International' ? 'International Trips' : 'Domestic Trips',
          durationText: pkg.duration,
          price: pkg.price,
          isFav: false,
          img: pkg.image_url || pkg.banner_image
        }));
        setTripsList(mappedTrips);
      }
      setLoading(false);
    }
    fetchPackages();
  }, []);`;

gtContent = gtContent.replace(gtRegex, gtReplacement);

// Add import if missing
if (!gtContent.includes("import { supabase }")) {
  gtContent = gtContent.replace("import PackageCard from '../components/PackageCard'", "import PackageCard from '../components/PackageCard'\nimport { supabase } from '../supabaseClient'");
}

// Update the link generation since we use id
gtContent = gtContent.replace(/link=\{\`\/itinerary\/\$\{trip\.name\.toLowerCase\(\)\.replace\(\/\\s\+\/g, '-'\)\}\`\}/g, "link={`/itinerary/${trip.id}`}");

fs.writeFileSync(fileGroup, gtContent, 'utf8');

// 2. Process Rajasthan.jsx
let rContent = fs.readFileSync(fileRaj, 'utf8');
const rRegex = /const \[tripsList, setTripsList\] = useState\(\[[\s\S]*?\]\)/;
const rReplacement = `const [tripsList, setTripsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPackages() {
      const { data, error } = await supabase
        .from('Pakage')
        .select('*');
      
      if (error) {
        console.error('Error fetching packages:', error);
      } else {
        const rajasthanPackages = data.filter(pkg => 
          pkg.state === 'Rajasthan' && pkg.status && pkg.status.includes('active')
        );
        const mappedTrips = rajasthanPackages.map(pkg => ({
          id: pkg.id,
          name: pkg.title,
          location: pkg.destination || pkg.state,
          style: pkg.category === 'International' ? 'International Trips' : 'Domestic Trips',
          durationText: pkg.duration,
          price: pkg.price,
          isFav: false,
          img: pkg.image_url || pkg.banner_image
        }));
        setTripsList(mappedTrips);
      }
      setLoading(false);
    }
    fetchPackages();
  }, []);`;

rContent = rContent.replace(rRegex, rReplacement);

// Add import if missing
if (!rContent.includes("import { supabase }")) {
  rContent = rContent.replace("import PackageCard from '../components/PackageCard'", "import PackageCard from '../components/PackageCard'\nimport { supabase } from '../supabaseClient'");
}

rContent = rContent.replace(/link=\{\`\/itinerary\/\$\{trip\.name\.toLowerCase\(\)\.replace\(\/\\s\+\/g, '-'\)\}\`\}/g, "link={`/itinerary/${trip.id}`}");

fs.writeFileSync(fileRaj, rContent, 'utf8');
