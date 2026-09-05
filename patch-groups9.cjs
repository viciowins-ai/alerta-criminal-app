const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

code = code.replace(
  "match /groups/{groupId} {\n      allow read: if isAuthenticated();\n      allow create: if isAuthenticated();\n\n\n      allow update: if isAuthenticated() &&\n                    true;\n      allow delete: if isAuthenticated() && request.auth.uid == resource.data.createdBy;\n    }",
  "match /groups/{groupId} {\n      allow read, write: if true;\n    }"
);

fs.writeFileSync('firestore.rules', code);
