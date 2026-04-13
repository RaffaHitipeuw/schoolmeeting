import { useRef, useCallback, useState } from "react";


export function useMediaStream() {
  const streamRef = useRef(null);
  const [isSharing, setIsSharing] = useState(false);
  const [hasCamera, setHasCamera]  = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    stopStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: true,
      });
      streamRef.current = stream;
      setHasCamera(true);
      setIsSharing(false);
      return stream;
    } catch (err) {
      console.error("[useMediaStream] startCamera failed:", err);
      throw err;
    }
  }, [stopStream]);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: false,
      });
      
      stream.getVideoTracks()[0].addEventListener("ended", async () => {
        await startCamera();
        setIsSharing(false);
      });
      streamRef.current = stream;
      setIsSharing(true);
      return stream;
    } catch (err) {
      console.error("[useMediaStream] startScreenShare failed:", err);
      throw err;
    }
  }, [startCamera]);

  return {
    streamRef,
    isSharing,
    hasCamera,
    startCamera,
    startScreenShare,
    stopStream,
  };
}
