const fs = require('fs');
let code = fs.readFileSync('src/pages/FeedPage.tsx', 'utf8');

code = code.replace(
  "setPosts(postsData);\n      setInitialLoading(false);",
  "setPosts(postsData);\n      if (!snapshot.metadata.fromCache || postsData.length > 0) setInitialLoading(false);"
);

code = code.replace(
  "setReports(reportsData);\n        setInitialLoading(false);",
  "setReports(reportsData);\n        if (!snapshot.metadata.fromCache || reportsData.length > 0) setInitialLoading(false);"
);

fs.writeFileSync('src/pages/FeedPage.tsx', code);
