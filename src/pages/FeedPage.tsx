import React, { useState, useEffect, useRef } from 'react';
import { TopBar } from '../components/TopBar';
import { MessageSquare, Heart, Share2, MoreHorizontal, AlertTriangle, ShieldCheck, Send, MapPin, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, getDoc, setDoc, deleteDoc, updateDoc, increment, where, limit, writeBatch, getDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CommentsModal } from '../components/CommentsModal';
import { getLevelInfo } from '../utils/levelUtils';

export function FeedPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [editingReport, setEditingReport] = useState<any>(null);
  const [editType, setEditType] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [feedFilter, setFeedFilter] = useState<'all' | 'reports' | 'posts'>('all');
  const [activeCommentItem, setActiveCommentItem] = useState<{id: string, type: 'post' | 'report', authorName: string} | null>(null);
  const feedContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    // Fetch user profile
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      }
    };
    fetchProfile();

    // Listen to posts
    const qPosts = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(100));
    const unsubscribePosts = onSnapshot(qPosts, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        feedType: 'post',
        ...(doc.data() as any)
      }));
      setPosts(postsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'posts');
    });

    // Listen to reports
    let unsubscribeReports = () => {};
    const setupReportsListener = async () => {
      let userGroupIds: string[] = [];
      if (user) {
        try {
          const qGroups = query(collection(db, 'groups'), where('members', 'array-contains', user.uid));
          const snap = await getDocs(qGroups);
          userGroupIds = snap.docs.map(d => d.id);
        } catch (e) {
          console.error(e);
        }
      }
      
      const qReports = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(100));
      unsubscribeReports = onSnapshot(qReports, (snapshot) => {
        let reportsData = snapshot.docs.map(doc => ({
          id: doc.id,
          feedType: 'report',
          ...(doc.data() as any)
        }));
        
        // Filter reports
        reportsData = reportsData.filter((r: any) => 
          !r.visibility || 
          r.visibility === 'public' || 
          (r.visibility === 'group' && userGroupIds.includes(r.groupId)) ||
          r.authorId === user?.uid
        );
        
        setReports(reportsData);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'reports');
      });
    };
    setupReportsListener();

    // Listen to user's likes
    const likesQuery = query(collection(db, 'likes'), where('userId', '==', user.uid));
    const unsubscribeLikes = onSnapshot(likesQuery, (snapshot) => {
      const userLikes = new Set<string>();
      snapshot.docs.forEach(doc => {
        if (doc.data().userId === user.uid) {
          userLikes.add(doc.data().postId);
        }
      });
      setLikedPosts(userLikes);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'likes');
    });

    return () => {
      unsubscribePosts();
      unsubscribeReports();
      unsubscribeLikes();
    };
  }, [user]);

  const handleLike = async (postId: string) => {
    if (!user) return;
    
    const likeId = `${user.uid}_${postId}`;
    const likeRef = doc(db, 'likes', likeId);
    const postRef = doc(db, 'posts', postId);

    try {
      const batch = writeBatch(db);
      
      if (likedPosts.has(postId)) {
        // Unlike
        batch.delete(likeRef);
        batch.update(postRef, {
          likesCount: increment(-1)
        });
      } else {
        // Like
        batch.set(likeRef, {
          postId,
          userId: user.uid,
          createdAt: serverTimestamp()
        });
        batch.update(postRef, {
          likesCount: increment(1)
        });
      }
      
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `likes/${likeId}`);
    }
  };

  const handleShare = async (item: any) => {
    try {
      let title = '';
      let text = '';

      if (item.feedType === 'report') {
        const typeName = item.type === 'roubo' ? 'Roubo/Furto' : item.type === 'suspeito' ? 'Atividade Suspeita' : item.type === 'vandalismo' ? 'Vandalismo' : 'Alerta';
        title = 'Alerta de Segurança - Guardian';
        text = `⚠️ Alerta de ${typeName} reportado em: ${item.location?.address || 'Localização não especificada'}. Fique atento!`;
      } else {
        title = `Post de ${item.authorName || 'Usuário'} no Guardian`;
        text = item.content;
      }

      const sharedUrl = item.feedType === 'report' 
        ? `${window.location.origin}/?reportId=${item.id}`
        : `${window.location.origin}/feed?postId=${item.id}`;
      
      if (navigator.share) {
        await navigator.share({
          title: title,
          text: text,
          url: sharedUrl,
        });
      } else {
        await navigator.clipboard.writeText(`${text} - ${sharedUrl}`);
        alert('Conteúdo copiado para a área de transferência!');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  const handleComment = (item: any, type: 'post' | 'report') => {
    setActiveCommentItem({
      id: item.id,
      type,
      authorName: item.authorName || 'Usuário'
    });
  };

  const handleUpvoteReport = async (reportId: string, currentUpvotes: number = 0) => {
    if (!user) return;
    
    try {
      const reportRef = doc(db, 'reports', reportId);
      const reportDoc = await getDoc(reportRef);
      
      if (!reportDoc.exists()) return;
      
      const reportData = reportDoc.data();
      const upvotedBy = reportData.upvotedBy || [];
      const hasUpvoted = upvotedBy.includes(user.uid);
      
      if (hasUpvoted) {
        // Remove upvote
        await updateDoc(reportRef, {
          upvotes: Math.max(0, currentUpvotes - 1),
          upvotedBy: upvotedBy.filter((id: string) => id !== user.uid)
        });
        
        // Remove points from user - non-blocking
        try {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            points: increment(-2)
          });
        } catch (pointsError) {
          console.warn("Could not update user points:", pointsError);
        }
      } else {
        // Add upvote
        await updateDoc(reportRef, {
          upvotes: currentUpvotes + 1,
          upvotedBy: [...upvotedBy, user.uid]
        });
        
        // Add points to user - non-blocking
        try {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            points: increment(2)
          });
        } catch (pointsError) {
          console.warn("Could not update user points:", pointsError);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `reports/${reportId}`);
    }
  };

  const handleUpdateReport = async () => {
    if (!editingReport || !user) return;
    try {
      await updateDoc(doc(db, 'reports', editingReport.id), {
        type: editType,
        description: editDescription
      });
      setEditingReport(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'reports');
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !user || !userProfile) return;

    try {
      const levelInfo = getLevelInfo(userProfile?.points || 0);
      await addDoc(collection(db, 'posts'), {
        authorId: user.uid,
        authorName: userProfile.name || user.displayName || 'Usuário',
        authorAvatar: userProfile.avatar || user.photoURL || "https://i.pravatar.cc/150?u=me",
        authorLevel: levelInfo.name,
        verified: levelInfo.verified,
        type: 'Informação',
        content: newPostContent,
        location: 'Sua Localização', // In a real app, get GPS location
        likesCount: 0,
        commentsCount: 0,
        createdAt: serverTimestamp(),
      });
      setNewPostContent('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'posts');
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Agora';
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Há ${diffHours} h`;
    return `Há ${diffDays} d`;
  };

  const feedItems = React.useMemo(() => {
    let combined = [...posts, ...reports];
    
    if (feedFilter === 'reports') {
      combined = reports;
    } else if (feedFilter === 'posts') {
      combined = posts;
    }

    return combined.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
      return timeB - timeA;
    });
  }, [posts, reports, feedFilter]);

  useEffect(() => {
    // Scroll to shared post if present
    const sharedPostId = searchParams.get('postId');
    if (sharedPostId && feedItems.length > 0) {
      setTimeout(() => {
        const element = document.getElementById(`post-${sharedPostId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2', 'ring-offset-slate-900');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2', 'ring-offset-slate-900');
          }, 3000);
        }
      }, 500);
    }
  }, [searchParams, feedItems]);

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <TopBar title="Rede Comunitária" />
      
      {/* Filters */}
      <div className="px-4 pt-4 pb-1">
        <div className="flex gap-2 bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setFeedFilter('all')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${feedFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Todos
          </button>
          <button
            onClick={() => setFeedFilter('reports')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${feedFilter === 'reports' ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            🚨 Alertas
          </button>
          <button
            onClick={() => setFeedFilter('posts')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${feedFilter === 'posts' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            💬 Discussões
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 pt-2">
        {/* Create Post Input */}
        <div className="bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-700 flex flex-col gap-3">
          <div className="flex gap-3 items-center">
            <img src={userProfile?.avatar || user?.photoURL || "https://i.pravatar.cc/150?u=me"} alt="Me" className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
            <input 
              type="text" 
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreatePost()}
              placeholder="Compartilhe algo com a comunidade..." 
              className="flex-1 bg-slate-900 rounded-full px-4 py-2 text-sm text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {newPostContent.trim() && (
            <div className="flex justify-end">
              <button 
                onClick={handleCreatePost}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-full text-sm font-bold transition-colors flex items-center gap-2"
              >
                <Send size={14} />
                Publicar
              </button>
            </div>
          )}
        </div>

        {/* Feed List */}
        {feedItems.length === 0 && (
          <div className="flex flex-col items-center justify-center p-10 text-center space-y-4 opacity-70 mt-10">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
              <MessageSquare size={32} />
            </div>
            <h3 className="text-white font-bold text-lg">Seu feed está vazio</h3>
            <p className="text-sm text-slate-400">Seja o primeiro a publicar algo ou fazer um alerta para sua comunidade!</p>
          </div>
        )}
        
        {feedItems.map(item => {
          const isRecent = item.createdAt?.toMillis && (Date.now() - item.createdAt.toMillis() < 2 * 60 * 60 * 1000);

          if (item.feedType === 'report') {
            return (
              <div key={`report-${item.id}`} className="bg-slate-800 p-4 rounded-2xl shadow-sm border border-red-500/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-10 -mt-10 pointer-events-none" />
                
                <div className="flex justify-between items-start mb-3 relative z-10">
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                        {item.authorName ? `Alerta por ${item.authorName}` : 'Alerta de Segurança'}
                        {item.verified && <ShieldCheck size={14} className="text-blue-400" />}
                        {isRecent && (
                          <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 animate-pulse tracking-wider">
                            <span className="w-1 h-1 bg-white rounded-full"></span> AGORA
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {formatTime(item.createdAt)}
                        {item.authorLevel ? ` • ${item.authorLevel}` : ''}
                      </p>
                    </div>
                  </div>
                  {user?.uid === item.authorId && (
                    <button 
                      onClick={() => {
                        setEditingReport(item);
                        setEditType(item.type || 'outro');
                        setEditDescription(item.description || '');
                      }}
                      className="text-slate-400 hover:text-white p-2"
                    >
                      <span className="text-xs bg-slate-700/50 px-2 py-1 rounded">Corrigir</span>
                    </button>
                  )}
                </div>
                <div className="mb-3 relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-red-500/20 text-red-400">
                      {item.visibility === 'group' ? '🔒 ' : ''}{item.type === 'roubo' ? 'Roubo/Furto' : item.type === 'suspeito' ? 'Atividade Suspeita' : item.type === 'vandalismo' ? 'Vandalismo' : 'Outro'}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 truncate">
                      <ShieldCheck size={12} />
                      {item.location?.address || 'Localização reportada'}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-sm text-slate-200 leading-relaxed mt-2 border-l-2 border-slate-600 pl-3 italic">"{item.description}"</p>
                  )}
                  {item.attachments && item.attachments.length > 0 && (
                    <div className="mt-4 flex gap-2 overflow-x-auto snap-x pb-2">
                      {item.attachments.map((attachment: any, index: number) => {
                        const isObject = typeof attachment === 'object' && attachment !== null;
                        const url = isObject ? attachment.url : attachment;
                        const type = isObject ? attachment.type : (url.includes('.mp4') || url.includes('video') ? 'video/mp4' : 'image/jpeg');

                        return (
                          <div key={index} className="relative aspect-video w-full shrink-0 snap-center rounded-xl overflow-hidden border border-slate-700 cursor-pointer" onClick={() => !type.startsWith('video/') && window.open(url, '_blank')}>
                            {type.startsWith('video/') ? (
                              <video src={url} controls className="w-full h-full object-cover" />
                            ) : (
                              <>
                                <img src={url} alt="Anexo do reporte" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent pointer-events-none" />
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-700 relative z-10">
                  <button 
                    onClick={() => handleUpvoteReport(item.id, item.upvotes)}
                    className={`flex items-center gap-1.5 transition-colors ${item.upvotedBy?.includes(user?.uid) ? 'text-blue-400' : 'text-slate-400 hover:text-blue-400'}`}
                  >
                    <ShieldCheck size={16} className={item.upvotes > 0 ? (item.upvotedBy?.includes(user?.uid) ? 'text-blue-400' : 'text-slate-300') : ''} />
                    <span className="text-xs font-medium">{item.upvotes || 0} {item.upvotes === 1 ? 'confirmação' : 'confirmações'}</span>
                  </button>
                  <button 
                    onClick={() => navigate(`/?reportId=${item.id}`)}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-blue-400 transition-colors"
                  >
                    <MapPin size={16} />
                  </button>
                  <button 
                    onClick={() => handleComment(item, 'report')}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-blue-400 transition-colors"
                  >
                    <MessageSquare size={16} />
                    <span className="text-xs font-medium">{item.commentsCount || 0}</span>
                  </button>
                  <button 
                    onClick={() => handleShare(item)}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-green-400 transition-colors"
                  >
                    <Share2 size={16} />
                  </button>
                </div>
              </div>
            );
          }

          const isLiked = likedPosts.has(item.id);
          return (
            <div key={`post-${item.id}`} className="bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-700">
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-3">
                  <img src={item.authorAvatar} alt={item.authorName} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1">
                      {item.authorName}
                      {item.verified && <ShieldCheck size={14} className="text-blue-400" />}
                    </h4>
                    <p className="text-xs text-slate-400">{formatTime(item.createdAt)} • {item.authorLevel}</p>
                  </div>
                </div>
                <button className="text-slate-500 hover:text-slate-300" onClick={() => alert('Opções do post (Em breve)')}>
                  <MoreHorizontal size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                    item.type === 'Alerta' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                  }`}>
                    {item.type}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    {item.location}
                  </span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">{item.content}</p>
                {item.attachments && item.attachments.length > 0 && (
                  <div className="mt-4 flex gap-2 overflow-x-auto snap-x pb-2">
                    {item.attachments.map((attachment: any, index: number) => {
                      const isObject = typeof attachment === 'object' && attachment !== null;
                      const url = isObject ? attachment.url : attachment;
                      const type = isObject ? attachment.type : (url.includes('.mp4') || url.includes('video') ? 'video/mp4' : 'image/jpeg');

                      return (
                        <div key={index} className="relative aspect-video w-full shrink-0 snap-center rounded-xl overflow-hidden border border-slate-700 cursor-pointer" onClick={() => !type.startsWith('video/') && window.open(url, '_blank')}>
                          {type.startsWith('video/') ? (
                            <video src={url} controls className="w-full h-full object-cover" />
                          ) : (
                            <>
                              <img src={url} alt="Anexo do post" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent pointer-events-none" />
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                <button 
                  onClick={() => handleLike(item.id)}
                  className={`flex items-center gap-1.5 transition-colors ${
                    isLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-400'
                  }`}
                >
                  <Heart size={18} className={isLiked ? 'fill-current' : ''} />
                  <span className="text-xs font-medium">{item.likesCount}</span>
                </button>
                <button 
                  onClick={() => handleComment(item, 'post')}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-blue-400 transition-colors"
                >
                  <MessageSquare size={18} />
                  <span className="text-xs font-medium">{item.commentsCount || 0}</span>
                </button>
                <button 
                  onClick={() => handleShare(item)}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-green-400 transition-colors"
                >
                  <Share2 size={18} />
                  <span className="text-xs font-medium">Compartilhar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Edit Report Modal */}
      {editingReport && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-white mb-4">Corrigir Alerta</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Tipo de Ocorrência</label>
                <select 
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none"
                >
                  <option value="roubo">Roubo/Furto</option>
                  <option value="suspeito">Atividade Suspeita</option>
                  <option value="vandalismo">Vandalismo</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-2">Descrição</label>
                <textarea 
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none resize-none h-24"
                  placeholder="Descreva o que aconteceu..."
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setEditingReport(null)}
                  className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleUpdateReport}
                  className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Comments Modal */}
      {activeCommentItem && (
        <CommentsModal
          isOpen={true}
          onClose={() => setActiveCommentItem(null)}
          itemId={activeCommentItem.id}
          itemType={activeCommentItem.type}
          authorName={activeCommentItem.authorName}
        />
      )}
    </div>
  );
}
