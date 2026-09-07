const fs = require('fs');
let code = fs.readFileSync('src/pages/FeedPage.tsx', 'utf8');

if (!code.includes('AttachmentGallery')) {
  code = code.replace("import { TopBar } from '../components/TopBar';", "import { TopBar } from '../components/TopBar';\nimport { AttachmentGallery } from '../components/AttachmentGallery';");
}

const regex1 = /\{item\.attachments && item\.attachments\.length > 0 && \([\s\S]*?<div className="mt-4 flex gap-2 overflow-x-auto snap-x pb-2">[\s\S]*?\{item\.attachments\.map\(\(attachment: any, index: number\) => \{[\s\S]*?\}\)[\s\S]*?<\/div>\n\s*\}\)/g;

code = code.replace(regex1, "{item.attachments && item.attachments.length > 0 && (\n                    <AttachmentGallery attachments={item.attachments} />\n                  )}");

fs.writeFileSync('src/pages/FeedPage.tsx', code);
