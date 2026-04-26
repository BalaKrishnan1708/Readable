import { useEffect, useState } from "react";

interface AudioAnalysisProps {
  isRecording: boolean;
  audioData?: {
    pitch_variation: number;
    pause_count: number;
    pause_duration_ms: number;
    speech_rate_wps: number;
  };
}

export const VoiceAnalysisVisualizer = ({
  isRecording,
  audioData,
}: AudioAnalysisProps) => {
  const [bars, setBars] = useState<number[]>(Array(20).fill(0.3));

  // Simulate audio bars animation
  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(() => {
      setBars((prev) =>
        prev.map(() => Math.random() * 0.8 + 0.2)
      );
    }, 100);

    return () => clearInterval(interval);
  }, [isRecording]);

  const getPitchStatus = (pitch: number) => {
    if (pitch < 10) return { status: "Low variation", color: "text-blue-600" };
    if (pitch < 30) return { status: "Normal", color: "text-green-600" };
    if (pitch < 60) return { status: "Good variety", color: "text-emerald-600" };
    return { status: "High variation", color: "text-purple-600" };
  };

  const getSpeechRateStatus = (wps: number) => {
    if (wps < 1) return { status: "Very slow", icon: "🐢" };
    if (wps < 2) return { status: "Slow", icon: "🚶" };
    if (wps < 4) return { status: "Good pace", icon: "🚶‍♂️" };
    if (wps < 6) return { status: "Fast", icon: "🏃" };
    return { status: "Very fast", icon: "🏃‍♂️" };
  };

  const pitchStatus = audioData ? getPitchStatus(audioData.pitch_variation) : null;
  const speechStatus = audioData ? getSpeechRateStatus(audioData.speech_rate_wps) : null;

  return (
    <div className="space-y-4 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200">
      <h3 className="font-semibold text-ink flex items-center gap-2">
        🎤 Voice Analysis
      </h3>

      {isRecording && (
        <>
          {/* Waveform Bars */}
          <div className="flex items-end justify-center gap-1 h-16 p-2 bg-slate-900/5 rounded-lg">
            {bars.map((height, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-gradient-to-t from-sea to-teal-400 transition-all duration-100"
                style={{
                  height: `${height * 100}%`,
                  minHeight: "4px",
                }}
              />
            ))}
          </div>

          {/* Real-time Metrics */}
          <div className="grid gap-2">
            {audioData && (
              <>
                {/* Pitch Variation */}
                <div className="p-3 rounded-lg bg-white/60 border border-white/60">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      Pitch Variation
                    </span>
                    <span
                      className={`text-sm font-semibold ${pitchStatus?.color}`}
                    >
                      {audioData.pitch_variation.toFixed(1)} Hz
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {pitchStatus?.status}
                  </p>
                  <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-purple-500"
                      style={{
                        width: `${Math.min((audioData.pitch_variation / 100) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Speech Rate */}
                <div className="p-3 rounded-lg bg-white/60 border border-white/60">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      Speech Rate {speechStatus?.icon}
                    </span>
                    <span className="text-sm font-semibold text-slate-700">
                      {audioData.speech_rate_wps.toFixed(2)} WPS
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {speechStatus?.status}
                  </p>
                  <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
                      style={{
                        width: `${Math.min((audioData.speech_rate_wps / 6) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Pause Detection */}
                <div className="p-3 rounded-lg bg-white/60 border border-white/60">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      Pauses Detected
                    </span>
                    <span className="text-sm font-semibold text-slate-700">
                      {audioData.pause_count}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Avg: {(audioData.pause_duration_ms / Math.max(audioData.pause_count, 1)).toFixed(0)}ms
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    {Array.from({ length: Math.min(audioData.pause_count, 8) }).map(
                      (_, i) => (
                        <div
                          key={i}
                          className="h-6 flex-1 rounded bg-red-300/60 flex items-center justify-center text-xs"
                        >
                          ⏸
                        </div>
                      )
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Live Tips */}
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-xs font-semibold text-amber-900">
              💡 Keep a steady pace and avoid long pauses for better fluency.
            </p>
          </div>
        </>
      )}

      {!isRecording && (
        <div className="text-center py-6 text-slate-500">
          <p className="text-sm">Voice analysis will appear while recording...</p>
        </div>
      )}
    </div>
  );
};

