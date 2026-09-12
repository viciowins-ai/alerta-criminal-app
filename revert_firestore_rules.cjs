const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

// Remove the strict comment validation and just add basic ones
code = code.replace(/function isValidComment[\s\S]*?function isValidLike/, "function isValidLike");

code = code.replace(/match \/comments\/\{commentId\}[\s\S]*?match \/feedbacks\/\{feedbackId\}/, "match /comments/{commentId} {\n      allow read, write: if isAuthenticated();\n    }\n    match /feedbacks/{feedbackId}");

fs.writeFileSync('firestore.rules', code);
