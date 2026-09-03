import React, { useState, useCallback, useRef, useEffect } from 'react';
import Map, { Source, Layer, Marker, MapRef } from 'react-map-gl/mapbox';
import { Search, Filter, ShieldAlert, Navigation, Building2, Landmark, Coffee, Train, LocateFixed, X, AlertCircle, ThumbsUp, Moon, ShieldCheck, Share2, MapPin } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, onSnapshot, limit, orderBy, doc, updateDoc, arrayUnion, increment, addDoc, serverTimestamp, getDoc, getDocs, writeBatch } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { useAuth } from '../contexts/AuthContext';
import { SOSModal } from '../components/SOSModal';
import { PanicModeOverlay } from '../components/PanicModeOverlay';
import { GuardianModeOverlay } from '../components/GuardianModeOverlay';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

const colorStyles: Record<string, string> = {
  roubo: "border-red-400 text-red-400 shadow-[0_0_15px_rgba(248,113,113,0.6)]",
  suspeito: "border-orange-400 text-orange-400 shadow-[0_0_15px_rgba(251,146,60,0.6)]",
  vandalismo: "border-yellow-400 text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]",
  outro: "border-slate-400 text-slate-400 shadow-[0_0_15px_rgba(148,163,184,0.6)]",
};

export function MapPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { isRecording, startRecording } = useAudioRecorder();
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [riskZones, setRiskZones] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [isPanicMode, setIsPanicMode] = useState(false);
  const [isGuardianMode, setIsGuardianMode] = useState(false);
  const [sosModalData, setSosModalData] = useState<{ isOpen: boolean; contacts: any[]; location: any | null }>({ isOpen: false, contacts: [], location: null });

  const mapRef = useRef<MapRef>(null);
  const initialCenterDone = useRef(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocalização não é suportada pelo seu navegador.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Only center on user if there's no shared report to center on
        const hasSharedReport = new URLSearchParams(window.location.search).get('reportId');
        if (!initialCenterDone.current && mapRef.current && !hasSharedReport) {
          mapRef.current.flyTo({
            center: [longitude, latitude],
            zoom: 16,
            pitch: 0,
            bearing: 0,
            duration: 2000,
            essential: true
          });
          initialCenterDone.current = true;
        }

        try {
          sessionStorage.setItem('lastKnownLocation', JSON.stringify({ lat: latitude, lng: longitude }));
        } catch (e) {}

        setUserLocation(prev => {
          if (!prev) return { lat: latitude, lng: longitude };
          
          const R = 6371e3;
          const p1 = prev.lat * Math.PI/180;
          const p2 = latitude * Math.PI/180;
          const dp = (latitude-prev.lat) * Math.PI/180;
          const dl = (longitude-prev.lng) * Math.PI/180;
          const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const d = R * c;
          
          if (d > 5) return { lat: latitude, lng: longitude };
          return prev;
        });
      },
      (error) => {
        console.warn(`Geolocation error ${error.code}: ${error.message}`);
        let errorMessage = 'Erro desconhecido ao buscar localização.';
        if (error.code === 1) errorMessage = 'Permissão negada. Autorize o uso do GPS.';
        if (error.code === 2) errorMessage = 'Sinal de GPS indisponível no momento.';
        if (error.code === 3) errorMessage = 'Tempo limite excedido ao buscar GPS.';
        setGeoError(errorMessage);
        setTimeout(() => setGeoError(null), 6000);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribeReports = onSnapshot(q, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }));
      setReports(reportsData);
      
      // Check for shared report in URL
      const sharedReportId = searchParams.get('reportId');
      if (sharedReportId) {
        const sharedReport = reportsData.find(r => r.id === sharedReportId);
        if (sharedReport) {
          setSelectedLocation(sharedReport);
          if (mapRef.current) {
            mapRef.current.flyTo({
              center: [sharedReport.location.lng, sharedReport.location.lat],
              zoom: 16,
              duration: 1500,
              essential: true
            });
            initialCenterDone.current = true;
            // Remove the parameter from URL without reloading
            searchParams.delete('reportId');
            setSearchParams(searchParams, { replace: true });
          }
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reports');
    });

    const qZones = query(collection(db, 'risk_zones'), limit(500));
    const unsubscribeZones = onSnapshot(qZones, (snapshot) => {
      const zonesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }));
      setRiskZones(zonesData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'risk_zones');
    });

    return () => {
      unsubscribeReports();
      unsubscribeZones();
    };
  }, []);

  const filteredReports = React.useMemo(() => {
    if (!activeFilter) return reports;
    return reports.filter(report => report.type === activeFilter);
  }, [reports, activeFilter]);

  // Use real data from Firestore for the heatmap
  const heatmapData = React.useMemo(() => {
    let features: any[] = [];
    
    if (riskZones.length > 0) {
      features = riskZones.map(zone => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [zone.location.lng, zone.location.lat] },
        properties: { intensity: zone.intensity || 0.8 }
      }));
    } else {
      // Fallback to reports data if no risk zones are defined
      features = reports.map(report => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [report.location.lng, report.location.lat] },
        properties: { intensity: report.upvotes ? 0.5 + (Math.min(report.upvotes, 10) / 20) : 0.5 }
      }));
    }

    return { type: 'FeatureCollection', features };
  }, [riskZones, reports]);

  const triggerGPS = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 16,
        pitch: 0,
        bearing: 0,
        duration: 1500,
        essential: true
      });
    } else {
      setGeoError("Buscando localização... Certifique-se de que o GPS está ativado.");
      setTimeout(() => setGeoError(null), 4000);
    }
  };

  const onMapLoad = useCallback(() => {
    setIsMapLoaded(true);
    
    // Check if we have a shared report to center on
    const sharedReportId = searchParams.get('reportId');
    if (sharedReportId) {
      if (reports.length > 0) {
        const sharedReport = reports.find(r => r.id === sharedReportId);
        if (sharedReport && mapRef.current) {
          setSelectedLocation(sharedReport);
          mapRef.current.flyTo({
            center: [sharedReport.location.lng, sharedReport.location.lat],
            zoom: 16,
            pitch: 0,
            bearing: 0,
            duration: 2000,
            essential: true
          });
          initialCenterDone.current = true;
          searchParams.delete('reportId');
          setSearchParams(searchParams, { replace: true });
        }
      }
      return; // Don't center on user location if we're waiting for a report to load
    }

    if (userLocation && mapRef.current && !initialCenterDone.current) {
      mapRef.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 16,
        pitch: 0,
        bearing: 0,
        duration: 2000,
        essential: true
      });
      initialCenterDone.current = true;
    }
  }, [userLocation, searchParams, reports, setSearchParams]);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const token = MAPBOX_TOKEN;
        if (!token) return;
        const proximity = userLocation ? `&proximity=${userLocation.lng},${userLocation.lat}` : '';
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${token}&country=br${proximity}`);
        const data = await res.json();
        setSearchResults(data.features || []);
      } catch (error) {
        console.error("Error searching places:", error);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  const handleSelectPlace = (place: any) => {
    setSearchQuery(place.place_name);
    setSearchResults([]);
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: place.center,
        zoom: 16,
        duration: 2000,
        essential: true
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchResults.length > 0) {
        handleSelectPlace(searchResults[0]);
      }
    }
  };

  const handleMarkerClick = (report: any) => {
    setSelectedLocation(report);
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [report.location.lng, report.location.lat],
        zoom: 16,
        duration: 1500,
        essential: true
      });
    }
  };

  const handleSOS = async () => {
    console.log('handleSOS started');
    if (!user) {
      console.log('No user, returning');
      setGeoError('Você precisa estar logado para usar o SOS.');
      setTimeout(() => setGeoError(null), 4000);
      return;
    }
    if (!userLocation) {
      console.log('No userLocation, returning');
      setGeoError('Localização não disponível. Tente novamente em instantes.');
      setTimeout(() => setGeoError(null), 4000);
      return;
    }

    console.log('Setting isSOSActive to true');
    setIsSOSActive(true);
    try {
      const alertData = {
        userId: user.uid,
        location: {
          lat: userLocation.lat,
          lng: userLocation.lng
        },
        status: 'active',
        createdAt: serverTimestamp()
      };
      
      console.log('Calling addDoc for emergencyAlerts');
      const docRef = await addDoc(collection(db, 'emergencyAlerts'), alertData);
      console.log('addDoc successful, docRef:', docRef.id);
      
      // Start audio recording asynchronously
      console.log('Starting audio recording');
      startRecording(10000).then(async (audioBase64) => {
        if (audioBase64) {
          console.log('Audio recording finished, updating doc');
          await updateDoc(docRef, { audioData: audioBase64 });
        }
      }).catch(e => console.log('Audio recording skipped/failed', e));
      
      console.log('Calling getDoc for user');
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      console.log('getDoc successful');
      const trustedContacts = userDoc.data()?.trustedContacts || [];
      
      console.log('Setting sosModalData');
      setSosModalData({
        isOpen: true,
        contacts: trustedContacts,
        location: userLocation
      });
      
    } catch (error) {
      console.error('Error in handleSOS:', error);
      setGeoError('Erro ao enviar SOS. Tente novamente.');
      setTimeout(() => setGeoError(null), 4000);
      try {
        handleFirestoreError(error, OperationType.CREATE, 'emergencyAlerts');
      } catch (e) {
        // Prevent crash
      }
    } finally {
      console.log('In finally block, setting isSOSActive to false');
      setIsSOSActive(false);
    }
  };

  const handleUpvote = async (reportId: string) => {
    if (!user) {
      alert('Você precisa estar logado para confirmar uma ocorrência.');
      return;
    }
    
    try {
      const reportRef = doc(db, 'reports', reportId);
      
      if (selectedLocation?.upvotedBy?.includes(user.uid)) {
        // Remove upvote
        const upvotedBy = selectedLocation.upvotedBy.filter(id => id !== user.uid);
        await updateDoc(reportRef, {
          upvotes: Math.max(0, (selectedLocation.upvotes || 1) - 1),
          upvotedBy: upvotedBy
        });
        
        // Remove points from user
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          points: increment(-2)
        });

        // Update local state to reflect immediately
        setSelectedLocation(prev => prev ? {
          ...prev,
          upvotes: Math.max(0, (prev.upvotes || 1) - 1),
          upvotedBy: upvotedBy
        } : null);
      } else {
        // Add upvote
        await updateDoc(reportRef, {
          upvotes: increment(1),
          upvotedBy: arrayUnion(user.uid)
        });
        
        // Add points to user
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          points: increment(2)
        });

        // Update local state to reflect immediately
        setSelectedLocation(prev => prev ? {
          ...prev,
          upvotes: (prev.upvotes || 0) + 1,
          upvotedBy: [...(prev.upvotedBy || []), user.uid]
        } : null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `reports/${reportId}`);
    }
  };

  const handleShareLocation = async () => {
    if (!selectedLocation) return;
    
    const url = `${window.location.origin}/?reportId=${selectedLocation.id}`;
    const title = selectedLocation.location.address || getLabel(selectedLocation.type);
    const text = `Alerta Criminal: ${title}. Nível de risco: ${getRiskLevel(selectedLocation.type)}. Veja os detalhes no aplicativo:`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Alerta Criminal',
          text: text,
          url: url,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(`${text} ${url}`);
      alert('Link copiado para a área de transferência!');
    }
  };

  const getRiskLevel = (type: string) => {
    switch (type) {
      case 'roubo': return 'Crítico';
      case 'suspeito': return 'Alto';
      case 'vandalismo': return 'Médio';
      default: return 'Baixo';
    }
  };

  const getLabel = (type: string) => {
    switch (type) {
      case 'roubo': return 'Roubo/Furto';
      case 'suspeito': return 'Atividade Suspeita';
      case 'vandalismo': return 'Vandalismo';
      default: return 'Outro';
    }
  };

  const markers = React.useMemo(() => {
    const now = new Date().getTime();

    return filteredReports.map((report) => {
      const isSelected = selectedLocation?.id === report.id;
      const colorClass = colorStyles[report.type] || colorStyles['outro'];
      
      // Temporal Decay Logic
      const reportTime = report.createdAt?.toMillis ? report.createdAt.toMillis() : now;
      const ageInHours = (now - reportTime) / (1000 * 60 * 60);
      
      let opacityClass = 'opacity-100';
      let pulseClass = '';
      let scaleClass = isSelected ? 'scale-125' : 'hover:scale-110';

      if (ageInHours > 24) {
        // Older than 24h: Very faded, no pulse, smaller
        opacityClass = 'opacity-40 grayscale';
        pulseClass = '';
        scaleClass = isSelected ? 'scale-110' : 'scale-90 hover:scale-100';
      } else if (ageInHours > 2) {
        // 2 to 24h: Slightly faded, no pulse
        opacityClass = 'opacity-80';
        pulseClass = '';
      }

      return (
        <Marker 
          key={report.id} 
          longitude={report.location.lng} 
          latitude={report.location.lat} 
          anchor="bottom"
          onClick={e => {
            e.originalEvent.stopPropagation();
            handleMarkerClick(report);
          }}
        >
          <div 
            className={`flex flex-col items-center cursor-pointer transition-all duration-500 ${scaleClass} ${opacityClass}`}
          >
            <div className={`w-10 h-10 bg-gray-900 rounded-full border-2 flex items-center justify-center ${colorClass} ${pulseClass}`}>
              <AlertCircle size={18} />
            </div>
            <span className="mt-1.5 text-[10px] font-medium text-gray-200 drop-shadow-md bg-gray-900 px-2 py-0.5 rounded-md border border-gray-700">
              {getLabel(report.type)}
            </span>
          </div>
        </Marker>
      );
    });
  }, [filteredReports, selectedLocation]);

  return (
    <div className="relative w-full h-full bg-slate-900">
      {/* Search Bar Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 z-10 flex gap-3 mt-2">
        <div className="flex-1 relative">
          <div className="bg-slate-900/95 rounded-2xl shadow-lg flex items-center px-4 py-3 border border-slate-700/50 transition-all focus-within:border-blue-500/50 focus-within:bg-slate-900">
            <Search size={20} className="text-blue-400 mr-3" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={handleSearchInput}
              onKeyDown={handleKeyDown}
              placeholder="Buscar local ou endereço..." 
              className="flex-1 outline-none bg-transparent text-sm text-slate-100 placeholder-slate-400 font-medium"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="text-slate-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {(searchResults.length > 0 || (searchQuery.length > 3 && !isSearching && searchResults.length === 0)) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 max-h-60 overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map((place) => (
                  <button
                    key={place.id}
                    onClick={() => handleSelectPlace(place)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-800 border-b border-slate-800 last:border-0 flex items-start gap-3 transition-colors"
                  >
                    <MapPin size={18} className="text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-white line-clamp-1">{place.text}</p>
                      <p className="text-xs text-slate-400 line-clamp-1">{place.place_name}</p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-4 text-center">
                  <p className="text-sm text-slate-300">Nenhum local encontrado.</p>
                  <p className="text-xs text-slate-500 mt-1">Tente simplificar a busca (ex: apenas rua e cidade).</p>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`bg-slate-900/95 p-3 rounded-2xl shadow-lg transition-colors border flex items-center justify-center ${activeFilter ? 'text-blue-400 border-blue-500/50' : 'text-slate-400 border-slate-700/50 hover:bg-slate-800'}`}
          >
            <Filter size={20} />
          </button>
          
          {showFilters && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-slate-900 rounded-xl shadow-xl border border-slate-700/50 overflow-hidden z-50 animate-fade-in">
              <div className="p-2 space-y-1">
                <button
                  onClick={() => { setActiveFilter(null); setShowFilters(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!activeFilter ? 'bg-blue-500/20 text-blue-400' : 'text-slate-300 hover:bg-slate-800'}`}
                >
                  Todos os Alertas
                </button>
                <button
                  onClick={() => { setActiveFilter('roubo'); setShowFilters(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeFilter === 'roubo' ? 'bg-red-500/20 text-red-400' : 'text-slate-300 hover:bg-slate-800'}`}
                >
                  Roubo/Furto
                </button>
                <button
                  onClick={() => { setActiveFilter('suspeito'); setShowFilters(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeFilter === 'suspeito' ? 'bg-orange-500/20 text-orange-400' : 'text-slate-300 hover:bg-slate-800'}`}
                >
                  Atividade Suspeita
                </button>
                <button
                  onClick={() => { setActiveFilter('vandalismo'); setShowFilters(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeFilter === 'vandalismo' ? 'bg-yellow-500/20 text-yellow-400' : 'text-slate-300 hover:bg-slate-800'}`}
                >
                  Vandalismo
                </button>
                <button
                  onClick={() => { setActiveFilter('outro'); setShowFilters(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeFilter === 'outro' ? 'bg-slate-500/20 text-slate-400' : 'text-slate-300 hover:bg-slate-800'}`}
                >
                  Outro
                </button>
                <div className="h-px w-full bg-slate-700/50 my-1" />
                <button
                  onClick={() => { setShowHeatmap(!showHeatmap); setShowFilters(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${showHeatmap ? 'bg-purple-500/20 text-purple-400' : 'text-slate-300 hover:bg-slate-800'}`}
                >
                  <span>Mapa de Calor</span>
                  <div className={`w-8 h-4 rounded-full transition-colors relative ${showHeatmap ? 'bg-purple-500' : 'bg-slate-600'}`}>
                    <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${showHeatmap ? 'translate-x-4.5 left-0.5' : 'left-0.5'}`} />
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Toast */}
      {geoError && (
        <div className="absolute top-20 left-4 right-4 z-50 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md animate-fade-in">
          <p className="font-bold">Erro de GPS</p>
          <p className="text-sm">{geoError}</p>
        </div>
      )}

      {/* Map */}
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: userLocation?.lng || -46.6333,
          latitude: userLocation?.lat || -23.5505,
          zoom: 15.5,
          pitch: 0,
          bearing: 0
        }}
        onLoad={onMapLoad}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        onError={(e) => console.warn('Mapbox warning:', e.error?.message || e)}
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

        {isMapLoaded && showHeatmap && (
          <>
            <Source type="geojson" data={heatmapData as any}>
              <Layer
                id="heatmap-layer"
                type="heatmap"
                paint={{
                  'heatmap-weight': ['get', 'intensity'],
                  'heatmap-intensity': 1,
                  'heatmap-color': [
                    'interpolate',
                    ['linear'],
                    ['heatmap-density'],
                    0, 'rgba(0,0,0,0)',
                    0.2, 'rgba(220,38,38,0.2)', // red-600
                    0.4, 'rgba(239,68,68,0.4)', // red-500
                    0.6, 'rgba(248,113,113,0.6)', // red-400
                    0.8, 'rgba(252,165,165,0.8)', // red-300
                    1, 'rgba(254,226,226,1)'    // red-100
                  ],
                  'heatmap-radius': 45,
                  'heatmap-opacity': 0.6
                }}
              />
            </Source>
          </>
        )}

        {/* Custom Glowing Markers */}
        {markers}
      </Map>

      {/* Floating Action Buttons */}
      <div className={`absolute right-4 flex flex-col gap-3 z-30 items-center transition-all duration-300 ${selectedLocation ? 'bottom-[280px]' : 'bottom-[100px]'}`}>
        <button 
          onClick={() => setIsGuardianMode(true)}
          className="bg-blue-600 text-white p-3.5 rounded-2xl shadow-lg border border-blue-400/30 hover:bg-blue-500 transition-all active:scale-95 flex items-center justify-center"
          aria-label="Meu Guardião"
          title="Meu Guardião (Acompanhamento)"
        >
          <ShieldCheck size={24} />
        </button>
        <button 
          onClick={() => setIsPanicMode(true)}
          className="bg-slate-900 text-slate-400 p-3.5 rounded-2xl shadow-lg border border-slate-700/50 hover:bg-slate-800 hover:text-white transition-all active:scale-95 flex items-center justify-center"
          aria-label="Modo Pânico (Tela Escura)"
          title="Modo Pânico (Tela Escura)"
        >
          <Moon size={24} />
        </button>
        <button 
          onClick={handleSOS}
          disabled={isSOSActive}
          className={`bg-red-600 text-white p-2 rounded-2xl shadow-lg border border-red-400/30 hover:bg-red-500 transition-all active:scale-95 flex flex-col items-center justify-center min-w-[52px] min-h-[52px] ${isSOSActive ? 'opacity-50 cursor-not-allowed' : 'animate-pulse'}`}
          aria-label="SOS Emergência"
        >
          <ShieldAlert size={20} />
          <span className="text-[10px] font-black leading-none mt-1">S.O.S</span>
        </button>
        <button 
          onClick={triggerGPS}
          className="bg-slate-900 text-blue-400 p-3.5 rounded-2xl shadow-lg border border-slate-700/50 hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center"
          aria-label="Minha Localização"
        >
          <LocateFixed size={24} />
        </button>
        <button 
          onClick={() => navigate('/route')}
          className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-3.5 rounded-2xl shadow-lg border border-blue-400/30 hover:from-blue-400 hover:to-blue-600 transition-all active:scale-95 flex items-center justify-center"
          aria-label="Nova Rota"
        >
          <Navigation size={24} />
        </button>
      </div>

      <PanicModeOverlay 
        isActive={isPanicMode} 
        onDeactivate={() => setIsPanicMode(false)} 
        onTriggerSOS={() => {
          setIsPanicMode(false);
          handleSOS();
        }} 
      />

      <GuardianModeOverlay 
        isActive={isGuardianMode}
        onDeactivate={() => setIsGuardianMode(false)}
        location={userLocation}
      />

      {/* Bottom Sheet Summary */}
      {selectedLocation && (
        <div className="absolute bottom-0 left-0 right-0 bg-slate-950 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] p-6 pb-6 z-20 transition-transform transform translate-y-0 border-t border-white/10 animate-in slide-in-from-bottom-full">
          <div className="w-12 h-1.5 bg-slate-700/50 rounded-full mx-auto mb-6 cursor-pointer" onClick={() => setSelectedLocation(null)} />
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 pr-4">
              <h2 className="text-xl font-black text-white tracking-tight mb-1 line-clamp-2">{selectedLocation.location.address || getLabel(selectedLocation.type)}</h2>
              <div className="flex items-center gap-3 mt-2">
                <p className="text-sm text-slate-400 font-medium">
                  Risco: <span className={`font-bold drop-shadow-[0_0_8px_rgba(239,68,68,0.5)] ${
                    getRiskLevel(selectedLocation.type) === 'Crítico' ? 'text-red-500' :
                    getRiskLevel(selectedLocation.type) === 'Alto' ? 'text-orange-500' :
                    getRiskLevel(selectedLocation.type) === 'Médio' ? 'text-yellow-500' : 'text-green-500'
                  }`}>{getRiskLevel(selectedLocation.type)}</span>
                </p>
                <div className="w-1 h-1 rounded-full bg-slate-600" />
                <p className="text-sm text-slate-400 font-medium flex items-center gap-1">
                  <ThumbsUp size={14} className={selectedLocation.upvotedBy?.includes(user?.uid) ? 'text-blue-400' : ''} />
                  {selectedLocation.upvotes || 0} confirmaram
                </p>
                {selectedLocation.authorName && (
                  <>
                    <div className="w-1 h-1 rounded-full bg-slate-600" />
                    <p className="text-sm text-slate-400 font-medium">Por: <span className="text-white">{selectedLocation.authorName}</span></p>
                  </>
                )}
              </div>
            </div>
            <div className="bg-slate-900/50 border border-white/5 rounded-xl p-2 text-center min-w-[4rem] shrink-0">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Status</p>
              <p className={`text-sm font-black leading-none ${
                selectedLocation.status === 'verified' ? 'text-green-500' :
                selectedLocation.status === 'pending' ? 'text-yellow-500' : 'text-red-500'
              }`}>{selectedLocation.status === 'verified' ? 'Verificado' : selectedLocation.status === 'pending' ? 'Pendente' : 'Falso'}</p>
            </div>
          </div>
          
          {selectedLocation.description && (
            <p className="text-sm text-slate-300 mb-4 italic border-l-2 border-slate-600 pl-3">"{selectedLocation.description}"</p>
          )}

          {selectedLocation.attachments && selectedLocation.attachments.length > 0 && (
            <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
              {selectedLocation.attachments.map((attachment: any, index: number) => {
                const isObject = typeof attachment === 'object' && attachment !== null;
                const url = isObject ? attachment.url : attachment;
                const type = isObject ? attachment.type : (url.includes('.mp4') || url.includes('video') ? 'video/mp4' : 'image/jpeg');

                return (
                  <div key={index} className="h-20 w-20 shrink-0 rounded-lg overflow-hidden border border-slate-700 cursor-pointer relative" onClick={() => !type.startsWith('video/') && window.open(url, '_blank')}>
                    {type.startsWith('video/') ? (
                      <video src={url} className="w-full h-full object-cover" />
                    ) : (
                      <img src={url} alt="Anexo" className="w-full h-full object-cover" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
            <button 
              onClick={() => navigate(`/route?destination=${encodeURIComponent(selectedLocation.location.address || '')}`)}
              className="flex flex-col items-center gap-2 min-w-[72px]"
            >
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform">
                <Navigation size={20} />
              </div>
              <span className="text-[11px] font-bold text-blue-500">Rotas</span>
            </button>

            <button 
              onClick={() => handleUpvote(selectedLocation.id)}
              className="flex flex-col items-center gap-2 min-w-[72px]"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all duration-300 ${
                selectedLocation.upvotedBy?.includes(user?.uid) 
                  ? 'bg-blue-500 text-white shadow-blue-500/30 border border-blue-400' 
                  : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
              }`}>
                <ThumbsUp size={20} className={selectedLocation.upvotedBy?.includes(user?.uid) ? 'fill-current' : ''} />
              </div>
              <span className={`text-[11px] font-bold ${selectedLocation.upvotedBy?.includes(user?.uid) ? 'text-blue-400' : 'text-slate-300'}`}>
                {selectedLocation.upvotedBy?.includes(user?.uid) ? 'Confirmado' : 'Confirmar'}
              </span>
            </button>

            <button 
              onClick={handleShareLocation}
              className="flex flex-col items-center gap-2 min-w-[72px]"
            >
              <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform">
                <Share2 size={20} />
              </div>
              <span className="text-[11px] font-bold text-slate-300">Compartilhar</span>
            </button>
          </div>
        </div>
      )}

      <SOSModal 
        isOpen={sosModalData.isOpen}
        onClose={() => setSosModalData(prev => ({ ...prev, isOpen: false }))}
        contacts={sosModalData.contacts}
        location={sosModalData.location}
        isRecordingAudio={isRecording}
        onVideoUpload={() => {
          alert('Vídeo anexado com sucesso! (Simulado - Requer Firebase Storage para envio real)');
        }}
      />
    </div>
  );
}
