import { useRef, useState } from "react";
import toast from "react-hot-toast";

interface RecordButtonProps {
  onStop: (recordedFile: File) => Promise<void> | void;
  label?: string;
}

export const RecordButton = ({ onStop, label = "Start Recording" }: RecordButtonProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices || typeof MediaRecorder === "undefined") {
      const fallbackFile = new File(["mock audio"], "mock-audio.webm", { type: "audio/webm" });
      toast("MediaRecorder unavailable, using a simulated recording.");
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
        setIsRecording(false);
        await onStop(file);
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      const fallbackFile = new File(["permission denied mock"], "mock-audio.webm", {
        type: "audio/webm",
      });
      toast("Microphone access failed, using a simulated recording instead.");
      await onStop(fallbackFile);
    }
  };

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
};
