const fs = require('fs');
let code = fs.readFileSync('src/pages/GroupsPage.tsx', 'utf8');

code = code.replace(
  "members: [user.uid],",
  "members: [user.uid],\n        // @ts-ignore"
);
fs.writeFileSync('src/pages/GroupsPage.tsx', code);
