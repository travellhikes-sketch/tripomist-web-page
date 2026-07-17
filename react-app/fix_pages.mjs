import fs from 'fs';
import path from 'path';

const files = [
  {
    path: 'src/pages/GroupTrips.jsx',
    title: 'Group Departures',
    img: 'https://images.unsplash.com/photo-1523592121529-f6dde35f079e?w=1200&q=80',
    about: "Looking for an adventure with like-minded travelers? Our Group Departures offer the perfect blend of exploration, fun, and safety. Join us and make memories that will last a lifetime."
  },
  {
    path: 'src/pages/WeekendTrips.jsx',
    title: 'Weekend Departures',
    img: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80',
    about: "Short on time but big on wanderlust? Our Weekend Departures are designed for the perfect quick getaway to refresh and recharge your spirit without the hassle of long planning."
  },
  {
    path: 'src/pages/Treks.jsx',
    title: 'Trekking Departure',
    img: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=80',
    about: "Conquer the peaks and explore the unseen with our Trekking Departures. Whether you are a beginner or a seasoned trekker, we have the perfect trail waiting for you."
  },
  {
    path: 'src/pages/FamilyTours.jsx',
    title: 'Family Destinations',
    img: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1200&q=80',
    about: "Create unforgettable moments with your loved ones. Our Family Destinations are carefully curated to ensure comfort, safety, and fun activities for all age groups."
  },
  {
    path: 'src/pages/HoneymoonTrips.jsx',
    title: 'Honeymoon Trips',
    img: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=1200&q=80',
    about: "Celebrate your love in the world's most romantic destinations. Our Honeymoon Trips offer luxurious stays, breathtaking views, and intimate experiences to start your new journey together."
  }
];

for (const file of files) {
  let content = fs.readFileSync(file.path, 'utf8');

  // Ensure ReadMoreText is imported
  if (!content.includes('import ReadMoreText')) {
    content = content.replace("import Navbar from '../components/Navbar'", "import Navbar from '../components/Navbar'\nimport ReadMoreText from '../components/ReadMoreText'");
  }

  // Define the new replacement layout
  const newLayout = `      {/* Hero Video/Image Banner */}
      <section className="relative w-full h-[50vh] min-h-[400px] overflow-hidden">
        <img
          src="${file.img}"
          alt="${file.title}"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        <div className="absolute bottom-10 left-0 right-0 z-10 flex flex-col items-center justify-end px-4">
          <h1 className="text-white text-3xl md:text-5xl font-bold text-center tracking-tight">
            ${file.title}
          </h1>
        </div>
      </section>

      {/* About Section */}
      <section className="w-full max-w-6xl mx-auto px-4 pt-12 pb-6">
        <div className="flex-1">
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-4">
            About ${file.title}
          </h2>
          <ReadMoreText text="${file.about}" />
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="max-w-6xl mx-auto px-4 pb-36 w-full">

        {/* Trips Grid */}`;

  // Replace everything from {/* Hero */} down to {/* Trips Grid */} with the new layout
  const regex = /\{\/\* Hero \*\/\}.*?\{\/\* Trips Grid \*\/\}/s;
  if (regex.test(content)) {
    content = content.replace(regex, newLayout);
  } else {
    console.log("Could not match layout block in " + file.path);
  }
  
  // also fix className="flex-grow max-w-7xl mx-auto w-full px-4 md:px-8 py-12" to "max-w-6xl mx-auto px-4 pb-36 w-full"
  // Wait, I already removed that main opening tag if it was between Hero and Trips grid, wait:
  // In the original, the `<main className="flex-grow max-w-7xl mx-auto w-full px-4 md:px-8 py-12">` was right before {/* Filter Pills */} and then {/* Trips Grid */} was inside it.
  // My regex replaces up to {/* Trips Grid */}, so it removes the <main> opening tag. My newLayout puts it back.

  fs.writeFileSync(file.path, content, 'utf8');
}

// Update Home.jsx texts and Honeymoon image
let home = fs.readFileSync('src/pages/Home.jsx', 'utf8');

// Replace link titles inside the circles
home = home.replace(/>Group Trips<\/span>/g, ">Group Departures</span>");
home = home.replace(/alt="Group Trips"/g, 'alt="Group Departures"');

home = home.replace(/>Weekend Trips<\/span>/g, ">Weekend Departures</span>");
home = home.replace(/alt="Weekend Trips"/g, 'alt="Weekend Departures"');

home = home.replace(/>Treks<\/span>/g, ">Trekking Departure</span>");
home = home.replace(/alt="Treks"/g, 'alt="Trekking Departure"');

home = home.replace(/>Family Tours<\/span>/g, ">Family Destinations</span>");
home = home.replace(/alt="Family Tours"/g, 'alt="Family Destinations"');

// Fix Honeymoon Trips image
home = home.replace('src="https://images.unsplash.com/photo-1520106208642-127e9976378e?q=80&w=600&auto=format&fit=crop"', 'src="https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=600&q=80"');

fs.writeFileSync('src/pages/Home.jsx', home, 'utf8');
console.log("Done");
