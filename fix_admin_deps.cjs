const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboardPage.tsx', 'utf8');

// Modify the dependency array of the main useEffect in AdminDashboardPage
code = code.replace(
  "  }, [user, role, loading, navigate]);",
  "  }, [user, role, loading, navigate, activeTab]);"
);

fs.writeFileSync('src/pages/AdminDashboardPage.tsx', code);
