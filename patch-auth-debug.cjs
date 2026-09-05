const fs = require('fs');
let code = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

if (!code.includes("console.log('Auth State:', user)")) {
  code = code.replace(
    /const AuthContext = createContext<AuthContextType>\(\{/,
    "const AuthContext = createContext<AuthContextType>({\n  // @ts-ignore"
  );
  
  code = code.replace(
    /return \(\n    <AuthContext.Provider/,
    "// DEBUG: console.log('Auth State:', user);\n  return (\n    <AuthContext.Provider"
  );
  fs.writeFileSync('src/contexts/AuthContext.tsx', code);
}
