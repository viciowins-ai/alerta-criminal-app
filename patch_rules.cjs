const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

if (!rules.includes('match /comments/{commentId}')) {
  rules = rules.replace(
    'match /feedbacks/{feedbackId}',
    `match /comments/{commentId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.resource.data.authorId == request.auth.uid;
      allow update: if isAuthenticated() && resource.data.authorId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.authorId == request.auth.uid || isAdmin();
    }
    match /feedbacks/{feedbackId}`
  );
}

const reportUpdate = `allow update: if (isDocOwner() && isValidReport(request.resource.data) && areImmutableFieldsUnchanged(['authorId', 'createdAt', 'status', 'location', 'upvotes', 'upvotedBy'])) || (isAuthenticated() && isValidReportUpvote()) || (isAdmin() && isValidReport(request.resource.data) && areImmutableFieldsUnchanged(['authorId', 'createdAt']));`;
const newReportUpdate = `
      function isValidReportCommentIncrement() {
        let oldComments = ('commentsCount' in resource.data) ? resource.data.commentsCount : 0;
        let newComments = ('commentsCount' in request.resource.data) ? request.resource.data.commentsCount : 0;
        return request.resource.data.diff(resource.data).affectedKeys().hasOnly(['commentsCount']) && (newComments == oldComments + 1 || newComments == oldComments - 1);
      }
      allow update: if (isDocOwner() && isValidReport(request.resource.data) && areImmutableFieldsUnchanged(['authorId', 'createdAt', 'status', 'location', 'upvotes', 'upvotedBy', 'commentsCount'])) || (isAuthenticated() && isValidReportUpvote()) || (isAuthenticated() && isValidReportCommentIncrement()) || (isAdmin() && isValidReport(request.resource.data) && areImmutableFieldsUnchanged(['authorId', 'createdAt']));
`;
rules = rules.replace(reportUpdate, newReportUpdate.trim());

const postUpdate = `allow update: if (isDocOwner() && isValidPost(request.resource.data) && areImmutableFieldsUnchanged(['authorId', 'createdAt', 'likesCount', 'commentsCount', 'verified'])) || (isAuthenticated() && isValidLikeIncrement()) || (isAdmin() && isValidPost(request.resource.data) && areImmutableFieldsUnchanged(['authorId', 'createdAt']));`;
const newPostUpdate = `
      function isValidPostCommentIncrement() {
        let oldComments = ('commentsCount' in resource.data) ? resource.data.commentsCount : 0;
        let newComments = ('commentsCount' in request.resource.data) ? request.resource.data.commentsCount : 0;
        return request.resource.data.diff(resource.data).affectedKeys().hasOnly(['commentsCount']) && (newComments == oldComments + 1 || newComments == oldComments - 1);
      }
      allow update: if (isDocOwner() && isValidPost(request.resource.data) && areImmutableFieldsUnchanged(['authorId', 'createdAt', 'likesCount', 'commentsCount', 'verified'])) || (isAuthenticated() && isValidLikeIncrement()) || (isAuthenticated() && isValidPostCommentIncrement()) || (isAdmin() && isValidPost(request.resource.data) && areImmutableFieldsUnchanged(['authorId', 'createdAt']));
`;
rules = rules.replace(postUpdate, newPostUpdate.trim());

fs.writeFileSync('firestore.rules', rules);
