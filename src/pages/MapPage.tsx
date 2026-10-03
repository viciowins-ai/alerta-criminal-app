import React, { useState, useCallback, useRef, useEffect } from 'react';
import Map, { Source, Layer, Marker, MapRef } from 'react-map-gl/mapbox';
import { AttachmentGallery } from '../components/AttachmentGallery';
import { AudioPlayer } from '../components/AudioPlayer';
import { Search, Filter, ShieldAlert, Navigation, Building2, Landmark, Coffee, Train, LocateFixed, X, AlertCircle, ThumbsUp, Moon, ShieldCheck, Share2, MapPin, MapPinOff, Radio, Play, Car, Bike, Globe, Siren, Eye, Flame, AlertTriangle, Check, Layers } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSelectorModal, SUPPORTED_LANGUAGES } from '../components/LanguageSelectorModal';
import { FlagIcon } from '../components/FlagIcon';
import { db } from '../firebase';
import { collection, query, onSnapshot, limit, orderBy, doc, updateDoc, arrayUnion, increment, addDoc, serverTimestamp, getDoc, getDocs, writeBatch, where, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { useAuth } from '../contexts/AuthContext';
import { SOSModal } from '../components/SOSModal';
import { PanicModeOverlay } from '../components/PanicModeOverlay';
import { GuardianModeOverlay } from '../components/GuardianModeOverlay';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

const markerStyles: Record<string, { border: string; bg: string; shadow: string; pinBg: string; pointerBg: string; textColor: string }> = {
  roubo: { 
    border: "border-white", 
    bg: "bg-red-600", 
    shadow: "shadow-[0_0_16px_rgba(239,68,68,0.85)]", 
    pinBg: "bg-red-600", 
    pointerBg: "bg-red-600",
    textColor: "text-red-400" 
  },
  suspeito: { 
    border: "border-white", 
    bg: "bg-orange-500", 
    shadow: "shadow-[0_0_16px_rgba(249,115,22,0.85)]", 
    pinBg: "bg-orange-500", 
    pointerBg: "bg-orange-500",
    textColor: "text-orange-400" 
  },
  zeladoria: { 
    border: "border-white", 
    bg: "bg-cyan-500", 
    shadow: "shadow-[0_0_16px_rgba(6,182,212,0.85)]", 
    pinBg: "bg-cyan-500", 
    pointerBg: "bg-cyan-500",
    textColor: "text-cyan-400" 
  },
  vandalismo: { 
    border: "border-slate-900", 
    bg: "bg-yellow-400", 
    shadow: "shadow-[0_0_16px_rgba(234,179,8,0.85)]", 
    pinBg: "bg-yellow-400", 
    pointerBg: "bg-yellow-400",
    textColor: "text-yellow-400" 
  },
  outro: { 
    border: "border-white", 
    bg: "bg-slate-600", 
    shadow: "shadow-[0_0_12px_rgba(148,163,184,0.7)]", 
    pinBg: "bg-slate-600", 
    pointerBg: "bg-slate-600",
    textColor: "text-slate-300" 
  },
};

const normalizeType = (type?: string) => {
  if (!type) return 'outro';
  const t = type.toLowerCase().trim();
  if (t === 'roubo' || t === 'furto' || t === 'assalto' || t === 'roubo/furto') return 'roubo';
  if (t === 'suspeito' || t === 'atividade_suspeita' || t === 'atitude_suspeita') return 'suspeito';
  if (t === 'zeladoria' || t === 'risco' || t === 'alagamento' || t === 'perigo' || t === 'hazard') return 'zeladoria';
  if (t === 'vandalismo' || t === 'pichacao' || t === 'depredacao') return 'vandalismo';
  return 'outro';
};

const getMarkerIcon = (type: string) => {
  const norm = normalizeType(type);
  switch (norm) {
    case 'roubo':
      return <Siren size={15} className="text-white drop-shadow-sm" />;
    case 'suspeito':
      return <Eye size={15} className="text-white drop-shadow-sm" />;
    case 'zeladoria':
      return <AlertTriangle size={15} className="text-white drop-shadow-sm" />;
    case 'vandalismo':
      return <Flame size={15} className="text-slate-950 drop-shadow-sm" />;
    default:
      return <AlertCircle size={15} className="text-white drop-shadow-sm" />;
  }
};

export function MapPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { isRecording, startRecording } = useAudioRecorder();
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [rawReports, setRawReports] = useState<any[]>([]);
  const [activePatrols, setActivePatrols] = useState<any[]>([]);

  // Carregar Patrulhas Ativas
  useEffect(() => {
    const q = query(
      collection(db, 'users'), 
      where('isPatrolling', '==', true)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const patrols = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActivePatrols(patrols);
    }, (error) => {
      console.error("Erro ao carregar patrulhas", error);
    });
    return () => unsubscribe();
  }, []);
  const [riskZones, setRiskZones] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null);
  type GpsStatus = 'checking' | 'active_satellite' | 'coarse_network' | 'disabled';
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('checking');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isGpsDisabledModalOpen, setIsGpsDisabledModalOpen] = useState(false);
  const [coarseAccuracy, setCoarseAccuracy] = useState<number | null>(null);
  const [isCoarseLocationModalOpen, setIsCoarseLocationModalOpen] = useState(false);
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [isPanicMode, setIsPanicMode] = useState(false);
  const [isGuardianMode, setIsGuardianMode] = useState(false);
  const [sosModalData, setSosModalData] = useState<{ isOpen: boolean; contacts: any[]; location: any | null }>({ isOpen: false, contacts: [], location: null });

  const mapRef = useRef<MapRef>(null);
  const initialCenterDone = useRef(false);

  const evaluatePosition = useCallback((coords: GeolocationCoordinates) => {
    const { latitude, longitude } = coords;
    
    setUserLocation(prev => {
      if (!prev) return { lat: latitude, lng: longitude };

      const R = 6371e3;
      const p1 = prev.lat * Math.PI / 180;
      const p2 = latitude * Math.PI / 180;
      const dp = (latitude - prev.lat) * Math.PI / 180;
      const dl = (longitude - prev.lng) * Math.PI / 180;
      const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = R * c;

      // Deadband filter: If stationary (< 3.5m variance), keep perfectly still!
      if (dist < 3.5) return prev;
      return { lat: latitude, lng: longitude };
    });

    // When valid coordinates are returned by the device, GPS is active!
    setGpsStatus('active_satellite');
    setCoarseAccuracy(null);
    setIsGpsDisabledModalOpen(false);
    setIsCoarseLocationModalOpen(false);
  }, []);

  const triggerGPS = useCallback((openModalOnIssue = true) => {
    setIsLocating(true);

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsStatus('disabled');
      setUserLocation(null);
      setIsLocating(false);
      if (openModalOnIssue) setIsGpsDisabledModalOpen(true);
      return;
    }

    // Instant visual response: if we already have a location, center immediately!
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 16.5,
        duration: 700,
        essential: true
      });
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        evaluatePosition(position.coords);
        setIsLocating(false);
        setIsGpsDisabledModalOpen(false);

        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [position.coords.longitude, position.coords.latitude],
            zoom: 16.5,
            pitch: 0,
            bearing: 0,
            duration: 900,
            essential: true
          });
        }

        try {
          sessionStorage.setItem('lastKnownLocation', JSON.stringify({ lat: position.coords.latitude, lng: position.coords.longitude }));
        } catch (e) {}
      },
      (error) => {
        setIsLocating(false);
        setGpsStatus('disabled');
        setCoarseAccuracy(null);
        setUserLocation(null);
        try { sessionStorage.removeItem('lastKnownLocation'); } catch (e) {}
        if (openModalOnIssue) {
          setIsGpsDisabledModalOpen(true);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 4000,
        maximumAge: 3000
      }
    );
  }, [evaluatePosition, userLocation]);

  // Monitor device permission & app focus/visibility changes in real-time
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'permissions' in navigator && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((permissionStatus) => {
        if (permissionStatus.state === 'denied') {
          setGpsStatus('disabled');
          setCoarseAccuracy(null);
          setUserLocation(null);
          try { sessionStorage.removeItem('lastKnownLocation'); } catch (e) {}
        }
        permissionStatus.onchange = () => {
          if (permissionStatus.state === 'denied') {
            setGpsStatus('disabled');
            setCoarseAccuracy(null);
            setUserLocation(null);
            try { sessionStorage.removeItem('lastKnownLocation'); } catch (e) {}
          } else if (permissionStatus.state === 'granted') {
            triggerGPS(false);
          }
        };
      }).catch(() => {});
    }

    const handleVisibilityOrFocus = () => {
      triggerGPS(false);
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    // Initial check on mount
    triggerGPS(false);

    // Bidirectional real-time sync: detects both when GPS is turned OFF and when turned back ON
    const autoSyncInterval = setInterval(() => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          evaluatePosition(position.coords);
        },
        (error) => {
          // If the user turns off GPS in phone quick settings:
          if (error && (error.code === 1 || error.code === 2)) {
            setGpsStatus('disabled');
            setUserLocation(null);
            try { sessionStorage.removeItem('lastKnownLocation'); } catch (e) {}
          }
        },
        { enableHighAccuracy: true, timeout: 2500, maximumAge: 3000 }
      );
    }, 2500);

    return () => {
      clearInterval(autoSyncInterval);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [triggerGPS]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsStatus('disabled');
      setIsGpsDisabledModalOpen(true);
      return;
    }

    let watchId: number | undefined;

    try {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          evaluatePosition(position.coords);

          const { latitude, longitude } = position.coords;
          
          // Only center on user if there's no shared report to center on
          const hasSharedReport = new URLSearchParams(window.location.search).get('reportId');
          if (!initialCenterDone.current && mapRef.current && !hasSharedReport) {
            mapRef.current.flyTo({
              center: [longitude, latitude],
              zoom: 16.5,
              pitch: 0,
              bearing: 0,
              duration: 1500,
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
            
            // Only update if moved > 2m to prevent stationary jitter
            if (d > 2) return { lat: latitude, lng: longitude };
            return prev;
          });
        },
        (error) => {
          if (error) {
            if (error.code === 1 || error.code === 2) {
              setGpsStatus('disabled');
              setCoarseAccuracy(null);
              setUserLocation(null);
              try { sessionStorage.removeItem('lastKnownLocation'); } catch (e) {}
              return;
            }
            if (error.code === 3) {
              setGpsStatus('disabled');
            }
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
      );
    } catch (_e) {
      setGpsStatus('disabled');
    }

    return () => {
      try {
        if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
      } catch (e) {}
    };
  }, [evaluatePosition]);

  const [userGroupIds, setUserGroupIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      setUserGroupIds([]);
      return;
    }
    const qGroups = query(collection(db, 'groups'), where('members', 'array-contains', user.uid));
    const unsubscribeGroups = onSnapshot(qGroups, (snap) => {
      setUserGroupIds(snap.docs.map(d => d.id));
    }, (e) => console.error(e));
    return () => unsubscribeGroups();
  }, [user]);

  useEffect(() => {
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(50));
    
    const unsubscribeReports = onSnapshot(q, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }));
      setRawReports(reportsData);
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

  const reports = React.useMemo(() => {
    return rawReports.filter(r => {
      const isPrivate = 
        r.visibility === 'group' || 
        r.visibility === 'private' || 
        r.visibility === 'privado' || 
        Boolean(r.groupId) || 
        Boolean(r.groupName);
      if (isPrivate) {
        return (r.authorId === user?.uid) || (r.groupId && userGroupIds.includes(r.groupId));
      }
      return !r.visibility || r.visibility === 'public';
    });
  }, [rawReports, user, userGroupIds]);

  useEffect(() => {
    const sharedReportId = searchParams.get('reportId');
    if (sharedReportId && reports.length > 0) {
      const sharedReport = reports.find(r => r.id === sharedReportId);
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
          searchParams.delete('reportId');
          setSearchParams(searchParams, { replace: true });
        }
      }
    }
  }, [searchParams, reports]);

  const filteredReports = React.useMemo(() => {
    if (!activeFilter) return reports;
    return reports.filter(report => normalizeType(report.type) === activeFilter);
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

  const handleDeleteReport = async () => {
    if (!selectedLocation || !user || (selectedLocation.authorId !== user.uid && user.email !== 'viciowins@gmail.com')) return;
    if (window.confirm("Deseja realmente excluir sua ocorrência do mapa?")) {
      try {
        await deleteDoc(doc(db, 'reports', selectedLocation.id));
        setSelectedLocation(null);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `reports/${selectedLocation.id}`);
      }
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
    const norm = normalizeType(type);
    switch (norm) {
      case 'roubo': return t('map.riskLevels.critical', 'Crítico');
      case 'zeladoria': return t('map.riskLevels.medium', 'Atenção');
      case 'suspeito': return t('map.riskLevels.high', 'Alto');
      case 'vandalismo': return t('map.riskLevels.medium', 'Médio');
      default: return t('map.riskLevels.low', 'Baixo');
    }
  };

  const getLabel = (type: string) => {
    const norm = normalizeType(type);
    switch (norm) {
      case 'roubo': return t('report.types.roubo', 'Roubo/Furto');
      case 'zeladoria': return t('report.types.zeladoria', 'Zeladoria / Risco');
      case 'suspeito': return t('report.types.suspeito', 'Atividade Suspeita');
      case 'vandalismo': return t('report.types.vandalismo', 'Vandalismo');
      default: return t('report.types.outro', 'Outro');
    }
  };

  const markers = React.useMemo(() => {
    const now = new Date().getTime();

    return filteredReports.map((report) => {
      const isSelected = selectedLocation?.id === report.id;
      const normType = normalizeType(report.type);
      const style = markerStyles[normType] || markerStyles['outro'];
      
      // Temporal Decay Logic:
      // - Ocorrências com mais de 24h: aplicam classe CSS 'grayscale' e opacidade reduzida, ficando em tons de cinza desbotados (alerta antigo/histórico)
      // - Ocorrências recentes (<= 24h): exibem 100% das cores vivas e vibrantes da sua respectiva categoria
      const reportTime = report.createdAt?.toMillis ? report.createdAt.toMillis() : now;
      const ageInHours = (now - reportTime) / (1000 * 60 * 60);
      
      let opacityClass = 'opacity-100';
      let scaleClass = isSelected ? 'scale-125 z-40' : 'hover:scale-110 z-10';

      if (ageInHours > 24) {
        // Mais de 24 horas: decaimento temporal em escala de cinza (grayscale)
        opacityClass = 'opacity-70 grayscale';
        scaleClass = isSelected ? 'scale-115 z-40' : 'scale-90 hover:scale-105 z-0';
      } else if (ageInHours > 2) {
        // Entre 2 e 24 horas: ocorrência do dia com cores vivas
        opacityClass = 'opacity-95';
      }

      const isGroup = report.visibility === 'group';
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
            className={`flex flex-col items-center cursor-pointer transition-all duration-300 ${scaleClass} ${opacityClass}`}
          >
            <div className={`relative w-8 h-8 rounded-full border-2 ${style.border} ${style.pinBg} ${style.shadow} flex items-center justify-center transition-all`}>
              {getMarkerIcon(normType)}
              {isGroup && (
                <span className="absolute -top-1 -right-1 text-[8px] bg-slate-900 border border-slate-700 rounded-full px-0.5 leading-none">🔒</span>
              )}
            </div>
            {/* Pointer point at base */}
            <div className={`w-2 h-2 -mt-1 rotate-45 ${style.pointerBg} border-r-2 border-b-2 ${style.border}`} />
            
            {/* Show badge ONLY when selected to avoid overlapping clutter on mobile */}
            {isSelected && (
              <span className="mt-1 text-[10px] font-bold text-white drop-shadow-md bg-slate-950/95 px-2 py-0.5 rounded-md border border-slate-700 whitespace-nowrap animate-fade-in pointer-events-none">
                {isGroup ? `🔒 ${getLabel(normType)}` : getLabel(normType)}
              </span>
            )}
          </div>
        </Marker>
      );
    });
  }, [filteredReports, selectedLocation]);

  return (
    <div className="relative w-full h-full bg-slate-900">
      {/* Top Header & GPS Status Container */}
      <div className="absolute top-0 left-0 right-0 p-3 pt-[calc(0.75rem+env(safe-area-inset-top))] z-40 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto w-full">
        <div className="flex-1 relative">
          <div className="bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-lg flex items-center px-3.5 h-11 border border-slate-700/50 transition-all focus-within:border-blue-500/50 focus-within:bg-slate-900">
            <Search size={18} className="text-blue-400 mr-2.5 shrink-0" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={handleSearchInput}
              onKeyDown={handleKeyDown}
              placeholder={t('map.searchPlaceholder', 'Buscar local ou endereço...')} 
              className="flex-1 outline-none bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-400 font-medium truncate"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="text-slate-400 hover:text-white transition-colors p-1">
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
                  <p className="text-sm text-slate-300">{t('map.noLocationFound', 'Nenhum local encontrado.')}</p>
                  <p className="text-xs text-slate-500 mt-1">{t('map.simplifySearch', 'Tente simplificar a busca (ex: apenas rua e cidade).')}</p>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {(() => {
            const currentLangCode = i18n.language || 'pt';
            const currentLangObj = SUPPORTED_LANGUAGES.find(l => currentLangCode.startsWith(l.code)) || SUPPORTED_LANGUAGES[0];
            return (
              <button 
                onClick={() => setIsLangModalOpen(true)}
                className="bg-slate-900/95 backdrop-blur-md h-11 px-2.5 rounded-2xl shadow-lg transition-colors border border-slate-700/50 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center gap-1.5 shrink-0"
                title={t('settings.language', 'Idioma')}
                aria-label={t('settings.language', 'Idioma')}
              >
                <FlagIcon code={currentLangObj.flagCode || currentLangObj.code} size="sm" />
                <span className="text-[11px] font-bold uppercase text-slate-200">
                  {currentLangObj.code}
                </span>
              </button>
            );
          })()}

          <div className="relative">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`bg-slate-900/95 backdrop-blur-md h-11 w-11 rounded-2xl shadow-lg transition-colors border flex items-center justify-center relative shrink-0 ${activeFilter ? 'text-blue-400 border-blue-500/50' : 'text-slate-400 border-slate-700/50 hover:bg-slate-800'}`}
              title={t('map.filters.title', 'Filtros')}
              aria-label={t('map.filters.title', 'Filtros')}
            >
              <Filter size={18} />
              {activeFilter && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-slate-900 animate-pulse" />
              )}
            </button>
          
          {showFilters && (
            <>
              {/* Invisible backdrop to dismiss when tapping outside */}
              <div 
                className="fixed inset-0 z-40 bg-black/20" 
                onClick={() => setShowFilters(false)} 
              />
              
              {(() => {
                const isRTL = i18n.language === 'ar' || (typeof document !== 'undefined' && document.documentElement.dir === 'rtl');
                return (
                  <div 
                    className={`absolute top-full mt-2 w-64 sm:w-72 max-w-[calc(100vw-1.5rem)] bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/70 overflow-hidden z-50 animate-fade-in divide-y divide-slate-800/80 ${
                      isRTL ? 'left-0 right-auto' : 'right-0 left-auto'
                    }`}
                  >
                    {/* Header with Title and Clear button */}
                    <div className="px-3.5 py-2.5 flex items-center justify-between bg-slate-950/40">
                      <div className="flex items-center gap-2">
                        <Filter size={14} className="text-blue-400" />
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          {t('map.filters.title', 'Filtros')}
                        </span>
                      </div>
                      {activeFilter && (
                        <button
                          onClick={() => { setActiveFilter(null); setShowFilters(false); }}
                          className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {t('common.clear', 'Limpar')}
                        </button>
                      )}
                    </div>

                    {/* Filter Items */}
                    <div className="p-1.5 space-y-0.5">
                      <button
                        onClick={() => { setActiveFilter(null); setShowFilters(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${!activeFilter ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:bg-slate-800/80 border border-transparent'}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Layers size={14} className="text-blue-400 shrink-0" />
                          <span className="truncate">{t('map.filters.all', 'Todos os Alertas')}</span>
                        </div>
                        {!activeFilter && <Check size={16} className={`text-blue-400 shrink-0 ${isRTL ? 'mr-2' : 'ml-2'}`} />}
                      </button>

                      <button
                        onClick={() => { setActiveFilter('roubo'); setShowFilters(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${activeFilter === 'roubo' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-slate-300 hover:bg-slate-800/80 border border-transparent'}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                          <span className="truncate">{t('report.types.roubo', 'Roubo/Furto')}</span>
                        </div>
                        {activeFilter === 'roubo' && <Check size={16} className={`text-red-400 shrink-0 ${isRTL ? 'mr-2' : 'ml-2'}`} />}
                      </button>

                      <button
                        onClick={() => { setActiveFilter('suspeito'); setShowFilters(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${activeFilter === 'suspeito' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'text-slate-300 hover:bg-slate-800/80 border border-transparent'}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                          <span className="truncate">{t('report.types.suspeito', 'Atividade Suspeita')}</span>
                        </div>
                        {activeFilter === 'suspeito' && <Check size={16} className={`text-orange-400 shrink-0 ${isRTL ? 'mr-2' : 'ml-2'}`} />}
                      </button>

                      <button
                        onClick={() => { setActiveFilter('zeladoria'); setShowFilters(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${activeFilter === 'zeladoria' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-300 hover:bg-slate-800/80 border border-transparent'}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                          <span className="truncate">{t('report.types.zeladoria', 'Zeladoria / Risco')}</span>
                        </div>
                        {activeFilter === 'zeladoria' && <Check size={16} className={`text-cyan-400 shrink-0 ${isRTL ? 'mr-2' : 'ml-2'}`} />}
                      </button>

                      <button
                        onClick={() => { setActiveFilter('vandalismo'); setShowFilters(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${activeFilter === 'vandalismo' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'text-slate-300 hover:bg-slate-800/80 border border-transparent'}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                          <span className="truncate">{t('report.types.vandalismo', 'Vandalismo')}</span>
                        </div>
                        {activeFilter === 'vandalismo' && <Check size={16} className={`text-yellow-400 shrink-0 ${isRTL ? 'mr-2' : 'ml-2'}`} />}
                      </button>

                      <button
                        onClick={() => { setActiveFilter('outro'); setShowFilters(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${activeFilter === 'outro' ? 'bg-slate-500/20 text-slate-300 border border-slate-500/30' : 'text-slate-300 hover:bg-slate-800/80 border border-transparent'}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
                          <span className="truncate">{t('report.types.outro', 'Outro')}</span>
                        </div>
                        {activeFilter === 'outro' && <Check size={16} className={`text-slate-300 shrink-0 ${isRTL ? 'mr-2' : 'ml-2'}`} />}
                      </button>
                    </div>

                    {/* Heatmap Section */}
                    <div className="p-1.5 bg-slate-950/30">
                      <button
                        onClick={() => { setShowHeatmap(!showHeatmap); setShowFilters(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${showHeatmap ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-300 hover:bg-slate-800/80 border border-transparent'}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Flame size={16} className={showHeatmap ? "text-purple-400 shrink-0" : "text-slate-400 shrink-0"} />
                          <span className="truncate font-semibold">{t('map.filters.heatmap', 'Mapa de Calor')}</span>
                        </div>
                        <div className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${isRTL ? 'mr-2' : 'ml-2'} ${showHeatmap ? 'bg-purple-600' : 'bg-slate-700'}`}>
                          <div 
                            className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all duration-200 ${
                              showHeatmap 
                                ? (isRTL ? 'right-[18px]' : 'left-[18px]') 
                                : (isRTL ? 'right-[3px]' : 'left-[3px]')
                            }`} 
                          />
                        </div>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
          </div>
        </div>
      </div>

        {/* GPS Banner when GPS is disabled on the device */}
        {gpsStatus === 'disabled' && (
          <div className="pointer-events-auto w-full animate-in fade-in slide-in-from-top-2 duration-300">
            <button
              onClick={() => setIsGpsDisabledModalOpen(true)}
              className="w-full bg-slate-950/95 border-2 border-amber-500 text-amber-200 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center justify-between text-xs backdrop-blur-md active:scale-98 transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <MapPinOff size={18} className="text-amber-400 shrink-0 animate-bounce" />
                <span className="font-bold text-left truncate">GPS desativado no celular. Toque para ativar.</span>
              </div>
              <span className="bg-amber-500 text-slate-950 font-black px-3 py-1 rounded-xl text-[11px] shrink-0 ml-2 shadow-sm">
                Ativar
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Error Toast */}
      {geoError && (
        <div className="absolute top-[calc(4.75rem+env(safe-area-inset-top))] left-3.5 right-3.5 z-50 bg-slate-900/95 border border-red-500/60 text-red-200 p-3.5 rounded-2xl shadow-2xl backdrop-blur-md animate-fade-in flex items-start gap-3">
          <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-xs text-white">{t('map.gpsError', 'Aviso de GPS')}</p>
            <p className="text-xs text-red-300 mt-0.5 leading-snug">{geoError}</p>
          </div>
          <button onClick={() => setGeoError(null)} className="text-slate-400 hover:text-white p-1">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Floating Active Filter Status Badge */}
      {activeFilter && (
        <div className="absolute top-[calc(4.5rem+env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-20 animate-fade-in pointer-events-none">
          <div className="bg-slate-950/90 backdrop-blur-md border border-slate-700/80 px-3.5 py-1 rounded-full shadow-xl flex items-center gap-2 text-xs">
            <span className={`w-2 h-2 rounded-full animate-pulse ${
              activeFilter === 'roubo' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' :
              activeFilter === 'suspeito' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]' :
              activeFilter === 'zeladoria' ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]' :
              activeFilter === 'vandalismo' ? 'bg-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.8)]' : 'bg-slate-400'
            }`} />
            <span className="text-slate-200 font-medium whitespace-nowrap">
              {filteredReports.length === 0 
                ? t('map.noReportsInFilter', 'Nenhum alerta deste tipo nesta área')
                : `${filteredReports.length} ${filteredReports.length === 1 ? t('map.reportCountOne', 'alerta exibido') : t('map.reportCountMany', 'alertas exibidos')}`
              }
            </span>
          </div>
        </div>
      )}

      {/* Map */}
      <Map
        ref={mapRef}
        reuseMaps
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
        onError={(e) => console.warn('Mapbox warning:', e.error?.message || 'Erro no mapa')}
      >
        {/* Custom User Location Marker */}
        {userLocation && (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
            <div className="relative flex items-center justify-center transition-all duration-700 ease-out pointer-events-none">
              {/* Soft radar pulse halo (stable, no erratic flashing) */}
              <div className="absolute w-10 h-10 bg-blue-500/25 rounded-full animate-pulse" />
              {/* High-visibility blue location point */}
              <div className="relative w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-[0_0_12px_rgba(59,130,246,0.95)]" />
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
        {/* Viatura / Tático Móvel Markers */}
        {activePatrols.map((patrol) => {
          if (!patrol.location || !patrol.location.lat || !patrol.location.lng) return null;
          return (
            <Marker 
              key={patrol.id} 
              longitude={patrol.location.lng} 
              latitude={patrol.location.lat} 
              anchor="center"
              style={{ zIndex: 50 }}
            >
              <div className="relative flex flex-col items-center justify-center">
                <div className="absolute w-12 h-12 bg-blue-500/30 rounded-full animate-ping" />
                <div className="relative w-10 h-10 bg-slate-900 border-2 border-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] flex items-center justify-center">
                  {patrol.vehicleType === 'motorcycle' ? (
                    <Bike size={20} className="text-blue-400" />
                  ) : (
                    <Car size={20} className="text-blue-400" />
                  )}
                </div>
                <span className="mt-1 bg-slate-900/90 text-blue-400 text-[9px] font-bold px-2 py-0.5 rounded border border-blue-500/50 uppercase">
                  {patrol.vehicleType === 'motorcycle' ? t('map.patrolMotorcycle', 'Tático Móvel') : t('map.patrolCar', 'Viatura')}
                </span>
              </div>
            </Marker>
          );
        })}
      </Map>

      {/* Floating Action Buttons */}
      <div className={`absolute right-3.5 sm:right-4 flex flex-col gap-3 z-30 items-center transition-all duration-300 ${selectedLocation ? 'opacity-0 pointer-events-none translate-x-12 bottom-24' : 'opacity-100 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] translate-x-0'}`}>
        <button 
          onClick={() => setIsGuardianMode(true)}
          className="bg-blue-600 text-white w-14 h-14 rounded-2xl shadow-xl border border-blue-400/30 hover:bg-blue-500 transition-all active:scale-90 flex items-center justify-center"
          aria-label={t('map.buttons.guardian', 'Meu Guardião')}
          title={t('map.buttons.guardian', 'Meu Guardião (Acompanhamento)')}
        >
          <ShieldCheck size={26} />
        </button>
        <button 
          onClick={() => setIsPanicMode(true)}
          className="bg-slate-900/95 backdrop-blur-md text-slate-300 w-14 h-14 rounded-2xl shadow-xl border border-slate-700/60 hover:bg-slate-800 hover:text-white transition-all active:scale-90 flex items-center justify-center"
          aria-label={t('map.buttons.panic', 'Modo Pânico (Tela Escura)')}
          title={t('map.buttons.panic', 'Modo Pânico (Tela Escura)')}
        >
          <Moon size={24} />
        </button>
        <button 
          onClick={handleSOS}
          disabled={isSOSActive}
          className={`bg-red-600 text-white w-14 h-14 rounded-2xl shadow-xl border border-red-400/40 hover:bg-red-500 transition-all active:scale-90 flex flex-col items-center justify-center ${isSOSActive ? 'opacity-50 cursor-not-allowed' : 'animate-pulse'}`}
          aria-label={t('map.buttons.sos', 'SOS Emergência')}
          title={t('map.buttons.sos', 'SOS Emergência')}
        >
          <ShieldAlert size={22} />
          <span className="text-[9px] font-black leading-none mt-0.5 tracking-wider">S.O.S</span>
        </button>
        <button 
          onClick={triggerGPS}
          disabled={isLocating}
          className="bg-slate-900/95 backdrop-blur-md text-blue-400 border border-slate-700/60 w-14 h-14 rounded-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-90 flex items-center justify-center"
          aria-label={t('map.buttons.myLocation', 'Minha Localização')}
          title={t('map.buttons.myLocation', 'Minha Localização')}
        >
          <LocateFixed size={26} className={isLocating ? 'animate-spin text-blue-400' : ''} />
        </button>
      </div>

      {/* Modal de Aviso de GPS Desativado */}
      {isGpsDisabledModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center flex flex-col items-center">
            <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 mb-4 animate-bounce">
              <MapPinOff size={28} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Ative o GPS no seu Celular</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4 text-center">
              O ícone de <strong>Localização</strong> do seu aparelho está desligado. Para visualizar sua posição no mapa com precisão e utilizar funções de rota e emergência, ative o GPS no seu telefone:
            </p>

            <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-slate-800 space-y-2.5 mb-5 text-xs text-slate-300 text-left w-full">
              <div className="flex items-start gap-2.5">
                <span className="bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0 mt-0.5">Passo 1</span>
                <span>Puxe a barra do topo do celular para baixo para abrir os atalhos rápidos.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="bg-blue-600/30 text-blue-400 font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0 mt-0.5">Passo 2</span>
                <span>Toque no botão <strong>"Localização"</strong> para ligar (ele ficará azul/aceso).</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 w-full">
              <button
                onClick={() => triggerGPS(true)}
                disabled={isLocating}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-95 text-xs"
              >
                <LocateFixed size={18} className={isLocating ? 'animate-spin' : ''} />
                <span>{isLocating ? 'Buscando Satélites...' : 'Já ativei o GPS, Sincronizar'}</span>
              </button>
              <button
                onClick={() => setIsGpsDisabledModalOpen(false)}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors"
              >
                Continuar navegando no mapa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Instrução: Ativar Localização Exata / GPS */}
      {isCoarseLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-left flex flex-col">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 mb-3 mx-auto">
              <Radio size={26} className="animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 text-center">Ativar Localização Exata (GPS)</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4 text-center">
              Seu celular está usando a localização aproximada do <strong className="text-amber-300">modem Wi-Fi ou antena celular</strong> (margem de ~{coarseAccuracy || 200}m) porque o GPS de satélite ou a permissão exata não foram acionados.
            </p>

            <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-slate-800 space-y-2.5 mb-5 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <span className="bg-blue-600/30 text-blue-400 font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0 mt-0.5">Android</span>
                <span>Puxe a barra superior, segure o ícone <strong>Localização</strong> e ative <strong>"Localização Precisa"</strong>. No navegador, clique no cadeado 🔒 na barra do site e escolha <strong>"Localização Exata"</strong>.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-blue-600/30 text-blue-400 font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0 mt-0.5">iPhone</span>
                <span>Vá em <strong>Ajustes &gt; Privacidade &gt; Localização &gt; Safari</strong> e ative <strong>"Localização Precisa"</strong>.</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 w-full">
              <button
                onClick={triggerGPS}
                disabled={isLocating}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-95 text-xs"
              >
                <LocateFixed size={16} className={isLocating ? 'animate-spin' : ''} />
                <span>{isLocating ? 'Sintonizando Satélites...' : 'Tentar Novamente (Buscar Satélites)'}</span>
              </button>
              <button
                onClick={() => setIsCoarseLocationModalOpen(false)}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors text-center"
              >
                Usar Localização Atual Assim Mesmo
              </button>
            </div>
          </div>
        </div>
      )}

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
        <div className="absolute bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-xl rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.7)] p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] z-50 transition-transform border-t border-slate-700/60 animate-in slide-in-from-bottom-full max-h-[50vh] flex flex-col">
          <div className="relative flex items-center justify-center mb-4 shrink-0">
            <div className="w-12 h-1.5 bg-slate-700 rounded-full cursor-pointer hover:bg-slate-600 transition-colors" onClick={() => setSelectedLocation(null)} />
            <button 
              onClick={() => setSelectedLocation(null)}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title={t('common.close', 'Fechar')}
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto hide-scrollbar -mx-5 px-5 pb-2">
            <div className="flex justify-between items-start mb-4">
            <div className="flex-1 pr-4">
              <h2 className="text-xl font-black text-white tracking-tight mb-1 line-clamp-2">{selectedLocation.location.address || getLabel(selectedLocation.type)}</h2>
              <div className="flex items-center gap-3 mt-2">
                <p className="text-sm text-slate-400 font-medium">
                  {t('map.riskLevels.risk', 'Risco')}: <span className={`font-bold drop-shadow-[0_0_8px_rgba(239,68,68,0.5)] ${
                    selectedLocation.type === 'roubo' ? 'text-red-500' :
                    selectedLocation.type === 'suspeito' ? 'text-orange-500' :
                    selectedLocation.type === 'zeladoria' || selectedLocation.type === 'vandalismo' ? 'text-yellow-500' : 'text-green-500'
                  }`}>{getRiskLevel(selectedLocation.type)}</span>
                </p>
                <div className="w-1 h-1 rounded-full bg-slate-600" />
                <p className="text-sm text-slate-400 font-medium flex items-center gap-1">
                  <ThumbsUp size={14} className={selectedLocation.upvotedBy?.includes(user?.uid) ? 'text-blue-400' : ''} />
                  {selectedLocation.upvotes || 0} {t('map.confirmed', 'confirmaram')}
                </p>
                {selectedLocation.authorName && (
                  <>
                    <div className="w-1 h-1 rounded-full bg-slate-600" />
                    <p className="text-sm text-slate-400 font-medium">{t('map.byAuthor', 'Por:')} <span className="text-white">{selectedLocation.authorName}</span></p>
                  </>
                )}
              </div>
            </div>
            <div className="bg-slate-900/50 border border-white/5 rounded-xl p-2 text-center min-w-[4rem] shrink-0">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">{t('map.status', 'Status')}</p>
              <p className={`text-sm font-black leading-none ${
                selectedLocation.status === 'verified' ? 'text-green-500' :
                selectedLocation.status === 'pending' ? 'text-yellow-500' : 'text-red-500'
              }`}>{selectedLocation.status === 'verified' ? t('map.statusVerified', 'Verificado') : selectedLocation.status === 'pending' ? t('map.statusPending', 'Pendente') : t('map.statusFake', 'Falso')}</p>
            </div>
          </div>
          
          {selectedLocation.description && (
            <p className="text-sm text-slate-300 mb-4 italic border-l-2 border-slate-600 pl-3">"{selectedLocation.description}"</p>
          )}

          {selectedLocation.audioUrl && (
            <div className="mb-4">
              <AudioPlayer src={selectedLocation.audioUrl} duration={selectedLocation.audioDuration} />
            </div>
          )}

          {selectedLocation.attachments && selectedLocation.attachments.length > 0 && (
            <div className="mb-4">
              <AttachmentGallery attachments={selectedLocation.attachments} />
            </div>
          )}
          </div>

          <div className="flex gap-3 overflow-x-auto pt-3 pb-1 hide-scrollbar shrink-0 border-t border-slate-800 mt-2">
            <button 
              onClick={() => navigate(`/route?destination=${encodeURIComponent(selectedLocation.location.address || '')}`)}
              className="flex flex-col items-center gap-1.5 min-w-[68px]"
            >
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform">
                <Navigation size={18} />
              </div>
              <span className="text-[11px] font-bold text-blue-500">{t('nav.routes', 'Rotas')}</span>
            </button>
            <button 
              onClick={() => handleUpvote(selectedLocation.id)}
              className="flex flex-col items-center gap-1.5 min-w-[68px]"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all duration-300 ${
                selectedLocation.upvotedBy?.includes(user?.uid) 
                  ? 'bg-blue-500 text-white shadow-blue-500/30 border border-blue-400' 
                  : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
              }`}>
                <ThumbsUp size={18} className={selectedLocation.upvotedBy?.includes(user?.uid) ? 'fill-current' : ''} />
              </div>
              <span className={`text-[11px] font-bold ${selectedLocation.upvotedBy?.includes(user?.uid) ? 'text-blue-400' : 'text-slate-300'}`}>
                {selectedLocation.upvotedBy?.includes(user?.uid) ? t('map.confirmedAction', 'Confirmado') : t('map.confirmAction', 'Confirmar')}
              </span>
            </button>
            <button 
              onClick={handleShareLocation}
              className="flex flex-col items-center gap-1.5 min-w-[68px]"
            >
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform">
                <Share2 size={18} />
              </div>
              <span className="text-[11px] font-bold text-slate-300">{t('map.share', 'Compartilhar')}</span>
            </button>
            {(user?.uid === selectedLocation.authorId || user?.email === 'viciowins@gmail.com') && (
              <button 
                onClick={handleDeleteReport}
                className="flex flex-col items-center gap-1.5 min-w-[68px]"
              >
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-red-500/50 flex items-center justify-center text-red-500 shadow-lg active:scale-95 transition-transform">
                  <X size={18} />
                </div>
                <span className="text-[11px] font-bold text-red-500">{t('map.delete', 'Excluir')}</span>
              </button>
            )}
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

      <LanguageSelectorModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
      />
    </div>
  );
}
