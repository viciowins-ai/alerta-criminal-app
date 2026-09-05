const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

code = code.replace(
  "allow read: if true;",
  "allow read: if false;"
);

fs.writeFileSync('firestore.rules', code);
