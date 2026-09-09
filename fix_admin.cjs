const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

rules = rules.replace(/get\(\/databases\/\$\(database\)\/documents\/users\/\$\(request\.auth\.uid\)\)\.data\.role == 'admin'/g, 
"('role' in get(/databases/$(database)/documents/users/$(request.auth.uid)).data && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin')");

fs.writeFileSync('firestore.rules', rules);
console.log("Admin rules updated!");
