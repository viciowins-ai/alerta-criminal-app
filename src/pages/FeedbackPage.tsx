import React, { useState } from 'react';
import { TopBar } from '../components/TopBar';
import { Star, MessageSquare, Send, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export function FeedbackPage() {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await addDoc(collection(db, 'feedbacks'), {
        userId: user.uid,
        userName: user.displayName || 'Anônimo',
        rating,
        comment,
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Não foi possível enviar sua avaliação. Verifique sua conexão e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col h-full bg-slate-900">
        <TopBar title="Avaliar Aplicativo" showBack={true} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={48} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Muito Obrigado!</h2>
          <p className="text-slate-400 max-w-xs mx-auto">
            Sua avaliação foi enviada com sucesso. Nós a usaremos para continuar aprimorando o Alerta Criminal para todos!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <TopBar title="Avaliar Aplicativo" showBack={true} />
      
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 rounded-3xl shadow-lg text-white text-center relative overflow-hidden mb-6">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 border-4 border-white/30 shadow-inner">
              <Star size={32} className="text-yellow-300 fill-yellow-300 drop-shadow-md" />
            </div>
            <h2 className="text-xl font-bold mb-2">Ajude a Evoluir</h2>
            <p className="text-indigo-100 text-sm font-medium leading-relaxed max-w-[250px] mx-auto">
              Sua opinião é fundamental para aprimorarmos o Alerta Criminal!
            </p>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-2xl mb-6 text-sm flex items-start gap-3">
            <AlertTriangle className="shrink-0 mt-0.5" size={18} />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-3xl border border-slate-700">
          <div className="mb-6 flex flex-col items-center">
            <label className="block text-sm text-slate-300 mb-3 font-medium">Como você avalia sua experiência?</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 transition-transform hover:scale-110"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star 
                    size={40} 
                    className={`${(hoverRating || rating) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'} transition-colors`} 
                  />
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm text-slate-300 mb-2 font-medium flex items-center gap-2">
              <MessageSquare size={16} /> Deixe um comentário (opcional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="O que você achou do aplicativo? Tem alguma sugestão de melhoria?"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none h-32"
              maxLength={1000}
            />
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <><Send size={20} /> Enviar Avaliação</>}
          </button>
        </form>
      </div>
    </div>
  );
}
