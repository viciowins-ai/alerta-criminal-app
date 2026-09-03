const fs = require('fs');
let code = fs.readFileSync('src/pages/ReportPage.tsx', 'utf8');

code = code.replace(
  "createdAt: serverTimestamp()",
  `createdAt: serverTimestamp(),
        visibility: visibility,
        groupId: visibility === 'group' ? selectedGroupId : null,
        groupName: visibility === 'group' ? userGroups.find(g => g.id === selectedGroupId)?.name : null`
);

fs.writeFileSync('src/pages/ReportPage.tsx', code);
