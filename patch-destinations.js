const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'react-app/src/pages');
const destinationPages = ['Uttarakhand.jsx', 'Himachal.jsx', 'Kashmir.jsx', 'Rajasthan.jsx', 'Meghalaya.jsx', 'Ladakh.jsx', 'Spiti.jsx', 'Andaman.jsx'];

destinationPages.forEach(file => {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Extract Title, Desc, Img from existing Hero
  const titleMatch = content.match(/<h1[^>]*>([^<]+)<\/h1>/);
  const descMatch = content.match(/<p className="text-white\/80 mt-2 text-base[^>]*>([^<]+)<\/p>/);
  const imgMatch = content.match(/<img\s+src="([^"]+)"\s+alt="([^"]+)"/);
  
  const title = titleMatch ? titleMatch[1] : '';
  const desc = descMatch ? descMatch[1] : '';
  const imgUrl = imgMatch ? imgMatch[1] : '';
  const imgAlt = imgMatch ? imgMatch[2] : '';
  
  // Replace the old Hero section
  const newHero = `      {/* Hero */}
      <section className="relative w-full h-72 md:h-96 flex items-end pb-10 px-6 md:px-12 overflow-hidden">
        <img
          src="${imgUrl}"
          alt="${imgAlt}"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        <div className="relative z-10 w-full max-w-7xl mx-auto">
          {/* Desktop Layout */}
          <div className="hidden md:flex relative w-full items-end justify-between">
            <div className="w-1/3">
              <p className="text-emerald-400 text-sm font-semibold tracking-widest uppercase mb-1">Explore India</p>
              <h1 className="text-white text-4xl md:text-5xl font-bold leading-tight">${title}</h1>
              <p className="text-white/80 mt-2 text-base">${desc}</p>
            </div>
            
            <div className="absolute left-1/2 -translate-x-1/2 bottom-2 w-[400px]">
              <DestinationSearch />
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden flex flex-col gap-6">
            <div>
              <p className="text-emerald-400 text-sm font-semibold tracking-widest uppercase mb-1">Explore India</p>
              <h1 className="text-white text-4xl font-bold leading-tight">${title}</h1>
              <p className="text-white/80 mt-2 text-base">${desc}</p>
            </div>
            <div className="w-full">
              <DestinationSearch />
            </div>
          </div>
        </div>
      </section>`;
      
  content = content.replace(/\{\/\* Hero \*\/\}[\s\S]*?<\/section>/, newHero);
  
  // Remove the old search bar from 'Top Destinations'
  content = content.replace(/<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">\s*<h2 className="text-2xl font-bold text-on-surface">Top Destinations<\/h2>\s*<DestinationSearch \/>\s*<\/div>/, '<h2 className="text-2xl font-bold text-on-surface mb-6">Top Destinations</h2>');
  
  fs.writeFileSync(filePath, content);
});

console.log('Destination pages updated successfully');
