const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

const regex = /match \/feedbacks\/\{feedbackId\} \{[\s\S]*?\}/;
const newBlock = `match /feedbacks/{feedbackId} {
      allow read, create: if request.auth != null;
      allow update, delete: if request.auth != null;
    }`;

rules = rules.replace(regex, newBlock);
fs.writeFileSync('firestore.rules', rules);
console.log("Local rules synced with user's Firebase console changes!");
