import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, AlertCircle, ExternalLink, Compass, Globe, Copy, Check, Loader2 } from 'lucide-react';
import { auth } from '../firebase';
import { signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/Logo';
import { isInAppBrowser, openInExternalBrowser } from '../utils/inAppBrowser';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [redirectChecking, setRedirectChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [inAppDetected, setInAppDetected] = useState(false);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setInAppDetected(isInAppBrowser());
  }, []);

  // Check for redirect result from Google login (crucial for mobile Chrome, Safari, and PWAs)
  useEffect(() => {
    let isMounted = true;
    getRedirectResult(auth)
      .then((result) => {
        if (!isMounted) return;
        if (result && result.user) {
          const from = location.state?.from?.pathname || '/';
          navigate(from, { replace: true });
        }
      })
      .catch((err: any) => {
        if (!isMounted) return;
        const errorCode = err?.code || '';
        const errorMessage = err?.message || '';
        console.warn('[Firebase Auth] Redirect error:', errorCode, errorMessage);
        
        if (
          errorCode === 'auth/unauthorized-domain' ||
          errorMessage.includes('auth/unauthorized-domain') ||
          errorMessage.includes('unauthorized domain') ||
          errorMessage.includes('unauthorized-domain')
        ) {
          setUnauthorizedDomain(window.location.hostname || 'alertacriminal.com.br');
        } else if (errorCode !== 'auth/popup-closed-by-user') {
          setError('Ocorreu uma instabilidade ao autenticar com o Google. Tente novamente.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setRedirectChecking(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [navigate, location]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleGoogleLogin = async () => {
    // If inside Facebook / Instagram / In-App browser, Google OAuth popups fail due to storage partitioning
    if (isInAppBrowser()) {
      setError(null);
      setMessage('Navegador do Facebook detectado. Redirecionando para o Chrome/Safari para login seguro...');
      const opened = openInExternalBrowser();
      if (!opened) {
        setError('O Facebook bloqueia login com o Google dentro do aplicativo. Toque nos 3 pontinhos (⋮) no canto superior direito e selecione "Abrir no navegador externo".');
      }
      return;
    }

    setLoading(true);
    setError(null);
    setUnauthorizedDomain(null);
    
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.matchMedia('(max-width: 768px)').matches ||
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;

    // Mobile devices (Android/iOS) and standalone PWAs MUST use redirect because popups lose opener reference
    if (isMobile) {
      try {
        await signInWithRedirect(auth, provider);
        return;
      } catch (err: any) {
        console.warn('[Firebase Auth] signInWithRedirect warning, falling back to popup:', err);
      }
    }

    try {
      await signInWithPopup(auth, provider);
      // O useEffect acima vai redirecionar automaticamente quando o 'user' for atualizado
    } catch (err: any) {
      setLoading(false);
      
      const errorCode = err?.code || '';
      const errorMessage = err?.message || '';

      if (
        errorCode === 'auth/unauthorized-domain' ||
        errorMessage.includes('auth/unauthorized-domain') ||
        errorMessage.includes('unauthorized domain') ||
        errorMessage.includes('unauthorized-domain')
      ) {
        console.warn('[Firebase Auth] Domínio não autorizado no Console do Firebase:', window.location.hostname);
        setUnauthorizedDomain(window.location.hostname || 'alertacriminal.com.br');
      } else if (
        errorCode === 'auth/popup-blocked' ||
        errorCode === 'auth/popup-closed-by-user' ||
        errorCode === 'auth/missing-initial-state' ||
        errorMessage.includes('storage-partitioned')
      ) {
        // Fallback directly to redirect for blocked popups
        try {
          setLoading(true);
          await signInWithRedirect(auth, provider);
        } catch {
          setLoading(false);
          setError('O navegador bloqueou a janela de autenticação. Tente novamente no navegador padrão.');
        }
      } else {
        console.warn('[Firebase Auth] Erro no login:', errorCode, errorMessage);
        setError('Ocorreu um erro ao conectar com o Google. Tente novamente.');
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 px-6 pb-2 pt-6 relative overflow-hidden">
      {/* Video Background Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950">
        <video
          autoPlay
          loop
          muted
          playsInline
          src="/bg-video.mp4?v=2"
          onError={(e) => {
            // Se falhar o carregamento do vídeo no navegador, oculta graciosamente e mantém o fundo escuro
            e.currentTarget.style.display = 'none';
          }}
          className="absolute inset-0 w-full h-full object-cover saturate-[1.5] contrast-[1.1] brightness-[1.05] scale-[1.15]"
        />
        {/* Gradient overlay to further obscure edges and improve text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/20"></div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-end max-w-sm mx-auto w-full pb-0 pt-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <Logo className="w-32 h-32 mb-1" />
        <p className="text-slate-200 text-center mb-3 text-sm leading-relaxed font-medium drop-shadow-md">
          Sua comunidade mais segura começa com você.
          <br />
          Faça parte desde o início.
        </p>

        {inAppDetected && (
          <div className="w-full mb-4 p-4 bg-amber-500/20 backdrop-blur-md border border-amber-500/40 rounded-2xl text-amber-200 text-xs space-y-2.5 shadow-xl animate-in fade-in duration-500">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <Compass size={18} className="text-amber-400 shrink-0" />
              <span>Navegador do Facebook / Instagram Detectado</span>
            </div>
            <p className="leading-relaxed text-[11.5px] text-amber-100">
              O Google e o Facebook bloqueiam autenticação dentro de navegadores internos por segurança das contas. Para fazer login, abra este site no Chrome ou Safari externo:
            </p>
            <button
              type="button"
              onClick={() => openInExternalBrowser()}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <ExternalLink size={15} />
              <span>Abrir no Chrome / Safari</span>
            </button>
            <p className="text-[10px] text-amber-300/80 text-center flex items-center justify-center gap-1">
              <span>Ou toque nos 3 pontinhos</span>
              <span className="font-bold bg-amber-400/20 px-1.5 py-0.5 rounded border border-amber-400/30">⋮</span>
              <span>no topo direito e escolha "Abrir no navegador"</span>
            </p>
          </div>
        )}

        {unauthorizedDomain && (
          <div className="w-full mb-4 p-4 bg-amber-500/15 backdrop-blur-md border border-amber-500/40 rounded-2xl text-amber-200 text-xs space-y-3 shadow-xl animate-in fade-in duration-300">
            <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
              <Globe size={18} className="text-amber-400 shrink-0" />
              <span>Adicionar Domínio no Firebase</span>
            </div>
            
            <p className="leading-relaxed text-[11.5px] text-amber-100">
              Na tela do Firebase Console que você abriu (<strong>Domínios autorizados</strong>), clique no botão <strong>"Adicionar domínio"</strong> e cadastre os domínios abaixo para liberar o login:
            </p>

            <div className="space-y-2">
              {[
                { domain: 'alertacriminal.com.br', label: 'Domínio Oficial (Produção)' },
                { domain: window.location.hostname || 'ais-dev-zhziz4noufss6snsh3ucwb-301228962847.us-east1.run.app', label: 'Ambiente de Testes / Atual' },
                { domain: 'ais-pre-zhziz4noufss6snsh3ucwb-301228962847.us-east1.run.app', label: 'Ambiente de Pré-visualização' }
              ].filter((item, idx, arr) => arr.findIndex(x => x.domain === item.domain) === idx).map((item) => (
                <div key={item.domain} className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-slate-400 font-medium truncate">{item.label}</p>
                    <code className="text-[11px] font-mono text-cyan-300 truncate select-all block">
                      {item.domain}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(item.domain);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-[11px] font-semibold rounded-lg shrink-0 flex items-center gap-1.5 transition-all border border-slate-700"
                  >
                    <Copy size={12} />
                    <span>Copiar</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="text-[11px] text-slate-300 space-y-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <p className="font-semibold text-amber-300">Passo a passo na tela do Firebase:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-300/90 text-[10.5px]">
                <li>Clique no botão <strong>"Adicionar domínio"</strong> (Add domain) no canto da tabela;</li>
                <li>Cole um dos domínios acima (sem https://, apenas o nome);</li>
                <li>Clique em <strong>Adicionar</strong> (repita para os outros);</li>
                <li>Volte aqui e clique novamente em <strong>Continuar com o Google</strong>!</li>
              </ol>
            </div>

            <a
              href="https://console.firebase.google.com/project/alerta-criminal-c1612/authentication/settings"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <ExternalLink size={15} />
              <span>Abrir Firebase Console &gt; Domínios Autorizados</span>
            </a>
          </div>
        )}

        {error && (
          <div className="w-full mb-4 p-4 bg-red-500/20 border border-red-500/40 rounded-2xl flex items-start gap-3 text-red-200 text-xs backdrop-blur-md">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0 text-red-400" />
            <div className="space-y-1.5 flex-1">
              <p className="font-medium">{error}</p>
              {inAppDetected && (
                <button
                  type="button"
                  onClick={() => openInExternalBrowser()}
                  className="mt-1 px-3 py-1.5 bg-red-500 hover:bg-red-400 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-all"
                >
                  <ExternalLink size={13} />
                  <span>Abrir no navegador externo</span>
                </button>
              )}
            </div>
          </div>
        )}

        {message && (
          <div className="w-full mb-4 p-4 bg-green-500/20 border border-green-500/40 rounded-2xl flex items-start gap-3 text-green-200 text-xs backdrop-blur-md">
            <Shield size={18} className="mt-0.5 flex-shrink-0 text-green-400" />
            <p className="font-medium">{message}</p>
          </div>
        )}

        <div className="w-full mt-0 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || redirectChecking}
            className="w-full py-3.5 rounded-2xl font-bold text-slate-700 bg-white hover:bg-slate-50 transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-lg disabled:opacity-80"
          >
            {loading || redirectChecking ? (
              <div className="flex items-center gap-2 text-slate-800 text-sm font-semibold">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <span>Conectando com o Google...</span>
              </div>
            ) : (
              <>
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continuar com o Google
              </>
            )}
          </button>
          
          <p className="mt-2 text-[10px] leading-tight text-slate-300 text-center max-w-[250px] drop-shadow-lg font-medium">
            Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade.
          </p>
        </div>
      </div>
    </div>
  );
}
