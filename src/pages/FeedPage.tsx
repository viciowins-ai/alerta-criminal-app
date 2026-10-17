import React, { useState, useEffect, useRef } from 'react';
import { TopBar } from '../components/TopBar';
import { AttachmentGallery } from '../components/AttachmentGallery';
import { AudioPlayer } from '../components/AudioPlayer';
import { MessageSquare, Heart, Share2, MoreHorizontal, AlertTriangle, ShieldCheck, MapPin, Users, Lock, Plus, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, getDoc, deleteDoc, updateDoc, increment, where, limit, writeBatch } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CommentsModal } from '../components/CommentsModal';
import { getLevelInfo } from '../utils/levelUtils';
import { useTranslation } from 'react-i18next';

export function FeedPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [privateReports, setPrivateReports] = useState<any[]>([]);
  const [privatePosts, setPrivatePosts] = useState<any[]>([]);
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editType, setEditType] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editVisibility, setEditVisibility] = useState<'public' | 'group'>('public');
  const [editGroupId, setEditGroupId] = useState<string>('');
  const [feedFilter, setFeedFilter] = useState<'reports' | 'private'>('reports');
  const [activeCommentItem, setActiveCommentItem] = useState<{id: string, type: 'post' | 'report', authorName: string} | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setEditType(item.type || 'outro');
    setEditDescription(item.description || item.content || '');
    const isPrivate = item.visibility === 'group' || item.visibility === 'private' || Boolean(item.groupId);
    setEditVisibility(isPrivate ? 'group' : 'public');
    setEditGroupId(item.groupId || (userGroups.length > 0 ? userGroups[0].id : ''));
  };

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

  const handleUpdateItem = async () => {
    if (!editingItem || !user) return;
    try {
      const isReport = editingItem.feedType === 'report';
      const isGroup = editVisibility === 'group';
      const targetGroup = userGroups.find(g => g.id === editGroupId) || userGroups[0];

      const updates: any = {
        visibility: editVisibility,
        groupId: isGroup && targetGroup ? targetGroup.id : null,
        groupName: isGroup && targetGroup ? targetGroup.name : null
      };

      if (isReport) {
        updates.type = editType;
        updates.description = editDescription.trim();
        await updateDoc(doc(db, 'reports', editingItem.id), updates);
      } else {
        updates.content = editDescription.trim();
        if (isGroup && targetGroup) {
          updates.location = targetGroup.name;
          updates.type = 'Aviso da Rede';
        }
        await updateDoc(doc(db, 'posts', editingItem.id), updates);
      }
      setEditingItem(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${editingItem.feedType}s/${editingItem.id}`);
    }
  };


  const formatTime = (timestamp: any) => {
    if (!timestamp) return t('time.now', 'Agora');
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t('time.now', 'Agora');
    if (diffMins < 60) return t('time.minutesAgo', 'Há {{count}} min', { count: diffMins });
    if (diffHours < 24) return t('time.hoursAgo', 'Há {{count}} h', { count: diffHours });
    return t('time.daysAgo', 'Há {{count}} d', { count: diffDays });
  };

  const formatLevel = (levelName?: string) => {
    if (!levelName) return '';
    return t(`levels.${levelName}`, levelName);
  };

  const getReportTypeBadge = (rawType?: string) => {
    const norm = (rawType || '').toLowerCase().trim();
    if (norm.includes('roubo') || norm.includes('furto')) {
      return { label: t('report.types.roubo', 'Roubo/Furto'), color: 'bg-red-500/20 text-red-400 border-red-500/30' };
    }
    if (norm.includes('suspeito')) {
      return { label: t('report.types.suspeito', 'Atividade Suspeita'), color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
    }
    if (norm.includes('zeladoria') || norm.includes('risco')) {
      return { label: t('report.types.zeladoria', 'Zeladoria / Risco'), color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
    }
    if (norm.includes('vandalismo')) {
      return { label: t('report.types.vandalismo', 'Vandalismo'), color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    }
    return { label: t('report.types.outro', 'Outro'), color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
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

    // Public feed (Alertas Públicos)
    let combined = [...posts, ...reports];

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
      <TopBar title={t('feed.title', 'Rede Comunitária')} showBack={false} />
      
      {/* Filters / Tabs (Apenas Alertas Públicos e Redes Privadas) */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex gap-2 bg-slate-800/90 p-1.5 rounded-xl border border-slate-700/60 shadow-inner">
          <button
            onClick={() => setFeedFilter('reports')}
            className={`flex-1 py-2 px-3 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              feedFilter === 'reports'
                ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
            }`}
          >
            <span className="text-base leading-none">🚨</span>
            <span className="whitespace-nowrap">{t('feed.publicAlerts', 'Alertas Públicos')}</span>
          </button>

          <button
            onClick={() => setFeedFilter('private')}
            className={`flex-1 py-2 px-3 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              feedFilter === 'private'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/30'
                : 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/30'
            }`}
          >
            <span className="text-base leading-none">🔒</span>
            <span className="whitespace-nowrap">{t('feed.privateNetworks', 'Redes Privadas')}</span>
            {userGroups.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${isRTL ? 'mr-0.5' : 'ml-0.5'} ${
                feedFilter === 'private'
                  ? 'bg-indigo-900/90 text-indigo-100 border border-indigo-400/40'
                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              }`}>
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
                <h3 className="text-white font-bold text-base mb-1.5">{t('feed.privateCircles', 'Círculos de Confiança Privados')}</h3>
                <p className="text-slate-400 text-xs leading-relaxed max-w-xs mx-auto mb-5">
                  {t('feed.noGroupsDesc', 'Você ainda não faz parte de nenhuma rede privada. Crie um grupo para sua rua ou condomínio, ou entre com o código de um vizinho.')}
                </p>
                <button
                  onClick={() => navigate('/groups')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                >
                  <Plus size={16} /> {t('feed.createOrJoinGroup', 'Criar ou Entrar em um Grupo')}
                </button>
              </div>
            ) : (
              <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-indigo-500/30 flex flex-col gap-2.5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <Shield size={14} className="text-indigo-400" />
                      {t('feed.yourNetwork', 'Sua Rede:')}
                    </span>
                    {userGroups.length > 1 ? (
                      <select
                        value={selectedGroupId}
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                        className="bg-slate-900 border border-indigo-500/40 text-white text-xs font-bold rounded-lg px-2.5 py-1 outline-none cursor-pointer"
                      >
                        <option value="all">{t('feed.allNetworks', 'Todas as Redes')} ({userGroups.length})</option>
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
                    {t('common.manage', 'Gerenciar')} <ArrowRight size={12} className={isRTL ? 'rotate-180' : ''} />
                  </button>
                </div>

                {currentSelectedGroup && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 text-[11px] text-slate-400 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Users size={12} className="text-indigo-400" />
                        {t('feed.membersCount', '{{count}} membros participantes', { count: currentSelectedGroup.members?.length || 1 })}
                      </span>
                      <span className="font-mono text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700 text-[10px]">
                        {t('feed.inviteCode', 'Código:')} {currentSelectedGroup.inviteCode}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/report?groupId=${currentSelectedGroup.id}`)}
                        className="text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors border border-red-500/20 cursor-pointer"
                      >
                        <AlertTriangle size={12} />
                        {t('feed.newNetworkAlert', 'Novo Alerta')}
                      </button>
                      <button
                        onClick={() => navigate('/groups')}
                        className="text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border border-indigo-500/20 cursor-pointer"
                      >
                        <MessageSquare size={12} />
                        Bate-papo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Feed List */}
        {initialLoading ? (
          <div className="flex flex-col items-center justify-center p-10 text-center opacity-70 mt-10">
            <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 text-sm font-medium">{t('feed.loading', 'Carregando feed...')}</p>
          </div>
        ) : feedItems.length === 0 && (
          <div className="flex flex-col items-center justify-center p-10 text-center space-y-4 opacity-70 mt-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${feedFilter === 'private' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
              {feedFilter === 'private' ? <Lock size={32} /> : <MessageSquare size={32} />}
            </div>
            <h3 className="text-white font-bold text-lg">
              {feedFilter === 'private' ? t('feed.emptyPrivate', 'Nenhuma publicação nesta rede ainda') : t('feed.emptyPublic', 'Seu feed está vazio')}
            </h3>
            <p className="text-sm text-slate-400 max-w-xs">
              {feedFilter === 'private'
                ? t('feed.emptyPrivateDesc', 'Compartilhe um aviso ou relate uma ocorrência restrita aos seus vizinhos!')
                : t('feed.emptyPublicDesc', 'Seja o primeiro a publicar algo ou fazer um alerta para sua comunidade!')}
            </p>
          </div>
        )}
        
        {feedItems.map(item => {
          const isRecent = item.createdAt?.toMillis && (Date.now() - item.createdAt.toMillis() < 2 * 60 * 60 * 1000);
          const isPrivateItem = Boolean(item.groupId || item.groupName || item.visibility === 'group');

          if (item.feedType === 'report') {
            const reportBadge = getReportTypeBadge(item.type);
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
                        {item.isAnonymous || !item.authorName 
                          ? t('feed.alertByAnonymous', 'Alerta por Morador Anônimo') 
                          : t('feed.alertBy', 'Alerta por {{name}}', { name: item.authorName })}
                        {item.verified && <ShieldCheck size={14} className="text-blue-400" />}
                        {isRecent && (
                          <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 animate-pulse tracking-wider">
                            <span className="w-1 h-1 bg-white rounded-full"></span> {t('time.now', 'AGORA').toUpperCase()}
                          </span>
                        )}
                        {isPrivateItem ? (
                          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Lock size={10} /> {item.groupName || t('feed.privateNetworks', 'Rede Privada')}
                          </span>
                        ) : (
                          <span className="bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="text-[10px]">🚨</span> {t('feed.publicAlertBadge', 'Alerta Público')}
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                        <span>{formatTime(item.createdAt)}</span>
                        {item.authorLevel && <span>• {formatLevel(item.authorLevel)}</span>}
                      </p>
                    </div>
                  </div>
                  {(user?.uid === item.authorId || user?.email === 'viciowins@gmail.com') && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={() => openEditModal(item)}
                        className="text-slate-400 hover:text-white p-1"
                      >
                        <span className="text-xs bg-slate-700/50 px-2 py-1 rounded hover:bg-slate-700 transition-colors">
                          {t('feed.edit', 'Corrigir')}
                        </span>
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(item.id, 'report')}
                        className="text-slate-400 hover:text-red-400 p-1"
                      >
                        <span className="text-xs bg-slate-700/50 px-2 py-1 rounded hover:bg-red-500/20 transition-colors">
                          {t('common.delete', 'Excluir')}
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Report Content */}
                <div className="mb-3 relative z-10">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${reportBadge.color}`}>
                      {reportBadge.label.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1.5 min-w-0 flex-1 text-xs text-slate-400 max-w-full">
                      <MapPin size={13} className="text-red-400 shrink-0" />
                      <span 
                        dir="auto" 
                        className="truncate text-slate-300 font-medium max-w-full inline-block"
                        title={item.location?.address || t('feed.mapLocation', 'Localização selecionada no mapa')}
                      >
                        {item.location?.address || t('feed.mapLocation', 'Localização selecionada no mapa')}
                      </span>
                    </div>
                  </div>
                  {item.description && (
                    <p dir="auto" className="text-sm text-slate-200 leading-relaxed italic bg-slate-900/40 p-3 rounded-xl border border-slate-700/40 mb-2 text-start">
                      "{item.description}"
                    </p>
                  )}
                  {item.audioUrl && (
                    <div className="mb-2.5">
                      <AudioPlayer src={item.audioUrl} duration={item.audioDuration} />
                    </div>
                  )}
                  {item.attachments && item.attachments.length > 0 && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <AttachmentGallery attachments={item.attachments} />
                    </div>
                  )}
                </div>

                {/* Report Actions with Enhanced Usability & Touch Target Isolation */}
                <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-700/80 relative z-10">
                  {/* 1. Confirmações */}
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpvoteReport(item.id, item.upvotes || 0);
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-xl transition-all font-medium min-h-[44px] active:scale-95 touch-manipulation cursor-pointer border ${
                      item.upvotedBy?.includes(user?.uid) 
                        ? 'bg-blue-600/20 text-blue-400 border-blue-500/40 shadow-sm' 
                        : 'bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 border-slate-700/70'
                    }`}
                    title={t('feed.confirmations', '{{count}} confirmações', { count: item.upvotes || 0 })}
                  >
                    <ShieldCheck size={18} className={`shrink-0 ${item.upvotedBy?.includes(user?.uid) ? 'fill-current text-blue-400' : 'text-blue-400'}`} />
                    <span className="text-xs font-bold">{item.upvotes || 0}</span>
                    <span className="hidden md:inline text-[11px] text-slate-400">confirmar</span>
                  </button>

                  {/* 2. Ver no Mapa */}
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/?reportId=${item.id}`);
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 active:scale-95 transition-all text-slate-300 border border-slate-700/70 min-h-[44px] touch-manipulation cursor-pointer shadow-sm"
                    title={t('feed.viewOnMap', 'Ver no Mapa')}
                  >
                    <MapPin size={17} className="text-red-400 shrink-0" />
                    <span className="text-xs font-semibold text-slate-200">Mapa</span>
                  </button>

                  {/* 3. Comentar */}
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleComment(item, 'report');
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 hover:text-amber-300 active:scale-95 transition-all text-slate-300 border border-slate-700/70 min-h-[44px] touch-manipulation cursor-pointer shadow-sm group"
                    title="Ver e adicionar comentários"
                  >
                    <MessageSquare size={17} className="text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-200">{item.commentsCount || 0}</span>
                    <span className="hidden md:inline text-[11px] text-slate-400">comentários</span>
                  </button>

                  {/* 4. Compartilhar */}
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare(item);
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 hover:text-emerald-300 active:scale-95 transition-all text-slate-300 border border-slate-700/70 min-h-[44px] touch-manipulation cursor-pointer shadow-sm group"
                    title={t('common.share', 'Compartilhar')}
                  >
                    <Share2 size={17} className="text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-slate-200 truncate hidden xs:inline sm:inline">Compartilhar</span>
                    <span className="text-xs font-semibold text-slate-200 xs:hidden sm:hidden">Enviar</span>
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
                    className={`w-10 h-10 rounded-full object-cover shrink-0 ${isPrivateItem ? 'border border-indigo-400/40' : ''}`} 
                    referrerPolicy="no-referrer" 
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5 flex-wrap">
                      {item.authorName || t('common.user', 'Usuário')}
                      {item.verified && <ShieldCheck size={14} className="text-blue-400" />}
                      {isPrivateItem ? (
                        <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Lock size={10} /> {item.groupName || t('feed.privateNetworks', 'Rede Privada')}
                        </span>
                      ) : (
                        <span className="bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="text-[10px]">🌐</span> {t('feed.publicPostBadge', 'Publicação Pública')}
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                      <span>{formatTime(item.createdAt)}</span>
                      {item.authorLevel && <span>• {formatLevel(item.authorLevel)}</span>}
                    </p>
                  </div>
                </div>
                {(user?.uid === item.authorId || user?.email === 'viciowins@gmail.com') ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={() => openEditModal(item)}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <span className="text-xs bg-slate-700/50 px-2 py-1 rounded hover:bg-slate-700 transition-colors">
                        {t('feed.edit', 'Corrigir')}
                      </span>
                    </button>
                    <button 
                      className="text-slate-400 hover:text-red-400 p-1" 
                      onClick={() => handleDeleteItem(item.id, 'post')}
                    >
                      <span className="text-xs bg-slate-700/50 px-2 py-1 rounded hover:bg-red-500/20 transition-colors">
                        {t('common.delete', 'Excluir')}
                      </span>
                    </button>
                  </div>
                ) : (
                  <button className="text-slate-500 hover:text-slate-300 shrink-0">
                    <MoreHorizontal size={20} />
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                    isPrivateItem 
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : item.type === 'Alerta' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                  }`}>
                    {item.type}
                  </span>
                  <div className="flex items-center gap-1.5 min-w-0 flex-1 text-xs text-slate-400 max-w-full">
                    {isPrivateItem ? <Lock size={12} className="text-indigo-400 shrink-0" /> : <AlertTriangle size={12} className="shrink-0" />}
                    <span dir="auto" className="truncate text-slate-300 font-medium max-w-full inline-block">
                      {item.location}
                    </span>
                  </div>
                </div>
                <p dir="auto" className="text-sm text-slate-200 leading-relaxed text-start">{item.content}</p>
                {item.audioUrl && (
                  <div className="my-2.5">
                    <AudioPlayer src={item.audioUrl} duration={item.audioDuration} />
                  </div>
                )}
                {item.attachments && item.attachments.length > 0 && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <AttachmentGallery attachments={item.attachments} />
                  </div>
                )}
              </div>

              {/* Post Actions with Enhanced Usability & Touch Target Isolation */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-700/80">
                {/* 1. Curtir */}
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike(item.id);
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-2 rounded-xl transition-all font-medium min-h-[44px] active:scale-95 touch-manipulation cursor-pointer border ${
                    isLiked 
                      ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-sm' 
                      : 'bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 border-slate-700/70'
                  }`}
                  title="Curtir publicação"
                >
                  <Heart size={18} className={`shrink-0 ${isLiked ? 'fill-current text-red-500' : 'text-red-400'}`} />
                  <span className="text-xs font-bold">{item.likesCount || 0}</span>
                </button>

                {/* 2. Comentar */}
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleComment(item, 'post');
                  }}
                  className="flex items-center justify-center gap-2 py-2 px-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 hover:text-amber-300 active:scale-95 transition-all text-slate-300 border border-slate-700/70 min-h-[44px] touch-manipulation cursor-pointer shadow-sm group"
                  title="Ver e adicionar comentários"
                >
                  <MessageSquare size={18} className="text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-200">{item.commentsCount || 0}</span>
                  <span className="text-xs font-semibold text-slate-300 hidden xs:inline">Comentar</span>
                </button>

                {/* 3. Compartilhar */}
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare(item);
                  }}
                  className="flex items-center justify-center gap-2 py-2 px-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 hover:text-emerald-300 active:scale-95 transition-all text-slate-300 border border-slate-700/70 min-h-[44px] touch-manipulation cursor-pointer shadow-sm group"
                  title={t('common.share', 'Compartilhar')}
                >
                  <Share2 size={18} className="text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-slate-200">{t('common.share', 'Compartilhar')}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Edit Item Modal (Reports and Posts) */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{editingItem.feedType === 'report' ? '🚨' : '💬'}</span>
                {editingItem.feedType === 'report' 
                  ? t('feed.editReportTitle', 'Corrigir Ocorrência') 
                  : t('feed.editPostTitle', 'Editar Publicação')}
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Report Type Selector (only for reports) */}
              {editingItem.feedType === 'report' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t('report.typeLabel', 'Tipo de Ocorrência')}</label>
                  <select 
                    value={editType} 
                    onChange={(e) => setEditType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-blue-500"
                  >
                    <option value="roubo">{t('report.types.roubo', 'Roubo/Furto')}</option>
                    <option value="suspeito">{t('report.types.suspeito', 'Atividade Suspeita')}</option>
                    <option value="zeladoria">{t('report.types.zeladoria', 'Zeladoria / Risco')}</option>
                    <option value="vandalismo">{t('report.types.vandalismo', 'Vandalismo')}</option>
                    <option value="outro">{t('report.types.outro', 'Outro')}</option>
                  </select>
                </div>
              )}

              {/* Description / Content Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {editingItem.feedType === 'report' ? t('report.descriptionLabel', 'Descrição') : t('feed.contentLabel', 'Conteúdo da Mensagem')}
                </label>
                <textarea 
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none resize-none h-24 focus:border-blue-500"
                  placeholder={editingItem.feedType === 'report' ? t('report.descriptionPlaceholder', 'Descreva o que aconteceu...') : 'Escreva sua mensagem...'}
                />
              </div>

              {/* Destination & Privacy Toggle */}
              <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 space-y-2.5">
                <label className="block text-xs font-bold text-slate-200">
                  {t('feed.privacyDestination', 'Destino & Privacidade da Publicação')}
                </label>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditVisibility('public')}
                    className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                      editVisibility === 'public'
                        ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <span>🚨</span>
                    <span>{t('report.publicAll', 'Público (Todos)')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditVisibility('group')}
                    className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                      editVisibility === 'group'
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <Lock size={12} />
                    <span>{t('report.privateNetwork', 'Rede Privada')}</span>
                  </button>
                </div>

                {editVisibility === 'group' && (
                  <div className="pt-2 border-t border-slate-700/60 animate-in fade-in space-y-1.5">
                    {userGroups.length > 0 ? (
                      <>
                        <label className="block text-[11px] text-indigo-300 font-semibold">
                          Selecione o Grupo Privado de destino:
                        </label>
                        <select
                          value={editGroupId}
                          onChange={(e) => setEditGroupId(e.target.value)}
                          className="w-full bg-slate-900 border border-indigo-500/40 rounded-xl px-3 py-2 text-xs font-semibold text-white outline-none focus:border-indigo-400 cursor-pointer"
                        >
                          {userGroups.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </select>
                        <p className="text-[10px] text-slate-400 leading-tight">
                          🔒 O alerta sumirá do feed público geral e ficará visível <strong>apenas</strong> para membros deste grupo.
                        </p>
                      </>
                    ) : (
                      <p className="text-[11px] text-amber-400 leading-tight">
                        Você ainda não faz parte de redes privadas para isolar este alerta.
                      </p>
                    )}
                  </div>
                )}

                {editVisibility === 'public' && (
                  <p className="text-[10px] text-slate-400 leading-tight">
                    ℹ️ Visível para toda a cidade no mapa de ocorrências e feed público geral.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  {t('common.cancel', 'Cancelar')}
                </button>
                <button 
                  type="button"
                  onClick={handleUpdateItem}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  {t('common.saveChanges', 'Salvar Alterações')}
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
