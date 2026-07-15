import { useState, useCallback } from "react";
import Tesseract from "tesseract.js";

export function useImageOCR(onText: (text: string) => void) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const processImage = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const result = await Tesseract.recognize(file, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const text = result.data.text.trim();
      if (!text) {
        setError("No text found in image.");
      } else {
        onText(text);
      }
    } catch (err) {
      setError("Failed to extract text from image.");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [onText]);

  return { isProcessing, progress, error, processImage };
}
