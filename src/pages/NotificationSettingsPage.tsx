import React, { useState, useEffect } from 'react';
import { TopBar } from '../components/TopBar';
import { useAuth } from '../contexts/AuthContext';
import { db, messaging } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getToken } from 'firebase/messaging';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, BellRing } from 'lucide-react';

// Chave pública VAPID (opcional, mas recomendada para FCM web)
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export function NotificationSettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({ push: true, email: false, whatsapp: false });
  const [isRequesting, setIsRequesting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.notificationSettings) {
            setSettings(data.notificationSettings);
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'users');
      }
    };
    fetchSettings();
  }, [user]);

  const requestPushPermission = async () => {
    setErrorMessage(null);
    
    // Check if running inside an iframe
    if (window.self !== window.top) {
      setErrorMessage('Notificações push não podem ser ativadas dentro desta visualização. Por favor, abra o aplicativo em uma nova aba (botão no canto superior direito) para ativar.');
      return false;
    }

    if (!('Notification' in window)) {
      setErrorMessage('Seu navegador não suporta notificações push.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const msg = await messaging();
        if (msg) {
          const token = await getToken(msg, VAPID_KEY ? { vapidKey: VAPID_KEY } : undefined);
          
          if (token && user) {
            // Salvar o token no Firestore
            const docRef = doc(db, 'users', user.uid);
            await updateDoc(docRef, { fcmToken: token });
            console.log('Token FCM salvo com sucesso!');
            return true;
          } else {
            setErrorMessage('Não foi possível gerar o token de notificação.');
          }
        } else {
          setErrorMessage('Serviço de mensageria não suportado neste navegador.');
        }
      } else {
        setErrorMessage('Permissão para notificações negada pelo navegador. Verifique as configurações do seu site.');
      }
    } catch (error: any) {
      console.error('Erro ao solicitar permissão de notificação:', error);
      setErrorMessage(`Erro ao ativar: ${error?.message || 'Restrição do navegador ou permissão negada.'}`);
    }
    return false;
  };

  const toggleSetting = async (key: keyof typeof settings) => {
    if (!user || isRequesting) return;

    const newValue = !settings[key];
    
    // Se estiver ativando o Push, pede permissão primeiro
    if (key === 'push' && newValue === true) {
      setIsRequesting(true);
      const granted = await requestPushPermission();
      setIsRequesting(false);
      
      if (!granted) {
        // Se não conseguiu permissão, não ativa a chave
        return;
      }
    }

    const newSettings = { ...settings, [key]: newValue };
    setSettings(newSettings);
    
    try {
      const docRef = doc(db, 'users', user.uid);
      updateDoc(docRef, { notificationSettings: newSettings }).catch(e => console.error(e));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users');
      // Revert on error
      setSettings(settings);
    }
  };

  const testNotification = () => {
    if (!('Notification' in window)) {
      alert('Seu navegador não suporta notificações.');
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification('Alerta Criminal - Teste', {
        body: 'Sua configuração de notificações está funcionando perfeitamente!',
        icon: '/escudo-logo.png',
        badge: '/escudo-logo.png',
        vibrate: [200, 100, 200]
      } as any);
    } else {
      alert('Você precisa ativar as notificações primeiro.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <TopBar title="Notificações" showBack />
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        
        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
            <p className="text-red-200 text-sm">{errorMessage}</p>
          </div>
        )}

        <div className="space-y-2">
          <ToggleItem 
            label="Notificações Push (Celular)" 
            description="Receba alertas de perigo próximos a você em tempo real." 
            checked={settings.push} 
            onChange={() => toggleSetting('push')} 
            isLoading={isRequesting && !settings.push}
          />
          
          {settings.push && (
            <button 
              onClick={testNotification}
              className="w-full bg-blue-500/10 border border-blue-500/30 text-blue-400 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-500/20 transition-colors"
            >
              <BellRing size={18} />
              <span className="font-semibold text-sm">Testar Notificação no Aparelho</span>
            </button>
          )}
        </div>

        <div className="space-y-2">
          <ToggleItem 
            label="E-mail" 
            description="Resumos semanais e atualizações de segurança da sua região." 
            checked={settings.email} 
            onChange={() => toggleSetting('email')} 
          />
          
          {settings.email && (
            <button 
              onClick={async () => {
                if (!user?.email) {
                  alert("Você não tem um e-mail cadastrado.");
                  return;
                }
                try {
                  const res = await fetch('/api/test-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ to: user.email, name: user.displayName || 'Usuário' })
                  });
                  const data = await res.json();
                  if (data.success) {
                    alert("E-mail de teste enviado com sucesso! Verifique sua caixa de entrada.");
                  } else {
                    alert("Erro ao enviar e-mail: " + data.error);
                  }
                } catch (e) {
                  alert("Erro ao conectar com o servidor.");
                }
              }}
              className="w-full bg-slate-800 border border-slate-700 text-slate-300 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"
            >
              <span className="font-semibold text-sm">Enviar E-mail de Teste Agora</span>
            </button>
          )}
        </div>
        <div className="space-y-2">
          <ToggleItem 
            label="WhatsApp" 
            description="Avisos críticos e alertas de SOS dos seus contatos de confiança." 
            checked={settings.whatsapp} 
            onChange={() => toggleSetting('whatsapp')} 
          />
          
          {settings.whatsapp && (
            <button 
              onClick={async () => {
                const phone = prompt("Digite seu número de WhatsApp com código do país (ex: +5511999999999):");
                if (!phone) return;
                
                try {
                  const res = await fetch('/api/test-whatsapp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ to: phone, name: user?.displayName || 'Usuário' })
                  });
                  const data = await res.json();
                  if (data.success) {
                    alert("Mensagem de teste enviada com sucesso pro seu WhatsApp!");
                  } else {
                    alert("Erro ao enviar WhatsApp: " + data.error);
                  }
                } catch (e) {
                  alert("Erro ao conectar com o servidor.");
                }
              }}
              className="w-full bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#25D366]/20 transition-colors"
            >
              <span className="font-semibold text-sm">Testar WhatsApp Agora</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ToggleItem({ label, description, checked, onChange, isLocked = false, isLoading = false }: { label: string, description: string, checked: boolean, onChange: () => void, isLocked?: boolean, isLoading?: boolean }) {
  return (
    <div className={`bg-slate-800 p-5 rounded-2xl border border-slate-700 flex items-center justify-between ${isLocked ? 'opacity-70' : ''}`}>
      <div className="flex-1 pr-4">
        <div className="flex items-center gap-2">
          <p className="font-bold text-white text-sm">{label}</p>
          {isLocked && <div className="bg-yellow-500/20 text-yellow-500 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Lock size={10} /> PRO</div>}
        </div>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{description}</p>
      </div>
      <button 
        onClick={onChange} 
        disabled={isLoading}
        className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${checked ? 'bg-blue-500' : 'bg-slate-600'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${checked ? 'left-7' : 'left-1'}`} />
      </button>
    </div>
  );
}
