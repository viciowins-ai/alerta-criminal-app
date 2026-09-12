const fs = require('fs');
let code = fs.readFileSync('src/components/CommentsModal.tsx', 'utf8');

const replacement = `
import React, { useState, useEffect } from 'react';
import { X, Send, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemType: 'post' | 'report';
  authorName: string;
}

interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: any;
}

export function CommentsModal({ isOpen, onClose, itemId, itemType, authorName }: CommentsModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchComments = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(\`/api/comments?itemId=\${itemId}\`, {
        headers: {
          'Authorization': \`Bearer \${token}\`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && itemId) {
      setIsLoading(true);
      fetchComments();
      
      // Poll for new comments every 5 seconds while open
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

      if (!res.ok) throw new Error('Falha ao adicionar comentário');

      setNewComment('');
      await fetchComments(); // Refresh comments immediately
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'comments');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Agora';
    try {
      let date;
      if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else if (timestamp?.toDate) {
        date = timestamp.toDate();
      } else {
        date = new Date(timestamp);
      }
      return new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
      }).format(date);
    } catch (e) {
      return 'Agora';
    }
  };
`;

code = code.replace(/import React[\s\S]*?const formatTime = \(timestamp: any\) => \{[\s\S]*?  \};/m, replacement);

fs.writeFileSync('src/components/CommentsModal.tsx', code);
