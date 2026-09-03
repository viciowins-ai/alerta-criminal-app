const fs = require('fs');
let code = fs.readFileSync('src/pages/FeedPage.tsx', 'utf8');

code = code.replace(
  "import { MessageSquare, Heart, Share2, MoreHorizontal, AlertTriangle, ShieldCheck, Send, MapPin } from 'lucide-react';",
  "import { MessageSquare, Heart, Share2, MoreHorizontal, AlertTriangle, ShieldCheck, Send, MapPin, Users } from 'lucide-react';"
);

fs.writeFileSync('src/pages/FeedPage.tsx', code);
