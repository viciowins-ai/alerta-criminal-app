const fs = require('fs');
const file = 'src/pages/AccountSettingsPage.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "updateDoc(docRef, { name, phone })",
  "setDoc(docRef, { name, phone, uid: user.uid }, { merge: true })"
);

fs.writeFileSync(file, code);
