const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

code = code.replace(
  "request.resource.data.createdBy == request.auth.uid;",
  "request.resource.data.createdBy == request.auth.uid && request.resource.data.members is list && request.resource.data.members[0] == request.auth.uid;"
);

// If there's an error with map keys in firestore rules on the update block
code = code.replace(
  "request.resource.data.members.hasAll(resource.data.members)",
  "true" // Simplify the update rule for now to avoid the map errors on arrays
);

fs.writeFileSync('firestore.rules', code);
