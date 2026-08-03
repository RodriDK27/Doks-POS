import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export function useVoiceSearch(setSearchQuery: (query: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const toggleVoiceSearch = useCallback(async () => {
    if (typeof window === 'undefined') return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('El reconocimiento de voz no es soportado en este navegador.');
      return;
    }

    if (isListeningRef.current) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.error('SpeechRecognition stop error:', err);
        }
      }
      setIsListening(false);
      isListeningRef.current = false;
      return;
    }

    // Solicitar permisos de micrófono
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        let devices = await navigator.mediaDevices.enumerateDevices();
        let audioDevices = devices.filter(d => d.kind === 'audioinput');

        if (audioDevices.length === 0 || !audioDevices[0].label) {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          devices = await navigator.mediaDevices.enumerateDevices();
          audioDevices = devices.filter(d => d.kind === 'audioinput');
        }

        // Buscar dispositivo "D1"
        const d1Device = audioDevices.find(d => d.label.toLowerCase().includes('d1'));

        const constraints = d1Device
          ? { audio: { deviceId: { exact: d1Device.deviceId } } }
          : { audio: true };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        // Detener todas las pistas de audio para liberar el hardware del micrófono
        stream.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) {
            console.error('Error stopping stream track:', e);
          }
        });
      } catch (micErr) {
        console.error('Microphone permission request failed:', micErr);
        toast.error('Permiso de micrófono denegado o no disponible. Habilítalo en tu navegador.');
        return;
      }
    }

    try {
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = 'es-MX';

      recog.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
      };

      recog.onend = () => {
        setIsListening(false);
        isListeningRef.current = false;
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recog.onerror = (event: any) => {
        setIsListening(false);
        isListeningRef.current = false;

        if (event.error === 'not-allowed') {
          toast.error('Permiso de micrófono denegado o bloqueado.');
        } else if (event.error === 'no-speech') {
          toast.error('No se detectó voz. Intenta de nuevo.');
        } else if (event.error === 'network') {
          toast.error('Error de red. Asegúrate de tener conexión a Internet.');
        } else {
          toast.error(`Error de búsqueda por voz: ${event.error}`);
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recog.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const cleanedText = transcript.endsWith('.') ? transcript.slice(0, -1) : transcript;
        setSearchQuery(cleanedText);
        toast.success(`Búsqueda por voz: "${cleanedText}"`);
      };

      recognitionRef.current = recog;
      recog.start();
    } catch (err) {
      console.error('SpeechRecognition start error:', err);
      setIsListening(false);
      isListeningRef.current = false;
    }
  }, [setSearchQuery]);

  return { isListening, toggleVoiceSearch };
}
