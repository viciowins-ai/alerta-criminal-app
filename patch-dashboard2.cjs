const fs = require('fs');
let code = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf8');

code = code.replace(
  /        setChartData\(newChartData\);\n      \}\n    \}, \(error\) => \{\n      handleFirestoreError\(error, OperationType.LIST, 'reports'\);\n    \}\);/g,
  `        setChartData(newChartData);
      }
    };
    setupReportsListener();`
);

fs.writeFileSync('src/pages/DashboardPage.tsx', code);
