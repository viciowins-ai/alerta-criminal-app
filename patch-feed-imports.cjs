const fs = require('fs');
let code = fs.readFileSync('src/pages/FeedPage.tsx', 'utf8');

code = code.replace(
  "increment, where, limit, writeBatch } from 'firebase/firestore';",
  "increment, where, limit, writeBatch, getDocs } from 'firebase/firestore';"
);

fs.writeFileSync('src/pages/FeedPage.tsx', code);
