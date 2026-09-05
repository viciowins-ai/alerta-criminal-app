const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

const targetStr = `match /databases/{database}/documents {`;
const insertStr = `
    match /groups/{groupId} {
      allow read, write: if true;
    }
`;

code = code.replace(targetStr, targetStr + insertStr);

fs.writeFileSync('firestore.rules', code);
