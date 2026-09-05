const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

code = code.replace(
  "request.resource.data.createdBy == request.auth.uid &&\n                    \n                    ",
  "request.resource.data.createdBy == request.auth.uid;\n"
);
fs.writeFileSync('firestore.rules', code);
