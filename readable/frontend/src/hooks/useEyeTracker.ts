import { useState, useCallback, useRef, useEffect } from "react";
import { useReadableEyeTracker } from "./useGazeFlow";

interface EyeTrackerOptions {
  isEnabled: boolean;
  targetRef: React.RefObject<HTMLElement>;
  onGazeUpdate: (gaze: { wordIndex: number | null }) => void;
  port?: number;
}

/**
 * Maps GazePointer coordinates to browser viewport coordinates.
 * Handles both Absolute (pixels) and Normalized (0-1) coordinates.
 */
const mapToViewport = (gazeX: number, gazeY: number) => {
  let absX = gazeX;
  let absY = gazeY;

  // Detect normalized coordinates (0 to 1) and scale to screen pixels
  if (Math.abs(gazeX) <= 1.01 && Math.abs(gazeY) <= 1.01) {
    absX = gazeX * window.screen.width;
    absY = gazeY * window.screen.height;
  }

  const horizontalChrome = Math.max(window.outerWidth - window.innerWidth, 0);
  const verticalChrome = Math.max(window.outerHeight - window.innerHeight, 0);
  const sideBorder = horizontalChrome / 2;
  const topChrome = Math.max(verticalChrome - sideBorder, 0);

  return {
    x: absX - window.screenX - sideBorder,
    y: absY - window.screenY - topChrome,
  };
};

export const useEyeTracker = ({ isEnabled, targetRef, onGazeUpdate, port = 43333 }: EyeTrackerOptions) => {
  const [samples, setSamples] = useState<any[]>([]);
  const [latestGaze, setLatestGaze] = useState<{ x: number; y: number } | null>(null);
  const isTrackingRef = useRef(false);

  const { latestSample, status, connect, disconnect } = useReadableEyeTracker({
    appKey: "AppKeyTrial", // GazePointer default
    port: port, 
  });

  useEffect(() => {
    if (isEnabled) {
      connect();
    } else {
      disconnect();
    }
  }, [isEnabled, connect, disconnect]);

  const startTracking = useCallback(() => {
    isTrackingRef.current = true;
    setSamples([]);
  }, []);

  const stopTracking = useCallback(() => {
    isTrackingRef.current = false;
  }, []);

  // Process Gaze Samples
  useEffect(() => {
    if (!isEnabled || !latestSample) return;

    // Use normalized-aware mapper
    const { x, y } = mapToViewport(latestSample.GazeX, latestSample.GazeY);
    setLatestGaze({ x, y });

    if (isTrackingRef.current) {
      const element = document.elementFromPoint(x, y);
      const wordSpan = element?.closest("[data-word-index]");
      
      if (wordSpan) {
        const wordIndex = parseInt((wordSpan as HTMLElement).dataset.wordIndex || "-1", 10);
        if (wordIndex !== -1) {
          onGazeUpdate({ wordIndex });
        }
      }

      setSamples(prev => [...prev, { x, y, ts: Date.now() }]);
    }
  }, [isEnabled, latestSample, onGazeUpdate]);

  // Mouse Fallback
  useEffect(() => {
    if (!isEnabled || status === "connected" || latestSample) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (latestSample) return;
      
      setLatestGaze({ x: e.clientX, y: e.clientY });

      if (isTrackingRef.current) {
        const element = document.elementFromPoint(e.clientX, e.clientY);
        const wordSpan = element?.closest("[data-word-index]");
        
        if (wordSpan) {
          const wordIndex = parseInt((wordSpan as HTMLElement).dataset.wordIndex || "-1", 10);
          if (wordIndex !== -1) {
            onGazeUpdate({ wordIndex });
          }
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isEnabled, latestSample, status, onGazeUpdate]);

  return {
    samples,
    latestGaze,
    status,
    startTracking,
    stopTracking,
  };
};
