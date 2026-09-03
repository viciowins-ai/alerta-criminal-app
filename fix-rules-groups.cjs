const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

// Update isValidReport to include visibility and groupId
rules = rules.replace(
  "hasOnlyAllowedFields(['authorId', 'type', 'description', 'location', 'status', 'upvotes', 'upvotedBy', 'createdAt', 'attachments'])",
  "hasOnlyAllowedFields(['authorId', 'type', 'description', 'location', 'status', 'upvotes', 'upvotedBy', 'createdAt', 'attachments', 'visibility', 'groupId', 'groupName'])"
);

rules = rules.replace(
  "data.createdAt is timestamp;",
  "data.createdAt is timestamp &&\n             (!('visibility' in data) || data.visibility in ['public', 'group']) &&\n             (!('groupId' in data) || data.groupId is string) &&\n             (!('groupName' in data) || data.groupName is string);"
);

// Add match /groups/{groupId}
const groupsRule = `
    match /groups/{groupId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
`;

rules = rules.replace(
  "match /emergencyAlerts/{alertId} {",
  groupsRule + "\n    match /emergencyAlerts/{alertId} {"
);

fs.writeFileSync('firestore.rules', rules);
console.log('Rules updated');
