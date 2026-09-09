const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

const oldBlockRegex = /match \/feedbacks\/\{feedbackId\} \{[\s\S]*?allow update, delete:.*?\n\s*\}/;

const newBlock = `match /feedbacks/{feedbackId} {
      allow create: if isAuthenticated();
      allow read: if isAuthenticated();
      allow update, delete: if isAuthenticated() && (
        isAdmin() ||
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) && 
         'role' in get(/databases/$(database)/documents/users/$(request.auth.uid)).data &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'guard')
      );
    }`;

rules = rules.replace(oldBlockRegex, newBlock);
fs.writeFileSync('firestore.rules', rules);
console.log("Rules updated!");
