const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboardPage.tsx', 'utf8');

// I'm completely removing the activeTab dependency from the useEffect just in case, but actually let's ensure we just don't have caching issues.
// Let's modify the onSnapshot calls for activeSOS and occurrences24hCount to make sure they run!

// Looking at the screenshots, the user is seeing 0 SOS and 0 occurrences. But the alert exists in the DB.
// Let's check if the user is considered an admin by the query?
// The query for emergencyAlerts is: query(collection(db, 'emergencyAlerts'), where('status', '==', 'active'))
// Wait, in my rules for emergencyAlerts, allow read: if true. So anyone can read it.
// Why is it returning 0?

// Is the status exactly 'active'? Let's check the test script output.
// test_db.mjs output: { ... status: 'active', ... }

// Ah! Let's check how activeSOS is used.
code = code.replace(
  "const qSOS = query(collection(db, 'emergencyAlerts'), where('status', '==', 'active'));",
  "const qSOS = query(collection(db, 'emergencyAlerts'), where('status', '==', 'active'));\n    console.log('Setting up SOS listener...');"
);

code = code.replace(
  "setActiveSOS(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));",
  "const newSOS = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));\n      console.log('Received SOS update:', newSOS);\n      setActiveSOS(newSOS);"
);

fs.writeFileSync('src/pages/AdminDashboardPage.tsx', code);
