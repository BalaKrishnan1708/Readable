import { useCallback, useEffect, useRef, useState } from "react";

import type { GazeFlowPacket, GazeFlowSample, GazeFlowStatus } from "../types/eyeTracking";

interface UseGazeFlowOptions {
  appKey: string;
  port: number;
}

const MAX_SAMPLES = 240;

export const useReadableEyeTracker = ({ appKey, port }: UseGazeFlowOptions) => {
  const [status, setStatus] = useState<GazeFlowStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [authorizationStatus, setAuthorizationStatus] = useState<string | null>(null);
  const [latestSample, setLatestSample] = useState<GazeFlowSample | null>(null);
  const [samples, setSamples] = useState<GazeFlowSample[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const authorizationSeenRef = useRef(false);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  }, []);

  const clearSamples = useCallback(() => {
    setSamples([]);
    setLatestSample(null);
  }, []);

  const connect = useCallback(() => {
    if (typeof window === "undefined" || typeof WebSocket === "undefined") {
      setStatus("error");
      setError("WebSocket is not supported in this browser.");
      return;
    }

    disconnect();
    clearSamples();
    authorizationSeenRef.current = false;
    setAuthorizationStatus(null);
    setError(null);
    setStatus("connecting");

    const socket = new WebSocket(`ws://127.0.0.1:${port}`);
    socketRef.current = socket;

    socket.onopen = () => {
      setStatus("authorizing");
      socket.send(appKey);
    };

    socket.onmessage = (event) => {
      if (!authorizationSeenRef.current) {
        const authMessage = String(event.data);
        authorizationSeenRef.current = true;
        setAuthorizationStatus(authMessage);

        if (!authMessage.toLowerCase().startsWith("ok")) {
          setStatus("error");
          setError(`Readable Eye Tracker authorization failed: ${authMessage}`);
          socket.close();
          return;
        }

        setStatus("connected");
        return;
      }

      try {
        const packet = JSON.parse(String(event.data)) as GazeFlowPacket;
        const sample: GazeFlowSample = {
          ...packet,
          receivedAt: Date.now(),
        };

        setLatestSample(sample);
        setSamples((current) => [...current.slice(-MAX_SAMPLES + 1), sample]);
      } catch {
        setStatus("error");
        setError("Received invalid gaze data from the local eye-tracker service.");
      }
    };

    socket.onerror = () => {
      setStatus("error");
      setError(
        "Unable to connect to the local eye-tracker service. Start the tracker app locally and verify the port.",
      );
    };

    socket.onclose = () => {
      socketRef.current = null;
      if (status !== "error") {
        setStatus(authorizationSeenRef.current ? "closed" : "idle");
      }
    };
  }, [appKey, clearSamples, disconnect, port, status]);

  useEffect(() => () => disconnect(), [disconnect]);

  return {
    status,
    error,
    authorizationStatus,
    latestSample,
    samples,
    connect,
    disconnect,
    clearSamples,
  };
};
