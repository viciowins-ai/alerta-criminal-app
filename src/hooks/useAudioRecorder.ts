import { useState, useRef, useCallback, useEffect } from 'react';

function getSupportedMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
    'audio/ogg'
  ];
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return '';
}

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const activeStream = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);
  const selectedMimeType = useRef<string>('audio/webm');
  const resolvePromiseRef = useRef<((val: string | null) => void) | null>(null);

  // Limpa timer se desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (activeStream.current) {
        activeStream.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const finalizeRecording = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setSecondsLeft(0);

      const recorder = mediaRecorder.current;
      if (!recorder || recorder.state === 'inactive') {
        setIsRecording(false);
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        try {
          const type = selectedMimeType.current || 'audio/webm';
          const audioBlob = new Blob(audioChunks.current, { type });
          
          if (audioBlob.size === 0) {
            setIsRecording(false);
            if (activeStream.current) {
              activeStream.current.getTracks().forEach(t => t.stop());
            }
            resolve(null);
            return;
          }

          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64Audio = reader.result as string;
            if (activeStream.current) {
              activeStream.current.getTracks().forEach(t => t.stop());
              activeStream.current = null;
            }
            setIsRecording(false);
            resolve(base64Audio);
          };
          reader.onerror = () => {
            setIsRecording(false);
            resolve(null);
          };
        } catch (err) {
          console.error("Erro ao processar blob de áudio:", err);
          setIsRecording(false);
          resolve(null);
        }
      };

      try {
        recorder.stop();
      } catch (err) {
        console.warn("Erro ao parar recorder:", err);
        setIsRecording(false);
        resolve(null);
      }
    });
  }, []);

  const startRecording = useCallback(async (durationMs: number = 10000): Promise<string | null> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn("Microfone não suportado no navegador.");
        return null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      activeStream.current = stream;

      const mimeType = getSupportedMimeType();
      selectedMimeType.current = mimeType || 'audio/webm';

      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(stream, options);
      mediaRecorder.current = recorder;
      audioChunks.current = [];

      const totalSeconds = Math.ceil(durationMs / 1000);
      setSecondsLeft(totalSeconds);
      setIsRecording(true);

      return new Promise((resolve) => {
        resolvePromiseRef.current = resolve;

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunks.current.push(event.data);
          }
        };

        // Inicia contagem regressiva
        let remaining = totalSeconds;
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          remaining -= 1;
          setSecondsLeft(remaining > 0 ? remaining : 0);
          if (remaining <= 0) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            finalizeRecording().then((res) => {
              if (resolvePromiseRef.current) {
                resolvePromiseRef.current(res);
                resolvePromiseRef.current = null;
              }
            });
          }
        }, 1000);

        recorder.start(1000); // chunk a cada 1s
      });
    } catch (error) {
      console.warn("Acesso ao microfone negado ou falhou:", error);
      setIsRecording(false);
      setSecondsLeft(0);
      return null;
    }
  }, [finalizeRecording]);

  return { isRecording, secondsLeft, startRecording, stopRecording: finalizeRecording };
}
