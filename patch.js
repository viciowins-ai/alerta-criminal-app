const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

const regex = /function isValidReport\(data\) \{[\s\S]*?\}/;
const newFunc = `function isValidReport(data) {
      return hasRequiredFields(['authorId', 'type', 'location', 'status', 'createdAt']);
    }`;

rules = rules.replace(regex, newFunc);
fs.writeFileSync('firestore.rules', rules);
