import React, { useState, useEffect } from 'react';
import { X, Send, User } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { useTranslation } from 'react-i18next';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemType: 'post' | 'report';
  authorName: string;
}

export function CommentsModal({ isOpen, onClose, itemId, itemType, authorName }: CommentsModalProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !itemId) return;

    const q = query(
      collection(db, 'comments'),
      where('itemId', '==', itemId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }));
      
      // Ordenar no frontend (cliente) para evitar o erro de Índice Composto do Firebase
      fetchedComments.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeA - timeB; // Ordem crescente
      });
      
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

      // Track comment event
      import('../firebase').then(({ trackEvent }) => {
        trackEvent('comment_created', {
          item_type: itemType
        });
      }).catch(console.error);

      // Increment comment count on the parent item
      const itemRef = doc(db, itemType === 'report' ? 'reports' : 'posts', itemId);
      await updateDoc(itemRef, {
        commentsCount: increment(1)
      });

      setNewComment('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'comments');
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
            <h3 className="text-lg font-bold text-white">{t('comments.title', 'Comentários')}</h3>
            <p className="text-xs text-slate-400">{t('comments.inPostOf', 'em publicação de {{author}}', { author: authorName })}</p>
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
              <p className="text-sm">{t('comments.empty', 'Nenhum comentário ainda.')}</p>
              <p className="text-xs">{t('comments.beFirst', 'Seja o primeiro a participar!')}</p>
            </div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="flex gap-3">
                <img 
                  src={comment.authorAvatar || "https://i.pravatar.cc/150?u=" + comment.authorId} 
                  alt={comment.authorName} 
                  className="w-8 h-8 rounded-full object-cover mt-1 shrink-0" 
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 bg-slate-800 p-3 rounded-2xl rounded-tl-sm">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-semibold text-sm text-white">{comment.authorName}</span>
                    <span className="text-xs text-slate-400">
                      {comment.createdAt ? 
                        new Intl.DateTimeFormat(i18n.language || 'pt-BR', { 
                          hour: '2-digit', minute: '2-digit',
                          day: '2-digit', month: '2-digit'
                        }).format(comment.createdAt.toDate ? comment.createdAt.toDate() : new Date(comment.createdAt)) 
                        : t('time.now', 'agora')
                      }
                    </span>
                  </div>
                  <p dir="auto" className="text-sm text-slate-200 text-start">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 pb-safe">
          <div className="flex gap-2 items-end">
            <textarea
              dir="auto"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t('comments.placeholder', 'Adicione um comentário...')}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-32 min-h-[44px] text-start"
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
