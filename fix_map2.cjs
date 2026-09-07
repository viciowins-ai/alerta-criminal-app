const fs = require('fs');
let code = fs.readFileSync('src/pages/MapPage.tsx', 'utf8');

const regex1 = /\{selectedLocation\.attachments && selectedLocation\.attachments\.length > 0 && \([\s\S]*?<div className="mb-4 flex gap-2 overflow-x-auto pb-2">[\s\S]*?\{selectedLocation\.attachments\.map\(\(attachment: any, index: number\) => \{[\s\S]*?\}\)[\s\S]*?<\/div>\n\s*\}\)/g;

code = code.replace(regex1, "{selectedLocation.attachments && selectedLocation.attachments.length > 0 && (\n            <div className=\"mb-4\">\n              <AttachmentGallery attachments={selectedLocation.attachments} />\n            </div>\n          )}");

fs.writeFileSync('src/pages/MapPage.tsx', code);
