const fs = require('fs');
let code = fs.readFileSync('src/pages/MapPage.tsx', 'utf8');

if (!code.includes('AttachmentGallery')) {
  code = code.replace("import { Search", "import { AttachmentGallery } from '../components/AttachmentGallery';\nimport { Search");
}

const regex1 = /\{selectedLocation\.attachments && selectedLocation\.attachments\.length > 0 && \(\s*<div className="mb-4 flex gap-2 overflow-x-auto pb-2">\s*\{selectedLocation\.attachments\.map\(\(attachment: any, index: number\) => \{\s*const isObject = typeof attachment === 'object' && attachment !== null;\s*const url = isObject \? attachment\.url : attachment;\s*const type = isObject \? attachment\.type : \(url\.includes\('\.mp4'\) \|\| url\.includes\('video'\) \? 'video\/mp4' : 'image\/jpeg'\);\s*return \(\s*<div key=\{index\} className="relative aspect-video w-\[200px\] shrink-0 rounded-lg overflow-hidden cursor-pointer" onClick=\{.*?\}\>\s*\{type\.startsWith\('video\/'\) \? \(\s*<>\s*<video src=\{url\} className="w-full h-full object-cover" muted playsInline \/>\s*<div className="absolute inset-0 bg-black\/40 flex items-center justify-center">\s*<Play className="text-white fill-white\/80" size=\{24\} \/>\s*<\/div>\s*<\/>\s*\) : \(\s*<img src=\{url\} alt="Anexo" className="w-full h-full object-cover" \/>\s*\)\}\s*<\/div>\s*\);\s*\}\)\}\s*<\/div>\s*\)\}/g;

code = code.replace(regex1, "{selectedLocation.attachments && selectedLocation.attachments.length > 0 && (\n            <div className=\"mb-4\">\n              <AttachmentGallery attachments={selectedLocation.attachments} />\n            </div>\n          )}");

fs.writeFileSync('src/pages/MapPage.tsx', code);
