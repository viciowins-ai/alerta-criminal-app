import React, { useState, useEffect, useRef } from 'react';
import { TopBar } from '../components/TopBar';
import { AttachmentGallery } from '../components/AttachmentGallery';
import { MessageSquare, Heart, Share2, MoreHorizontal, AlertTriangle, ShieldCheck, Send, MapPin, Users, Lock, Plus, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, getDoc, deleteDoc, updateDoc, increment, where, limit, writeBatch } from 'firebase/firestore';
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
  const [privateReports, setPrivateReports] = useState<any[]>([]);
  const [privatePosts, setPrivatePosts] = useState<any[]>([]);
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [newPostContent, setNewPostContent] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [editingReport, setEditingReport] = useState<any>(null);
  const [editType, setEditType] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [feedFilter, setFeedFilter] = useState<'all' | 'reports' | 'private'>('all');
  const [activeCommentItem, setActiveCommentItem] = useState<{id: string, type: 'post' | 'report', authorName: string} | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setInitialLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch user profile & user groups
  useEffect(() => {
    if (!user) return;

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

    // Listen to user groups
    const qGroups = query(collection(db, 'groups'), where('members', 'array-contains', user.uid));
    const unsubscribeGroups = onSnapshot(qGroups, (snapshot) => {
      const groupsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserGroups(groupsData);
      if (groupsData.length > 0 && selectedGroupId === 'all') {
        setSelectedGroupId(groupsData[0].id);
      }
    }, (error) => {
      console.error("Error fetching user groups:", error);
    });

    // Listen to public posts
    const qPosts = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(100));
    const unsubscribePosts = onSnapshot(qPosts, (snapshot) => {
      let postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        feedType: 'post',
        ...(doc.data() as any)
      }));

      // Apenas postagens públicas no feed geral
      postsData = postsData.filter((p: any) => {
        const isPrivate = p.visibility === 'group' || p.visibility === 'private' || p.visibility === 'privado' || Boolean(p.groupId) || Boolean(p.groupName);
        return !isPrivate;
      });

      setPosts(postsData);
      if (!snapshot.metadata.fromCache || postsData.length > 0) setInitialLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'posts');
    });

    // Listen to public reports
    const qReports = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(100));
    const unsubscribeReports = onSnapshot(qReports, (snapshot) => {
      let reportsData = snapshot.docs.map(doc => ({
        id: doc.id,
        feedType: 'report',
        ...(doc.data() as any)
      }));
      
      // TRAVA DE PRIVACIDADE:
      // Ocorrências de Rede Privada NUNCA aparecem no feed público geral.
      reportsData = reportsData.filter((r: any) => {
        const isPrivate = 
          r.visibility === 'group' || 
          r.visibility === 'private' || 
          r.visibility === 'privado' || 
          Boolean(r.groupId) || 
          Boolean(r.groupName);
        
        if (isPrivate) {
          return false;
        }
        return !r.visibility || r.visibility === 'public';
      });
      
      setReports(reportsData);
      if (!snapshot.metadata.fromCache || reportsData.length > 0) setInitialLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reports');
    });

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
      unsubscribeGroups();
      unsubscribePosts();
      unsubscribeReports();
      unsubscribeLikes();
    };
  }, [user]);

  // Listen to private reports & posts for user's groups
  useEffect(() => {
    if (!user || userGroups.length === 0) {
      setPrivateReports([]);
      setPrivatePosts([]);
      return;
    }

    const groupIdsToQuery = selectedGroupId === 'all' 
      ? userGroups.map(g => g.id).slice(0, 10) 
      : [selectedGroupId];

    if (groupIdsToQuery.length === 0) return;

    // Listen to private reports
    const qPrivReports = query(
      collection(db, 'reports'), 
      where('groupId', 'in', groupIdsToQuery)
    );
    const unsubPrivReports = onSnapshot(qPrivReports, (snapshot) => {
      const reps = snapshot.docs.map(d => ({
        id: d.id,
        feedType: 'report',
        ...d.data()
      }));
      setPrivateReports(reps);
    }, (err) => {
      console.error("Error loading private reports in feed:", err);
    });

    // Listen to private posts
    const qPrivPosts = query(
      collection(db, 'posts'),
      where('groupId', 'in', groupIdsToQuery)
    );
    const unsubPrivPosts = onSnapshot(qPrivPosts, (snapshot) => {
      const psts = snapshot.docs.map(d => ({
        id: d.id,
        feedType: 'post',
        ...d.data()
      }));
      setPrivatePosts(psts);
    }, (err) => {
      console.error("Error loading private posts in feed:", err);
    });

    return () => {
      unsubPrivReports();
      unsubPrivPosts();
    };
  }, [user, userGroups, selectedGroupId]);

  const handleLike = async (postId: string) => {
    if (!user) return;
    
    const likeId = `${user.uid}_${postId}`;
    const likeRef = doc(db, 'likes', likeId);
    const postRef = doc(db, 'posts', postId);

    try {
      const batch = writeBatch(db);
      
      if (likedPosts.has(postId)) {
        batch.delete(likeRef);
        batch.update(postRef, {
          likesCount: increment(-1)
        });
      } else {
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

  const handleDeleteItem = async (id: string, feedType: 'post' | 'report') => {
    if (!user) return;
    const isConfirmed = window.confirm(
      feedType === 'post' 
        ? "Tem certeza que deseja excluir esta publicação?" 
        : "Tem certeza que deseja excluir este alerta?"
    );
    
    if (!isConfirmed) return;

    try {
      if (feedType === 'post') {
        await deleteDoc(doc(db, 'posts', id));
        setPosts(prev => prev.filter(p => p.id !== id));
        setPrivatePosts(prev => prev.filter(p => p.id !== id));
      } else {
        await deleteDoc(doc(db, 'reports', id));
        setReports(prev => prev.filter(r => r.id !== id));
        setPrivateReports(prev => prev.filter(r => r.id !== id));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${feedType}s/${id}`);
    }
  };

  const handleShare = async (item: any) => {
    const isReport = item.feedType === 'report';
    const title = isReport 
      ? `Alerta: ${item.type?.toUpperCase()} em ${item.location?.address || 'Localização'}` 
      : `Publicação de ${item.authorName} no Alerta Criminal`;
    
    const text = isReport 
      ? `Atenção! Alerta registrado no bairro: "${item.description || item.type}". Confira no mapa do Alerta Criminal:` 
      : `Confira o relato de ${item.authorName}: "${item.content}". Acesse o Alerta Criminal:`;
      
    const url = window.location.origin + (isReport ? `/?reportId=${item.id}` : `/feed?postId=${item.id}`);

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url
        });
        return;
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Erro ao compartilhar nativamente:', error);
        } else {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(`${title}\n\n${text}\n${url}`);
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message: 'Link copiado para a área de transferência!' } 
      }));
    } catch (error) {
      console.error('Erro ao copiar link:', error);
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
        await updateDoc(reportRef, {
          upvotes: Math.max(0, currentUpvotes - 1),
          upvotedBy: upvotedBy.filter((id: string) => id !== user.uid)
        });
        
        try {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            points: increment(-2)
          });
        } catch (pointsError) {
          console.warn("Could not update user points:", pointsError);
        }
      } else {
        await updateDoc(reportRef, {
          upvotes: currentUpvotes + 1,
          upvotedBy: [...upvotedBy, user.uid]
        });
        
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

      // Post em Grupo Privado
      if (feedFilter === 'private') {
        const targetGroup = userGroups.find(g => g.id === selectedGroupId) || userGroups[0];
        if (!targetGroup) {
          navigate('/groups');
          return;
        }

        await addDoc(collection(db, 'posts'), {
          authorId: user.uid,
          authorName: userProfile.name || user.displayName || 'Morador',
          authorAvatar: userProfile.avatar || user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
          authorLevel: levelInfo.name,
          verified: levelInfo.verified,
          type: 'Aviso da Rede',
          content: newPostContent.trim(),
          location: targetGroup.name,
          visibility: 'group',
          groupId: targetGroup.id,
          groupName: targetGroup.name,
          likesCount: 0,
          commentsCount: 0,
          createdAt: serverTimestamp(),
        });
        setNewPostContent('');
        return;
      }

      // Post Público na Comunidade Geral
      await addDoc(collection(db, 'posts'), {
        authorId: user.uid,
        authorName: userProfile.name || user.displayName || 'Usuário',
        authorAvatar: userProfile.avatar || user.photoURL || "https://i.pravatar.cc/150?u=me",
        authorLevel: levelInfo.name,
        verified: levelInfo.verified,
        type: 'Informação',
        content: newPostContent.trim(),
        location: 'Sua Localização',
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

  const currentSelectedGroup = React.useMemo(() => {
    if (selectedGroupId === 'all') return userGroups[0] || null;
    return userGroups.find(g => g.id === selectedGroupId) || null;
  }, [userGroups, selectedGroupId]);

  const feedItems = React.useMemo(() => {
    if (feedFilter === 'private') {
      const combined = [...privatePosts, ...privateReports];
      return combined.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
    }

    let combined = [...posts, ...reports];
    
    if (feedFilter === 'reports') {
      combined = reports;
    }

    // TRAVA DUPLA DE SEGURANÇA:
    // Garante categoricamente que nada de grupo privado passe para a aba pública
    combined = combined.filter((item: any) => {
      const isPrivate = 
        item.visibility === 'group' || 
        item.visibility === 'private' || 
        item.visibility === 'privado' || 
        Boolean(item.groupId) || 
        Boolean(item.groupName);
      return !isPrivate;
    });

    return combined.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
      return timeB - timeA;
    });
  }, [posts, reports, privatePosts, privateReports, feedFilter]);

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
      
      {/* Filters / Tabs */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex gap-1.5 bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setFeedFilter('all')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${feedFilter === 'all' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Todos
          </button>
          <button
            onClick={() => setFeedFilter('reports')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${feedFilter === 'reports' ? 'bg-red-500/20 text-red-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            🚨 Alertas Públicos
          </button>
          <button
            onClick={() => setFeedFilter('private')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${feedFilter === 'private' ? 'bg-indigo-600 text-white shadow-sm' : 'text-indigo-400 hover:text-indigo-300'}`}
          >
            <Lock size={12} />
            <span>Redes Privadas</span>
            {userGroups.length > 0 && (
              <span className="bg-indigo-900/80 text-indigo-200 text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                {userGroups.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 pt-2">
        {/* Visual Seletor de Redes Privadas quando na aba Privada */}
        {feedFilter === 'private' && (
          <div className="space-y-3 animate-in fade-in">
            {userGroups.length === 0 ? (
              <div className="bg-slate-800/90 border border-indigo-500/30 rounded-2xl p-6 text-center shadow-lg">
                <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                  <Lock size={26} />
                </div>
                <h3 className="text-white font-bold text-base mb-1.5">Círculos de Confiança Privados</h3>
                <p className="text-slate-400 text-xs leading-relaxed max-w-xs mx-auto mb-5">
                  Você ainda não faz parte de nenhuma rede privada. Crie um grupo para sua rua ou condomínio, ou entre com o código de um vizinho.
                </p>
                <button
                  onClick={() => navigate('/groups')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                >
                  <Plus size={16} /> Criar ou Entrar em um Grupo
                </button>
              </div>
            ) : (
              <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-indigo-500/30 flex flex-col gap-2.5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <Shield size={14} className="text-indigo-400" />
                      Sua Rede:
                    </span>
                    {userGroups.length > 1 ? (
                      <select
                        value={selectedGroupId}
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                        className="bg-slate-900 border border-indigo-500/40 text-white text-xs font-bold rounded-lg px-2.5 py-1 outline-none cursor-pointer"
                      >
                        <option value="all">Todas as Redes ({userGroups.length})</option>
                        {userGroups.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-white text-xs font-bold bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-0.5 rounded-lg">
                        {userGroups[0].name}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => navigate('/groups')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  >
                    Gerenciar <ArrowRight size={12} />
                  </button>
                </div>

                {currentSelectedGroup && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users size={12} className="text-indigo-400" />
                      {currentSelectedGroup.members?.length || 1} membros participantes
                    </span>
                    <span className="font-mono text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700 text-[10px]">
                      Código: {currentSelectedGroup.inviteCode}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Create Post Input */}
        {(feedFilter !== 'private' || userGroups.length > 0) && (
          <div className={`p-4 rounded-2xl shadow-sm border flex flex-col gap-3 ${
            feedFilter === 'private' ? 'bg-slate-800 border-indigo-500/40' : 'bg-slate-800 border-slate-700'
          }`}>
            <div className="flex gap-3 items-center">
              <img 
                src={userProfile?.avatar || user?.photoURL || "https://i.pravatar.cc/150?u=me"} 
                alt="Me" 
                className={`w-10 h-10 rounded-full object-cover ${feedFilter === 'private' ? 'border border-indigo-400/40' : ''}`} 
                referrerPolicy="no-referrer" 
              />
              <input 
                type="text" 
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreatePost()}
                placeholder={
                  feedFilter === 'private'
                    ? (currentSelectedGroup ? `Escreva um aviso para ${currentSelectedGroup.name}...` : "Escreva um aviso para sua rede privada...")
                    : "Compartilhe algo com a comunidade..."
                } 
                className="flex-1 bg-slate-900 rounded-full px-4 py-2 text-sm text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-700"
              />
            </div>
            
            <div className="flex items-center justify-between pt-1 border-t border-slate-700/60">
              {feedFilter === 'private' ? (
                <button
                  onClick={() => navigate(currentSelectedGroup ? `/report?groupId=${currentSelectedGroup.id}` : '/report')}
                  className="text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border border-red-500/20 cursor-pointer"
                >
                  <AlertTriangle size={13} />
                  Novo Alerta na Rede
                </button>
              ) : (
                <span className="text-[11px] text-slate-500">
                  Publicação visível para toda a comunidade
                </span>
              )}

              {newPostContent.trim() && (
                <button 
                  onClick={handleCreatePost}
                  className={`text-white px-4 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow ${
                    feedFilter === 'private' ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-blue-600 hover:bg-blue-500'
                  }`}
                >
                  {feedFilter === 'private' ? <Lock size={12} /> : <Send size={12} />}
                  {feedFilter === 'private' ? 'Publicar na Rede' : 'Publicar'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Feed List */}
        {initialLoading ? (
          <div className="flex flex-col items-center justify-center p-10 text-center opacity-70 mt-10">
            <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 text-sm font-medium">Carregando feed...</p>
          </div>
        ) : feedItems.length === 0 && (
          <div className="flex flex-col items-center justify-center p-10 text-center space-y-4 opacity-70 mt-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${feedFilter === 'private' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
              {feedFilter === 'private' ? <Lock size={32} /> : <MessageSquare size={32} />}
            </div>
            <h3 className="text-white font-bold text-lg">
              {feedFilter === 'private' ? 'Nenhuma publicação nesta rede ainda' : 'Seu feed está vazio'}
            </h3>
            <p className="text-sm text-slate-400 max-w-xs">
              {feedFilter === 'private'
                ? 'Compartilhe um aviso ou relate uma ocorrência restrita aos seus vizinhos!'
                : 'Seja o primeiro a publicar algo ou fazer um alerta para sua comunidade!'}
            </p>
          </div>
        )}
        
        {feedItems.map(item => {
          const isRecent = item.createdAt?.toMillis && (Date.now() - item.createdAt.toMillis() < 2 * 60 * 60 * 1000);
          const isPrivateItem = Boolean(item.groupId || item.groupName || item.visibility === 'group');

          if (item.feedType === 'report') {
            return (
              <div 
                key={`report-${item.id}`} 
                className={`bg-slate-800 p-4 rounded-2xl shadow-sm relative overflow-hidden ${
                  isPrivateItem ? 'border border-indigo-500/40 shadow-indigo-950/20' : 'border border-red-500/30'
                }`}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-10 -mt-10 pointer-events-none ${
                  isPrivateItem ? 'bg-indigo-500/5' : 'bg-red-500/5'
                }`} />
                
                <div className="flex justify-between items-start mb-3 relative z-10">
                  <div className="flex gap-3 items-center">
                    {item.isAnonymous || !item.authorAvatar ? (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        isPrivateItem ? 'bg-indigo-500/20 text-indigo-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {isPrivateItem ? <Lock size={18} /> : <AlertTriangle size={20} />}
                      </div>
                    ) : (
                      <div className="relative shrink-0">
                        <img 
                          src={item.authorAvatar} 
                          alt={item.authorName || 'Alerta'} 
                          className={`w-10 h-10 rounded-full object-cover ${
                            isPrivateItem ? 'border border-indigo-500/50' : 'border border-red-500/40'
                          }`} 
                          referrerPolicy="no-referrer" 
                        />
                        <div className={`absolute -bottom-1 -right-1 rounded-full p-0.5 text-white border border-slate-900 shadow ${
                          isPrivateItem ? 'bg-indigo-600' : 'bg-red-600'
                        }`}>
                          {isPrivateItem ? <Lock size={9} /> : <AlertTriangle size={10} />}
                        </div>
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                        {item.authorName ? `Alerta por ${item.authorName}` : 'Alerta de Segurança'}
                        {item.verified && <ShieldCheck size={14} className="text-blue-400" />}
                        {isRecent && (
                          <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 animate-pulse tracking-wider">
                            <span className="w-1 h-1 bg-white rounded-full"></span> AGORA
                          </span>
                        )}
                        {isPrivateItem && (
                          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Lock size={10} /> {item.groupName || 'Rede Privada'}
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {formatTime(item.createdAt)}
                        {item.authorLevel ? ` • ${item.authorLevel}` : ''}
                      </p>
                    </div>
                  </div>
                  {(user?.uid === item.authorId || user?.email === 'viciowins@gmail.com') && (
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => {
                          setEditingReport(item);
                          setEditType(item.type || 'outro');
                          setEditDescription(item.description || '');
                        }}
                        className="text-slate-400 hover:text-white p-2"
                      >
                        <span className="text-xs bg-slate-700/50 px-2 py-1 rounded hover:bg-slate-700 transition-colors">Corrigir</span>
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(item.id, 'report')}
                        className="text-slate-400 hover:text-red-400 p-2"
                      >
                        <span className="text-xs bg-slate-700/50 px-2 py-1 rounded hover:bg-red-500/20 transition-colors">Excluir</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Report Content */}
                <div className="mb-3 relative z-10">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                      {item.type?.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 truncate max-w-[200px] sm:max-w-none">
                      <MapPin size={12} className="text-red-400 shrink-0" />
                      {item.location?.address || 'Localização no Mapa'}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-sm text-slate-200 leading-relaxed italic bg-slate-900/40 p-3 rounded-xl border border-slate-700/40 mb-2">
                      "{item.description}"
                    </p>
                  )}
                  {item.attachments && item.attachments.length > 0 && (
                    <AttachmentGallery attachments={item.attachments} />
                  )}
                </div>

                {/* Report Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-700 relative z-10">
                  <button 
                    onClick={() => handleUpvoteReport(item.id, item.upvotes || 0)}
                    className={`flex items-center gap-1.5 transition-colors ${
                      item.upvotedBy?.includes(user?.uid) ? 'text-blue-400' : 'text-slate-400 hover:text-blue-400'
                    }`}
                  >
                    <ShieldCheck size={18} className={item.upvotedBy?.includes(user?.uid) ? 'fill-current' : ''} />
                    <span className="text-xs font-medium">{item.upvotes || 0} confirmações</span>
                  </button>
                  <button 
                    onClick={() => navigate(`/?reportId=${item.id}`)}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
                  >
                    <MapPin size={18} />
                    <span className="text-xs font-medium">Ver no Mapa</span>
                  </button>
                  <button 
                    onClick={() => handleComment(item, 'report')}
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
                  </button>
                </div>
              </div>
            );
          }

          const isLiked = likedPosts.has(item.id);
          return (
            <div 
              key={`post-${item.id}`} 
              className={`bg-slate-800 p-4 rounded-2xl shadow-sm border ${
                isPrivateItem ? 'border-indigo-500/40' : 'border-slate-700'
              }`}
            >
              {/* Post Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-3">
                  <img 
                    src={item.authorAvatar} 
                    alt={item.authorName} 
                    className={`w-10 h-10 rounded-full object-cover ${isPrivateItem ? 'border border-indigo-400/40' : ''}`} 
                    referrerPolicy="no-referrer" 
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5 flex-wrap">
                      {item.authorName}
                      {item.verified && <ShieldCheck size={14} className="text-blue-400" />}
                      {isPrivateItem && (
                        <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Lock size={10} /> {item.groupName || 'Rede Privada'}
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-400">{formatTime(item.createdAt)} • {item.authorLevel}</p>
                  </div>
                </div>
                {(user?.uid === item.authorId || user?.email === 'viciowins@gmail.com') ? (
                  <button 
                    className="text-slate-500 hover:text-red-400 p-2" 
                    onClick={() => handleDeleteItem(item.id, 'post')}
                  >
                    <span className="text-xs bg-slate-700/50 px-2 py-1 rounded hover:bg-red-500/20 transition-colors">Excluir</span>
                  </button>
                ) : (
                  <button className="text-slate-500 hover:text-slate-300">
                    <MoreHorizontal size={20} />
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                    isPrivateItem 
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : item.type === 'Alerta' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                  }`}>
                    {item.type}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    {isPrivateItem ? <Lock size={12} className="text-indigo-400" /> : <AlertTriangle size={12} />}
                    {item.location}
                  </span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">{item.content}</p>
                {item.attachments && item.attachments.length > 0 && (
                  <AttachmentGallery attachments={item.attachments} />
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 overflow-hidden">
            <h3 className="text-lg font-bold text-white mb-4">Corrigir Ocorrência</h3>
            
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
