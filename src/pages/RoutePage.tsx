import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TopBar } from '../components/TopBar';
import Map, { Source, Layer, Marker, MapRef } from 'react-map-gl/mapbox';
import { Navigation, MapPin, ShieldCheck, AlertTriangle, LocateFixed, Search, X, Loader2, AlertCircle, ShieldAlert, Moon, Lock, Star } from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDoc, doc, updateDoc, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { SOSModal } from '../components/SOSModal';
import { PanicModeOverlay } from '../components/PanicModeOverlay';
import { useNavigate } from 'react-router-dom';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

const colorStyles: Record<string, string> = {
  roubo: "border-red-400 text-red-400 shadow-[0_0_15px_rgba(248,113,113,0.6)]",
  suspeito: "border-orange-400 text-orange-400 shadow-[0_0_15px_rgba(251,146,60,0.6)]",
  vandalismo: "border-yellow-400 text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]",
  outro: "border-slate-400 text-slate-400 shadow-[0_0_15px_rgba(148,163,184,0.6)]",
};

const getLabel = (type: string) => {
  switch (type) {
    case 'roubo': return 'Roubo/Furto';
    case 'suspeito': return 'Atividade Suspeita';
    case 'vandalismo': return 'Vandalismo';
    default: return 'Outro';
  }
};

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export function RoutePage() {
  const { user } = useAuth();
  const { isRecording, startRecording } = useAudioRecorder();
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [isPanicMode, setIsPanicMode] = useState(false);
  const navigate = useNavigate();
  const [sosModalData, setSosModalData] = useState<{ isOpen: boolean; contacts: any[]; location: any | null }>({ isOpen: false, contacts: [], location: null });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [destination, setDestination] = useState<{lat: number, lng: number, name: string} | null>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [reports, setReports] = useState<any[]>([]);
  const [riskZones, setRiskZones] = useState<any[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  const mapRef = useRef<MapRef>(null);
  const initialCenterDone = useRef(false);
  const skipSearchRef = useRef(false);

  // Fetch active reports and risk zones
  useEffect(() => {
    const q = query(collection(db, 'reports'), where('status', 'in', ['pending', 'verified']));
    const unsubscribeReports = onSnapshot(q, (snapshot) => {
      const reps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReports(reps);
    });

    const qZones = query(collection(db, 'risk_zones'), limit(500));
    const unsubscribeZones = onSnapshot(qZones, (snapshot) => {
      const zones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRiskZones(zones);
    });

    return () => {
      unsubscribeReports();
      unsubscribeZones();
    };
  }, []);

  // Geolocation
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocalização não é suportada pelo seu navegador.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        if (!initialCenterDone.current && mapRef.current) {
          mapRef.current.flyTo({
            center: [longitude, latitude],
            zoom: 15,
            duration: 2000,
            essential: true
          });
          initialCenterDone.current = true;
        }

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
        setGeoError('Não foi possível obter sua localização.');
        setTimeout(() => setGeoError(null), 6000);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    if (userLocation && mapRef.current && !initialCenterDone.current) {
      mapRef.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 15,
        duration: 2000,
        essential: true
      });
      initialCenterDone.current = true;
    }
  }, [userLocation]);

  // Search Destination
  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }
    
    // Don't search if the query is exactly the selected destination name
    if (destination && searchQuery === destination.name) {
      return;
    }
    
    if (searchQuery.length > 2) {
      const delayDebounceFn = setTimeout(async () => {
        try {
          if (!MAPBOX_TOKEN) {
            console.error("Mapbox token is missing");
            return;
          }
          const proximity = userLocation ? `&proximity=${userLocation.lng},${userLocation.lat}` : '';
          const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&country=br${proximity}`);
          if (!res.ok) throw new Error('Failed to fetch from Mapbox');
          const data = await res.json();
          setSearchResults(data.features || []);
        } catch (e) {
          console.error("Search error:", e);
        }
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, userLocation, destination]);

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
        console.log('Audio recording finished, updating doc');
        await updateDoc(docRef, { audioData: audioBase64 });
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

  const calculateRoutes = async (dest: {lat: number, lng: number}) => {
    if (!userLocation) {
      setGeoError("Localização de origem não encontrada.");
      return;
    }
    if (!MAPBOX_TOKEN) {
      setGeoError("Token do Mapbox não configurado.");
      return;
    }
    setIsCalculating(true);
    try {
      // 1. Rota direta (com alternativas)
      const urlDirect = `https://api.mapbox.com/directions/v5/mapbox/driving/${userLocation.lng},${userLocation.lat};${dest.lng},${dest.lat}?alternatives=true&geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
      
      // 2. Calcular waypoints de desvio (padrão "starburst" ao redor do centro)
      // Isso força a API a buscar caminhos por diversas ruas alternativas
      const dx = dest.lng - userLocation.lng;
      const dy = dest.lat - userLocation.lat;
      const length = Math.sqrt(dx*dx + dy*dy);
      
      let urls = [urlDirect];
      
      // Se a distância for maior que ~200m, tenta rotas de desvio
      if (length > 0.002) { 
        const midLng = userLocation.lng + dx * 0.5;
        const midLat = userLocation.lat + dy * 0.5;
        
        // Apenas um raio proporcional à distância total
        const radii = [Math.max(0.004, length * 0.4)];
        
        // Apenas ângulos perpendiculares para desvios laterais
        const baseAngle = Math.atan2(dy, dx);
        const angles = [
          baseAngle + Math.PI/2, // 90 graus (esquerda)
          baseAngle - Math.PI/2, // -90 graus (direita)
        ];
        
        radii.forEach(radius => {
          angles.forEach(angle => {
            const wpLng = midLng + Math.cos(angle) * radius;
            const wpLat = midLat + Math.sin(angle) * radius;
            urls.push(`https://api.mapbox.com/directions/v5/mapbox/driving/${userLocation.lng},${userLocation.lat};${wpLng},${wpLat};${dest.lng},${dest.lat}?alternatives=true&geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`);
          });
        });
      }

      // Fazer todas as requisições em paralelo
      const responses = await Promise.all(urls.map(url => fetch(url).catch(() => null)));
      
      let allRoutes: any[] = [];
      
      for (const res of responses) {
        if (res && res.ok) {
          const data = await res.json();
          if (data.routes) {
            allRoutes = [...allRoutes, ...data.routes];
          }
        }
      }

      if (allRoutes.length > 0) {
        const routesWithRisk = allRoutes.map((route: any) => {
          let riskScore = 0;
          const encounteredReports = new Set();
          
          const coords = route.geometry.coordinates;
          for (let i = 0; i < coords.length; i += 3) {
            const [lng, lat] = coords[i];
            
            reports.forEach(report => {
              if (report.location) {
                const dist = getDistanceFromLatLonInKm(lat, lng, report.location.lat, report.location.lng);
                // Aumentando o raio de detecção para 500m para ser mais conservador
                if (dist < 0.5) { 
                  // Penalidade extrema
                  let penalty = 0;
                  if (dist < 0.15) penalty = 1000000; // Menos de 150m = INACEITÁVEL
                  else if (dist < 0.3) penalty = 10000; // Menos de 300m = MUITO RUIM
                  else penalty = Math.pow(10, (0.5 - dist) * 5); // 300m - 500m = Ruim
                  
                  // Multiplicadores baseados na gravidade
                  const multiplier = report.type === 'roubo' ? 5 : report.type === 'suspeito' ? 3 : 1;
                  riskScore += (penalty * multiplier);
                  encounteredReports.add(report.id);
                }
              }
            });
          }
          
          return {
            ...route,
            riskScore,
            incidentsOnRoute: encounteredReports.size
          };
        });
        
        // Ordenar por risco (menor primeiro) e depois por duração (mais rápida primeiro)
        routesWithRisk.sort((a: any, b: any) => {
          if (a.riskScore !== b.riskScore) {
            return a.riskScore - b.riskScore;
          }
          return a.duration - b.duration;
        });

        // Filtrar rotas muito parecidas para não mostrar opções redundantes na UI
        const uniqueRoutes: any[] = [];
        const seenGeometries = new Set();
        
        for (const r of routesWithRisk) {
          // Criar uma assinatura simples da rota baseada no meio dela e duração
          const midPoint = r.geometry.coordinates[Math.floor(r.geometry.coordinates.length / 2)];
          const signature = `${Math.round(midPoint[0]*100)},${Math.round(midPoint[1]*100)}-${Math.round(r.duration/60)}`;
          
          if (!seenGeometries.has(signature)) {
            seenGeometries.add(signature);
            uniqueRoutes.push(r);
          }
          if (uniqueRoutes.length >= 3) break; // Manter no máximo 3 opções na UI
        }
        
        const finalRoutes = uniqueRoutes.length > 0 ? uniqueRoutes : routesWithRisk.slice(0, 3);
        
        // A primeira rota após a ordenação é a mais segura
        const safestRoute = finalRoutes[0];
        
        // A rota mais rápida (ignorando risco) para comparação
        const fastestRoute = [...finalRoutes].sort((a, b) => a.duration - b.duration)[0];
        
        finalRoutes.forEach((r: any) => {
          r.isFastest = (r === fastestRoute);
          r.isSafest = (r === safestRoute);
          r.isCompletelySafe = (r.incidentsOnRoute === 0);
        });
        
        setRoutes(finalRoutes);
        
        const safestIndex = finalRoutes.findIndex((r: any) => r.isSafest);
        setSelectedRouteIndex(safestIndex >= 0 ? safestIndex : 0);
        
        // Fit bounds
        const allCoords = finalRoutes[0].geometry.coordinates;
        const minLng = Math.min(...allCoords.map((c: any) => c[0]));
        const maxLng = Math.max(...allCoords.map((c: any) => c[0]));
        const minLat = Math.min(...allCoords.map((c: any) => c[1]));
        const maxLat = Math.max(...allCoords.map((c: any) => c[1]));

        mapRef.current?.fitBounds(
          [[minLng, minLat], [maxLng, maxLat]],
          { padding: 60, duration: 1000 }
        );
      }
    } catch (e) {
      console.error(e);
      setGeoError("Erro ao calcular rotas.");
    } finally {
      setIsCalculating(false);
    }
  };

  const heatmapData = React.useMemo(() => {
    const features = riskZones.map(zone => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [zone.location.lng, zone.location.lat] },
      properties: { intensity: zone.intensity || 0.8 }
    }));

    return { type: 'FeatureCollection', features };
  }, [riskZones]);

  const markers = React.useMemo(() => {
    const now = new Date().getTime();

    return reports.map((report) => {
      const colorClass = colorStyles[report.type] || colorStyles['outro'];
      
      // Temporal Decay Logic
      const reportTime = report.createdAt?.toMillis ? report.createdAt.toMillis() : now;
      const ageInHours = (now - reportTime) / (1000 * 60 * 60);
      
      let opacityClass = 'opacity-100';
      let pulseClass = '';
      let scaleClass = 'hover:scale-110';

      if (ageInHours > 24) {
        // Older than 24h: Very faded, no pulse, smaller
        opacityClass = 'opacity-40 grayscale';
        pulseClass = '';
        scaleClass = 'scale-90 hover:scale-100';
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
  }, [reports]);

  const triggerGPS = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 15,
        duration: 1500,
        essential: true
      });
    }
  };



  return (
    <div className="flex flex-col h-full bg-slate-900 relative">
      <TopBar title="Rotas Seguras (I.A.)" />
      
      {/* Inputs */}
      <div className="absolute top-16 left-4 right-4 z-10 flex flex-col gap-2">
        <div className="bg-slate-900/95 p-3 rounded-2xl shadow-lg border border-slate-700/50 flex items-center gap-3 relative">
          <MapPin size={18} className="text-blue-400 shrink-0" />
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="Para onde vamos?" 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value === '') {
                  setDestination(null);
                  setRoutes([]);
                }
              }}
              className="w-full bg-transparent text-sm outline-none text-white placeholder-slate-400 pr-8"
            />
            {searchQuery && (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setDestination(null);
                  setRoutes([]);
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden z-50 max-h-60 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => {
                    skipSearchRef.current = true;
                    setDestination({
                      lat: result.center[1],
                      lng: result.center[0],
                      name: result.place_name
                    });
                    setSearchQuery(result.place_name);
                    setSearchResults([]);
                    calculateRoutes({ lat: result.center[1], lng: result.center[0] });
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-800 border-b border-slate-700/50 last:border-0 text-sm text-slate-200 flex items-start gap-2"
                >
                  <Search size={14} className="mt-0.5 text-slate-400 shrink-0" />
                  <span className="line-clamp-2">{result.place_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error Toast */}
      {geoError && (
        <div className="absolute top-40 left-4 right-4 z-50 bg-red-900/90 border border-red-500/50 text-red-200 p-3 rounded-xl shadow-lg animate-fade-in flex items-center gap-3">
          <AlertTriangle size={20} className="text-red-400 shrink-0" />
          <p className="text-sm">{geoError}</p>
        </div>
      )}

      {/* Map */}
      <div className="flex-1 relative">
        <Map
          ref={mapRef}
          initialViewState={{
            longitude: userLocation?.lng || -46.6366,
            latitude: userLocation?.lat || -23.5552,
            zoom: 14.5,
            pitch: 0,
            bearing: 0
          }}
          onLoad={() => setIsMapLoaded(true)}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
          onError={(e) => console.warn('Mapbox warning:', e.error?.message || e)}
        >
          {/* User Location */}
          {userLocation && (
            <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-12 h-12 bg-blue-500/30 rounded-full animate-ping" />
                <div className="relative w-5 h-5 bg-blue-500 border-[3px] border-white rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
              </div>
            </Marker>
          )}

          {/* Destination Marker */}
          {destination && (
            <Marker longitude={destination.lng} latitude={destination.lat} anchor="bottom">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-gray-900 rounded-full border-2 border-red-400 shadow-[0_0_15px_rgba(248,113,113,0.6)] flex items-center justify-center">
                  <MapPin size={20} className="text-red-400" />
                </div>
              </div>
            </Marker>
          )}

          {/* Routes */}
          {isMapLoaded && routes.length > 0 && (
            <>
              {/* Render selected route on top */}
              <Source type="geojson" data={{ type: 'Feature', properties: {}, geometry: routes[selectedRouteIndex].geometry } as any}>
                <Layer
                  id="route-layer-selected-bg"
                  type="line"
                  layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                  paint={{
                    'line-color': selectedRouteIndex === 0 ? '#10B981' : selectedRouteIndex === 1 ? '#F97316' : '#94A3B8',
                    'line-width': 8,
                    'line-opacity': 0.8,
                  }}
                />
                <Layer
                  id="route-layer-selected-fg"
                  type="line"
                  layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                  paint={{
                    'line-color': '#ffffff',
                    'line-width': 3,
                    'line-opacity': 0.5,
                  }}
                />
              </Source>
            </>
          )}

          {/* Heatmap Layer */}
          {isMapLoaded && (
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
          )}

          {/* Custom Glowing Markers */}
          {markers}
        </Map>

        {/* Loading Overlay */}
        {isCalculating && (
          <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center z-20">
            <div className="bg-slate-800 p-4 rounded-2xl shadow-xl flex flex-col items-center gap-3 border border-slate-700">
              <Loader2 size={32} className="text-blue-500 animate-spin" />
              <p className="text-sm text-white font-medium">Analisando rotas seguras...</p>
            </div>
          </div>
        )}

        {/* Custom GPS Button */}
        <div className={`absolute right-4 flex flex-col gap-3 z-10 transition-all duration-300 ${routes.length > 0 ? 'bottom-[45vh]' : 'bottom-6'}`}>
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
            <ShieldAlert size={16} />
            <span className="text-[10px] font-black leading-none mt-1">S.O.S</span>
          </button>
          <button 
            onClick={triggerGPS}
            className="bg-slate-900 text-blue-400 p-3.5 rounded-2xl shadow-lg border border-slate-700/50 hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center"
            aria-label="Minha Localização"
          >
            <LocateFixed size={24} />
          </button>
        </div>
      </div>

      <PanicModeOverlay 
        isActive={isPanicMode} 
        onDeactivate={() => setIsPanicMode(false)} 
        onTriggerSOS={() => {
          setIsPanicMode(false);
          handleSOS();
        }} 
      />

      {/* Bottom Summary */}
      {routes.length > 0 && (
        <div className="bg-slate-800 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.3)] p-5 z-20 border-t border-slate-700 flex flex-col max-h-[45vh]">
          <div className="flex justify-between items-start mb-4 shrink-0">
            <div>
              <h2 className={`text-lg font-bold flex items-center gap-2 ${selectedRouteIndex === 0 ? 'text-green-400' : selectedRouteIndex === 1 ? 'text-orange-400' : 'text-slate-400'}`}>
                {selectedRouteIndex === 0 ? 'Rota Segura' : `Alternativa ${selectedRouteIndex + 1}`}
                {selectedRouteIndex === 0 && <ShieldCheck size={20} className="drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]" />}
              </h2>
              <p className="text-sm text-slate-400">
                {Math.round(routes[selectedRouteIndex].duration / 60)} min ({Math.round(routes[selectedRouteIndex].distance / 100) / 10} km)
              </p>
            </div>
            {routes[selectedRouteIndex].incidentsOnRoute === 0 ? (
              <div className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs font-bold uppercase shadow-[0_0_10px_rgba(52,211,153,0.15)]">
                Baixo Risco
              </div>
            ) : (
              <div className="bg-orange-500/10 text-orange-400 px-3 py-1 rounded-full text-xs font-bold uppercase shadow-[0_0_10px_rgba(249,115,22,0.15)]">
                Risco Moderado
              </div>
            )}
          </div>
          
          {/* Route Options */}
          <div className="flex gap-3 overflow-x-auto pb-4 mb-2 snap-x shrink-0 scrollbar-hide -mx-5 px-5">
            {routes.map((route, idx) => {
              const borderColor = idx === 0 ? 'border-green-500' : idx === 1 ? 'border-orange-500' : 'border-slate-500';
              const bgColor = idx === 0 ? 'bg-green-500/10' : idx === 1 ? 'bg-orange-500/10' : 'bg-slate-500/10';
              const textColor = idx === 0 ? 'text-green-400' : idx === 1 ? 'text-orange-400' : 'text-slate-400';
              
              return (
              <button 
                key={idx}
                onClick={() => setSelectedRouteIndex(idx)}
                className={`shrink-0 p-3 rounded-xl border snap-start transition-all ${selectedRouteIndex === idx ? `${borderColor} ${bgColor}` : 'border-slate-700 bg-slate-900/50'} flex flex-col items-start text-left min-w-[150px] ${idx === routes.length - 1 ? 'mr-5' : ''}`}
              >
                <span className={`font-bold ${selectedRouteIndex === idx ? textColor : 'text-slate-300'}`}>
                  {idx === 0 ? 'Rota Segura' : `Alternativa ${idx + 1}`}
                </span>
                <span className="text-sm text-slate-400 mt-1">{Math.round(route.duration / 60)} min • {Math.round(route.distance / 100) / 10} km</span>
                {route.incidentsOnRoute > 0 ? (
                  <span className="text-xs text-orange-400 mt-2 flex items-center gap-1"><AlertTriangle size={12}/> {route.incidentsOnRoute} alertas</span>
                ) : (
                  <span className="text-xs text-green-400 mt-2 flex items-center gap-1"><ShieldCheck size={12}/> Rota limpa</span>
                )}
              </button>
            )})}
          </div>

          {routes[selectedRouteIndex].incidentsOnRoute > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 mb-4 flex items-start gap-3 shrink-0">
              <AlertTriangle size={20} className="text-orange-400 shrink-0 mt-0.5" />
              <p className="text-xs text-orange-300 leading-relaxed">
                Atenção: Nossa I.A. detectou {routes[selectedRouteIndex].incidentsOnRoute} alerta(s) de segurança reportados próximos a esta rota. Mantenha-se atento.
              </p>
            </div>
          )}

          <button 
            onClick={() => {
              const route = routes[selectedRouteIndex];
              const dest = route.geometry.coordinates[route.geometry.coordinates.length - 1];
              window.open(`https://www.google.com/maps/dir/?api=1&origin=${userLocation?.lat},${userLocation?.lng}&destination=${dest[1]},${dest[0]}&travelmode=driving`, '_blank');
            }}
            className="w-full bg-blue-600 text-white font-semibold py-4 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 shrink-0 mt-auto"
          >
            <Navigation size={20} />
            Abrir no Google Maps
          </button>
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

