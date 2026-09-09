const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

const oldBlock = `match /feedbacks/{feedbackId} {
      allow create: if isAuthenticated();
      allow read: if isAuthenticated();
      allow update, delete: if isAuthenticated() && (
        ('email' in request.auth.token && request.auth.token.email == 'viciowins@gmail.com') ||
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'guard'])
      );
    }`;

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

// use replace string directly, fallback to regex if spacing is weird
const regex = /match \/feedbacks\/\{feedbackId\} \{[\s\S]*?\}/;
rules = rules.replace(regex, newBlock);

fs.writeFileSync('firestore.rules', rules);
console.log("Feedbacks rule updated!");
