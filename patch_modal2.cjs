const fs = require('fs');
let code = fs.readFileSync('src/components/CommentsModal.tsx', 'utf8');

const topReplacement = `import React, { useState, useEffect } from 'react';
import { X, Send, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemType: 'post' | 'report';
  authorName: string;
}

export function CommentsModal({ isOpen, onClose, itemId, itemType, authorName }: CommentsModalProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = async () => {
    if (!user || !itemId) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(\`/api/comments?itemId=\${itemId}\`, {
        headers: { 'Authorization': \`Bearer \${token}\` }
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen && itemId && user) {
      fetchComments();
      const interval = setInterval(fetchComments, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, itemId, user]);

  const handlePostComment = async () => {
    if (!newComment.trim() || !user) return;
    setIsSubmitting(true);
    
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify({
          itemId,
          itemType,
          content: newComment.trim(),
          authorName: user.displayName,
          authorAvatar: user.photoURL
        })
      });

      if (res.ok) {
        setNewComment('');
        await fetchComments();
      } else {
        console.error("Failed to post comment");
      }
    } catch (error) {
      console.error("Error posting comment", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;`;

// Replace everything before `if (!isOpen) return null;`
code = code.replace(/import React[\s\S]*?if \(!isOpen\) return null;/m, topReplacement);

// Fix the date formatting inside the JSX since createdAt is now a string (from our API ISOString) instead of a Firestore Timestamp
code = code.replace(/comment\.createdAt\?\.toDate\(\)/g, "new Date(comment.createdAt)");

fs.writeFileSync('src/components/CommentsModal.tsx', code);
