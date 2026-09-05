const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

const regex = /match \/groups\/\{groupId\} \{(.*?)\}/s;
const replacement = `match /groups/{groupId} {
      allow read, create, update: if request.auth != null;
      allow delete: if request.auth != null && request.auth.uid == resource.data.createdBy;
    }`;

code = code.replace(regex, replacement);

fs.writeFileSync('firestore.rules', code);
