const fs = require('fs');

const rules = `
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // ===============================================================
    // Helper Functions
    // ===============================================================

    function isAuthenticated() {
      return request.auth != null;
    }

    function isDocOwner() {
      return isAuthenticated() && resource.data.authorId == request.auth.uid;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // ===============================================================
    // Rules
    // ===============================================================

    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow create: if isOwner(userId);
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }

    match /reports/{reportId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isDocOwner() || isAdmin() || isAuthenticated();
      allow delete: if isDocOwner() || isAdmin();
    }

    match /posts/{postId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isDocOwner() || isAdmin() || isAuthenticated();
      allow delete: if isDocOwner() || isAdmin();
    }
    
    match /likes/{likeId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if false;
      allow delete: if isAuthenticated();
    }

    match /risk_zones/{zoneId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    match /guardian_sessions/{sessionId} {
      allow read: if true;
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAdmin() || isAuthenticated();
    }
    
    match /emergencyAlerts/{alertId} {
      allow read: if true;
      allow create: if isAuthenticated();
    }
    
    match /mail/{mailId} {
      allow create: if isAuthenticated();
      allow read: if isAdmin();
    }
    
    match /whatsapp_messages/{messageId} {
      allow create: if isAuthenticated();
      allow read: if isAdmin();
    }

    match /feedbacks/{feedbackId} {
      allow create: if isAuthenticated();
      allow read: if isAdmin();
    }
  }
}
`;

fs.writeFileSync('firestore.rules', rules.trim());
