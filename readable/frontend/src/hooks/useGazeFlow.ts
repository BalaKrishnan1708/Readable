import { useCallback, useEffect, useRef, useState } from "react";

import type { GazeFlowPacket, GazeFlowSample, GazeFlowStatus } from "../types/eyeTracking";

interface UseGazeFlowOptions {
  appKey: string;
  port: number;
}

const MAX_SAMPLES = 240;

export const useReadableEyeTracker = ({ appKey = "AppKeyTrial", port = 43333 }: Partial<UseGazeFlowOptions>) => {
  const [status, setStatus] = useState<GazeFlowStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [authorizationStatus, setAuthorizationStatus] = useState<string | null>(null);
  const [latestSample, setLatestSample] = useState<GazeFlowSample | null>(null);
  const [samples, setSamples] = useState<GazeFlowSample[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const authorizationSeenRef = useRef(false);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.onclose = null;
      socketRef.current.close();
      socketRef.current = null;
    }
    setStatus("closed");
  }, []);

  const clearSamples = useCallback(() => {
    setSamples([]);
    setLatestSample(null);
  }, []);

  const connect = useCallback(() => {
    if (typeof window === "undefined" || typeof WebSocket === "undefined") {
      setStatus("error");
      setError("WebSocket is not supported.");
      return;
    }

    if (socketRef.current && socketRef.current.readyState <= WebSocket.OPEN) {
      return;
    }

    disconnect();
    clearSamples();
    authorizationSeenRef.current = false;
    setAuthorizationStatus(null);
    setError(null);
    setStatus("connecting");

    try {
      const socket = new WebSocket(`ws://127.0.0.1:${port}`);
      socketRef.current = socket;

      socket.onopen = () => {
        setStatus("authorizing");
        socket.send(appKey);
      };

      socket.onmessage = (event) => {
        const data = String(event.data).trim();
        
        // 1. Detect JSON Packet (Standard GazePointer/GazeFlow)
        if (data.startsWith("{")) {
          try {
            const raw = JSON.parse(data);
            
            // Normalize property names (GazePointer vs GazeFlow)
            const packet: GazeFlowPacket = {
              GazeX: raw.GazeX ?? raw.x ?? raw.GazePointX ?? 0,
              GazeY: raw.GazeY ?? raw.y ?? raw.GazePointY ?? 0,
              HeadX: raw.HeadX ?? 0,
              HeadY: raw.HeadY ?? 0,
              HeadZ: raw.HeadZ ?? 0,
              HeadYaw: raw.HeadYaw ?? 0,
              HeadPitch: raw.HeadPitch ?? 0,
              HeadRoll: raw.HeadRoll ?? 0
            };

            const sample: GazeFlowSample = {
              ...packet,
              receivedAt: Date.now(),
            };

            if (!authorizationSeenRef.current) {
              authorizationSeenRef.current = true;
              setStatus("connected");
            }

            setLatestSample(sample);
            setSamples((current) => [...current.slice(-MAX_SAMPLES + 1), sample]);
            return;
          } catch (e) {
            console.error("GazePointer JSON parse error:", e);
          }
        }

        // 2. Detect String Packet (Legacy GazePointer)
        // Format example: "GazeX:100;GazeY:200"
        if (data.includes("GazeX") || data.includes("GazeY")) {
          const parts = data.split(/[;,]/);
          const raw: any = {};
          parts.forEach(p => {
            const [k, v] = p.split(":");
            if (k && v) raw[k.trim()] = parseFloat(v.trim());
          });

          if (raw.GazeX !== undefined || raw.GazeY !== undefined) {
             const sample: GazeFlowSample = {
                GazeX: raw.GazeX ?? 0,
                GazeY: raw.GazeY ?? 0,
                HeadX: 0, HeadY: 0, HeadZ: 0,
                HeadYaw: 0, HeadPitch: 0, HeadRoll: 0,
                receivedAt: Date.now()
             };
             if (!authorizationSeenRef.current) {
                authorizationSeenRef.current = true;
                setStatus("connected");
             }
             setLatestSample(sample);
             return;
          }
        }

        // 3. Handle Auth Handshake
        if (!authorizationSeenRef.current) {
          if (data.toLowerCase().startsWith("ok")) {
            authorizationSeenRef.current = true;
            setAuthorizationStatus(data);
            setStatus("connected");
          } else if (data.toLowerCase().startsWith("error")) {
            setStatus("error");
            setError(`GazePointer: ${data}`);
            socket.close();
          }
          // Some trackers just send "Connected" or "Hello"
          else if (data.length > 0 && data.length < 50) {
             console.log("GazePointer Handshake:", data);
             authorizationSeenRef.current = true;
             setStatus("connected");
          }
        }
      };

      socket.onerror = () => {
        setStatus("error");
        setError("GazePointer connection failed. Check if tracker is running.");
      };

      socket.onclose = () => {
        socketRef.current = null;
        setStatus(prev => prev === "error" ? "error" : "closed");
      };
    } catch (e) {
      setStatus("error");
      setError("Failed to create WebSocket.");
    }
  }, [appKey, clearSamples, disconnect, port]);

  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

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
