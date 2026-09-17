const fs = require('fs');
let code = fs.readFileSync('functions/src/index.ts', 'utf8');

// Fix broadcast
code = code.replace(
    /if \(htmlContent && userData\.email && isEmailEnabled\) {/g,
    "if (htmlContent && userData.email && !userData.email.endsWith('@anonymous.com') && isEmailEnabled) {"
);

// Fix weeklySummary
code = code.replace(
    /if \(userData\.notificationSettings\?\.email && userData\.email\) {/g,
    "if (userData.notificationSettings?.email && userData.email && !userData.email.endsWith('@anonymous.com')) {"
);

fs.writeFileSync('functions/src/index.ts', code);
console.log('Patched functions/src/index.ts');
