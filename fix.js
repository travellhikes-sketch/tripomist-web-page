const fs = require('fs');
const dir = './react-app/src/pages/';
const files = fs.readdirSync(dir);
files.forEach(file => {
  if (file.startsWith('Itinerary') && file.endsWith('.jsx')) {
    let p = dir + file;
    let content = fs.readFileSync(p, 'utf8');
    let target = 'className="btn-shiny bg-[#01AFD1] hover:bg-[#0092b3] text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer"';
    let replacement = 'className="btn-shiny bg-[#01AFD1] hover:bg-[#0092b3] text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-colors flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer"';
    let newContent = content.replace(target, replacement);
    if (content !== newContent) {
      fs.writeFileSync(p, newContent);
      console.log('Updated ' + file);
    }
  }
});
