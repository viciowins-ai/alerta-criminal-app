const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

code = code.replace(
  "allow create: if isAuthenticated() && \n                    true",
  "allow create: if isAuthenticated();\n"
);
code = code.replace(
  "(request.auth.uid in resource.data.members || true)",
  "true"
);

fs.writeFileSync('firestore.rules', code);
