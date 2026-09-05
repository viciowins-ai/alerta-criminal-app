const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');
let idx = code.indexOf('match /groups');
let sub = code.substring(0, idx);
console.log("Count of match /databases:", (sub.match(/match \/databases/g) || []).length);
console.log("Count of opening braces:", (sub.match(/\{/g) || []).length);
console.log("Count of closing braces:", (sub.match(/\}/g) || []).length);
