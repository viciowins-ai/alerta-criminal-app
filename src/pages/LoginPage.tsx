import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, AlertCircle } from 'lucide-react';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/Logo';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      await signInWithPopup(auth, provider);
      // O useEffect acima vai redirecionar automaticamente quando o 'user' for atualizado
    } catch (err: any) {
      setLoading(false);
      
      // Se o usuário apenas fechou o popup, não mostramos um erro assustador
      if (err.code === 'auth/popup-closed-by-user' || err.message?.includes('auth/popup-closed-by-user')) {
        setError(null);
      } else {
        console.error(err);
        setError('Ocorreu um erro ao conectar com o Google. Tente novamente.');
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 p-6 relative overflow-hidden">
      {/* Video Background Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950">
        <video
          autoPlay
          loop
          muted
          playsInline
          src="/bg-video.mp4?v=2"
          onError={(e) => {
            console.error("Erro ao carregar o vídeo local:", e);
            e.currentTarget.style.display = 'none'; // se falhar, esconde o video e mostra o fundo azul da div
          }}
          className="absolute inset-0 w-full h-full object-cover saturate-[1.5] contrast-[1.1] brightness-[1.05] scale-[1.15]"
        />
        {/* Gradient overlay to further obscure edges and improve text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/20"></div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-end max-w-sm mx-auto w-full pb-6 pt-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <Logo className="w-48 h-48 mb-4" />
        <p className="text-slate-200 text-center mb-6 text-sm leading-relaxed font-medium drop-shadow-md">
          Sua comunidade mais segura. Junte-se a milhares de guardiões.
        </p>

        {error && (
          <div className="w-full mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800 text-sm">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {message && (
          <div className="w-full mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-start gap-3 text-green-800 text-sm">
            <Shield size={18} className="mt-0.5 flex-shrink-0" />
            <p>{message}</p>
          </div>
        )}

        <div className="w-full mt-2 flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-slate-700 bg-white hover:bg-slate-50 transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-lg"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
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
          
          <p className="mt-4 text-xs text-slate-200 text-center max-w-[250px] drop-shadow-lg font-medium">
            Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade.
          </p>
        </div>
      </div>
    </div>
  );
}
