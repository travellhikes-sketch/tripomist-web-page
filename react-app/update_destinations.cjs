const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');
const targetPages = [
  'Andaman.jsx',
  'Goa.jsx',
  'Himachal.jsx',
  'Kashmir.jsx',
  'Kerala.jsx',
  'Ladakh.jsx',
  'Meghalaya.jsx',
  'Rajasthan.jsx',
  'Spiti.jsx',
  'Uttarakhand.jsx'
];

const oldCardRegex = /<Link\s+key=\{dest\.id\}(?:.|\n)*?<\/Link>/g;

const newCardCode = `<PackageCard 
              key={dest.id}
              tripTitle={dest.name} 
              price={"₹" + dest.price.toLocaleString()}
              duration={dest.duration} 
              description={dest.tagline}
              bg={dest.img}
              link={\`/itinerary/\${dest.name.toLowerCase().replace(/\\s+/g, '-')}\`} 
            />`;

targetPages.forEach(page => {
  const filePath = path.join(pagesDir, page);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace card
  content = content.replace(oldCardRegex, newCardCode);

  // Add PackageCard import
  if (!content.includes('import PackageCard')) {
    content = content.replace(/(import React.*?)\n/, "$1\nimport PackageCard from '../components/PackageCard'\n");
  }

  // Use URL search params instead of state
  if (content.includes("const [searchQuery, setSearchQuery] = useState('')")) {
    const searchLogic = `const location = require('react-router-dom').useLocation ? require('react-router-dom').useLocation() : window.location;
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('search') || '';`;
    content = content.replace("const [searchQuery, setSearchQuery] = useState('')", searchLogic);
  } else if (!content.includes("const searchParams = new URLSearchParams")) {
    // If it doesn't have it at all (e.g., I removed it earlier)
    const exportRegex = /export default function [a-zA-Z]+\(\) {\n/;
    const searchLogic = `const location = require('react-router-dom').useLocation ? require('react-router-dom').useLocation() : window.location;
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('search') || '';\n`;
    content = content.replace(exportRegex, match => match + searchLogic);
  }
  
  // ensure useLocation is imported from react-router-dom if not already using require fallback
  // Actually, using require() inline in frontend code might break if not handled by vite properly.
  // Let's explicitly import useLocation
  if (!content.includes('useLocation')) {
    content = content.replace("import { Link } from 'react-router-dom'", "import { Link, useLocation } from 'react-router-dom'");
  }
  
  // Now fix the inline searchLogic to use standard useLocation
  content = content.replace(/const location = require\('react-router-dom'\)\.useLocation \? require\('react-router-dom'\)\.useLocation\(\) : window\.location;/, 'const location = useLocation();');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${page}`);
});
