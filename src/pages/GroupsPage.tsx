import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Plus, Users, Search, ArrowRight, UserPlus, LogOut, Copy, Check, Lock, ChevronDown, ChevronUp, MapPin, AlertTriangle, Eye, Siren, Flame, MoreHorizontal, Clock, Crown, ShieldCheck, Trash2, Mic, UserMinus, RefreshCw, MessageSquare, Send, Heart, MessageCircle } from 'lucide-react';
import { TopBar } from '../components/TopBar';
import { AttachmentGallery } from '../components/AttachmentGallery';
import { AudioPlayer } from '../components/AudioPlayer';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { CommentsModal } from '../components/CommentsModal';
import { getLevelInfo } from '../utils/levelUtils';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, serverTimestamp, increment, onSnapshot } from 'firebase/firestore';

export function GroupsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [expandedMembersGroupId, setExpandedMembersGroupId] = useState<string | null>(null);
  const [recordingGroupId, setRecordingGroupId] = useState<string | null>(null);
  const [isSubmittingVoice, setIsSubmittingVoice] = useState(false);
  const [groupReports, setGroupReports] = useState<Record<string, any[]>>({});
  const [loadingReports, setLoadingReports] = useState<Record<string, boolean>>({});
  const [membersMap, setMembersMap] = useState<Record<string, { uid: string; name: string; avatar: string; level?: string }>>({});
  const [activeCommentItem, setActiveCommentItem] = useState<{ id: string; type: 'post' | 'report'; authorName: string } | null>(null);
  const [groupMessageText, setGroupMessageText] = useState<Record<string, string>>({});
  const [isSendingMessage, setIsSendingMessage] = useState<Record<string, boolean>>({});
  const [groupTabFilter, setGroupTabFilter] = useState<Record<string, 'all' | 'messages' | 'reports'>>({});
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) setUserProfile(snap.data());
    }).catch(console.error);
  }, [user]);

  const fetchMemberProfiles = async (uids: string[]) => {
    const missing = uids.filter(uid => uid && !membersMap[uid]);
    if (missing.length === 0) return;

    const newProfiles: Record<string, any> = {};
    await Promise.all(
      missing.map(async (uid) => {
        try {
          const snap = await getDoc(doc(db, 'users', uid));
          if (snap.exists()) {
            const d = snap.data();
            newProfiles[uid] = {
              uid,
              name: d.name || 'Usuário',
              avatar: d.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.name || 'U')}&background=random`,
              level: d.level || 'Iniciante'
            };
            return;
          }
        } catch (err) {
          console.error("Erro ao buscar perfil de membro:", uid, err);
        }

        // Fallback profile
        newProfiles[uid] = {
          uid,
          name: uid === user?.uid ? (user?.displayName || 'Você') : 'Membro da Rede',
          avatar: uid === user?.uid && user?.photoURL ? user.photoURL : `https://i.pravatar.cc/150?u=${uid}`,
          level: 'Membro'
        };
      })
    );

    setMembersMap(prev => ({ ...prev, ...newProfiles }));
  };

  const toggleGroupReports = (groupId: string) => {
    if (expandedGroupId === groupId) {
      setExpandedGroupId(null);
    } else {
      setExpandedGroupId(groupId);
    }
  };

  // Real-time synchronization of posts and reports for the currently expanded group
  useEffect(() => {
    if (!expandedGroupId) return;
    setLoadingReports(prev => ({ ...prev, [expandedGroupId]: true }));

    let currentReports: any[] = [];
    let currentPosts: any[] = [];

    const syncCombined = () => {
      const combined = [...currentReports, ...currentPosts];
      combined.sort((a: any, b: any) => {
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return tB - tA;
      });
      setGroupReports(prev => ({ ...prev, [expandedGroupId]: combined }));
      setLoadingReports(prev => ({ ...prev, [expandedGroupId]: false }));

      const authorUids = combined.map((r: any) => r.authorId).filter(Boolean);
      if (authorUids.length > 0) {
        fetchMemberProfiles(authorUids);
      }
    };

    const qReports = query(collection(db, 'reports'), where('groupId', '==', expandedGroupId));
    const qPosts = query(collection(db, 'posts'), where('groupId', '==', expandedGroupId));

    const unsubReports = onSnapshot(qReports, (snapshot) => {
      currentReports = snapshot.docs.map(d => ({ id: d.id, feedType: 'report', ...d.data() }));
      syncCombined();
    }, (err) => {
      console.error("Erro ao sincronizar ocorrências da rede privada:", err);
      setLoadingReports(prev => ({ ...prev, [expandedGroupId]: false }));
    });

    const unsubPosts = onSnapshot(qPosts, (snapshot) => {
      currentPosts = snapshot.docs.map(d => ({ id: d.id, feedType: 'post', ...d.data() }));
      syncCombined();
    }, (err) => {
      console.error("Erro ao sincronizar mensagens da rede privada:", err);
      setLoadingReports(prev => ({ ...prev, [expandedGroupId]: false }));
    });

    return () => {
      unsubReports();
      unsubPosts();
    };
  }, [expandedGroupId]);

  const handleToggleLike = async (groupId: string, item: any) => {
    if (!user) return;
    const colName = item.feedType === 'report' ? 'reports' : 'posts';
    const isLiked = (item.likedBy || item.upvotedBy || []).includes(user.uid);
    try {
      await updateDoc(doc(db, colName, item.id), {
        likesCount: increment(isLiked ? -1 : 1),
        upvotes: increment(isLiked ? -1 : 1),
        likedBy: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
        upvotedBy: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch (err) {
      console.error("Erro ao curtir:", err);
    }
  };

  const handleDeleteItem = async (groupId: string, itemId: string, feedType: 'post' | 'report') => {
    if (!window.confirm(feedType === 'post' ? 'Tem certeza de que deseja excluir esta mensagem deste grupo?' : 'Tem certeza de que deseja excluir esta ocorrência deste grupo privado?')) return;
    try {
      await deleteDoc(doc(db, feedType === 'post' ? 'posts' : 'reports', itemId));
      setGroupReports(prev => ({
        ...prev,
        [groupId]: (prev[groupId] || []).filter(r => r.id !== itemId)
      }));
    } catch (err) {
      console.error("Erro ao excluir item:", err);
      alert("Não foi possível excluir.");
    }
  };

  const handleSendTextMessage = async (group: any) => {
    const text = (groupMessageText[group.id] || '').trim();
    if (!text || !user) return;

    setIsSendingMessage(prev => ({ ...prev, [group.id]: true }));
    try {
      const levelInfo = getLevelInfo(userProfile?.points || 0);
      const groupName = group?.name || 'Rede Privada';
      const authorName = userProfile?.name || user.displayName || 'Morador da Rede';
      const authorAvatar = userProfile?.avatar || user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`;

      const postPayload: any = {
        authorId: user.uid,
        authorName: authorName,
        authorAvatar: authorAvatar,
        authorLevel: levelInfo?.name || 'Membro Ativo',
        verified: false,
        type: 'Aviso da Rede',
        content: text,
        location: groupName,
        visibility: 'group',
        groupId: group.id,
        groupName: groupName,
        likesCount: 0,
        commentsCount: 0,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'posts'), postPayload);

      // Add to local timeline immediately
      setGroupReports(prev => ({
        ...prev,
        [group.id]: [
          {
            id: docRef.id,
            feedType: 'post',
            ...postPayload,
            createdAt: { toMillis: () => Date.now() }
          },
          ...(prev[group.id] || [])
        ]
      }));

      // Ensure group timeline is expanded so user sees message
      setExpandedGroupId(group.id);
      setGroupMessageText(prev => ({ ...prev, [group.id]: '' }));

      // Broadcast push notification to group members
      try {
        const idToken = await user.getIdToken();
        await fetch('/api/push/broadcast', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            title: `💬 [${groupName}] Nova mensagem de ${authorName}`,
            body: text.length > 80 ? `${text.slice(0, 80)}...` : text,
            url: `/groups`,
            visibility: 'group',
            groupId: group.id
          })
        });
      } catch (pushErr) {
        console.warn("Could not send push notification:", pushErr);
      }
    } catch (err: any) {
      console.error("Error sending message in group:", err);
      alert(`Não foi possível enviar a mensagem: ${err?.message || 'Tente novamente em instantes.'}`);
    } finally {
      setIsSendingMessage(prev => ({ ...prev, [group.id]: false }));
    }
  };

  const handleSendVoiceReport = async (group: any, audio: { url: string; duration: number }) => {
    if (!user || !audio) return;
    setIsSubmittingVoice(true);
    try {
      const timeFormatted = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const reportPayload: any = {
        authorId: user.uid,
        authorName: user.displayName || 'Membro da Rede',
        authorAvatar: user.photoURL || '',
        authorLevel: 'Membro Ativo',
        isAnonymous: false,
        verified: false,
        type: 'suspeito',
        description: `🎙️ Mensagem de voz gravada para o grupo (${audio.duration}s)`,
        audioUrl: audio.url,
        audioDuration: audio.duration,
        location: {
          lat: -25.4284,
          lng: -49.2733,
          address: `Rede Privada: ${group.name}`
        },
        status: 'pending',
        upvotes: 0,
        upvotedBy: [],
        createdAt: serverTimestamp(),
        visibility: 'group',
        groupId: group.id,
        groupName: group.name
      };

      if (navigator.geolocation) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              reportPayload.location.lat = pos.coords.latitude;
              reportPayload.location.lng = pos.coords.longitude;
              resolve();
            },
            () => resolve(),
            { enableHighAccuracy: true, timeout: 6000, maximumAge: 5000 }
          );
        });
      }

      const docRef = await addDoc(collection(db, 'reports'), reportPayload);
      
      setGroupReports(prev => ({
        ...prev,
        [group.id]: [
          {
            id: docRef.id,
            ...reportPayload,
            createdAt: { toMillis: () => Date.now() }
          },
          ...(prev[group.id] || [])
        ]
      }));

      try {
        const idToken = await user.getIdToken();
        const shortProtocol = docRef.id.slice(0, 5).toUpperCase();
        await fetch('/api/push/broadcast', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            title: `🔒 [${group.name}] Alerta de Voz às ${timeFormatted} (#${shortProtocol})`,
            body: `🎙️ Nova mensagem de voz gravada no grupo por ${user.displayName || 'um membro'}`,
            url: `/?reportId=${docRef.id}`,
            htmlContent: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #0f172a; padding: 20px; text-align: center;">
                  <img src="https://alertacriminal.com.br/escudo-logo.png" alt="Alerta Criminal" width="80" style="display: block; margin: 0 auto;" />
                </div>
                <div style="padding: 24px; background-color: #ffffff;">
                  <h2 style="color: #4f46e5; margin-top: 0; font-size: 24px;">🎙️ Mensagem de Voz na Rede Privada</h2>
                  <p style="font-size: 16px;">O morador <strong>${user.displayName || 'Membro da Rede'}</strong> enviou um áudio (${audio.duration}s) no grupo privado <strong>${group.name}</strong>.</p>
                  <div style="text-align: center; margin-top: 24px;">
                    <a href="https://alertacriminal.com.br/?reportId=${docRef.id}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px;">
                      Ouvir Mensagem de Voz no Aplicativo
                    </a>
                  </div>
                </div>
              </div>
            `,
            visibility: 'group',
            groupId: group.id,
            reportId: docRef.id
          })
        });
      } catch (e) {
        console.error("Erro ao notificar grupo sobre mensagem de voz:", e);
      }

      setRecordingGroupId(null);
    } catch (err) {
      console.error("Erro ao enviar mensagem de voz no grupo:", err);
      alert("Não foi possível enviar o áudio.");
    } finally {
      setIsSubmittingVoice(false);
    }
  };

  const toggleMembersList = (groupId: string) => {
    setExpandedMembersGroupId(prev => prev === groupId ? null : groupId);
  };

  const fetchGroups = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'groups'), where('members', 'array-contains', user.uid));
      const querySnapshot = await getDocs(q);
      const groupsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGroups(groupsData);

      // Fetch profiles for all members in all groups
      const allMemberUids = Array.from(new Set(groupsData.flatMap((g: any) => g.members || [])));
      if (allMemberUids.length > 0) {
        fetchMemberProfiles(allMemberUids as string[]);
      }
    } catch (err) {
      console.error("Error fetching groups", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [user]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newGroupName.trim()) return;
    
    // Generate a 6-character random alphanumeric code
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    try {
      const payload = {
        name: newGroupName.trim(),
        inviteCode,
        createdBy: user.uid,
        members: [user.uid],
        // @ts-ignore
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'groups'), payload);
      setNewGroupName('');
      setIsCreating(false);
      fetchGroups();
    } catch (err: any) {
      console.error("Error creating group", err);
      alert(`Erro ao criar o grupo privado. Tente novamente. Detalhes: ${err.message || err}`);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !joinCode.trim()) return;
    
    const code = joinCode.trim().toUpperCase();
    
    try {
      const q = query(collection(db, 'groups'), where('inviteCode', '==', code));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        alert("Código de convite inválido ou grupo privado não encontrado.");
        return;
      }
      
      const groupDoc = querySnapshot.docs[0];
      const groupData = groupDoc.data();
      
      if (groupData.members.includes(user.uid)) {
        alert("Você já faz parte deste grupo privado!");
        return;
      }
      
      await updateDoc(doc(db, 'groups', groupDoc.id), {
        members: arrayUnion(user.uid)
      });
      
      setJoinCode('');
      setIsJoining(false);
      fetchGroups();
      alert(`Você entrou no grupo privado: ${groupData.name}`);
    } catch (err) {
      console.error("Error joining group", err);
      alert("Erro ao entrar no grupo privado. Tente novamente.");
    }
  };

  const handleLeaveGroup = async (groupId: string, groupName: string) => {
    if (!user) return;
    if (confirm(`Tem certeza que deseja sair do grupo privado "${groupName}"?`)) {
      try {
        await updateDoc(doc(db, 'groups', groupId), {
          members: arrayRemove(user.uid)
        });
        fetchGroups();
      } catch (err) {
        console.error("Error leaving group", err);
        alert("Erro ao sair do grupo privado.");
      }
    }
  };

  const handleRemoveMember = async (groupId: string, memberUid: string, memberName: string) => {
    if (!user) return;
    if (confirm(`Tem certeza de que deseja remover "${memberName}" deste grupo privado? Ele não terá mais acesso às ocorrências e mensagens deste grupo.`)) {
      try {
        await updateDoc(doc(db, 'groups', groupId), {
          members: arrayRemove(memberUid)
        });
        fetchGroups();
      } catch (err) {
        console.error("Erro ao remover membro do grupo:", err);
        alert("Erro ao remover o membro do grupo.");
      }
    }
  };

  const handleRegenerateInviteCode = async (groupId: string, groupName: string) => {
    if (!user) return;
    if (confirm(`Deseja gerar um novo código de convite para "${groupName}"? O código anterior deixará de funcionar imediatamente.`)) {
      try {
        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        await updateDoc(doc(db, 'groups', groupId), {
          inviteCode: newCode
        });
        fetchGroups();
        alert(`Novo código gerado com sucesso: ${newCode}`);
      } catch (err) {
        console.error("Erro ao redefinir código:", err);
        alert("Não foi possível gerar novo código.");
      }
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <TopBar title="Grupos Privados" showBack />
      
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-2">Círculos de Confiança</h2>
          <p className="text-slate-400 text-sm">
            Crie ou entre em redes privadas para compartilhar alertas de segurança exclusivos com sua rua, condomínio ou bairro.
          </p>
        </div>

        <div className="flex gap-3 mb-8">
          <button 
            onClick={() => { setIsCreating(true); setIsJoining(false); }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 font-medium transition-colors shadow-sm"
          >
            <Plus size={18} />
            Criar Grupo Privado
          </button>
          <button 
            onClick={() => { setIsJoining(true); setIsCreating(false); }}
            className="flex-1 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 font-medium transition-colors"
          >
            <UserPlus size={18} />
            Entrar
          </button>
        </div>

        {isCreating && (
          <form onSubmit={handleCreateGroup} className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-8 animate-in fade-in slide-in-from-top-4">
            <h3 className="text-white font-bold mb-3">Criar Novo Grupo Privado</h3>
            <input 
              type="text" 
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Ex: Moradores da Rua das Flores"
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 mb-3 focus:outline-none focus:border-blue-500"
              required
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setIsCreating(false)} className="flex-1 py-2 text-slate-400 font-medium">Cancelar</button>
              <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg py-2 font-medium">Criar</button>
            </div>
          </form>
        )}

        {isJoining && (
          <form onSubmit={handleJoinGroup} className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-8 animate-in fade-in slide-in-from-top-4">
            <h3 className="text-white font-bold mb-3">Entrar com Código</h3>
            <input 
              type="text" 
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Digite o código de 6 dígitos"
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 mb-3 focus:outline-none focus:border-blue-500 text-center uppercase tracking-widest font-bold"
              maxLength={6}
              required
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setIsJoining(false)} className="flex-1 py-2 text-slate-400 font-medium">Cancelar</button>
              <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg py-2 font-medium">Entrar</button>
            </div>
          </form>
        )}

        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <Shield size={18} className="text-blue-500" />
          Seus Grupos Privados
        </h3>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-slate-800/50 rounded-xl p-8 text-center border border-slate-700/50">
            <Users size={48} className="text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">Você ainda não faz parte de nenhuma rede privada.</p>
            <p className="text-slate-500 text-sm mt-2">Crie um grupo privado ou peça um código de convite para um vizinho.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map(group => {
              const isCreator = group.createdBy === user?.uid;
              const isMembersOpen = expandedMembersGroupId === group.id;

              return (
                <div key={group.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-sm">
                  {/* Group Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-white font-bold text-lg">{group.name}</h4>
                        {isCreator && (
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Crown size={11} className="text-amber-400" />
                            Criador
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">Rede Privada Segura</p>
                    </div>

                    {/* Member Avatars Stack & Toggle Button */}
                    <button 
                      onClick={() => toggleMembersList(group.id)}
                      className="flex items-center gap-2 bg-slate-900/80 hover:bg-slate-900 text-slate-300 border border-slate-700 rounded-lg p-1.5 px-2.5 transition-colors cursor-pointer group"
                      title="Clique para ver os membros do grupo"
                    >
                      <div className="flex items-center -space-x-2">
                        {group.members.slice(0, 4).map((uid: string) => {
                          const mProfile = membersMap[uid];
                          const isMe = uid === user?.uid;
                          const avatarUrl = mProfile?.avatar || (isMe && user?.photoURL) || `https://i.pravatar.cc/150?u=${uid}`;
                          const memberName = isMe ? `${mProfile?.name || user?.displayName || 'Você'} (Você)` : (mProfile?.name || 'Membro');
                          return (
                            <img 
                              key={uid}
                              src={avatarUrl}
                              alt={memberName}
                              title={memberName}
                              className="w-6 h-6 rounded-full border border-slate-900 object-cover ring-1 ring-blue-500/40"
                              referrerPolicy="no-referrer"
                            />
                          );
                        })}
                        {group.members.length > 4 && (
                          <div className="w-6 h-6 rounded-full bg-slate-700 border border-slate-900 flex items-center justify-center text-[9px] font-bold text-slate-300">
                            +{group.members.length - 4}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-slate-200">
                        {group.members.length} {group.members.length === 1 ? 'membro' : 'membros'}
                      </span>
                      {isMembersOpen ? (
                        <ChevronUp size={14} className="text-slate-400 group-hover:text-white transition-colors" />
                      ) : (
                        <ChevronDown size={14} className="text-slate-400 group-hover:text-white transition-colors" />
                      )}
                    </button>
                  </div>

                  {/* Expandable Members Details List */}
                  {isMembersOpen && (
                    <div className="bg-slate-900/90 border border-blue-500/30 rounded-xl p-3 mb-4 animate-in fade-in">
                      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-800">
                        <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                          <Users size={14} />
                          Membros da Rede Privada ({group.members.length})
                        </span>
                        <span className="text-[10px] text-slate-400">Alertas restritos a este grupo</span>
                      </div>
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {group.members.map((uid: string) => {
                          const mProfile = membersMap[uid];
                          const isMe = uid === user?.uid;
                          const isGroupCreator = group.createdBy === uid;
                          const avatarUrl = mProfile?.avatar || (isMe && user?.photoURL) || `https://i.pravatar.cc/150?u=${uid}`;
                          const memberName = isMe 
                            ? `${mProfile?.name || user?.displayName || 'Você'} (Você)` 
                            : (mProfile?.name || 'Membro do Grupo');

                          return (
                            <div key={uid} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
                              <div className="flex items-center gap-2.5">
                                <img 
                                  src={avatarUrl} 
                                  alt={memberName}
                                  className="w-8 h-8 rounded-full object-cover border border-slate-600 shadow-sm"
                                  referrerPolicy="no-referrer"
                                />
                                <div>
                                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                                    {memberName}
                                    {isMe && <span className="text-[9px] text-blue-400 font-normal bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">Você</span>}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    {mProfile?.level || 'Membro'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {isGroupCreator ? (
                                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Crown size={10} /> Criador
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Shield size={10} className="text-slate-400" /> Membro
                                  </span>
                                )}
                                {(group.createdBy === user?.uid && !isMe) && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMember(group.id, uid, memberName)}
                                    title={`Remover ${memberName} deste grupo`}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20 text-[10px] font-bold px-2 py-1 rounded border border-red-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <UserMinus size={11} />
                                    Remover
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 pt-3 border-t border-slate-700 flex flex-col gap-3">
                    {/* Invite Code */}
                    <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/60 flex-wrap gap-2">
                      <div>
                        <p className="text-[11px] text-slate-400">Código de Convite da Rede:</p>
                        <p className="text-white font-mono font-bold tracking-widest text-base">{group.inviteCode}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          type="button"
                          onClick={() => copyToClipboard(group.inviteCode)}
                          className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                        >
                          {copiedCode === group.inviteCode ? (
                            <>
                              <Check size={14} className="text-green-400" />
                              <span className="text-green-400">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                        {group.createdBy === user?.uid && (
                          <button
                            type="button"
                            onClick={() => handleRegenerateInviteCode(group.id, group.name)}
                            title="Gerar novo código e cancelar o anterior"
                            className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                          >
                            <RefreshCw size={13} />
                            Novo Código
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Collapsible Group Chat & Occurrences */}
                    <div className="pt-1">
                      <button 
                        onClick={() => toggleGroupReports(group.id)}
                        className="w-full flex items-center justify-between py-2.5 px-3 bg-slate-900/80 hover:bg-slate-900 border border-indigo-500/30 rounded-lg text-xs font-medium text-slate-300 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2 text-indigo-400">
                          <MessageCircle size={15} />
                          <span className="text-white font-semibold">Bate-papo & Ocorrências da Rede Privada</span>
                          {groupReports[group.id] && (
                            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                              {groupReports[group.id].length}
                            </span>
                          )}
                        </span>
                        {expandedGroupId === group.id ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                      </button>

                      {expandedGroupId === group.id && (
                        <div className="mt-3 space-y-3 border-t border-slate-700/60 pt-3 animate-in fade-in">
                          {/* Live Chat Banner */}
                          <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-2.5 text-xs flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Lock size={14} className="text-indigo-400 shrink-0" />
                              <span className="text-slate-300 text-[11px]">
                                Canal exclusivo entre os <strong className="text-white">{group.members?.length || 1} membros</strong> deste grupo.
                              </span>
                            </div>
                            <span className="bg-indigo-500/20 text-indigo-300 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0">
                              Privado
                            </span>
                          </div>

                          {/* Chat Typing Input Box */}
                          <div className="bg-slate-900 border border-indigo-500/40 rounded-xl p-2.5 shadow-inner">
                            <div className="flex items-center gap-2">
                              <img 
                                src={userProfile?.avatar || user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'U')}&background=random`} 
                                alt="Você" 
                                className="w-8 h-8 rounded-full object-cover border border-indigo-500/40 shrink-0" 
                                referrerPolicy="no-referrer"
                              />
                              <input 
                                type="text"
                                value={groupMessageText[group.id] || ''}
                                onChange={(e) => setGroupMessageText(prev => ({ ...prev, [group.id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendTextMessage(group);
                                  }
                                }}
                                placeholder="Conversar no grupo: digite uma mensagem..."
                                className="flex-1 bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white rounded-lg px-3 py-2 text-xs placeholder-slate-400 outline-none min-w-0"
                              />
                              <button
                                type="button"
                                disabled={!(groupMessageText[group.id] || '').trim() || isSendingMessage[group.id]}
                                onClick={() => handleSendTextMessage(group)}
                                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white p-2 rounded-lg transition-colors flex items-center justify-center cursor-pointer shrink-0 shadow"
                                title="Enviar mensagem digitada (Enter)"
                              >
                                {isSendingMessage[group.id] ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Send size={15} />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => setRecordingGroupId(prev => prev === group.id ? null : group.id)}
                                className={`p-2 rounded-lg border transition-colors flex items-center justify-center cursor-pointer shrink-0 ${
                                  recordingGroupId === group.id 
                                    ? 'bg-red-500/20 text-red-400 border-red-500/40' 
                                    : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700'
                                }`}
                                title="Gravar áudio de voz"
                              >
                                <Mic size={15} />
                              </button>
                            </div>
                            <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-slate-400">
                              <span>Pressione <strong className="text-slate-300">Enter</strong> para enviar mensagem</span>
                              <span className="flex items-center gap-1 text-indigo-300">
                                <Lock size={10} /> Criptografado na rede
                              </span>
                            </div>
                          </div>

                          {/* Quick Filter Tabs: Todos / Mensagens / Ocorrências */}
                          {groupReports[group.id] && groupReports[group.id].length > 0 && (
                            <div className="flex items-center gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => setGroupTabFilter(prev => ({ ...prev, [group.id]: 'all' }))}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                                  (groupTabFilter[group.id] || 'all') === 'all'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                Todos ({groupReports[group.id].length})
                              </button>
                              <button
                                type="button"
                                onClick={() => setGroupTabFilter(prev => ({ ...prev, [group.id]: 'messages' }))}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                                  groupTabFilter[group.id] === 'messages'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                <MessageSquare size={11} />
                                Mensagens ({groupReports[group.id].filter(i => i.feedType === 'post').length})
                              </button>
                              <button
                                type="button"
                                onClick={() => setGroupTabFilter(prev => ({ ...prev, [group.id]: 'reports' }))}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                                  groupTabFilter[group.id] === 'reports'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                <AlertTriangle size={11} />
                                Alertas ({groupReports[group.id].filter(i => i.feedType === 'report').length})
                              </button>
                            </div>
                          )}

                          {/* Messages & Reports List */}
                          {loadingReports[group.id] ? (
                            <div className="flex items-center justify-center py-6 text-xs text-slate-400 gap-2">
                              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                              Sincronizando conversas do grupo...
                            </div>
                          ) : !groupReports[group.id] || groupReports[group.id].length === 0 ? (
                            <div className="bg-slate-900/50 p-5 rounded-xl text-center border border-slate-800">
                              <MessageCircle size={28} className="text-indigo-400/60 mx-auto mb-2" />
                              <p className="text-xs text-slate-300 font-semibold">Nenhuma mensagem ou alerta neste grupo ainda.</p>
                              <p className="text-[11px] text-slate-500 mt-1">
                                Digite acima para iniciar a conversa com os moradores desta rede privada!
                              </p>
                            </div>
                          ) : (
                            (() => {
                              const filter = groupTabFilter[group.id] || 'all';
                              const filteredItems = groupReports[group.id].filter(item => {
                                if (filter === 'messages') return item.feedType === 'post';
                                if (filter === 'reports') return item.feedType === 'report';
                                return true;
                              });

                              if (filteredItems.length === 0) {
                                return (
                                  <div className="bg-slate-900/40 p-4 rounded-xl text-center border border-slate-800 text-xs text-slate-400">
                                    Nenhum item encontrado nesta categoria.
                                  </div>
                                );
                              }

                              return filteredItems.map(rep => {
                                const authorMember = membersMap[rep.authorId];
                                const isMe = rep.authorId === user?.uid;
                                const authorAvatar = rep.authorAvatar || authorMember?.avatar || (isMe && user?.photoURL) || `https://i.pravatar.cc/150?u=${rep.authorId || 'membro'}`;
                                const authorName = rep.isAnonymous 
                                  ? 'Morador Anônimo' 
                                  : (rep.authorName || authorMember?.name || (isMe ? (user?.displayName || 'Você') : 'Membro'));
                                const isPost = rep.feedType === 'post';
                                const isLiked = (rep.likedBy || rep.upvotedBy || []).includes(user?.uid || '');
                                const likesCount = rep.likesCount || rep.upvotes || (rep.likedBy ? rep.likedBy.length : 0) || 0;
                                const commentsCount = rep.commentsCount || 0;

                                const typeLabel = isPost
                                  ? '💬 Mensagem'
                                  : (rep.type === 'roubo' ? 'Roubo/Furto' : rep.type === 'suspeito' ? 'Atividade Suspeita' : rep.type === 'vandalismo' ? 'Vandalismo' : rep.type === 'zeladoria' ? 'Zeladoria / Risco' : 'Ocorrência');

                                return (
                                  <div 
                                    key={rep.id} 
                                    className={`rounded-xl p-3.5 text-xs shadow-md border ${
                                      isPost 
                                        ? 'bg-slate-900/90 border-slate-700/80 hover:border-slate-600 transition-colors' 
                                        : 'bg-slate-900 border-indigo-500/30'
                                    }`}
                                  >
                                    {/* Author & Header */}
                                    <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-slate-800">
                                      <div className="flex items-center gap-2.5">
                                        {rep.isAnonymous ? (
                                          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                                            <Shield size={16} />
                                          </div>
                                        ) : (
                                          <div className="relative shrink-0">
                                            <img 
                                              src={authorAvatar} 
                                              alt={authorName} 
                                              className="w-9 h-9 rounded-full object-cover border border-indigo-500/50 shadow-sm" 
                                              referrerPolicy="no-referrer" 
                                            />
                                            <div className="absolute -bottom-1 -right-1 bg-indigo-600 rounded-full p-0.5 text-white border border-slate-900">
                                              <Lock size={9} />
                                            </div>
                                          </div>
                                        )}
                                        <div>
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="font-bold text-white text-xs">
                                              {authorName}
                                            </span>
                                            {isMe && (
                                              <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-medium border border-indigo-500/30">Você</span>
                                            )}
                                            {rep.verified && <ShieldCheck size={12} className="text-blue-400" />}
                                          </div>
                                          <p className="text-[10px] text-slate-400">
                                            {rep.createdAt?.toMillis ? new Date(rep.createdAt.toMillis()).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'Recentemente'}
                                            {rep.authorLevel ? ` • ${rep.authorLevel}` : ''}
                                          </p>
                                        </div>
                                      </div>

                                      <span className={`font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${
                                        isPost 
                                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                      }`}>
                                        <Lock size={10} />
                                        {typeLabel}
                                      </span>
                                    </div>

                                    {/* Location (for reports or posts with specific location) */}
                                    {!isPost && rep.location?.address && (
                                      <p className="text-slate-300 font-medium mb-1.5 flex items-center gap-1.5 text-xs">
                                        <MapPin size={12} className="text-red-400 shrink-0" />
                                        <span className="truncate">{rep.location.address}</span>
                                      </p>
                                    )}

                                    {/* Text Content (Post content or Report description) */}
                                    {(rep.content || rep.description) && (
                                      <p className={`text-slate-100 text-xs sm:text-sm leading-relaxed mb-3 whitespace-pre-wrap break-words ${
                                        isPost ? 'bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60' : 'bg-slate-800/50 p-2.5 rounded-lg border border-slate-800'
                                      }`}>
                                        {rep.content || rep.description}
                                      </p>
                                    )}

                                    {/* Voice Audio Message */}
                                    {rep.audioUrl && (
                                      <div className="mb-3">
                                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-300 mb-1.5">
                                          <Mic size={13} className="text-indigo-400" />
                                          <span>Mensagem de Voz</span>
                                        </div>
                                        <AudioPlayer src={rep.audioUrl} duration={rep.audioDuration} />
                                      </div>
                                    )}

                                    {/* Photos & Attachments */}
                                    {rep.attachments && rep.attachments.length > 0 && (
                                      <div className="mb-3">
                                        <AttachmentGallery attachments={rep.attachments} />
                                      </div>
                                    )}

                                    {/* Footer with Like, Comment, Map & Delete Actions */}
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                                      <div className="flex items-center gap-4">
                                        {/* Curtir / Apoiar */}
                                        <button
                                          type="button"
                                          onClick={() => handleToggleLike(group.id, rep)}
                                          className={`flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                                            isLiked ? 'text-red-400' : 'text-slate-400 hover:text-slate-200'
                                          }`}
                                          title="Curtir mensagem"
                                        >
                                          <Heart size={14} className={isLiked ? 'fill-red-500 text-red-500' : ''} />
                                          <span>{likesCount}</span>
                                        </button>

                                        {/* Comentar */}
                                        <button
                                          type="button"
                                          onClick={() => setActiveCommentItem({ id: rep.id, type: isPost ? 'post' : 'report', authorName })}
                                          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer"
                                          title="Ver ou adicionar comentários"
                                        >
                                          <MessageSquare size={14} />
                                          <span>{commentsCount} {commentsCount === 1 ? 'comentário' : 'comentários'}</span>
                                        </button>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        {(rep.authorId === user?.uid || user?.email === 'viciowins@gmail.com') && (
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteItem(group.id, rep.id, rep.feedType)}
                                            title="Excluir item"
                                            className="text-xs text-red-400 hover:text-red-300 font-medium flex items-center gap-1 transition-colors cursor-pointer p-1 rounded hover:bg-red-500/10"
                                          >
                                            <Trash2 size={13} />
                                            <span>Excluir</span>
                                          </button>
                                        )}
                                        {!isPost && (
                                          <button
                                            type="button"
                                            onClick={() => navigate(`/?reportId=${rep.id}`)}
                                            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                          >
                                            Ver no Mapa <ArrowRight size={12} />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              });
                            })()
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Inline Quick Voice Message Recorder */}
                    {recordingGroupId === group.id && (
                      <div className="mt-3 p-3 bg-indigo-950/40 border border-indigo-500/40 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                            <Mic size={14} className="text-indigo-400" />
                            Gravar Áudio Rápido para o Grupo
                          </span>
                          <button
                            type="button"
                            onClick={() => setRecordingGroupId(null)}
                            className="text-xs text-slate-400 hover:text-white"
                          >
                            Fechar
                          </button>
                        </div>
                        <VoiceRecorder
                          maxDuration={60}
                          label="Pressione para falar aos vizinhos (até 60s)"
                          onAudioRecorded={(audio) => {
                            if (audio) {
                              handleSendVoiceReport(group, audio);
                            }
                          }}
                        />
                        {isSubmittingVoice && (
                          <div className="flex items-center justify-center gap-2 py-2 text-xs text-indigo-300">
                            <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                            <span>Publicando e notificando membros do grupo...</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bottom Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-700/40">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => toggleGroupReports(group.id)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                        >
                          <MessageCircle size={13} />
                          Conversar por Texto
                        </button>
                        <button
                          type="button"
                          onClick={() => setRecordingGroupId(prev => prev === group.id ? null : group.id)}
                          className="bg-slate-700 hover:bg-slate-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                        >
                          <Mic size={13} />
                          Áudio Rápido
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/report?groupId=${group.id}`)}
                          className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Plus size={13} />
                          Novo Alerta
                        </button>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleLeaveGroup(group.id, group.name)}
                        className="text-red-400 hover:text-red-300 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <LogOut size={14} /> Sair do Grupo
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comments Modal for Group Posts and Reports */}
      {activeCommentItem && (
        <CommentsModal
          isOpen={Boolean(activeCommentItem)}
          onClose={() => setActiveCommentItem(null)}
          itemId={activeCommentItem.id}
          itemType={activeCommentItem.type}
          authorName={activeCommentItem.authorName}
        />
      )}
    </div>
  );
}
