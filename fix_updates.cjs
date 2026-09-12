const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

// For reports
code = code.replace(/function isValidReportCommentIncrement\(\) \{[\s\S]*?allow update: if \(isDocOwner\(\) && isValidReport\(request\.resource\.data\) && areImmutableFieldsUnchanged\(\['authorId', 'createdAt', 'status', 'location', 'upvotes', 'upvotedBy', 'commentsCount'\]\)\) \|\| \(isAuthenticated\(\) && isValidReportUpvote\(\)\) \|\| \(isAuthenticated\(\) && isValidReportCommentIncrement\(\)\) \|\| \(isAdmin\(\) && isValidReport\(request\.resource\.data\) && areImmutableFieldsUnchanged\(\['authorId', 'createdAt'\]\)\);/, 
  "allow update: if (isDocOwner() && isValidReport(request.resource.data) && areImmutableFieldsUnchanged(['authorId', 'createdAt', 'status', 'location', 'upvotes', 'upvotedBy'])) || (isAuthenticated() && isValidReportUpvote()) || (isAuthenticated() && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['commentsCount'])) || (isAdmin() && isValidReport(request.resource.data) && areImmutableFieldsUnchanged(['authorId', 'createdAt']));");

// For posts
code = code.replace(/function isValidPostCommentIncrement\(\) \{[\s\S]*?allow update: if \(isDocOwner\(\) && isValidPost\(request\.resource\.data\) && areImmutableFieldsUnchanged\(\['authorId', 'createdAt', 'likesCount', 'commentsCount', 'verified'\]\)\) \|\| \(isAuthenticated\(\) && isValidLikeIncrement\(\)\) \|\| \(isAuthenticated\(\) && isValidPostCommentIncrement\(\)\) \|\| \(isAdmin\(\) && isValidPost\(request\.resource\.data\) && areImmutableFieldsUnchanged\(\['authorId', 'createdAt'\]\)\);/, 
  "allow update: if (isDocOwner() && isValidPost(request.resource.data) && areImmutableFieldsUnchanged(['authorId', 'createdAt', 'likesCount', 'commentsCount', 'verified'])) || (isAuthenticated() && isValidLikeIncrement()) || (isAuthenticated() && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['commentsCount'])) || (isAdmin() && isValidPost(request.resource.data) && areImmutableFieldsUnchanged(['authorId', 'createdAt']));");

fs.writeFileSync('firestore.rules', code);
