const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

const regex = /allow create: if isAuthenticated\(\); \/\/[\s\S]*?\(!\('upvotedBy' in request\.resource\.data\) \|\| request\.resource\.data\.upvotedBy\.size\(\) == 0\);/;
const newFunc = `allow create: if isAuthenticated();`;

rules = rules.replace(regex, newFunc);
fs.writeFileSync('firestore.rules', rules);
