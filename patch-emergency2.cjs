const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

code = code.replace(
  "allow read: if false;",
  "allow read: if true;"
);

fs.writeFileSync('firestore.rules', code);
