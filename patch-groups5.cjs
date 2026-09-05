const fs = require('fs');
let code = fs.readFileSync('src/pages/GroupsPage.tsx', 'utf8');

if (!code.includes("const payload = {")) {
  code = code.replace(
    /await addDoc\(collection\(db, 'groups'\), \{\n\s*name: newGroupName\.trim\(\),\n\s*inviteCode,\n\s*createdBy: user\.uid,\n\s*members: \[user\.uid\],\n\s*\/\/ @ts-ignore\n\s*createdAt: serverTimestamp\(\)\n\s*\}\);/,
    "const payload = {\n        name: newGroupName.trim(),\n        inviteCode,\n        createdBy: user.uid,\n        members: [user.uid],\n        // @ts-ignore\n        createdAt: serverTimestamp()\n      };\n      // console.log('Creating group payload:', payload);\n      await addDoc(collection(db, 'groups'), payload);"
  );
  fs.writeFileSync('src/pages/GroupsPage.tsx', code);
}
