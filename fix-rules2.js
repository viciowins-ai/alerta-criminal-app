const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

const additionalRules = `
    match /mail/{mailId} {
      allow create: if isAuthenticated();
      allow read: if isAdmin();
    }
    match /messages/{messageId} {
      allow create: if isAuthenticated();
      allow read: if isAdmin();
    }
`;

rules = rules.replace(/match \/feedbacks\/\{feedbackId\} \{/, additionalRules + '\n    match /feedbacks/{feedbackId} {');
fs.writeFileSync('firestore.rules', rules);
