const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboardPage.tsx', 'utf8');

// Also occurrences24hCount
code = code.replace(
  "const qOccurrences = query(collection(db, 'reports'), where('createdAt', '>=', Timestamp.fromDate(yesterday)));",
  "const qOccurrences = query(collection(db, 'reports'), where('createdAt', '>=', Timestamp.fromDate(yesterday)));\n    console.log('Setting up Occurrences listener...');"
);

code = code.replace(
  "setOccurrences24hCount(snapshot.size);",
  "console.log('Received Occurrences update, size:', snapshot.size);\n      setOccurrences24hCount(snapshot.size);"
);

// We need to check the security rules again for read access.
// Emergency alerts: `allow read: if true;`
// Reports: `allow read: if true;`

// Wait, the rules match is: match /reports/{reportId} { allow read: if true; ... } 
// Yes, reports is readable by anyone.

fs.writeFileSync('src/pages/AdminDashboardPage.tsx', code);
