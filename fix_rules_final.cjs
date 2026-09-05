const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

// The rules currently have a `match /groups/{groupId}` block far down at line 229. 
// We want to make sure it's at the top. Let's remove any existing ones and add a fresh one at the top.

// Remove any existing groups matches
code = code.replace(/match \/groups\/\{groupId\} \{(?:[^{}]*|\{[^{}]*\})*\}/g, "");

// Add it to the top
const targetStr = `match /databases/{database}/documents {`;
const insertStr = `
    match /groups/{groupId} {
      allow read, write: if request.auth != null;
    }
`;
code = code.replace(targetStr, targetStr + insertStr);

fs.writeFileSync('firestore.rules', code);
