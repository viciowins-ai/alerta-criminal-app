const fs = require('fs');
let code = fs.readFileSync('src/pages/FeedPage.tsx', 'utf8');

// Combine the two listeners into a single state update, or just use a flag.
// The issue is that the first onSnapshot might fire and have 0 posts, so we don't set loading to false.
// Then reports fires and has 0 reports, so we don't set loading to false.
// So the timer has to finish to set loading to false.
// We want to set loading to false if both listeners have fired at least once, OR if one of them has data.
// A simpler fix: 
// 1. Remove the length > 0 condition
// 2. Wait for the initial timer or just use a boolean flag in a ref.

code = code.replace(
  "if (postsData.length > 0) setInitialLoading(false);",
  "setInitialLoading(false);"
);

code = code.replace(
  "if (reportsData.length > 0) setInitialLoading(false);",
  "setInitialLoading(false);"
);

fs.writeFileSync('src/pages/FeedPage.tsx', code);
