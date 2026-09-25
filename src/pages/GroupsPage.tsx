import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Plus, Users, Search, ArrowRight, UserPlus, LogOut, Copy, Check, Lock, ChevronDown, ChevronUp, MapPin, AlertTriangle, Eye, Siren, Flame, MoreHorizontal, Clock, Crown, ShieldCheck } from 'lucide-react';
import { TopBar } from '../components/TopBar';
import { AttachmentGallery } from '../components/AttachmentGallery';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';

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
  const [groupReports, setGroupReports] = useState<Record<string, any[]>>({});
  const [loadingReports, setLoadingReports] = useState<Record<string, boolean>>({});
  const [membersMap, setMembersMap] = useState<Record<string, { uid: string; name: string; avatar: string; level?: string }>>({});

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

  const toggleGroupReports = async (groupId: string) => {
    if (expandedGroupId === groupId) {
      setExpandedGroupId(null);
      return;
    }
    setExpandedGroupId(groupId);
    if (!groupReports[groupId]) {
      setLoadingReports(prev => ({ ...prev, [groupId]: true }));
      try {
        const qReports = query(collection(db, 'reports'), where('groupId', '==', groupId));
        const snap = await getDocs(qReports);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        data.sort((a: any, b: any) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return tB - tA;
        });
        setGroupReports(prev => ({ ...prev, [groupId]: data }));

        // Also fetch author profiles if missing
        const authorUids = data.map((r: any) => r.authorId).filter(Boolean);
        if (authorUids.length > 0) {
          fetchMemberProfiles(authorUids);
        }
      } catch (err) {
        console.error("Error loading group reports", err);
      } finally {
        setLoadingReports(prev => ({ ...prev, [groupId]: false }));
      }
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
                              <div>
                                {isGroupCreator ? (
                                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Crown size={10} /> Criador
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Shield size={10} className="text-slate-400" /> Membro
                                  </span>
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
                    <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/60">
                      <div>
                        <p className="text-[11px] text-slate-400">Código de Convite da Rede:</p>
                        <p className="text-white font-mono font-bold tracking-widest text-base">{group.inviteCode}</p>
                      </div>
                      <button 
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
                    </div>
                    
                    {/* Collapsible Group Occurrences */}
                    <div className="pt-1">
                      <button 
                        onClick={() => toggleGroupReports(group.id)}
                        className="w-full flex items-center justify-between py-2.5 px-3 bg-slate-900/80 hover:bg-slate-900 border border-indigo-500/30 rounded-lg text-xs font-medium text-slate-300 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2 text-indigo-400">
                          <Lock size={14} />
                          <span className="text-white font-semibold">Ocorrências desta Rede Privada</span>
                          {groupReports[group.id] && (
                            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                              {groupReports[group.id].length}
                            </span>
                          )}
                        </span>
                        {expandedGroupId === group.id ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                      </button>

                      {expandedGroupId === group.id && (
                        <div className="mt-3 space-y-3 border-t border-slate-700/60 pt-3">
                          {loadingReports[group.id] ? (
                            <div className="flex items-center justify-center py-6 text-xs text-slate-400 gap-2">
                              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                              Carregando ocorrências da rede privada...
                            </div>
                          ) : !groupReports[group.id] || groupReports[group.id].length === 0 ? (
                            <div className="bg-slate-900/50 p-4 rounded-xl text-center border border-slate-800">
                              <Lock size={24} className="text-indigo-400/60 mx-auto mb-2" />
                              <p className="text-xs text-slate-300 font-medium">Nenhuma ocorrência relatada nesta rede privada ainda.</p>
                              <p className="text-[11px] text-slate-500 mt-1">
                                Ao relatar um novo alerta, selecione este grupo para que apenas os membros abaixo tenham acesso.
                              </p>
                            </div>
                          ) : (
                            groupReports[group.id].map(rep => {
                              const authorMember = membersMap[rep.authorId];
                              const isMe = rep.authorId === user?.uid;
                              const authorAvatar = rep.authorAvatar || authorMember?.avatar || (isMe && user?.photoURL) || `https://i.pravatar.cc/150?u=${rep.authorId || 'membro'}`;
                              const authorName = rep.isAnonymous 
                                ? 'Morador Anônimo' 
                                : (rep.authorName || authorMember?.name || (isMe ? (user?.displayName || 'Você') : 'Membro'));
                              const typeLabel = rep.type === 'roubo' ? 'Roubo/Furto' : rep.type === 'suspeito' ? 'Atividade Suspeita' : rep.type === 'vandalismo' ? 'Vandalismo' : rep.type === 'zeladoria' ? 'Zeladoria / Risco' : 'Outro';

                              return (
                                <div key={rep.id} className="bg-slate-900 border border-indigo-500/30 rounded-xl p-3.5 text-xs shadow-md">
                                  {/* Occurrence Header with Author Profile Picture */}
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

                                    <span className="font-bold text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                                      <Lock size={10} />
                                      {typeLabel}
                                    </span>
                                  </div>

                                  {/* Location */}
                                  <p className="text-slate-300 font-medium mb-1.5 flex items-center gap-1.5 text-xs">
                                    <MapPin size={12} className="text-red-400 shrink-0" />
                                    <span className="truncate">{rep.location?.address || 'Localização no Mapa'}</span>
                                  </p>

                                  {/* Description */}
                                  {rep.description && (
                                    <p className="text-slate-200 text-xs leading-relaxed mb-3 bg-slate-800/60 p-2.5 rounded-lg border border-slate-800">
                                      "{rep.description}"
                                    </p>
                                  )}

                                  {/* Photos & Attachments */}
                                  {rep.attachments && rep.attachments.length > 0 && (
                                    <div className="mb-3">
                                      <AttachmentGallery attachments={rep.attachments} />
                                    </div>
                                  )}

                                  {/* Footer with Map Action */}
                                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                      <Lock size={10} className="text-indigo-400" />
                                      Exclusivo para membros deste grupo
                                    </span>
                                    <button
                                      onClick={() => navigate(`/?reportId=${rep.id}`)}
                                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                    >
                                      Ver no Mapa <ArrowRight size={12} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Bottom Actions */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/40">
                      <button
                        onClick={() => navigate(`/report?groupId=${group.id}`)}
                        className="bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus size={13} />
                        Novo Alerta neste Grupo
                      </button>
                      <button 
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
    </div>
  );
}
