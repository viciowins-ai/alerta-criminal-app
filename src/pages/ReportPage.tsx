import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TopBar } from '../components/TopBar';
import { ImageBlurEditor } from '../components/ImageBlurEditor';
import { VideoPrivacyEditor } from '../components/VideoPrivacyEditor';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { InAppCameraModal } from '../components/InAppCameraModal';
import { CheckCircle2, Siren, Eye, Flame, MoreHorizontal, Send, Mic, Lock, Loader2, AlertTriangle, Shield } from 'lucide-react';
import { ViewStateChangeEvent, MapRef } from 'react-map-gl/mapbox';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, getDoc, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { getLevelInfo } from '../utils/levelUtils';
import { useTranslation } from 'react-i18next';
import { safeWatchPosition, safeGetCurrentPosition, safeClearWatch } from '../utils/geoUtils';
import { compressImageIfNeeded, formatFileSize } from '../utils/imageCompressor';
import { ReportLocationPicker } from '../components/report/ReportLocationPicker';
import { ReportMediaSection } from '../components/report/ReportMediaSection';
import { ReportUploadModal, UploadStatusState } from '../components/report/ReportUploadModal';

const INCIDENT_TYPES = [
  { id: 'roubo', label: 'Roubo/Furto', icon: <Siren size={24} />, baseColor: 'red', desc: 'Assaltos ou furtos', placeholder: 'Ex: Dois homens em uma moto preta, armados. Ocorreu há 10 min...' },
  { id: 'suspeito', label: 'Atividade Suspeita', icon: <Eye size={24} />, baseColor: 'orange', desc: 'Pessoas ou veículos', placeholder: 'Ex: Veículo prata rondando o local devagar, placa XYZ...' },
  { id: 'zeladoria', label: 'Zeladoria / Risco', icon: <AlertTriangle size={24} />, baseColor: 'cyan', desc: 'Ruas escuras, alagamentos...', placeholder: 'Ex: Poste apagado, buraco na via, enchente, bueiro entupido...' },
  { id: 'vandalismo', label: 'Vandalismo', icon: <Flame size={24} />, baseColor: 'yellow', desc: 'Danos ao patrimônio', placeholder: 'Ex: Pichação recente, ponto de ônibus depredado...' },
  { id: 'outro', label: 'Outro', icon: <MoreHorizontal size={24} />, baseColor: 'slate', desc: 'Outras ocorrências', placeholder: 'Forneça mais detalhes sobre o que aconteceu...' },
];

const COLOR_MAP: Record<string, any> = {
  red: { activeBg: 'bg-red-950/40', activeBorder: 'border-red-500/50', activeText: 'text-red-400', activeShadow: 'shadow-[0_0_20px_rgba(239,68,68,0.2)]', iconActiveBg: 'bg-red-500/20', glow: 'from-red-500/0 to-red-500/10' },
  orange: { activeBg: 'bg-orange-950/40', activeBorder: 'border-orange-500/50', activeText: 'text-orange-400', activeShadow: 'shadow-[0_0_20px_rgba(249,115,22,0.2)]', iconActiveBg: 'bg-orange-500/20', glow: 'from-orange-500/0 to-orange-500/10' },
  cyan: { activeBg: 'bg-cyan-950/40', activeBorder: 'border-cyan-500/50', activeText: 'text-cyan-400', activeShadow: 'shadow-[0_0_20px_rgba(6,182,212,0.2)]', iconActiveBg: 'bg-cyan-500/20', glow: 'from-cyan-500/0 to-cyan-500/10' },
  yellow: { activeBg: 'bg-yellow-950/40', activeBorder: 'border-yellow-500/50', activeText: 'text-yellow-400', activeShadow: 'shadow-[0_0_20px_rgba(234,179,8,0.2)]', iconActiveBg: 'bg-yellow-500/20', glow: 'from-yellow-500/0 to-yellow-500/10' },
  slate: { activeBg: 'bg-slate-800/80', activeBorder: 'border-slate-400/50', activeText: 'text-slate-200', activeShadow: 'shadow-[0_0_20px_rgba(148,163,184,0.2)]', iconActiveBg: 'bg-slate-600/30', glow: 'from-slate-500/0 to-slate-500/10' },
};

export function ReportPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [editingImage, setEditingImage] = useState<File | null>(null);
  const [editingVideo, setEditingVideo] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<{
    active: boolean;
    fileName: string;
    fileIndex: number;
    totalFiles: number;
    progress: number;
    bytesTransferred: number;
    totalBytes: number;
    speedKBps: number;
    estimatedSecondsLeft: number;
    phase: 'uploading' | 'saving' | 'broadcasting' | 'done';
    statusText?: string;
  }>({
    active: false,
    fileName: '',
    fileIndex: 0,
    totalFiles: 0,
    progress: 0,
    bytesTransferred: 0,
    totalBytes: 0,
    speedKBps: 0,
    estimatedSecondsLeft: 0,
    phase: 'uploading'
  });
  const currentUploadTaskRef = useRef<any>(null);
  const cancelRequestedRef = useRef<boolean>(false);
  const [audioData, setAudioData] = useState<{ url: string; duration: number } | null>(null);
  const [searchParams] = useSearchParams();
  const urlGroupId = searchParams.get('groupId');
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [visibility, setVisibility] = useState<'public' | 'group'>(urlGroupId ? 'group' : 'public');
  const [selectedGroupId, setSelectedGroupId] = useState<string>(urlGroupId || '');
  const [isInAppCameraOpen, setIsInAppCameraOpen] = useState(false);
  const [cameraInitialMode, setCameraInitialMode] = useState<'photo' | 'video'>('photo');
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetchSettings = async () => {
      try {
        const q = query(collection(db, 'groups'), where('members', 'array-contains', user.uid));
        const querySnapshot = await getDocs(q);
        const groupsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUserGroups(groupsData);
        if (urlGroupId && groupsData.some(g => g.id === urlGroupId)) {
          setSelectedGroupId(urlGroupId);
          setVisibility('group');
        } else if (groupsData.length > 0 && !selectedGroupId) {
          setSelectedGroupId(groupsData[0].id);
        }
      } catch (err) {
        console.error("Error fetching groups", err);
      }
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserProfile(data);
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

  const isVideoFile = (f: File) => f.type.startsWith('video/') || /\.(mp4|mov|avi|webm|mkv|3gp|m4v|ogv)$/i.test(f.name);
  const isImageFile = (f: File) => f.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|heic|heif)$/i.test(f.name);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsCompressingImage(true);
      const rawFiles: File[] = Array.from(e.target.files);
      
      // Scale down any ultra-high resolution photos to prevent memory crashes
      const newFiles: File[] = await Promise.all(
        rawFiles.map(async (file: File): Promise<File> => {
          if (isImageFile(file)) {
            try {
              return await compressImageIfNeeded(file);
            } catch {
              return file;
            }
          }
          return file;
        })
      );
      setIsCompressingImage(false);

      const firstVideo = newFiles.find(isVideoFile);
      const firstImage = newFiles.find(isImageFile);

      if (firstVideo) {
        setEditingVideo(firstVideo);
        const otherFiles = newFiles.filter(f => f !== firstVideo);
        if (otherFiles.length > 0) {
          setAttachments(prev => [...prev, ...otherFiles]);
        }
      } else if (firstImage) {
        setEditingImage(firstImage);
        const otherFiles = newFiles.filter(f => f !== firstImage);
        if (otherFiles.length > 0) {
          setAttachments(prev => [...prev, ...otherFiles]);
        }
      } else {
        setAttachments(prev => [...prev, ...newFiles]);
      }
    }
    if (e.target) e.target.value = '';
  };

  const handleCameraCapture = async (file: File) => {
    setIsInAppCameraOpen(false);
    if (isVideoFile(file)) {
      setEditingVideo(file);
    } else {
      setIsCompressingImage(true);
      try {
        const compressed = await compressImageIfNeeded(file);
        setIsCompressingImage(false);
        setEditingImage(compressed);
      } catch {
        setIsCompressingImage(false);
        setEditingImage(file);
      }
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
  const userHasDragged = useRef(false);

  useEffect(() => {
    const watchId = safeWatchPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        setUserLocation({ lng: longitude, lat: latitude });
        
        if (!userHasDragged.current) {
           setReportLocation({ longitude, latitude });
           mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 16, duration: 1000 });
           fetchAddress(longitude, latitude);
        }
      },
      (_error) => {
        // Silently handle unavailable location
      },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    return () => {
      safeClearWatch(watchId);
    };
  }, []);

  const requestLocation = useCallback(() => {
    setIsLocating(true);
    setAddress('Buscando localização de alta precisão...');
    safeGetCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        setUserLocation({ lng: longitude, lat: latitude });
        setReportLocation({ longitude, latitude });
        userHasDragged.current = false;
        mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 17, duration: 1000 });
        fetchAddress(longitude, latitude);
        setIsLocating(false);
      }, 
      (_error) => {
        if (userLocation) {
          userHasDragged.current = false;
          setReportLocation({ longitude: userLocation.lng, latitude: userLocation.lat });
          mapRef.current?.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 16, duration: 1000 });
          fetchAddress(userLocation.lng, userLocation.lat);
        } else {
          setAddress('Não foi possível obter sua localização precisa.');
        }
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, [userLocation]);

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
    userHasDragged.current = true;
  }, []);

  const handleMoveEnd = useCallback((evt: ViewStateChangeEvent) => {
    setIsDragging(false);
    setReportLocation({
      longitude: evt.viewState.longitude,
      latitude: evt.viewState.latitude
    });
    fetchAddress(evt.viewState.longitude, evt.viewState.latitude);
  }, []);

  const handleCancelUpload = () => {
    cancelRequestedRef.current = true;
    if (currentUploadTaskRef.current) {
      try {
        currentUploadTaskRef.current.cancel();
      } catch (e) {
        console.warn('Erro ao cancelar upload:', e);
      }
    }
    setIsSubmitting(false);
    setUploadStatus({
      active: false,
      fileName: '',
      fileIndex: 0,
      totalFiles: 0,
      progress: 0,
      bytesTransferred: 0,
      totalBytes: 0,
      speedKBps: 0,
      estimatedSecondsLeft: 0,
      phase: 'uploading'
    });
    setUploadProgress(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !user) return;
    
    if (!navigator.onLine && attachments.length > 0) {
      alert("⚠️ Você está sem conexão com a internet.\n\nO aplicativo não consegue enviar fotos e vídeos no modo offline. Por favor, remova as mídias para enviar apenas o texto, ou aguarde até ter sinal (3G/4G/Wi-Fi) para relatar com imagens.");
      return;
    }

    cancelRequestedRef.current = false;
    setIsSubmitting(true);
    
    try {
      const attachmentData: {url: string, type: string}[] = [];
      
      // Upload attachments com telemetria detalhada de velocidade e progresso
      for (let i = 0; i < attachments.length; i++) {
        if (cancelRequestedRef.current) {
          throw new Error('Envio cancelado pelo usuário.');
        }

        const file = attachments[i];
        
        setUploadStatus({
          active: true,
          fileName: file.name,
          fileIndex: i + 1,
          totalFiles: attachments.length,
          progress: 0,
          bytesTransferred: 0,
          totalBytes: file.size,
          speedKBps: 0,
          estimatedSecondsLeft: 0,
          phase: 'uploading',
          statusText: `Enviando anexo ${i + 1} de ${attachments.length}...`
        });

        const fileRef = ref(storage, `reports/${user.uid}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(fileRef, file);
        currentUploadTaskRef.current = uploadTask;
        
        let lastBytes = 0;
        let lastTime = Date.now();

        await new Promise<void>((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot) => {
              if (cancelRequestedRef.current) {
                try { uploadTask.cancel(); } catch {}
                reject(new Error('Envio cancelado pelo usuário.'));
                return;
              }

              const transferred = snapshot.bytesTransferred;
              const total = snapshot.totalBytes;
              const pct = total > 0 ? Math.round((transferred / total) * 100) : 0;
              setUploadProgress(pct);

              const now = Date.now();
              const timeDelta = (now - lastTime) / 1000;
              let currentSpeed = 0;
              let secLeft = 0;
              if (timeDelta >= 0.4) {
                const bytesDelta = transferred - lastBytes;
                currentSpeed = Math.max(0, bytesDelta / timeDelta / 1024);
                const remaining = total - transferred;
                secLeft = currentSpeed > 0 ? Math.round(remaining / (currentSpeed * 1024)) : 0;
                lastBytes = transferred;
                lastTime = now;
              }

              setUploadStatus(prev => ({
                ...prev,
                progress: pct,
                bytesTransferred: transferred,
                totalBytes: total,
                speedKBps: currentSpeed > 0 ? Math.round(currentSpeed) : prev.speedKBps,
                estimatedSecondsLeft: secLeft > 0 ? secLeft : prev.estimatedSecondsLeft
              }));
            }, 
            (error) => {
              currentUploadTaskRef.current = null;
              reject(error);
            }, 
            async () => {
              try {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                attachmentData.push({ url, type: file.type });
                currentUploadTaskRef.current = null;
                resolve();
              } catch (err) {
                currentUploadTaskRef.current = null;
                reject(err);
              }
            }
          );
        });
      }

      setUploadStatus(prev => ({
        ...prev,
        phase: 'saving',
        statusText: 'Gravando ocorrência no mapa e gerando protocolo...'
      }));

      const levelInfo = getLevelInfo(userProfile?.points || 0);

      const reportPayload: any = {
        authorId: user.uid,
        isAnonymous: isAnonymous,
        authorName: isAnonymous ? 'Morador Anônimo' : (userProfile?.name || user.displayName || 'Usuário'),
        authorAvatar: isAnonymous ? '' : (userProfile?.avatar || user.photoURL || ''),
        authorLevel: isAnonymous ? 'Iniciante' : levelInfo.name,
        verified: isAnonymous ? false : levelInfo.verified,
        type: selectedType,
        location: {
          lat: reportLocation.latitude,
          lng: reportLocation.longitude,
          address: address
        },
        status: 'pending',
        upvotes: 0,
        upvotedBy: [],
        createdAt: serverTimestamp(),
        visibility: visibility,
        groupId: visibility === 'group' ? selectedGroupId : null,
        groupName: visibility === 'group' ? userGroups.find(g => g.id === selectedGroupId)?.name : null
      };
      
      if (description.trim() !== '') {
        reportPayload.description = description.trim();
      }
      
      if (attachmentData.length > 0) {
        reportPayload.attachments = attachmentData;
      }

      if (audioData) {
        reportPayload.audioUrl = audioData.url;
        reportPayload.audioDuration = audioData.duration;
      }

      const reportRef = await addDoc(collection(db, 'reports'), reportPayload);

      // Track report creation
      import('../firebase').then(({ trackEvent }) => {
        trackEvent('report_created', {
          report_type: selectedType,
          has_attachments: attachments.length > 0,
          is_anonymous: isAnonymous
        });
      }).catch(console.error);

      // Generate HTML Content for Email Broadcast
      const typeLabel = INCIDENT_TYPES.find(t => t.id === selectedType)?.label || 'Ocorrência';
      let htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #0f172a; padding: 20px; text-align: center;">
            <img src="https://alertacriminal.com.br/escudo-logo.png" alt="Alerta Criminal" width="80" style="display: block; margin: 0 auto;" />
          </div>
          <div style="padding: 24px; background-color: #ffffff;">
            <h2 style="color: #dc2626; margin-top: 0; font-size: 24px;">🚨 Alerta de Segurança</h2>
            <p style="font-size: 16px; line-height: 1.5;">Uma nova ocorrência de <strong>${typeLabel}</strong> foi reportada na sua região.</p>
            
            <div style="background-color: #f8fafc; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <p style="margin: 0 0 8px 0;"><strong>📍 Local:</strong> <a href="https://alertacriminal.com.br/?reportId=${reportRef.id}" style="color: #3b82f6; text-decoration: underline;">${address || 'Localização aproximada'}</a></p>
              ${description.trim() !== '' ? `<p style="margin: 0; color: #475569;"><strong>📝 Detalhes:</strong> "${description.trim()}"</p>` : ''}
            </div>
      `;
      if (attachmentData.length > 0 && attachmentData[0].type.startsWith('image/')) {
        htmlContent += `
            <div style="margin: 20px 0; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
              <a href="https://alertacriminal.com.br/?reportId=${reportRef.id}">
                <img src="${attachmentData[0].url}" alt="Foto da Ocorrência" style="width: 100%; max-height: 300px; object-fit: cover; display: block; border: none;" />
              </a>
            </div>
        `;
      }

      if (audioData) {
        htmlContent += `
            <div style="margin: 20px 0; padding: 14px 18px; background-color: #e0e7ff; border: 1px solid #c7d2fe; border-radius: 8px; color: #3730a3; font-size: 14px;">
              🎙️ <strong>Mensagem de Voz anexada:</strong> O morador gravou um relato em áudio (${audioData.duration}s). <a href="https://alertacriminal.com.br/?reportId=${reportRef.id}" style="color: #4338ca; text-decoration: underline; font-weight: bold;">Clique para ouvir no app</a>.
            </div>
        `;
      }

      htmlContent += `
            <div style="text-align: center; margin-top: 32px;">
              <a href="https://alertacriminal.com.br/?reportId=${reportRef.id}" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Ver no Aplicativo
              </a>
            </div>
          </div>
          <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
            <p style="margin: 0;">Você está recebendo este e-mail porque ativou os alertas de segurança da sua região no Alerta Criminal.</p>
          </div>
        </div>
      `;

      // Trigger Push Notification and Email Broadcast via Backend (com isolamento estrito de grupos)
      try {
        setUploadStatus(prev => ({
          ...prev,
          phase: 'broadcasting',
          statusText: 'Disparando alertas de segurança para a vizinhança...'
        }));

        const idToken = await user.getIdToken();
        const isPrivate = visibility === 'group' || Boolean(reportPayload.groupId);
        const timeFormatted = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const shortProtocol = reportRef.id.slice(0, 5).toUpperCase();
        
        await fetch('/api/push/broadcast', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            title: isPrivate 
              ? `🔒 [${reportPayload.groupName || 'Grupo Privado'}] ${typeLabel} às ${timeFormatted} (#${shortProtocol})`
              : `🚨 Alerta Criminal: ${typeLabel} às ${timeFormatted} (#${shortProtocol})`,
            body: `Reportado em: ${address || 'Localização aproximada'}`,
            url: `/?reportId=${reportRef.id}`,
            htmlContent,
            visibility: reportPayload.visibility,
            groupId: reportPayload.groupId,
            reportId: reportRef.id
          })
        });
      } catch (pushErr) {
        console.error("Error triggering broadcast:", pushErr);
      }

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
    } catch (error: any) {
      if (cancelRequestedRef.current || error?.message === 'Envio cancelado pelo usuário.' || error?.code === 'storage/canceled') {
        console.log("Upload cancelado pelo usuário.");
        setIsSubmitting(false);
        setUploadStatus({
          active: false,
          fileName: '',
          fileIndex: 0,
          totalFiles: 0,
          progress: 0,
          bytesTransferred: 0,
          totalBytes: 0,
          speedKBps: 0,
          estimatedSecondsLeft: 0,
          phase: 'uploading'
        });
        setUploadProgress(0);
        return;
      }

      console.error("DEBUG ERROR:", error);
      if (error instanceof Error) {
        alert("Erro no upload: " + error.message);
      } else {
        alert("Erro desconhecido: " + (typeof error === 'object' && error !== null ? (error as any).message || 'Falha ao processar alerta' : String(error)));
      }
      setIsSubmitting(false);
      setUploadStatus({
        active: false,
        fileName: '',
        fileIndex: 0,
        totalFiles: 0,
        progress: 0,
        bytesTransferred: 0,
        totalBytes: 0,
        speedKBps: 0,
        estimatedSecondsLeft: 0,
        phase: 'uploading'
      });
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
        <h2 className="text-2xl font-bold text-white mb-2 text-center">
          {t('report.successTitle', 'Ocorrência Reportada!')}
        </h2>
        <p className="text-slate-400 text-center mb-8">
          {t('report.successSub', 'Obrigado por contribuir com a segurança da comunidade.')}
        </p>
        <button 
          onClick={() => navigate('/')}
          className="w-full bg-blue-600 text-white font-semibold py-4 rounded-xl hover:bg-blue-700 transition-colors"
        >
          {t('report.backToMap', 'Voltar ao Mapa')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <TopBar title={t('report.title', 'Reportar Ocorrência')} />
      
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        {/* Location Selection */}
        <ReportLocationPicker
          reportLocation={reportLocation}
          userLocation={userLocation}
          address={address}
          isLocating={isLocating}
          isDragging={isDragging}
          mapRef={mapRef}
          onRequestLocation={requestLocation}
          onMoveStart={handleMoveStart}
          onMoveEnd={handleMoveEnd}
        />

        {/* Destino & Visibilidade do Alerta (Sempre em destaque para evitar vazamento acidental) */}
        {userGroups.length > 0 && (
          <div className="bg-slate-800/90 p-4 rounded-2xl border border-indigo-500/30 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield size={16} className="text-indigo-400" />
                {t('report.visibilityTitle', 'Onde deseja publicar este alerta?')}
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                visibility === 'group'
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
              }`}>
                {visibility === 'group' ? '🔒 Privado (Grupo)' : '🚨 Público (Geral)'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`py-3 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 border cursor-pointer ${
                  visibility === 'public'
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs">
                  <span>🚨</span>
                  <span>{t('report.publicAll', 'Público Geral')}</span>
                </div>
                <span className="text-[9px] opacity-80 text-center">Toda a cidade vê</span>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('group')}
                className={`py-3 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 border cursor-pointer ${
                  visibility === 'group'
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs">
                  <Lock size={13} />
                  <span>{t('report.privateNetwork', 'Rede Privada')}</span>
                </div>
                <span className="text-[9px] opacity-80 text-center">Apenas membros</span>
              </button>
            </div>
            
            {visibility === 'group' ? (
              <div className="pt-2 border-t border-slate-700/60 animate-in fade-in space-y-1.5">
                <label className="block text-xs text-indigo-300 font-semibold">
                  {t('report.selectGroup', 'Grupo Privado de destino:')}
                </label>
                <select 
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full bg-slate-900 border border-indigo-500/40 text-white text-xs font-bold rounded-xl p-3 focus:outline-none focus:border-indigo-400 cursor-pointer"
                >
                  {userGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 leading-tight">
                  🔒 Este alerta ficará visível <strong>exclusivamente</strong> para os membros deste grupo privado. Não aparecerá no feed público geral nem no mapa aberto.
                </p>
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 leading-tight">
                ℹ️ Alerta comunitário geral: ficará visível para toda a cidade no mapa interativo e no feed aberto.
              </p>
            )}
          </div>
        )}

        {/* Incident Type */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">
            {t('report.selectType', 'Tipo de Ocorrência')}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {INCIDENT_TYPES.map(type => {
              const isSelected = selectedType === type.id;
              const colors = COLOR_MAP[type.baseColor];
              const translatedLabel = t(`report.types.${type.id}`, type.label);
              const translatedDesc = t(`report.typesDesc.${type.id}`, type.desc);
              
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
                    {translatedLabel}
                  </span>
                  <span className={`text-[10px] mt-1 relative z-10 transition-colors duration-300 text-center leading-tight ${
                    isSelected ? 'text-slate-300' : 'text-slate-500 group-hover:text-slate-400'
                  }`}>
                    {translatedDesc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">
            {t('report.descTitle', 'Descrição (Opcional)')}
          </h3>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t(`report.typesPlaceholder.${selectedType || 'outro'}`, INCIDENT_TYPES.find(t => t.id === selectedType)?.placeholder || "Forneça mais detalhes sobre o que aconteceu...")}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-28"
          />
        </div>

        {/* Dedicated Voice Audio Message Section */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Mic size={17} className="text-indigo-400" />
              <span>Mensagem de Voz (Opcional)</span>
            </h3>
            <span className="text-[10px] text-indigo-300 font-bold bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
              Até 60s
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Grave um áudio rápido relatando a ocorrência para que outros moradores possam ouvir o que aconteceu.
          </p>
          <VoiceRecorder
            maxDuration={60}
            label={t('report.voiceMessage', 'Pressione para Gravar Áudio de Voz')}
            onAudioRecorded={(audio) => setAudioData(audio)}
          />
        </div>

        {/* Attachments */}
        <ReportMediaSection
          attachments={attachments}
          isCompressingImage={isCompressingImage}
          fileInputRef={fileInputRef}
          galleryInputRef={galleryInputRef}
          videoInputRef={videoInputRef}
          onFileChange={handleFileChange}
          onTriggerInAppCamera={(mode) => {
            setCameraInitialMode(mode);
            setIsInAppCameraOpen(true);
          }}
          onEditImage={setEditingImage}
          onEditVideo={setEditingVideo}
          onRemoveAttachment={removeAttachment}
        />

        
        {/* Submit Button */}
        <div className="mt-auto pt-6 flex flex-col gap-4">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between cursor-pointer" onClick={() => setIsAnonymous(!isAnonymous)}>
            <div>
              <p className="font-bold text-white text-sm">
                {t('report.ghostModeTitle', 'Ocultar minha identidade (Modo Fantasma)')}
              </p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {t('report.ghostModeDesc', 'Você aparecerá como "Morador Anônimo" no feed.')}
              </p>
            </div>
            <button 
              type="button"
              dir="ltr"
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${isAnonymous ? 'bg-blue-500' : 'bg-slate-600'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 left-1 transition-transform ${isAnonymous ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <button
            type="submit"
            disabled={!selectedType || isSubmitting}
            className={`group relative w-full py-4 rounded-2xl font-bold text-white transition-all duration-300 overflow-hidden ${
              !selectedType || isSubmitting
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : visibility === 'group'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-[0.98] shadow-[0_0_20px_rgba(99,102,241,0.4)] border border-indigo-400/40'
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
                    <Loader2 size={18} className="animate-spin text-blue-400 shrink-0" />
                    <span className="text-white font-medium text-xs sm:text-sm">
                      {uploadStatus.phase === 'uploading'
                        ? `Enviando anexo ${uploadStatus.fileIndex}/${uploadStatus.totalFiles} (${uploadStatus.progress}% • ${formatFileSize(uploadStatus.bytesTransferred)}/${formatFileSize(uploadStatus.totalBytes)})`
                        : uploadStatus.phase === 'saving'
                        ? 'Gravando ocorrência no mapa...'
                        : 'Notificando vizinhança...'}
                    </span>
                  </div>
                  {uploadStatus.phase === 'uploading' && (
                    <div className="w-full max-w-[240px] h-1.5 bg-slate-700/80 rounded-full overflow-hidden mt-1">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-400 to-indigo-400 transition-all duration-300" 
                        style={{ width: `${Math.max(4, uploadStatus.progress)}%` }}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center gap-2 text-center">
                  {visibility === 'group' ? <Lock size={18} /> : <Send size={20} />}
                  <span className="truncate">
                    {visibility === 'group'
                      ? `Publicar no Grupo: ${userGroups.find(g => g.id === selectedGroupId)?.name || 'Rede Privada'}`
                      : t('report.submitBtn', 'Enviar Alerta Público Geral')}
                  </span>
                </div>
              )}
            </span>
          </button>
        </div>
      </form>
      
      {/* Upload Progress Modal Overlay */}
      <ReportUploadModal
        isOpen={isSubmitting}
        uploadStatus={uploadStatus}
        onCancel={handleCancelUpload}
      />
      
      {editingImage && (
        <ImageBlurEditor 
          file={editingImage} 
          onSave={(blurredFile) => {
            setAttachments(prev => [...prev.filter(f => f !== editingImage), blurredFile]);
            setEditingImage(null);
          }} 
          onCancel={() => {
            setEditingImage(null);
          }} 
        />
      )}

      {editingVideo && (
        <VideoPrivacyEditor 
          file={editingVideo}
          onSave={(processedFile) => {
            setAttachments(prev => {
              const idx = prev.findIndex(f => f === editingVideo);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = processedFile;
                return next;
              }
              return [...prev, processedFile];
            });
            setEditingVideo(null);
          }}
          onExtractPhoto={(photoFile) => {
            setEditingVideo(null);
            setEditingImage(photoFile);
          }}
          onCancel={() => {
            setAttachments(prev => {
              if (!prev.some(f => f === editingVideo)) {
                return [...prev, editingVideo];
              }
              return prev;
            });
            setEditingVideo(null);
          }}
        />
      )}

      <InAppCameraModal
        isOpen={isInAppCameraOpen}
        initialMode={cameraInitialMode}
        onClose={() => setIsInAppCameraOpen(false)}
        onCapture={handleCameraCapture}
        onFallbackToFilePicker={(fallbackMode) => {
          if (fallbackMode === 'video') {
            videoInputRef.current?.click();
          } else if (fallbackMode === 'gallery') {
            galleryInputRef.current?.click();
          } else {
            fileInputRef.current?.click();
          }
        }}
      />
    </div>
  );
}
