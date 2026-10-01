import React, { useState, useEffect } from 'react';
import { X, Send, User, Mic } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { useTranslation } from 'react-i18next';
import { AudioPlayer } from './AudioPlayer';
import { VoiceRecorder } from './VoiceRecorder';

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
  const [audioComment, setAudioComment] = useState<{ url: string; duration: number } | null>(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
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
    if ((!newComment.trim() && !audioComment) || !user) return;
    setIsSubmitting(true);
    
    try {
      const commentPayload: any = {
        itemId,
        itemType,
        authorId: user.uid,
        authorName: user.displayName || 'Usuário Anônimo',
        authorAvatar: user.photoURL || '',
        content: newComment.trim() || (audioComment ? '🎙️ Mensagem de voz' : ''),
        createdAt: serverTimestamp()
      };

      if (audioComment) {
        commentPayload.audioUrl = audioComment.url;
        commentPayload.audioDuration = audioComment.duration;
      }

      await addDoc(collection(db, 'comments'), commentPayload);

      // Track comment event
      import('../firebase').then(({ trackEvent }) => {
        trackEvent('comment_created', {
          item_type: itemType,
          has_audio: Boolean(audioComment)
        });
      }).catch(console.error);

      // Increment comment count on the parent item
      const itemRef = doc(db, itemType === 'report' ? 'reports' : 'posts', itemId);
      await updateDoc(itemRef, {
        commentsCount: increment(1)
      });

      setNewComment('');
      setAudioComment(null);
      setShowVoiceRecorder(false);
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
                  {comment.content && <p dir="auto" className="text-sm text-slate-200 text-start">{comment.content}</p>}
                  {comment.audioUrl && (
                    <div className="mt-2">
                      <AudioPlayer src={comment.audioUrl} duration={comment.audioDuration} compact />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Voice Recorder Overlay / Section */}
        {showVoiceRecorder && (
          <div className="p-3 bg-slate-800/90 border-t border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1">
                <Mic size={13} /> Gravar Áudio do Comentário
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowVoiceRecorder(false);
                  setAudioComment(null);
                }}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
            </div>
            <VoiceRecorder
              maxDuration={60}
              label="Gravar áudio (até 60s)"
              onAudioRecorded={(audio) => setAudioComment(audio)}
            />
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 pb-safe">
          <div className="flex gap-2 items-end">
            <button
              type="button"
              onClick={() => setShowVoiceRecorder(prev => !prev)}
              title="Gravar mensagem de voz"
              className={`p-3 rounded-xl border transition-colors flex items-center justify-center shrink-0 h-[44px] ${
                showVoiceRecorder || audioComment
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-indigo-300 hover:border-indigo-500/50'
              }`}
            >
              <Mic size={18} />
            </button>
            <textarea
              dir="auto"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={audioComment ? 'Áudio gravado! Adicione texto se desejar...' : t('comments.placeholder', 'Adicione um comentário...')}
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
              type="button"
              onClick={handlePostComment}
              disabled={(!newComment.trim() && !audioComment) || isSubmitting}
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
