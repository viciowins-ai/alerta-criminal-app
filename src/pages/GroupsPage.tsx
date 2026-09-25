import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Plus, Users, Search, ArrowRight, UserPlus, LogOut, Copy, Check, Lock, ChevronDown, ChevronUp, MapPin, AlertTriangle, Eye, Siren, Flame, MoreHorizontal, Clock } from 'lucide-react';
import { TopBar } from '../components/TopBar';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';

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
  const [groupReports, setGroupReports] = useState<Record<string, any[]>>({});
  const [loadingReports, setLoadingReports] = useState<Record<string, boolean>>({});

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
      } catch (err) {
        console.error("Error loading group reports", err);
      } finally {
        setLoadingReports(prev => ({ ...prev, [groupId]: false }));
      }
    }
  };

  const fetchGroups = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'groups'), where('members', 'array-contains', user.uid));
      const querySnapshot = await getDocs(q);
      const groupsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGroups(groupsData);
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
      // console.log('Creating group payload:', payload);
      await addDoc(collection(db, 'groups'), payload);
      setNewGroupName('');
      setIsCreating(false);
      fetchGroups();
    } catch (err) {
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
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 font-medium transition-colors"
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
            {groups.map(group => (
              <div key={group.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-white font-bold text-lg">{group.name}</h4>
                  <span className="bg-slate-900 text-slate-300 text-xs px-2 py-1 rounded-md font-medium border border-slate-700">
                    {group.members.length} {group.members.length === 1 ? 'membro' : 'membros'}
                  </span>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-700 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Código de Convite:</p>
                      <p className="text-white font-mono font-bold tracking-widest text-lg">{group.inviteCode}</p>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(group.inviteCode)}
                      className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                      {copiedCode === group.inviteCode ? (
                        <Check size={16} className="text-green-400" />
                      ) : (
                        <Copy size={16} />
                      )}
                      <span className="text-xs font-medium">{copiedCode === group.inviteCode ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                  
                  <div className="pt-2">
                    <button 
                      onClick={() => toggleGroupReports(group.id)}
                      className="w-full flex items-center justify-between py-2 px-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-700/60 rounded-lg text-xs font-medium text-slate-300 transition-colors"
                    >
                      <span className="flex items-center gap-1.5 text-indigo-400">
                        <Lock size={13} />
                        <span className="text-white font-medium">Ocorrências desta Rede Privada</span>
                        {groupReports[group.id] && (
                          <span className="bg-indigo-500/20 text-indigo-300 text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">
                            {groupReports[group.id].length}
                          </span>
                        )}
                      </span>
                      {expandedGroupId === group.id ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                    </button>

                    {expandedGroupId === group.id && (
                      <div className="mt-3 space-y-2 border-t border-slate-700/60 pt-3">
                        {loadingReports[group.id] ? (
                          <div className="flex items-center justify-center py-4 text-xs text-slate-400 gap-2">
                            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            Carregando ocorrências da rede privada...
                          </div>
                        ) : !groupReports[group.id] || groupReports[group.id].length === 0 ? (
                          <div className="bg-slate-900/40 p-4 rounded-lg text-center border border-slate-800">
                            <p className="text-xs text-slate-400">Nenhuma ocorrência relatada nesta rede privada ainda.</p>
                            <p className="text-[11px] text-slate-500 mt-1">Ao relatar uma nova ocorrência, você pode direcioná-la exclusivamente para este grupo.</p>
                          </div>
                        ) : (
                          groupReports[group.id].map(rep => {
                            const typeLabel = rep.type === 'roubo' ? 'Roubo/Furto' : rep.type === 'suspeito' ? 'Atividade Suspeita' : rep.type === 'vandalismo' ? 'Vandalismo' : rep.type === 'zeladoria' ? 'Zeladoria / Risco' : 'Outro';
                            return (
                              <div key={rep.id} className="bg-slate-900/80 border border-indigo-500/20 rounded-lg p-3 text-xs">
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <span className="font-bold text-indigo-300 flex items-center gap-1">
                                    <Lock size={11} className="text-indigo-400" />
                                    {typeLabel}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {rep.createdAt?.toMillis ? new Date(rep.createdAt.toMillis()).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                                  </span>
                                </div>
                                <p className="text-slate-300 font-medium mb-1 truncate flex items-center gap-1 text-[11px]">
                                  <MapPin size={11} className="text-red-400 shrink-0" />
                                  {rep.location?.address || 'Localização não informada'}
                                </p>
                                {rep.description && (
                                  <p className="text-slate-400 italic mb-2 line-clamp-2 text-[11px]">
                                    "{rep.description}"
                                  </p>
                                )}
                                <div className="flex items-center justify-between pt-1.5 border-t border-slate-800">
                                  <span className="text-[10px] text-slate-500">
                                    Por: {rep.isAnonymous ? 'Morador Anônimo' : (rep.authorName || 'Membro')}
                                  </span>
                                  <button
                                    onClick={() => navigate(`/?reportId=${rep.id}`)}
                                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
                                  >
                                    Ver no Mapa <ArrowRight size={11} />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end mt-2">
                    <button 
                      onClick={() => handleLeaveGroup(group.id, group.name)}
                      className="text-red-400 hover:text-red-300 text-xs font-medium flex items-center gap-1"
                    >
                      <LogOut size={14} /> Sair do Grupo Privado
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
