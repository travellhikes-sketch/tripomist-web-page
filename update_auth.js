const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/storm/Desktop/antigravity file/stitch_tripomist_web_page/react-app/src/pages';
const files = fs.readdirSync(dir).filter(f => f.startsWith('Itinerary') && f.endsWith('.jsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Need to ensure supabase is imported
  if (!content.includes('import { supabase }')) {
    content = content.replace(/import React[^;]*;?/, "import { supabase } from '../utils/supabaseClient';\n$&");
  }

  const oldHandleRegex = /const handleBookNow = \(\) => \{\s*setIsBookingModalOpen\(true\)\s*\}/g;
  
  const newHandle = `const handleBookNow = async () => {\n    const { data: { session } } = await supabase.auth.getSession();\n    if (session?.user) {\n      const slugStr = trip.slug || trip.title.toLowerCase().replace(/ /g, '-');\n      const dataStr = JSON.stringify({\n        formData: { \n          fullName: session.user.user_metadata?.full_name || '', \n          phone: session.user.phone || '', \n          email: session.user.email || '', \n          date: '', \n          source: '', \n          specialRequest: '' \n        },\n        tripDetails: { \n          packageId: trip.id || slugStr, \n          tripTitle: trip.title, \n          destination: trip.pickup || trip.title, \n          travellers: travellers, \n          price: trip.numericPrice,\n          costings: trip.costings || []\n        }\n      });\n      sessionStorage.setItem('checkoutData', dataStr);\n      navigate(\`/checkout/\${slugStr}\`);\n    } else {\n      setIsBookingModalOpen(true);\n    }\n  }`;

  if (oldHandleRegex.test(content)) {
    content = content.replace(oldHandleRegex, newHandle);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${file}`);
  } else {
    console.log(`Skipped ${file} - no match`);
  }
});
