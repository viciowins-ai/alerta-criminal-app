import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import Map, { Marker, NavigationControl, MapRef } from 'react-map-gl/mapbox';
import { ShieldAlert, PhoneCall, MapPin, Volume2, Download, AlertTriangle, ArrowLeft, ExternalLink, Play, Pause } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export function SosAlertPage() {
  const { alertId } = useParams<{ alertId: string }>();
  const navigate = useNavigate();
  const mapRef = useRef<MapRef>(null);

  const [alertData, setAlertData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!alertId) {
      setError('Alerta de emergência inválido ou não informado.');
      setLoading(false);
      return;
    }

    const alertRef = doc(db, 'emergencyAlerts', alertId);
    const unsubscribe = onSnapshot(alertRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAlertData(data);
      } else {
        setError('Alerta de emergência não encontrado ou já expirado.');
      }
      setLoading(false);
    }, (err) => {
      console.error('Erro ao buscar alerta SOS:', err);
      setError('Erro ao carregar o alerta de emergência.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [alertId]);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error('Erro ao tocar áudio:', err);
      });
    }
  };

  const handleDownloadAudio = () => {
    if (!alertData?.audioData) return;
    try {
      const link = document.createElement('a');
      link.href = alertData.audioData;
      const dateStr = alertData.createdAt?.toDate ? format(alertData.createdAt.toDate(), "yyyyMMdd-HHmm") : 'sos';
      link.download = `sos-audio-emergencia-${dateStr}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Erro no download:', e);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-6 text-white text-center">
        <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold">Carregando Alerta de Emergência...</h2>
        <p className="text-sm text-slate-400 mt-2">Conectando aos dados de socorro em tempo real.</p>
      </div>
    );
  }

  if (error || !alertData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-6 text-white text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center text-red-400 mb-4 border border-red-500/30">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-2xl font-black mb-2">Aviso de Emergência</h2>
        <p className="text-slate-300 max-w-md mb-6">{error || 'Não foi possível encontrar este alerta.'}</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-colors"
        >
          Ir para o Início
        </button>
      </div>
    );
  }

  const { location, createdAt, status, userName } = alertData;
  const dateFormatted = createdAt?.toDate ? format(createdAt.toDate(), "dd 'de' MMMM 'às' HH:mm:ss", { locale: ptBR }) : 'Horário não registrado';
  const googleMapsUrl = location ? `https://maps.google.com/?q=${location.lat},${location.lng}` : null;
  const wazeUrl = location ? `https://waze.com/ul?ll=${location.lat},${location.lng}&navigate=yes` : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Top Header */}
      <header className="bg-red-600/20 border-b border-red-500/30 px-4 py-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/40 animate-pulse">
            <ShieldAlert size={22} />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-wide flex items-center gap-2">
              ALERTA DE EMERGÊNCIA (SOS)
              <span className="text-[10px] bg-red-600 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {status === 'active' ? 'Ativo' : 'Concluído'}
              </span>
            </h1>
            <p className="text-xs text-red-200">
              Enviado para contatos de confiança • Alerta Criminal
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/')}
          className="p-2 text-slate-300 hover:text-white rounded-xl bg-slate-900/60 border border-slate-700/60 transition-colors"
          title="Abrir o Aplicativo"
        >
          <ArrowLeft size={18} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Banner Vítima */}
        <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-wider text-red-400 mb-1">
              Chamado de Socorro
            </p>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {userName || 'Um morador / contato'} pediu socorro!
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Acionado em: <strong className="text-white">{dateFormatted}</strong>
            </p>
          </div>
        </div>

        {/* Audio Player Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/20 text-red-400 rounded-2xl border border-red-500/30">
                <Volume2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Áudio de Emergência Gravado (10s)
                </h3>
                <p className="text-xs text-slate-400">
                  Som ambiente capturado no momento exato do disparo do SOS.
                </p>
              </div>
            </div>
          </div>

          {alertData.audioData ? (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={toggleAudio}
                  className="w-12 h-12 rounded-2xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-transform active:scale-95 shadow-lg shadow-red-600/30 shrink-0"
                  aria-label={isPlaying ? 'Pausar áudio' : 'Tocar áudio'}
                >
                  {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
                </button>
                <div className="flex-1">
                  <p className="text-xs font-bold text-white">
                    {isPlaying ? 'Reproduzindo áudio do local...' : 'Clique para ouvir o áudio'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Formato WebM de Alta Fidelidade (10 segundos)
                  </p>
                  <audio
                    ref={audioRef}
                    src={alertData.audioData}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />
                </div>
              </div>

              <button
                onClick={handleDownloadAudio}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-colors border border-slate-700 shrink-0"
              >
                <Download size={16} />
                Baixar Arquivo (.webm)
              </button>
            </div>
          ) : (
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-center">
              <p className="text-xs text-slate-400 italic">
                {status === 'active'
                  ? 'Processando áudio gravado... Caso o microfone tenha sido desautorizado, o áudio pode não estar disponível.'
                  : 'Nenhuma gravação de áudio disponível para este chamado.'}
              </p>
            </div>
          )}
        </div>

        {/* Botões de Ação Rápida de Socorro */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="tel:190"
            className="flex items-center justify-center gap-3 p-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-base shadow-xl shadow-red-600/30 transition-transform active:scale-98"
          >
            <PhoneCall size={22} />
            LIGAR PARA POLÍCIA (190)
          </a>
          <a
            href="tel:192"
            className="flex items-center justify-center gap-3 p-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black text-base shadow-xl shadow-orange-600/30 transition-transform active:scale-98"
          >
            <PhoneCall size={22} />
            LIGAR PARA SAMU (192)
          </a>
        </div>

        {/* Mapa e Localização */}
        {location && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={20} className="text-red-400" />
                <h3 className="text-base font-bold text-white">Localização do Alerta</h3>
              </div>
              <span className="text-xs text-slate-400">
                {location.lat?.toFixed(5)}, {location.lng?.toFixed(5)}
              </span>
            </div>

            <div className="h-64 w-full rounded-2xl overflow-hidden border border-slate-800 relative">
              {MAPBOX_TOKEN ? (
                <Map
                  ref={mapRef}
                  initialViewState={{
                    latitude: location.lat,
                    longitude: location.lng,
                    zoom: 15,
                  }}
                  mapStyle="mapbox://styles/mapbox/dark-v11"
                  mapboxAccessToken={MAPBOX_TOKEN}
                  style={{ width: '100%', height: '100%' }}
                >
                  <NavigationControl position="top-right" showCompass={false} />
                  <Marker latitude={location.lat} longitude={location.lng} anchor="center">
                    <div className="relative flex items-center justify-center">
                      <div className="w-10 h-10 bg-red-500/40 rounded-full animate-ping absolute" />
                      <div className="w-8 h-8 bg-red-600 border-2 border-white rounded-full flex items-center justify-center shadow-lg text-white">
                        <ShieldAlert size={16} />
                      </div>
                    </div>
                  </Marker>
                </Map>
              ) : (
                <div className="flex items-center justify-center h-full bg-slate-950 text-slate-400 text-sm">
                  Coordenadas: {location.lat}, {location.lng}
                </div>
              )}
            </div>

            {/* Rotas Externas */}
            <div className="flex flex-wrap gap-2 pt-1">
              {googleMapsUrl && (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors border border-slate-700"
                >
                  <ExternalLink size={14} />
                  Abrir no Google Maps
                </a>
              )}
              {wazeUrl && (
                <a
                  href={wazeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors border border-slate-700"
                >
                  <ExternalLink size={14} />
                  Abrir no Waze
                </a>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-slate-500 border-t border-slate-900 mt-auto">
        Alerta Criminal • Rede de Segurança Comunitária e Proteção Mútua
      </footer>
    </div>
  );
}
