const fs = require('fs');
let code = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf8');

const newReportsBlock = `
    let unsubscribeReports = () => {};
    const setupReportsListener = async () => {
      let userGroupIds: string[] = [];
      if (user) {
        try {
          const qGroups = query(collection(db, 'groups'), where('members', 'array-contains', user.uid));
          const snap = await getDocs(qGroups);
          userGroupIds = snap.docs.map(d => d.id);
        } catch (e) {
          console.error(e);
        }
      }
      
      const qReports = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(50));
      unsubscribeReports = onSnapshot(qReports, (snapshot) => {
        let reportsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as any)
        }));
        
        // Filter reports
        reportsData = reportsData.filter((r: any) => 
          !r.visibility || 
          r.visibility === 'public' || 
          (r.visibility === 'group' && userGroupIds.includes(r.groupId)) ||
          r.authorId === user?.uid
        );
        
        setReports(reportsData);
      });
    };
    setupReportsListener();
`;

code = code.replace(
  /const qReports = query\(collection\(db, 'reports'\), orderBy\('createdAt', 'desc'\), limit\(50\)\);[\s\S]*?\}\);/m,
  newReportsBlock.trim()
);

fs.writeFileSync('src/pages/DashboardPage.tsx', code);
