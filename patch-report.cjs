const fs = require('fs');
let code = fs.readFileSync('src/pages/ReportPage.tsx', 'utf8');

code = code.replace(
  "import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, getDoc } from 'firebase/firestore';",
  "import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, getDoc, query, where, getDocs } from 'firebase/firestore';"
);

code = code.replace(
  "const fetchSettings = async () => {",
  `const fetchSettings = async () => {
      try {
        const q = query(collection(db, 'groups'), where('members', 'array-contains', user.uid));
        const querySnapshot = await getDocs(q);
        const groupsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUserGroups(groupsData);
        if (groupsData.length > 0) {
          setSelectedGroupId(groupsData[0].id);
        }
      } catch (err) {
        console.error("Error fetching groups", err);
      }`
);

fs.writeFileSync('src/pages/ReportPage.tsx', code);
