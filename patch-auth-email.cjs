const fs = require('fs');
let code = fs.readFileSync('src/pages/LoginPage.tsx', 'utf8');

if (!code.includes("const [email, setEmail]")) {
  console.log("No email login state found");
}
