import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TopBar } from '../components/TopBar';
import { MapPin, Camera, Video, CheckCircle2, Siren, Eye, Flame, MoreHorizontal, Send, X, LocateFixed } from 'lucide-react';
import Map, { ViewStateChangeEvent, MapRef, Marker } from 'react-map-gl/mapbox';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

const INCIDENT_TYPES = [
  { id: 'roubo', label: 'Roubo/Furto', icon: <Siren size={24} />, baseColor: 'red' },
  { id: 'suspeito', label: 'Atividade Suspeita', icon: <Eye size={24} />, baseColor: 'orange' },
  { id: 'vandalismo', label: 'Vandalismo', icon: <Flame size={24} />, baseColor: 'yellow' },
  { id: 'outro', label: 'Outro', icon: <MoreHorizontal size={24} />, baseColor: 'slate' },
];

const COLOR_MAP: Record<string, any> = {
  red: { activeBg: 'bg-red-950/40', activeBorder: 'border-red-500/50', activeText: 'text-red-400', activeShadow: 'shadow-[0_0_20px_rgba(239,68,68,0.2)]', iconActiveBg: 'bg-red-500/20', glow: 'from-red-500/0 to-red-500/10' },
  orange: { activeBg: 'bg-orange-950/40', activeBorder: 'border-orange-500/50', activeText: 'text-orange-400', activeShadow: 'shadow-[0_0_20px_rgba(249,115,22,0.2)]', iconActiveBg: 'bg-orange-500/20', glow: 'from-orange-500/0 to-orange-500/10' },
  yellow: { activeBg: 'bg-yellow-950/40', activeBorder: 'border-yellow-500/50', activeText: 'text-yellow-400', activeShadow: 'shadow-[0_0_20px_rgba(234,179,8,0.2)]', iconActiveBg: 'bg-yellow-500/20', glow: 'from-yellow-500/0 to-yellow-500/10' },
  slate: { activeBg: 'bg-slate-800/80', activeBorder: 'border-slate-400/50', activeText: 'text-slate-200', activeShadow: 'shadow-[0_0_20px_rgba(148,163,184,0.2)]', iconActiveBg: 'bg-slate-600/30', glow: 'from-slate-500/0 to-slate-500/10' },
};

export function ReportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.privacySettings && typeof data.privacySettings.anonymousReports === 'boolean') {
            setIsAnonymous(data.privacySettings.anonymousReports);
          }
        }
      } catch (error) {
        console.error("Error fetching user privacy settings", error);
      }
    };
    fetchSettings();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Contextual Suggestion based on time
  useEffect(() => {
    const hour = new Date().getHours();
    // Between 10 PM and 5 AM, suggest 'suspeito' (Suspicious Activity)
    if (hour >= 22 || hour <= 5) {
      setSelectedType('suspeito');
    } else {
      // Otherwise suggest 'roubo' (Robbery/Theft)
      setSelectedType('roubo');
    }
  }, []);

  const lastKnownStr = sessionStorage.getItem('lastKnownLocation');
  const lastKnown = lastKnownStr ? JSON.parse(lastKnownStr) : null;

  const [reportLocation, setReportLocation] = useState({
    longitude: lastKnown ? lastKnown.lng : -46.6333,
    latitude: lastKnown ? lastKnown.lat : -23.5505,
  });
  const [userLocation, setUserLocation] = useState<{lng: number, lat: number} | null>(lastKnown ? {lng: lastKnown.lng, lat: lastKnown.lat} : null);
  const [address, setAddress] = useState('Buscando localização...');
  const [isDragging, setIsDragging] = useState(false);
  const mapRef = useRef<MapRef>(null);
  const [hasInitialLocation, setHasInitialLocation] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const requestLocation = useCallback(() => {
    setIsLocating(true);
    setAddress('Buscando localização...');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          setUserLocation({ lng: longitude, lat: latitude });
          setReportLocation({ longitude, latitude });
          setHasInitialLocation(true);
          mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 16, duration: 2000 });
          fetchAddress(longitude, latitude);
          setIsLocating(false);
        }, 
        (error) => {
          console.error("Error getting location:", error);
          let errorMsg = 'Não foi possível obter sua localização.';
          if (error.code === 1) errorMsg = 'Permissão de GPS negada.';
          if (error.code === 2) errorMsg = 'Sinal de GPS indisponível.';
          if (error.code === 3) errorMsg = 'Tempo limite ao buscar GPS.';
          setAddress(errorMsg);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      setAddress('Geolocalização não suportada pelo navegador.');
      setIsLocating(false);
    }
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const fetchAddress = async (lng: number, lat: number) => {
    try {
      const token = import.meta.env.VITE_MAPBOX_TOKEN;
      if (!token) return;
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&types=address,poi`);
      if (!res.ok) throw new Error('Failed to fetch address from Mapbox');
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        setAddress(data.features[0].place_name);
      } else {
        setAddress('Localização selecionada no mapa');
      }
    } catch (error) {
      setAddress('Localização selecionada no mapa');
    }
  };

  const handleMoveStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMoveEnd = useCallback((evt: ViewStateChangeEvent) => {
    setIsDragging(false);
    setReportLocation({
      longitude: evt.viewState.longitude,
      latitude: evt.viewState.latitude
    });
    fetchAddress(evt.viewState.longitude, evt.viewState.latitude);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !user) return;
    
    if (!navigator.onLine && attachments.length > 0) {
      alert("⚠️ Você está sem conexão com a internet.\n\nO aplicativo não consegue enviar fotos e vídeos no modo offline. Por favor, remova as mídias para enviar apenas o texto, ou aguarde até ter sinal (3G/4G/Wi-Fi) para relatar com imagens.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const attachmentData: {url: string, type: string}[] = [];
      
      // Upload attachments
      for (const file of attachments) {
        const fileRef = ref(storage, `reports/${user.uid}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(fileRef, file);
        
        await new Promise<void>((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
              console.log('Upload is ' + progress + '% done');
            }, 
            (error) => {
              reject(error);
            }, 
            async () => {
              try {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                attachmentData.push({ url, type: file.type });
                resolve();
              } catch (err) {
                reject(err);
              }
            }
          );
        });
      }

      const reportPayload: any = {
        authorId: user.uid,
        isAnonymous: isAnonymous,
        authorName: isAnonymous ? 'Morador Anônimo' : (user.displayName || 'Usuário'),
        type: selectedType,
        location: {
          lat: reportLocation.latitude,
          lng: reportLocation.longitude,
          address: address
        },
        status: 'pending',
        upvotes: 0,
        upvotedBy: [],
        createdAt: serverTimestamp()
      };
      
      if (description.trim() !== '') {
        reportPayload.description = description.trim();
      }
      
      if (attachmentData.length > 0) {
        reportPayload.attachments = attachmentData;
      }

      await addDoc(collection(db, 'reports'), reportPayload);

      // Add points to user - non-blocking
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          points: increment(10)
        });
      } catch (pointsError) {
        console.warn("Could not update user points:", pointsError);
      }
      
      setIsSubmitting(false);
      setIsSuccess(true);
      setUploadProgress(0);
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      console.error("DEBUG ERROR:", error);
      if (error instanceof Error) {
        alert("Erro no upload: " + error.message);
      } else {
        alert("Erro desconhecido: " + JSON.stringify(error));
      }
      setIsSubmitting(false);
      setUploadProgress(0);
      handleFirestoreError(error, OperationType.CREATE, 'reports');
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-900 p-6">
        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <CheckCircle2 size={40} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 text-center">Ocorrência Reportada!</h2>
        <p className="text-slate-400 text-center mb-8">Obrigado por contribuir com a segurança da comunidade.</p>
        <button 
          onClick={() => navigate('/')}
          className="w-full bg-blue-600 text-white font-semibold py-4 rounded-xl hover:bg-blue-700 transition-colors"
        >
          Voltar ao Mapa
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <TopBar title="Reportar Ocorrência" />
      
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        {/* Location Selection */}
        <div className="bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <MapPin size={18} className="text-blue-400" />
              Localização Exata
            </h3>
            <button 
              type="button"
              onClick={requestLocation}
              disabled={isLocating}
              className={`text-xs flex items-center gap-1 px-2 py-1 rounded-lg border transition-colors ${
                isLocating 
                  ? 'bg-slate-700 text-slate-400 border-slate-600 cursor-not-allowed' 
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20'
              }`}
            >
              <LocateFixed size={14} className={isLocating ? 'animate-spin' : ''} />
              {isLocating ? 'Buscando...' : 'Meu Local'}
            </button>
          </div>
          <div className="h-80 bg-slate-900 rounded-xl relative overflow-hidden mb-3 border border-slate-700">
            <Map
              ref={mapRef}
              initialViewState={{
                longitude: reportLocation.longitude,
                latitude: reportLocation.latitude,
                zoom: 16,
                pitch: 0,
                bearing: 0
              }}
              onMoveStart={handleMoveStart}
              onMoveEnd={handleMoveEnd}
              mapStyle="mapbox://styles/mapbox/streets-v12"
              mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
            >
              {/* Custom User Location Marker */}
              {userLocation && (
                <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-12 h-12 bg-blue-500/30 rounded-full animate-ping" />
                    <div className="relative w-5 h-5 bg-blue-500 border-[3px] border-white rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
                  </div>
                </Marker>
              )}
            </Map>
            {/* Center Pin Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className={`flex flex-col items-center transform transition-transform ${isDragging ? '-translate-y-8' : '-translate-y-1/2'}`}>
                <MapPin size={36} className="text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                <div className="w-2.5 h-2.5 bg-red-900/60 rounded-full -mt-1.5 animate-ping" />
              </div>
            </div>
            {/* Instruction Overlay */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
              <div className="bg-slate-900/95 text-white text-xs px-4 py-2 rounded-full shadow-lg border border-slate-700">
                Arraste o mapa para ajustar o local
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-300 truncate">{address}</p>
        </div>

        {/* Incident Type */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Tipo de Ocorrência</h3>
          <div className="grid grid-cols-2 gap-3">
            {INCIDENT_TYPES.map(type => {
              const isSelected = selectedType === type.id;
              const colors = COLOR_MAP[type.baseColor];
              
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type.id)}
                  className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-300 ease-out overflow-hidden group ${
                    isSelected 
                      ? `${colors.activeBg} ${colors.activeBorder} ${colors.activeShadow} scale-[1.02]` 
                      : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600 hover:-translate-y-1'
                  }`}
                >
                  {isSelected && (
                    <div className={`absolute inset-0 opacity-50 bg-gradient-to-b ${colors.glow}`} />
                  )}
                  
                  <div className={`p-3 rounded-full mb-3 transition-colors duration-300 relative z-10 ${
                    isSelected ? `${colors.iconActiveBg} ${colors.activeText}` : 'bg-slate-900/50 text-slate-400 group-hover:text-slate-300'
                  }`}>
                    {type.icon}
                  </div>
                  <span className={`text-sm font-bold relative z-10 transition-colors duration-300 ${
                    isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}>
                    {type.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Descrição (Opcional)</h3>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Forneça mais detalhes sobre o que aconteceu..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-28"
          />
        </div>

        {/* Attachments */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Anexos (Opcional)</h3>
          <div className="flex gap-3">
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              multiple
            />
            <input 
              type="file" 
              accept="video/*" 
              capture="environment" 
              ref={videoInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              multiple
            />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 bg-slate-800/50 border border-dashed border-slate-600 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-700/80 hover:border-slate-500 transition-all group">
              <div className="p-3 bg-slate-900/50 rounded-full group-hover:bg-slate-800 transition-colors">
                <Camera size={22} className="text-slate-400 group-hover:text-blue-400 transition-colors" />
              </div>
              <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-300">Tirar Foto</span>
            </button>
            <button type="button" onClick={() => videoInputRef.current?.click()} className="flex-1 bg-slate-800/50 border border-dashed border-slate-600 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-700/80 hover:border-slate-500 transition-all group">
              <div className="p-3 bg-slate-900/50 rounded-full group-hover:bg-slate-800 transition-colors">
                <Video size={22} className="text-slate-400 group-hover:text-blue-400 transition-colors" />
              </div>
              <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-300">Gravar Vídeo</span>
            </button>
          </div>
          
          {attachments.length > 0 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {attachments.map((file, index) => (
                <div key={index} className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-slate-700">
                  {file.type.startsWith('image/') ? (
                    <img src={URL.createObjectURL(file)} alt="attachment" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                      <Video size={24} className="text-slate-500" />
                    </div>
                  )}
                  <button 
                    type="button" 
                    onClick={() => removeAttachment(index)}
                    className="absolute top-1 right-1 bg-black/50 rounded-full p-1 hover:bg-red-500/80 transition-colors"
                  >
                    <X size={14} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="mt-auto pt-6 flex flex-col gap-4">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between cursor-pointer" onClick={() => setIsAnonymous(!isAnonymous)}>
            <div>
              <p className="font-bold text-white text-sm">Ocultar minha identidade (Modo Fantasma)</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">Você aparecerá como "Morador Anônimo" no feed.</p>
            </div>
            <button 
              type="button"
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${isAnonymous ? 'bg-blue-500' : 'bg-slate-600'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${isAnonymous ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <button
            type="submit"
            disabled={!selectedType || isSubmitting}
            className={`group relative w-full py-4 rounded-2xl font-bold text-white transition-all duration-300 overflow-hidden ${
              !selectedType || isSubmitting
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] shadow-[0_0_20px_rgba(79,70,229,0.4)] border border-blue-400/30'
            }`}
          >
            {selectedType && !isSubmitting && (
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 transition-transform duration-1000 group-hover:translate-x-[200%]" />
            )}
            <span className="relative z-10 flex flex-col items-center justify-center gap-1">
              {isSubmitting ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="animate-pulse">Enviando...</span>
                  </div>
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="w-full max-w-[200px] h-1.5 bg-slate-700 rounded-full overflow-hidden mt-1">
                      <div 
                        className="h-full bg-blue-400 transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Send size={20} />
                  Enviar Alerta de Segurança
                </div>
              )}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
