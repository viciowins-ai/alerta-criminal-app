const fs = require('fs');
let code = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf8');

if (!code.includes("import { useAuth }")) {
  code = code.replace(
    "import { db } from '../firebase';",
    "import { db } from '../firebase';\nimport { useAuth } from '../contexts/AuthContext';"
  );
}

if (!code.includes("const { user } = useAuth();")) {
  code = code.replace(
    "export function DashboardPage() {",
    "export function DashboardPage() {\n  const { user } = useAuth();"
  );
}

fs.writeFileSync('src/pages/DashboardPage.tsx', code);
