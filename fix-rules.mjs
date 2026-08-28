import fs from 'fs';
let rules = fs.readFileSync('firestore.rules', 'utf8');

// Find the last "match /guardian_sessions"
const idx = rules.lastIndexOf("match /guardian_sessions");
const substring = rules.substring(0, idx);

const newRules = substring + `    match /guardian_sessions/{sessionId} {
      // Anyone with the link can read the session (could be unauthenticated)
      allow read: if true;
      
      allow create: if isAuthenticated() && 
                      isValidGuardianSession(request.resource.data) &&
                      request.resource.data.userId == request.auth.uid;
                      
      allow update: if isAuthenticated() && 
                      isValidGuardianSession(request.resource.data) &&
                      resource.data.userId == request.auth.uid &&
                      areImmutableFieldsUnchanged(['userId', 'createdAt']);
                      
      allow delete: if isAdmin() || (isAuthenticated() && resource.data.userId == request.auth.uid);
    }
    
    match /feedbacks/{feedbackId} {
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow read: if isAdmin();
    }
  }
}
`;
fs.writeFileSync('firestore.rules', newRules);
