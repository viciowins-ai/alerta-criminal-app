const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

rules = rules.replace(/  \}\n    match \/feedbacks/g, '    match /feedbacks');

fs.writeFileSync('firestore.rules', rules);
