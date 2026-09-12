const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

// Add isValidComment function
const isValidCommentStr = `
    function isValidComment(data) {
      return hasRequiredFields(['itemId', 'itemType', 'authorId', 'authorName', 'content', 'createdAt']) &&
             data.itemId is string &&
             data.itemType in ['post', 'report'] &&
             data.authorId is string &&
             data.authorName is string &&
             data.content is string &&
             data.createdAt is timestamp;
    }
`;

if (!code.includes('isValidComment')) {
  code = code.replace(
    "    function isValidLike(data) {",
    isValidCommentStr + "\n    function isValidLike(data) {"
  );
}

// Add comments collection match
const commentsMatchStr = `
    match /comments/{commentId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && isValidComment(request.resource.data) && request.resource.data.authorId == request.auth.uid;
      allow update: if isAuthenticated() && isDocOwner() && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['content']) && request.resource.data.content is string;
      allow delete: if isDocOwner() || isAdmin();
    }
`;

if (!code.includes('match /comments/')) {
  code = code.replace(
    "    match /feedbacks/{feedbackId} {",
    commentsMatchStr + "\n    match /feedbacks/{feedbackId} {"
  );
}

// Add valid comment increment for reports
const reportUpdateOriginal = `allow update: if (isDocOwner() && isValidReport(request.resource.data) && areImmutableFieldsUnchanged(['authorId', 'createdAt', 'status', 'location', 'upvotes', 'upvotedBy'])) || (isAuthenticated() && isValidReportUpvote()) || (isAdmin() && isValidReport(request.resource.data) && areImmutableFieldsUnchanged(['authorId', 'createdAt']));`;
const reportUpdateNew = `      function isValidReportCommentIncrement() {
        let oldComments = ('commentsCount' in resource.data) ? resource.data.commentsCount : 0;
        let newComments = ('commentsCount' in request.resource.data) ? request.resource.data.commentsCount : 0;
        return request.resource.data.diff(resource.data).affectedKeys().hasOnly(['commentsCount']) && (newComments == oldComments + 1 || newComments == oldComments - 1);
      }
      allow update: if (isDocOwner() && isValidReport(request.resource.data) && areImmutableFieldsUnchanged(['authorId', 'createdAt', 'status', 'location', 'upvotes', 'upvotedBy', 'commentsCount'])) || (isAuthenticated() && isValidReportUpvote()) || (isAuthenticated() && isValidReportCommentIncrement()) || (isAdmin() && isValidReport(request.resource.data) && areImmutableFieldsUnchanged(['authorId', 'createdAt']));`;

if (!code.includes('isValidReportCommentIncrement')) {
  code = code.replace(reportUpdateOriginal, reportUpdateNew);
}

// Add valid comment increment for posts
const postUpdateOriginal = `allow update: if (isDocOwner() && isValidPost(request.resource.data) && areImmutableFieldsUnchanged(['authorId', 'createdAt', 'likesCount', 'commentsCount', 'verified'])) || (isAuthenticated() && isValidLikeIncrement()) || (isAdmin() && isValidPost(request.resource.data) && areImmutableFieldsUnchanged(['authorId', 'createdAt']));`;
const postUpdateNew = `      function isValidPostCommentIncrement() {
        let oldComments = ('commentsCount' in resource.data) ? resource.data.commentsCount : 0;
        let newComments = ('commentsCount' in request.resource.data) ? request.resource.data.commentsCount : 0;
        return request.resource.data.diff(resource.data).affectedKeys().hasOnly(['commentsCount']) && (newComments == oldComments + 1 || newComments == oldComments - 1);
      }
      allow update: if (isDocOwner() && isValidPost(request.resource.data) && areImmutableFieldsUnchanged(['authorId', 'createdAt', 'likesCount', 'commentsCount', 'verified'])) || (isAuthenticated() && isValidLikeIncrement()) || (isAuthenticated() && isValidPostCommentIncrement()) || (isAdmin() && isValidPost(request.resource.data) && areImmutableFieldsUnchanged(['authorId', 'createdAt']));`;

if (!code.includes('isValidPostCommentIncrement')) {
  code = code.replace(postUpdateOriginal, postUpdateNew);
}

fs.writeFileSync('firestore.rules', code);
