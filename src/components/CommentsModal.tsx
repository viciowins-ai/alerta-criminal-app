import React, { useState, useEffect } from 'react';
import { X, Send, User } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

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

  useEffect(() => {
    if (!isOpen || !itemId) return;

    const q = query(
      collection(db, 'comments'),
      where('itemId', '==', itemId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(fetchedComments);
    }, (error) => {
      console.error("Error fetching comments: ", error);
    });

    return () => unsubscribe();
  }, [isOpen, itemId]);

  const handlePostComment = async () => {
    if (!newComment.trim() || !user) return;
    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, 'comments'), {
        itemId,
        itemType,
        authorId: user.uid,
        authorName: user.displayName || 'Usuário Anônimo',
        authorAvatar: user.photoURL || '',
        content: newComment.trim(),
        createdAt: serverTimestamp()
      });

      // Increment comment count on the parent item
      const itemRef = doc(db, itemType === 'report' ? 'reports' : 'posts', itemId);
      await updateDoc(itemRef, {
        commentsCount: increment(1)
      });

      setNewComment('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-slate-900 border-t sm:border border-slate-700 w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl h-[80vh] sm:h-[600px] flex flex-col animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">Comentários</h3>
            <p className="text-xs text-slate-400">em publicação de {authorName}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2 opacity-50">
              <User size={32} />
              <p className="text-sm">Nenhum comentário ainda.</p>
              <p className="text-xs">Seja o primeiro a participar!</p>
            </div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="flex gap-3">
                <img 
                  src={comment.authorAvatar || "https://i.pravatar.cc/150?u=" + comment.authorId} 
                  alt={comment.authorName} 
                  className="w-8 h-8 rounded-full object-cover mt-1"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 bg-slate-800 p-3 rounded-2xl rounded-tl-sm">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm font-bold text-white">{comment.authorName}</span>
                    <span className="text-[10px] text-slate-400">
                      {comment.createdAt?.toDate ? 
                        comment.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                        : 'agora'
                      }
                    </span>
                  </div>
                  <p className="text-sm text-slate-200">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 pb-safe">
          <div className="flex gap-2 items-end">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Adicione um comentário..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-32 min-h-[44px]"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handlePostComment();
                }
              }}
            />
            <button
              onClick={handlePostComment}
              disabled={!newComment.trim() || isSubmitting}
              className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center shrink-0 h-[44px]"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
