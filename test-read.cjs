const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');
let idx = code.indexOf('match /groups');
console.log(code.substring(idx - 50, idx + 200));
