const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

const oldBlockRegex = /match \/feedbacks\/\{feedbackId\} \{[\s\S]*?allow update, delete:.*?\n\s*\}/;

const newBlock = `match /feedbacks/{feedbackId} {
      allow create: if isAuthenticated();
      allow read: if isAuthenticated();
      allow update, delete: if isAuthenticated() && (
        ('email' in request.auth.token && request.auth.token.email == 'viciowins@gmail.com') ||
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'guard'])
      );
    }`;

rules = rules.replace(oldBlockRegex, newBlock);
fs.writeFileSync('firestore.rules', rules);
console.log("Rules updated!");
