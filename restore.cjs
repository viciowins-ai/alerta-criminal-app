const fs = require('fs');

const orig = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /groups/{groupId} {
      allow read, write: if request.auth != null;
    }

    // ===============================================================
    // Helper Functions
    // ===============================================================

    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isDocOwner() {
      return isAuthenticated() && request.auth.uid == resource.data.authorId;
    }
    
    function isAdmin() {
      return isAuthenticated() && (
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
          'role' in get(/databases/$(database)/documents/users/$(request.auth.uid)).data && 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin') ||
        (request.auth.token.email == "viciowins@gmail.com")
      );
    }

    function hasRequiredFields(fields) {
      return request.resource.data.keys().hasAll(fields);
    }

    function hasOnlyAllowedFields(fields) {
      return request.resource.data.keys().hasOnly(fields);
    }

    function isValidEmail(email) {
      return email is string && email.matches("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");
    }

    function areImmutableFieldsUnchanged(fields) {
      return !request.resource.data.diff(resource.data).affectedKeys().hasAny(fields);
    }

    function isValidUser(data) {
      return hasRequiredFields(['uid', 'email', 'displayName', 'role', 'level', 'points', 'createdAt']) &&
             data.uid is string &&
             isValidEmail(data.email) &&
             data.displayName is string &&
             data.role in ['user', 'admin', 'moderator'] &&
             data.level in ['iniciante', 'bronze', 'prata', 'ouro', 'guardiao'] &&
             data.points is number && data.points >= 0 &&
             data.createdAt is timestamp;
    }

    function isValidReport(data) {
      return hasRequiredFields(['authorId', 'type', 'location', 'status', 'createdAt']) &&
             data.authorId is string &&
             data.type in ['police', 'accident', 'danger', 'traffic', 'other', 'roubo', 'suspeito', 'vandalismo', 'outro'] &&
             data.status in ['pending', 'verified', 'false_alert', 'false_alarm'] &&
             (!('upvotes' in data) || (data.upvotes is number && data.upvotes >= 0)) &&
             data.createdAt is timestamp;
    }

    function isValidPost(data) {
      return hasRequiredFields(['authorId', 'authorName', 'type', 'content', 'location', 'likesCount', 'commentsCount', 'verified', 'createdAt']) &&
             data.authorId is string &&
             data.likesCount is number && data.likesCount >= 0 &&
             data.commentsCount is number && data.commentsCount >= 0 &&
             data.verified is bool &&
             data.createdAt is timestamp;
    }

    function isValidEmergencyAlert(data) {
      return hasRequiredFields(['userId', 'location', 'status', 'createdAt']) &&
             data.userId is string &&
             data.status in ['active', 'resolved'] &&
             data.createdAt is timestamp;
    }

    function isValidGuardianSession(data) {
      return hasRequiredFields(['userId', 'userName', 'location', 'isActive', 'createdAt', 'updatedAt']) &&
             data.userId is string &&
             data.isActive is bool &&
             data.createdAt is timestamp &&
             data.updatedAt is timestamp;
    }

    function isValidLike(data) {
      return hasRequiredFields(['postId', 'userId', 'createdAt']) &&
             data.postId is string &&
             data.userId is string &&
             data.createdAt is timestamp;
    }

    // ===============================================================
    // Rules
    // ===============================================================

    match /emergencyAlerts/{alertId} {
      allow read: if true;
      allow create: if isAuthenticated() && isValidEmergencyAlert(request.resource.data) && request.resource.data.userId == request.auth.uid && request.resource.data.status == 'active';
      allow update: if isAuthenticated() && isValidEmergencyAlert(request.resource.data) && resource.data.userId == request.auth.uid && areImmutableFieldsUnchanged(['userId', 'createdAt', 'location']);
      allow delete: if isAdmin() || (isAuthenticated() && resource.data.userId == request.auth.uid);
    }

    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow create: if isOwner(userId) && isValidUser(request.resource.data) && request.resource.data.uid == userId && (!('role' in request.resource.data) || request.resource.data.role == 'user' || isAdmin());
      
      function isPointsIncrementValid() {
        let oldPoints = ('points' in resource.data) ? resource.data.points : 0;
        let newPoints = ('points' in request.resource.data) ? request.resource.data.points : 0;
        return newPoints == oldPoints + 10 || newPoints == oldPoints + 2 || newPoints == oldPoints - 2;
      }

      allow update: if (isOwner(userId) && isValidUser(request.resource.data) && (!('uid' in resource.data) || areImmutableFieldsUnchanged(['uid'])) && (!('createdAt' in resource.data) || areImmutableFieldsUnchanged(['createdAt'])) && (!('role' in resource.data) || areImmutableFieldsUnchanged(['role'])) && (!('level' in resource.data) || areImmutableFieldsUnchanged(['level'])) && (!('points' in resource.data) || areImmutableFieldsUnchanged(['points']) || isPointsIncrementValid())) || (isAuthenticated() && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['points']) && isPointsIncrementValid()) || (isAdmin() && isValidUser(request.resource.data) && (areImmutableFieldsUnchanged(['uid']) || (!('uid' in resource.data))) && (areImmutableFieldsUnchanged(['createdAt']) || (!('createdAt' in resource.data))));
      allow delete: if isAdmin() || (isAuthenticated() && resource.data.userId == request.auth.uid);
    }

    match /feedbacks/{feedbackId} {
      allow read, create: if isAuthenticated();
      allow update, delete: if isAuthenticated();
    }

    match /reports/{reportId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && isValidReport(request.resource.data) && request.resource.data.authorId == request.auth.uid && request.resource.data.status == 'pending' && (!('upvotes' in request.resource.data) || request.resource.data.upvotes == 0) && (!('upvotedBy' in request.resource.data) || request.resource.data.upvotedBy.size() == 0);
      
      function isValidReportUpvote() {
        let oldUpvotes = ('upvotes' in resource.data) ? resource.data.upvotes : 0;
        let newUpvotes = ('upvotes' in request.resource.data) ? request.resource.data.upvotes : 0;
        let oldUpvotedBy = ('upvotedBy' in resource.data) ? resource.data.upvotedBy : [];
        let newUpvotedBy = ('upvotedBy' in request.resource.data) ? request.resource.data.upvotedBy : [];
        let isUpvote = newUpvotes == oldUpvotes + 1 && request.auth.uid in newUpvotedBy && !(request.auth.uid in oldUpvotedBy);
        let isDownvote = newUpvotes == oldUpvotes - 1 && !(request.auth.uid in newUpvotedBy) && request.auth.uid in oldUpvotedBy;
        return request.resource.data.diff(resource.data).affectedKeys().hasOnly(['upvotes', 'upvotedBy']) && (isUpvote || isDownvote);
      }

      allow update: if (isDocOwner() && isValidReport(request.resource.data) && areImmutableFieldsUnchanged(['authorId', 'createdAt', 'status', 'location', 'upvotes', 'upvotedBy'])) || (isAuthenticated() && isValidReportUpvote()) || (isAdmin() && isValidReport(request.resource.data) && areImmutableFieldsUnchanged(['authorId', 'createdAt']));
      allow delete: if isDocOwner() || isAdmin();
    }

    match /posts/{postId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && isValidPost(request.resource.data) && request.resource.data.authorId == request.auth.uid && request.resource.data.likesCount == 0 && request.resource.data.commentsCount == 0 && request.resource.data.verified == false;
      
      function isValidLikeIncrement() {
        let oldLikes = ('likesCount' in resource.data) ? resource.data.likesCount : 0;
        let newLikes = ('likesCount' in request.resource.data) ? request.resource.data.likesCount : 0;
        let oldUpvotedBy = ('upvotedBy' in resource.data) ? resource.data.upvotedBy : [];
        let newUpvotedBy = ('upvotedBy' in request.resource.data) ? request.resource.data.upvotedBy : [];
        return request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likesCount', 'upvotedBy']) && newLikes >= 0 && math.abs(newLikes - oldLikes) == 1 && ((newLikes > oldLikes && newUpvotedBy.size() == oldUpvotedBy.size() + 1 && !(request.auth.uid in oldUpvotedBy) && (request.auth.uid in newUpvotedBy) && !exists(/databases/$(database)/documents/likes/$(request.auth.uid + '_' + postId)) && existsAfter(/databases/$(database)/documents/likes/$(request.auth.uid + '_' + postId))) || (newLikes < oldLikes && newUpvotedBy.size() == oldUpvotedBy.size() - 1 && (request.auth.uid in oldUpvotedBy) && !(request.auth.uid in newUpvotedBy) && exists(/databases/$(database)/documents/likes/$(request.auth.uid + '_' + postId)) && !existsAfter(/databases/$(database)/documents/likes/$(request.auth.uid + '_' + postId))));
      }

      allow update: if (isDocOwner() && isValidPost(request.resource.data) && areImmutableFieldsUnchanged(['authorId', 'createdAt', 'likesCount', 'commentsCount', 'verified'])) || (isAuthenticated() && isValidLikeIncrement()) || (isAdmin() && isValidPost(request.resource.data) && areImmutableFieldsUnchanged(['authorId', 'createdAt']));
      allow delete: if isDocOwner() || isAdmin();
    }

    match /likes/{likeId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && isValidLike(request.resource.data) && request.resource.data.userId == request.auth.uid && likeId == request.auth.uid + '_' + request.resource.data.postId;
      allow update: if false;
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }

    match /risk_zones/{zoneId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    match /guardian_sessions/{sessionId} {
      allow read: if true;
      allow create: if isAuthenticated() && isValidGuardianSession(request.resource.data) && request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && isValidGuardianSession(request.resource.data) && resource.data.userId == request.auth.uid && areImmutableFieldsUnchanged(['userId', 'createdAt']);
      allow delete: if isAdmin() || (isAuthenticated() && resource.data.userId == request.auth.uid);
    }
    
    match /mail/{mailId} {
      allow create: if isAuthenticated() && request.resource.data.to != null;
      allow read: if isAdmin();
    }

    match /whatsapp_messages/{messageId} {
      allow create: if isAuthenticated() && request.resource.data.to != null;
      allow read: if isAdmin();
    }
  }
}
`;

fs.writeFileSync('firestore.rules', orig);
