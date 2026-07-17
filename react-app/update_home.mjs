import fs from 'fs';
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
console.log("Home updated");
