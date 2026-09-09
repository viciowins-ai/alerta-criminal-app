const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');
rules = rules.trim();
if (rules.endsWith('// Force sync for GitHub')) {
  rules = rules.replace('// Force sync for GitHub', '').trim();
}
// Count braces to fix the issue in the UI
let open = (rules.match(/\{/g) || []).length;
let close = (rules.match(/\}/g) || []).length;
console.log("Open: " + open + ", Close: " + close);
