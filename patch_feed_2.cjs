const fs = require('fs');
let code = fs.readFileSync('src/pages/FeedPage.tsx', 'utf8');

// Also set initialLoading to false when the first snapshot is received.
code = code.replace(
  "setPosts(postsData);",
  "setPosts(postsData);\n      setInitialLoading(false);"
);

code = code.replace(
  "setReports(reportsData);",
  "setReports(reportsData);\n        setInitialLoading(false);"
);

fs.writeFileSync('src/pages/FeedPage.tsx', code);
