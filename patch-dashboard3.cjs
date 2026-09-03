const fs = require('fs');
let code = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf8');

// I will extract the current block, and then manually recreate the chartData logic inside the onSnapshot
// Actually, looking at it, the chartData logic uses `reportsData` inside the onSnapshot.

const originalUseEffectBody = `
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

        // Calculate chart data (last 7 days)
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const today = new Date().getDay();
        const orderedDays = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          orderedDays.push(days[d.getDay()]);
        }

        const counts = [0, 0, 0, 0, 0, 0, 0];
        
        reportsData.forEach(r => {
          if (r.createdAt && r.createdAt.toMillis) {
            const date = new Date(r.createdAt.toMillis());
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - date.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            if (diffDays <= 7) {
              const dayIndex = 6 - (diffDays - 1);
              if (dayIndex >= 0 && dayIndex < 7) {
                counts[dayIndex]++;
              }
            }
          }
        });

        const newChartData = orderedDays.map((day, index) => ({
          name: day,
          alertas: counts[index]
        }));
        
        // If no data, show some placeholder trend so chart isn't empty
        if (reportsData.length === 0) {
          setChartData([
            { name: 'Seg', alertas: 0 },
            { name: 'Ter', alertas: 0 },
            { name: 'Qua', alertas: 0 },
            { name: 'Qui', alertas: 0 },
            { name: 'Sex', alertas: 0 },
            { name: 'Sáb', alertas: 0 },
            { name: 'Dom', alertas: 0 },
          ]);
        } else {
          setChartData(newChartData);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'reports');
      });
    };
    setupReportsListener();
`;

// we find everything from `let unsubscribeReports = () => {};` to `setupReportsListener();` plus the broken `const newChartData = days.map`... `    });`
// So I will just use a regex to replace from `let unsubscribeReports` up to `OperationType.LIST, 'reports');\n    });`

code = code.replace(
  /let unsubscribeReports = \(\) => \{\};[\s\S]*?handleFirestoreError\(error, OperationType\.LIST, 'reports'\);\n    \}\);/m,
  originalUseEffectBody.trim()
);

// We should also ensure we remove the stray setupReportsListener(); and chart data array maps that might be left.
// The regex above should catch all the garbage because it starts at let unsubscribeReports and ends at the error handler.

fs.writeFileSync('src/pages/DashboardPage.tsx', code);
