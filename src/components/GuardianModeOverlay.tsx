import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, Share2, Users, MapPin, Activity, Edit2, AlertCircle, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface GuardianModeOverlayProps {
  isActive: boolean;
  onDeactivate: () => void;
  location: { lat: number; lng: number } | null;
}

export function GuardianModeOverlay({ isActive, onDeactivate, location }: GuardianModeOverlayProps) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<any[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTime, setActiveTime] = useState(0);
  const [isSharing, setIsSharing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionCreatedRef = React.useRef(false);
  const wakeLockRef = React.useRef<any>(null);
  
  // Camouflage Mode State
  const [isCamouflaged, setIsCamouflaged] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const pressTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const activateCamouflage = () => {
    setShowHint(true);
    setTimeout(() => {
      setShowHint(false);
      setIsCamouflaged(true);
    }, 2500);
  };

  const handlePointerDown = () => {
    pressTimerRef.current = setTimeout(() => {
      setIsCamouflaged(false);
    }, 2000);
  };

  const handlePointerUp = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  useEffect(() => {
    const requestWakeLock = async () => {
      if (isActive && 'wakeLock' in navigator) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        } catch (err: any) {
          // Ignore expected permission errors, particularly in iframes
          if (err.name !== 'NotAllowedError') {
            console.warn('Wake Lock request failed:', err.message);
          }
        }
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (isActive && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(console.error);
        wakeLockRef.current = null;
      }
    };
  }, [isActive]);

  useEffect(() => {
    if (isActive && user && location && !sessionCreatedRef.current) {
      sessionCreatedRef.current = true;
      const newSessionId = `${user.uid}_${Date.now()}`;
      setSessionId(newSessionId);
      
      const sessionRef = doc(db, 'guardian_sessions', newSessionId);
      setDoc(sessionRef, {
        userId: user.uid,
        userName: user.displayName || 'Usuário',
        location: location,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }).catch(console.error);

      const timer = setInterval(() => {
        setActiveTime(prev => prev + 1);
      }, 1000);
      
      return () => {
        clearInterval(timer);
        updateDoc(sessionRef, { isActive: false }).catch(console.error);
        sessionCreatedRef.current = false;
      };
    } else if (!isActive) {
      setActiveTime(0);
      setSessionId(null);
      sessionCreatedRef.current = false;
    }
  }, [isActive, user]); // Intentionally omitting location and sessionId to avoid re-running on every move

  const latestLocationRef = React.useRef(location);

  useEffect(() => {
    latestLocationRef.current = location;
  }, [location]);

  // Update location in Firestore periodically
  useEffect(() => {
    if (!isActive || !sessionId) return;

    const updateLocation = async () => {
      if (!latestLocationRef.current) return;
      
      try {
        const sessionRef = doc(db, 'guardian_sessions', sessionId);
        await updateDoc(sessionRef, {
          location: latestLocationRef.current,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        console.error("Erro ao atualizar localização do guardião:", error);
      }
    };

    // Update every 4 seconds for better real-time tracking
    const intervalId = setInterval(updateLocation, 4000);

    return () => clearInterval(intervalId);
  }, [isActive, sessionId]);

  useEffect(() => {
    const fetchContacts = async () => {
      if (!user || !isActive) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().trustedContacts) {
          setContacts(docSnap.data().trustedContacts);
        }
      } catch (err) {
        console.error('Error fetching contacts:', err);
      }
    };
    fetchContacts();
  }, [user, isActive]);

  if (!isActive) return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getTrackingUrl = () => {
    if (sessionId) {
      return `${window.location.origin}/track/${sessionId}`;
    }
    return location ? `https://maps.google.com/?q=${location.lat},${location.lng}` : '';
  };

  const handleShare = (phone: string) => {
    const trackingUrl = getTrackingUrl();
    if (!trackingUrl) return;
    
    const message = encodeURIComponent(
      `🛡️ *MEU GUARDIÃO ATIVO* 🛡️\n\nEstou compartilhando minha localização em tempo real com você por segurança.\n\nAcompanhe aqui:\n${trackingUrl}`
    );
    
    let cleanPhone = phone.replace(/\D/g, '');
    
    // Remove 55 if it's already there to standardize processing
    if (cleanPhone.startsWith('55') && cleanPhone.length > 11) {
      cleanPhone = cleanPhone.substring(2);
    }
    
    // Ensure it has the country code (55 for Brazil)
    if (!cleanPhone.startsWith('55') && cleanPhone.length >= 10) {
      cleanPhone = `55${cleanPhone}`;
    } else if (!cleanPhone.startsWith('55') && cleanPhone.length < 10) {
       // Fallback for other weird formats, just prepend 55
       cleanPhone = `55${cleanPhone}`;
    }
    
    const waLink = `https://wa.me/${cleanPhone}?text=${message}`;
    window.open(waLink, '_blank');
  };

  const handleShareGeneral = async () => {
    const trackingUrl = getTrackingUrl();
    if (!trackingUrl || isSharing) return;
    
    if (navigator.share) {
      setIsSharing(true);
      try {
        await navigator.share({
          title: 'Meu Guardião - Acompanhamento',
          text: 'Estou compartilhando minha localização em tempo real por segurança.',
          url: trackingUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      } finally {
        setIsSharing(false);
      }
    } else {
      navigator.clipboard.writeText(`Acompanhe minha localização: ${trackingUrl}`);
      alert('Link copiado para a área de transferência!');
    }
  };

  return (
    <>
      {/* Persistent Banner */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-blue-600 text-white p-3 shadow-lg flex items-center justify-between animate-in slide-in-from-top">
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShieldCheck size={20} className="text-white" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">Meu Guardião Ativo</p>
            <p className="text-xs text-blue-200 flex items-center gap-1">
              <Activity size={10} /> Transmitindo localização ({formatTime(activeTime)})
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={activateCamouflage}
            className="bg-slate-900/40 hover:bg-slate-900/60 p-2 rounded-full transition-colors"
            title="Ocultar Tela"
          >
            <EyeOff size={18} />
          </button>
          <button 
            onClick={() => setShowShareModal(true)}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
          >
            <Share2 size={18} />
          </button>
          <button 
            onClick={onDeactivate}
            className="bg-red-500 hover:bg-red-600 p-2 rounded-full transition-colors ml-1"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Camouflage Hint */}
      {showHint && (
        <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center animate-in fade-in">
          <p className="text-white/50 text-sm font-medium">Pressione a tela por 2 segundos para voltar</p>
        </div>
      )}

      {/* Camouflage Fake Google Screen */}
      {isCamouflaged && (
        <div 
          className="fixed inset-0 z-[9999] bg-white touch-none flex flex-col items-center pt-32 px-4"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Fake Top Bar */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>

          {/* Fake Google Logo */}
          <div className="text-5xl font-bold mb-8 tracking-tighter flex">
            <span className="text-[#4285F4]">G</span>
            <span className="text-[#EA4335]">o</span>
            <span className="text-[#FBBC05]">o</span>
            <span className="text-[#4285F4]">g</span>
            <span className="text-[#34A853]">l</span>
            <span className="text-[#EA4335]">e</span>
          </div>
          
          {/* Fake Search Bar */}
          <div className="w-full max-w-md bg-white border border-gray-200 shadow-md rounded-full px-5 py-3.5 flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <div className="flex-1 text-gray-400 text-lg">Pesquisar...</div>
            <svg className="w-5 h-5 text-[#4285F4]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.87 3.13 7 7 7v3h4v-3c3.87 0 7-3.13 7-7h-2z"/></svg>
          </div>

          {/* Fake Shortcuts */}
          <div className="mt-8 grid grid-cols-4 gap-6 w-full max-w-md px-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center"><svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg></div>
              <span className="text-xs text-gray-600">Início</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center"><svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg></div>
              <span className="text-xs text-gray-600">Notícias</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center"><svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
              <span className="text-xs text-gray-600">Vídeos</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center"><svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 100 4 2 2 0 000-4z"></path></svg></div>
              <span className="text-xs text-gray-600">Shopping</span>
            </div>
          </div>
        </div>
      )}

      {/* Share Bottom Sheet */}
      {showShareModal && (
        <>
          <div 
            className="fixed inset-0 z-[90] bg-slate-950/60 backdrop-blur-sm animate-in fade-in" 
            onClick={() => setShowShareModal(false)} 
          />
          <div className="fixed bottom-0 left-0 right-0 z-[100] bg-slate-900 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] p-6 pb-8 transition-transform transform translate-y-0 border-t border-white/10 animate-in slide-in-from-bottom-full">
            <div className="w-12 h-1.5 bg-slate-700/50 rounded-full mx-auto mb-6 cursor-pointer" onClick={() => setShowShareModal(false)} />
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30 shrink-0">
                <Users size={28} className="text-blue-500" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white mb-1">Compartilhar Rota</h2>
                <p className="text-slate-400 text-sm leading-tight">
                  Envie sua localização em tempo real para seus contatos.
                </p>
              </div>
            </div>

            <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-3 mb-6 flex items-start gap-3">
              <AlertCircle className="text-blue-400 shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-blue-200 leading-relaxed">
                <strong className="font-bold text-blue-100">Atenção:</strong> Mantenha o aplicativo aberto. O rastreamento pode ser pausado pelo celular se a tela for desligada ou o app minimizado.
              </p>
            </div>

            <div className="max-h-[50vh] overflow-y-auto pr-2">
              <button
                onClick={handleShareGeneral}
                disabled={isSharing}
                className={`w-full text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors mb-6 shadow-lg ${
                  isSharing ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <Share2 size={18} />
                {isSharing ? 'Compartilhando...' : 'Compartilhar Link Geral'}
              </button>

              {contacts.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Contatos de Confiança</p>
                  {contacts.map((contact, idx) => (
                    <div key={idx} className="w-full bg-slate-800 border border-slate-700/50 rounded-2xl flex items-center justify-between overflow-hidden">
                      <button
                        onClick={() => handleShare(contact.phone)}
                        className="flex-1 hover:bg-slate-700 text-white p-3.5 flex items-center justify-between transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-slate-300 font-bold">
                            {contact.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-200">{contact.name}</p>
                            <p className="text-xs text-slate-400">{contact.phone}</p>
                          </div>
                        </div>
                        <div className="bg-green-500/20 text-green-400 p-2.5 rounded-full">
                          <Share2 size={16} />
                        </div>
                      </button>
                      <a 
                        href="/trusted-contacts"
                        className="p-4 text-slate-400 hover:text-blue-400 hover:bg-slate-700 transition-colors border-l border-slate-700/50"
                        title="Editar contato"
                      >
                        <Edit2 size={18} />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-5 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                  <p className="text-slate-400 text-sm mb-3">Você ainda não tem contatos de confiança cadastrados.</p>
                  <a href="/trusted-contacts" className="inline-block bg-slate-800 text-blue-400 text-sm font-bold py-2 px-4 rounded-xl hover:bg-slate-700 transition-colors">
                    Adicionar Contatos
                  </a>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
