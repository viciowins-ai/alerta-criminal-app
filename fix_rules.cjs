const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

// The rules have two `match /groups/{groupId}` blocks. We will remove the one at the top.
code = code.replace(/match \/groups\/\{groupId\} \{\s*allow read, create, update: if request\.auth != null;\s*allow delete: if request\.auth != null && request\.auth\.uid == resource\.data\.createdBy;\s*\}/, "");

fs.writeFileSync('firestore.rules', code);
