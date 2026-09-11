const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('firebase.ts')) {
  code = code.replace(
    "import { PWAInstallPrompt } from \"./components/PWAInstallPrompt\";",
    "import { PWAInstallPrompt } from \"./components/PWAInstallPrompt\";\nimport { analytics } from './firebase';"
  );
  
  code = code.replace(
    "function App() {",
    "function App() {\n  // Initialize analytics on app load\n  useEffect(() => {\n    analytics().catch(console.error);\n  }, []);\n"
  );
  
  fs.writeFileSync('src/App.tsx', code);
}
