const fs = require('fs');
let code = fs.readFileSync('src/pages/MapPage.tsx', 'utf8');

const newBlock = `
  useEffect(() => {
    let unsubscribeReports = () => {};
    
    const setupListener = async () => {
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
      
      const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(50));
      unsubscribeReports = onSnapshot(q, (snapshot) => {
        let reportsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as any)
        }));
        
        // Filter reports
        reportsData = reportsData.filter(r => 
          !r.visibility || 
          r.visibility === 'public' || 
          (r.visibility === 'group' && userGroupIds.includes(r.groupId)) ||
          r.authorId === user?.uid
        );
        
        setReports(reportsData);
        
        const sharedReportId = searchParams.get('reportId');
        if (sharedReportId) {
          const sharedReport = reportsData.find(r => r.id === sharedReportId);
          if (sharedReport) {
            setSelectedLocation(sharedReport);
            if (mapRef.current) {
              mapRef.current.flyTo({
                center: [sharedReport.location.lng, sharedReport.location.lat],
                zoom: 16,
                duration: 1500,
                essential: true
              });
              initialCenterDone.current = true;
            }
          }
        }
      });
    };
    
    setupListener();

    return () => {
      unsubscribeReports();
    };
  }, [user]);
`;

// we need to replace the old useEffect completely.
code = code.replace(
  /useEffect\(\(\) => \{\n    const q = query\(collection\(db, 'reports'\), orderBy\('createdAt', 'desc'\), limit\(50\)\);[\s\S]*?unsubscribeReports\(\);\n    };\n  \}, \[\]\);/m,
  newBlock.trim()
);

fs.writeFileSync('src/pages/MapPage.tsx', code);
