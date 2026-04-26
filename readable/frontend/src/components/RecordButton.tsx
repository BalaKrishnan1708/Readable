import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import toast from "react-hot-toast";

interface RecordButtonProps {
  onStop: (recordedFile: File) => Promise<void> | void;
  label?: string;
  autoStartToken?: number;
  onRecordingStateChange?: (isRecording: boolean) => void;
  onAudioActivityChange?: (isSilent: boolean) => void;
}

export interface RecordButtonHandle {
  start: () => Promise<void>;
  stop: () => void;
}

export const RecordButton = forwardRef<RecordButtonHandle, RecordButtonProps>(
  ({ onStop, label = "Start Recording", autoStartToken, onRecordingStateChange, onAudioActivityChange }, ref) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const stopAudioTracking = () => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    analyserRef.current = null;
    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
    onAudioActivityChange?.(true);
  };

  const startAudioTracking = (stream: MediaStream) => {
    if (typeof window === "undefined" || typeof AudioContext === "undefined") {
      onAudioActivityChange?.(true);
      return;
    }

    stopAudioTracking();

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.85;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.fftSize);

    const tick = () => {
      if (!analyserRef.current) {
        return;
      }

      analyserRef.current.getByteTimeDomainData(data);
      let sumSquares = 0;
      for (const value of data) {
        const normalized = (value - 128) / 128;
        sumSquares += normalized * normalized;
      }
      const rms = Math.sqrt(sumSquares / data.length);
      onAudioActivityChange?.(rms < 0.035);
      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    tick();
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const startRecording = async () => {
    if (isRecording) {
      return;
    }
    if (!navigator.mediaDevices || typeof MediaRecorder === "undefined") {
      const fallbackFile = new File(["mock audio"], "mock-audio.webm", { type: "audio/webm" });
      toast("MediaRecorder unavailable, using a simulated recording.");
      onAudioActivityChange?.(true);
      await onStop(fallbackFile);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], "reading-session.webm", { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        stopAudioTracking();
        setIsRecording(false);
        onRecordingStateChange?.(false);
        await onStop(file);
      };

      startAudioTracking(stream);
      recorder.start();
      setIsRecording(true);
      onRecordingStateChange?.(true);
    } catch (error) {
      const fallbackFile = new File(["permission denied mock"], "mock-audio.webm", {
        type: "audio/webm",
      });
      toast("Microphone access failed, using a simulated recording instead.");
      stopAudioTracking();
      onRecordingStateChange?.(false);
      await onStop(fallbackFile);
    }
  };

  useImperativeHandle(ref, () => ({
    start: startRecording,
    stop: stopRecording,
  }));

  useEffect(() => {
    if (autoStartToken === undefined) {
      return;
    }
    void startRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartToken]);

  useEffect(() => () => stopAudioTracking(), []);

  return (
    <button
      type="button"
      onClick={isRecording ? stopRecording : startRecording}
      className={`rounded-full px-5 py-3 text-sm font-semibold text-white transition ${
        isRecording ? "bg-rose-500 hover:bg-rose-600" : "bg-sea hover:bg-teal-700"
      }`}
    >
      {isRecording ? "Stop Recording" : label}
    </button>
  );
});

RecordButton.displayName = "RecordButton";
