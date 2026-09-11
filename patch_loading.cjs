const fs = require('fs');
let code = fs.readFileSync('src/pages/FeedPage.tsx', 'utf8');

// Replace unconditional setInitialLoading(false) with conditional
code = code.replace(
  "setPosts(postsData);\n      setInitialLoading(false);",
  "setPosts(postsData);\n      if (postsData.length > 0) setInitialLoading(false);"
);

code = code.replace(
  "setReports(reportsData);\n        setInitialLoading(false);",
  "setReports(reportsData);\n        if (reportsData.length > 0) setInitialLoading(false);"
);

fs.writeFileSync('src/pages/FeedPage.tsx', code);
