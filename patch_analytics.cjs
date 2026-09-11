const fs = require('fs');
let code = fs.readFileSync('src/firebase.ts', 'utf8');

if (!code.includes('getAnalytics')) {
  code = code.replace(
    "import { getMessaging, isSupported } from 'firebase/messaging';",
    "import { getMessaging, isSupported } from 'firebase/messaging';\nimport { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';"
  );
  
  code += `\n\n// Initialize Analytics (only if supported by the browser)\nexport const analytics = async () => {\n  const supported = await isAnalyticsSupported();\n  if (supported) {\n    return getAnalytics(app);\n  }\n  return null;\n};\n`;
  
  fs.writeFileSync('src/firebase.ts', code);
}
