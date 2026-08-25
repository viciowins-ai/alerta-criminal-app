import { useState, useRef, useCallback } from 'react';

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const startRecording = useCallback(async (durationMs: number = 15000): Promise<string> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      return new Promise((resolve, reject) => {
        mediaRecorder.current!.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.current.push(event.data);
          }
        };

        mediaRecorder.current!.onstop = () => {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64Audio = reader.result as string;
            // Stop all tracks to release microphone
            stream.getTracks().forEach(track => track.stop());
            resolve(base64Audio);
          };
          reader.onerror = reject;
        };

        mediaRecorder.current!.start();
        setIsRecording(true);

        setTimeout(() => {
          if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
            mediaRecorder.current.stop();
            setIsRecording(false);
          }
        }, durationMs);
      });
    } catch (error) {
      console.warn("Error accessing microphone:", error);
      setIsRecording(false);
      throw error;
    }
  }, []);

  return { isRecording, startRecording };
}
