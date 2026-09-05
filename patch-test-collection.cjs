const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

code = code.replace(
  "match /databases/{database}/documents {",
  "match /databases/{database}/documents {\n    match /testCollection123/{id} { allow read: if true; }"
);

fs.writeFileSync('firestore.rules', code);
