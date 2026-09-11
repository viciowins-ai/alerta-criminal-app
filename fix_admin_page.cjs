const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboardPage.tsx', 'utf8');

code = code.replace(
  "const qOccurrences = query(collection(db, 'reports'), where('createdAt', '>=', yesterday));",
  "const qOccurrences = query(collection(db, 'reports'), where('createdAt', '>=', Timestamp.fromDate(yesterday)));"
);

code = code.replace(
  "const unsubSOS = onSnapshot(qSOS, (snapshot) => {\n      setActiveSOS(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));\n    });",
  "const unsubSOS = onSnapshot(qSOS, (snapshot) => {\n      setActiveSOS(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));\n    }, (error) => console.error('Error fetching SOS:', error));"
);

code = code.replace(
  "const unsubOccurrences = onSnapshot(qOccurrences, (snapshot) => {\n      setOccurrences24hCount(snapshot.size);\n    });",
  "const unsubOccurrences = onSnapshot(qOccurrences, (snapshot) => {\n      setOccurrences24hCount(snapshot.size);\n    }, (error) => console.error('Error fetching Occurrences:', error));"
);

fs.writeFileSync('src/pages/AdminDashboardPage.tsx', code);
