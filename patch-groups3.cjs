const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

code = code.replace(
  "request.resource.data.members.size() == 1 &&",
  ""
);
code = code.replace(
  "request.resource.data.members[0] == request.auth.uid;",
  ""
);

fs.writeFileSync('firestore.rules', code);
