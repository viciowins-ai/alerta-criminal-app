const fs = require('fs');
let code = fs.readFileSync('src/pages/MapPage.tsx', 'utf8');

code = code.replace(
  "import { collection, query, onSnapshot, orderBy, limit, addDoc, getDoc, doc, updateDoc, getDocs, where, arrayRemove, arrayUnion } from 'firebase/firestore';",
  "import { collection, query, onSnapshot, orderBy, limit, addDoc, getDoc, doc, updateDoc, getDocs, where, arrayRemove, arrayUnion } from 'firebase/firestore';"
);

code = code.replace(
  "const unsubscribeReports = onSnapshot(q, (snapshot) => {",
  `
    // Fetch user groups for filtering
    let userGroupIds: string[] = [];
    if (user) {
      const qGroups = query(collection(db, 'groups'), where('members', 'array-contains', user.uid));
      getDocs(qGroups).then(snap => {
        userGroupIds = snap.docs.map(d => d.id);
      }).catch(e => console.error(e));
    }
    
    const unsubscribeReports = onSnapshot(q, (snapshot) => {`
);

code = code.replace(
  "const reportsData = snapshot.docs.map(doc => ({",
  `let reportsData = snapshot.docs.map(doc => ({`
);

code = code.replace(
  "setReports(reportsData);",
  `
      // Filter reports: show if public, OR if visibility == 'group' and user is in that group, OR user is author
      reportsData = reportsData.filter(r => 
        !r.visibility || 
        r.visibility === 'public' || 
        (r.visibility === 'group' && userGroupIds.includes(r.groupId)) ||
        r.authorId === user?.uid
      );
      setReports(reportsData);`
);

fs.writeFileSync('src/pages/MapPage.tsx', code);
