// silence-tailwind.js
// Suppresses the Tailwind CDN production warning in the browser console
(function() {
  const originalWarn = console.warn;
  console.warn = function(...args) {
    const message = args.join(' ');
    if (message.includes('cdn.tailwindcss.com') || (message.includes('tailwindcss') && message.includes('production'))) {
      return;
    }
    originalWarn.apply(console, args);
  };
})();
