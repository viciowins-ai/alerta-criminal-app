const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

// The groups match block in current firestore.rules
const target = `    match /groups/{groupId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }`;

const replacement = `    match /groups/{groupId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && 
                    request.resource.data.createdBy == request.auth.uid &&
                    request.resource.data.members.size() == 1 &&
                    request.resource.data.members[0] == request.auth.uid;
      allow update: if isAuthenticated() &&
                    (request.auth.uid in resource.data.members || request.resource.data.members.hasAll(resource.data.members));
      allow delete: if isAuthenticated() && request.auth.uid == resource.data.createdBy;
    }`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('firestore.rules', code);
    console.log("Updated groups rules.");
} else {
    console.log("Could not find target groups block.");
}
