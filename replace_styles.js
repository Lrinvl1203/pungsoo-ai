const fs = require('fs');
let content = fs.readFileSync('pages/ConceptApp.tsx', 'utf8');

// The layout wrapper
content = content.replace(
  '<div className="min-h-screen bg-[#fdfbf7]">',
  `
  <div className="relative flex min-h-screen w-full flex-col group/design-root font-display text-slate-100 antialiased overflow-x-hidden">
    {/* Background Image Layer */}
    <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'linear-gradient(to bottom, rgba(34, 30, 16, 0.4), rgba(34, 30, 16, 0.95)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuCvWHIjiF4g5DNNRn-SXcwt2avj0BLQtkpRNkxzW4yaTcZygH6W75Mgm8xZfJMFwgDl3ZzUlc6mIm4DU7KMOq9ZA8y3P28VLj1AWm2fRSFz2W-eyaA8d3S-LT53x4KMyKZpWH97cfzWmHsYvjueHKf65AAHWn-QMjARhiNGq2m8jJxhg0Z_jHAroZMcVI7Cnqw_qBdC3swN5eLsbl34fGk8Nfx5AJ9q5f5qB6fz36r-sNjy-iST8wYDkl9viWeX0tRoiIMznIsyWmEx")' }}></div>
    <div className="relative z-10">
`
);

// Header
content = content.replace(
  '<header className="bg-white border-b border-[#e5e1da] py-8 px-4 text-center relative">',
  '<header className="fixed top-0 z-50 w-full border-b border-primary/20 bg-background-dark/80 backdrop-blur-md transition-all py-4 px-4 text-center">'
);

// Close wrapper
const lastDivIndex = content.lastIndexOf('</div>');
content = content.substring(0, lastDivIndex) + '</div>\n    </div>' + content.substring(lastDivIndex + 6);

// Color Mappings
content = content.replace(/bg-[#fdfbf7]/g, 'bg-transparent');
content = content.replace(/bg-white/g, 'bg-white/5 backdrop-blur-md');
content = content.replace(/bg-\[#e5e1da\]/g, 'bg-white/10');
content = content.replace(/text-\[#4a443b\]/g, 'text-white');
content = content.replace(/text-\[#d4af37\]/g, 'text-primary');
content = content.replace(/gold-gradient hover/g, 'bg-primary text-background-dark hover');
content = content.replace(/gold-gradient/g, 'bg-primary text-background-dark');
content = content.replace(/border-\[#e5e1da\]/g, 'border-white/10');
content = content.replace(/border-\[#d4af37\]\/30/g, 'border-primary/30');
content = content.replace(/border-\[#d4af37\]\/40/g, 'border-primary/40');
content = content.replace(/ring-\[#d4af37\]\/10/g, 'ring-primary/10');
content = content.replace(/border-\[#d4af37\]/g, 'border-primary');
content = content.replace(/bg-\[#faf9f6\]/g, 'bg-black/30 text-white');
content = content.replace(/text-\[#8c8273\]/g, 'text-slate-300');
content = content.replace(/text-\[#b0a99f\]/g, 'text-slate-400');
content = content.replace(/text-\[#6b6256\]/g, 'text-slate-200');

// Input background fix
content = content.replace(/bg-black\/30 text-white border border-white\/10 rounded-lg outline-none focus:border-primary/g, 'w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary text-white');

// "Let's fix some broken styling because of pure white references"
content = content.replace(/bg-indigo-50 text-indigo-600 border-indigo-200/g, 'bg-primary/20 text-primary border-primary');
content = content.replace(/bg-gray-50 text-gray-400 border-gray-200/g, 'bg-white/5 text-slate-400 border-white/10');

// Fix 'serif-font' to use 'font-display' just by letting 'serif-font' map to nothing or removing it
content = content.replace(/serif-font/g, 'font-bold');

fs.writeFileSync('pages/ConceptApp.tsx', content);
