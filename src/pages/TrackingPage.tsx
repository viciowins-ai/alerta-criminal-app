import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import Map, { Marker, NavigationControl, MapRef } from 'react-map-gl/mapbox';
import { ShieldCheck, AlertTriangle, ArrowLeft, Clock, Navigation } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export function TrackingPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const mapRef = useRef<MapRef>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [displayLocation, setDisplayLocation] = useState<{lat: number, lng: number} | null>(null);
  const isFollowingRef = useRef(true);
  const [isFollowing, setIsFollowing] = useState(true);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!sessionId) {
      setError('Sessão inválida.');
      setLoading(false);
      return;
    }

    const sessionRef = doc(db, 'guardian_sessions', sessionId);
    const unsubscribe = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSessionData(data);
      } else {
        setError('Sessão não encontrada ou expirada.');
      }
      setLoading(false);
    }, (err: any) => {
      console.error('Error fetching session:', err);
      if (err.code === 'permission-denied') {
        setError('Acesso negado. Esta sessão pode ser privada ou as regras de segurança estão bloqueando o acesso.');
      } else {
        setError('Erro ao carregar a sessão de acompanhamento.');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sessionId]);

  useEffect(() => {
    if (!sessionData?.location) return;
    const target = sessionData.location;

    if (!displayLocation) {
      setDisplayLocation(target);
      if (mapRef.current) {
        mapRef.current.jumpTo({ center: [target.lng, target.lat], zoom: 16 });
      }
      return;
    }

    // If jump is too large (>1km), teleport instead of animating
    const R = 6371e3;
    const p1 = displayLocation.lat * Math.PI/180;
    const p2 = target.lat * Math.PI/180;
    const dp = (target.lat-displayLocation.lat) * Math.PI/180;
    const dl = (target.lng-displayLocation.lng) * Math.PI/180;
    const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
    const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    if (distance > 1000) {
      setDisplayLocation(target);
      if (isFollowingRef.current && mapRef.current) {
        mapRef.current.jumpTo({ center: [target.lng, target.lat] });
      }
      return;
    }

    const startLoc = { ...displayLocation };
    const startTime = performance.now();
    const duration = 3800; // Glide over 3.8s (updates are every 4s)

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const lat = startLoc.lat + (target.lat - startLoc.lat) * progress;
      const lng = startLoc.lng + (target.lng - startLoc.lng) * progress;

      setDisplayLocation({ lat, lng });

      if (isFollowingRef.current && mapRef.current) {
        mapRef.current.jumpTo({ center: [lng, lat] });
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [sessionData?.location]);

  const handleMapInteraction = () => {
    if (isFollowingRef.current) {
      isFollowingRef.current = false;
      setIsFollowing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-slate-400">Carregando localização...</p>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-800 p-6 rounded-2xl max-w-sm w-full text-center border border-slate-700">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Sessão Indisponível</h2>
          <p className="text-slate-400 mb-6">{error || 'Esta sessão de acompanhamento não está mais ativa.'}</p>
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Ir para o Início
          </button>
        </div>
      </div>
    );
  }

  const { location, userName, isActive, updatedAt } = sessionData;
  const lastUpdate = updatedAt && typeof updatedAt.toDate === 'function' ? updatedAt.toDate() : new Date();
  const timeAgo = Math.floor((new Date().getTime() - lastUpdate.getTime()) / 60000); // in minutes

  return (
    <div className="h-screen w-full flex flex-col bg-slate-900 relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-slate-900/95 border-b border-slate-800 p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
          <ShieldCheck size={24} className="text-blue-500" />
        </div>
        <div className="flex-1">
          <h1 className="text-white font-bold leading-tight">Acompanhamento</h1>
          <p className="text-slate-400 text-xs">Guardião de {userName}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
          {isActive ? 'Ativo' : 'Encerrado'}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          onError={(e) => console.warn('Mapbox warning:', e.error?.message || e)}
          initialViewState={{
            longitude: displayLocation?.lng || location.lng,
            latitude: displayLocation?.lat || location.lat,
            zoom: 16,
          }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          onDragStart={handleMapInteraction}
          onZoomStart={handleMapInteraction}
        >
          <NavigationControl position="bottom-right" />
          
          {(displayLocation || location) && (
            <Marker
              longitude={displayLocation?.lng || location.lng}
              latitude={displayLocation?.lat || location.lat}
              anchor="center"
            >
              <div className="relative flex items-center justify-center">
                <div className={`absolute w-12 h-12 rounded-full ${isActive ? 'bg-blue-500/30 animate-ping' : 'bg-slate-500/30'}`}></div>
                <div className={`w-6 h-6 rounded-full border-4 border-white shadow-lg z-10 ${isActive ? 'bg-blue-600' : 'bg-slate-600'}`}></div>
              </div>
            </Marker>
          )}
        </Map>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-slate-900/95 border-t border-slate-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock size={16} className="text-slate-400" />
            <span className="text-sm">
              {isActive 
                ? (timeAgo === 0 ? 'Atualizado agora' : `Atualizado há ${timeAgo} min`)
                : 'Sessão encerrada'
              }
            </span>
          </div>
          <button 
            onClick={() => {
              isFollowingRef.current = true;
              setIsFollowing(true);
              if (mapRef.current && displayLocation) {
                mapRef.current.flyTo({
                  center: [displayLocation.lng, displayLocation.lat],
                  zoom: 16,
                  duration: 1000
                });
              }
            }}
            className={`text-sm font-bold flex items-center gap-1 transition-colors ${isFollowing ? 'text-blue-500 cursor-default' : 'text-slate-400 hover:text-blue-400'}`}
          >
            <Navigation size={16} className={isFollowing ? 'fill-current' : ''} />
            {isFollowing ? 'Acompanhando' : 'Centralizar'}
          </button>
        </div>
        
        <button 
          onClick={() => window.location.href = window.location.origin}
          className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors border border-slate-700 flex items-center justify-center gap-2"
        >
          <ShieldCheck size={18} />
          Baixar Alerta Criminal
        </button>
      </div>
    </div>
  );
}
