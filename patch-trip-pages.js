const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'react-app/src/pages');
const pages = [
  { file: 'GroupTrips.jsx', img: 'https://images.unsplash.com/photo-1523592121529-f6dde35f079e?w=1200&q=80' },
  { file: 'WeekendTrips.jsx', img: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80' },
  { file: 'UpcomingTrips.jsx', img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80' }
];

pages.forEach(p => {
  const filePath = path.join(pagesDir, p.file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Extract Title and Desc
  const titleMatch = content.match(/<h1[^>]*>([^<]+)<\/h1>/);
  const descMatch = content.match(/<p className="text-on-surface-variant text-sm md:text-base max-w-xl mx-auto">([^<]+)<\/p>/);
  
  const title = titleMatch ? titleMatch[1] : '';
  const desc = descMatch ? descMatch[1] : '';
  
  // Replace the old Header and Search
  const newHero = `      {/* Hero */}
      <section className="relative w-full h-72 md:h-96 flex items-end pb-10 px-6 md:px-12 overflow-hidden">
        <img
          src="${p.img}"
          alt="Trips"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        <div className="relative z-10 w-full max-w-7xl mx-auto">
          {/* Desktop Layout */}
          <div className="hidden md:flex relative w-full items-end justify-between">
            <div className="w-1/3">
              <p className="text-emerald-400 text-sm font-semibold tracking-widest uppercase mb-1">Explore</p>
              <h1 className="text-white text-4xl md:text-5xl font-bold leading-tight">${title}</h1>
              <p className="text-white/80 mt-2 text-base">${desc}</p>
            </div>
            
            <div className="absolute left-1/2 -translate-x-1/2 bottom-2 w-[400px]">
              <DestinationSearch 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search trips by destination..."
              />
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden flex flex-col gap-6">
            <div>
              <p className="text-emerald-400 text-sm font-semibold tracking-widest uppercase mb-1">Explore</p>
              <h1 className="text-white text-4xl font-bold leading-tight">${title}</h1>
              <p className="text-white/80 mt-2 text-base">${desc}</p>
            </div>
            <div className="w-full">
              <DestinationSearch 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search trips by destination..."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 md:px-8 py-12">`;
      
  // Add import if not present
  if (!content.includes('DestinationSearch')) {
    content = content.replace(/import Navbar from '..\/components\/Navbar'/, "import Navbar from '../components/Navbar'\nimport DestinationSearch from '../components/DestinationSearch'");
  }
  
  // Replace the old header and search input blocks
  const headerRegex = /\{\/\* Main Content Layout \*\/\}\s*<main className="flex-grow max-w-7xl mx-auto w-full px-4 md:px-8 py-12">\s*\{\/\* Page Header \*\/\}\s*<div className="text-center mb-12">[\s\S]*?<\/div>\s*\{\/\* Search Input \*\/\}\s*<div className="max-w-md mx-auto mb-10">[\s\S]*?<\/div>\s*<\/div>/;
  content = content.replace(headerRegex, newHero);
  
  fs.writeFileSync(filePath, content);
});

console.log('Trip pages updated successfully');
