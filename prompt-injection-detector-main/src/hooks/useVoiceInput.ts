import { useState, useRef, useCallback } from "react";

export function useVoiceInput(onTranscript: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<any>(null);

  const start = useCallback(async () => {
    setError(null);
    setInterimText("");

    // Request mic permission first
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Microphone access denied. Please allow microphone in browser settings.");
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition not supported. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (e: any) => {
      let interim = "";
      let final = "";

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          final += t;
        } else {
          interim += t;
        }
      }

      if (interim) setInterimText(interim);

      if (final) {
        setInterimText("");
        onTranscript(final.trim());
      }
    };

    recognition.onerror = (e: any) => {
      console.error("Speech error:", e.error, e);
      if (e.error === "not-allowed") {
        setError("Microphone permission denied.");
      } else if (e.error !== "no-speech") {
        setError(`Error: ${e.error}`);
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInterimText("");
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      setError("Could not start voice recognition.");
      setIsRecording(false);
    }
  }, [onTranscript]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
    setInterimText("");
  }, []);

  return { isRecording, error, interimText, start, stop };
}
