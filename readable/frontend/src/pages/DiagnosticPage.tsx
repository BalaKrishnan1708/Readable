import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Rocket, 
  PlayCircle, 
  Square, 
  Award, 
  Sparkles, 
  Mic,
  Activity,
  ArrowRight
} from "lucide-react";

import { startDiagnostic, submitDiagnostic } from "../api/sessions";
import { useEyeTracker } from "../hooks/useEyeTracker";
import { useStudentProfileQuery } from "../hooks/useProfileQueries";
import { ErrorBanner } from "../components/ErrorBanner";
import { getErrorMessage } from "../lib/errors";
import { DiagnosticReport } from "../components/DiagnosticReport";
import { authStore } from "../stores/authStore";
import type { SessionResult } from "../types/session";

const PHONICS_WORDS = ["Bright", "Sparkle", "Center"];

export const DiagnosticPage = () => {
  const queryClient = useQueryClient();
  const user = authStore((state) => state.user);
  const studentId = user?.id;
  const profileQuery = useStudentProfileQuery(studentId);
  const studentProfile = profileQuery.data;

  const [phase, setPhase] = useState<"landing" | "active" | "phonics" | "reporting">("landing");
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [phonicsStep, setPhonicsStep] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const passageRef = useRef<HTMLDivElement>(null);

  const tracker = useEyeTracker({
    isEnabled: phase === "active",
    targetRef: passageRef,
    onGazeUpdate: (gaze) => {
      if (gaze.wordIndex !== null) {
        setActiveWordIndex(gaze.wordIndex);
      }
    },
  });

  const startMutation = useMutation({
    mutationFn: startDiagnostic,
    onSuccess: () => {
      setPhase("active");
    },
  });

  const submitMutation = useMutation({
    mutationFn: (payload: { sessionId: number; audio: File; eyeTrackingData: any }) =>
      submitDiagnostic(payload.sessionId, payload.audio, payload.eyeTrackingData),
    onSuccess: (data) => {
      setSessionResult(data.result);
      setPhase("reporting");
      void queryClient.invalidateQueries({ queryKey: ["student-profile", studentId] });
      void queryClient.invalidateQueries({ queryKey: ["student-progress", studentId] });
    },
  });

  const beginDiagnostic = () => {
    startMutation.mutate();
  };

  const startTest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
        
        // Transition to phonics ONLY after audio is ready
        setPhase("phonics");
        startPhonicsCountdown();
      };

      recorder.start(1000); // Send data every 1 second
      setIsRecording(true);
      tracker.startTracking();
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  };

  const stopTest = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    tracker.stopTracking();
  };

  const startPhonicsCountdown = useCallback(() => {
    let count = 3;
    setCountdown(count);
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(interval);
        setCountdown(null);
        speakPhonics(PHONICS_WORDS[phonicsStep]);
      }
    }, 1000);
  }, [phonicsStep]);

  const speakPhonics = (word: string) => {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const completePhonics = () => {
    const finalAudio = audioBlob 
      ? new File([audioBlob], "session.wav", { type: "audio/wav" })
      : new File([], "silent.wav", { type: "audio/wav" });

    if (startMutation.data) {
      submitMutation.mutate({
        sessionId: startMutation.data.session_id,
        audio: finalAudio,
        eyeTrackingData: { samples: tracker.samples },
      });
    }
  };

  const passage = startMutation.data?.expected_text;
  const passageParagraphs = useMemo(() => {
    if (!passage) return [];
    return passage.split("\n\n").map((p) => p.trim().split(/\s+/));
  }, [passage]);

  const recentDiagnostics = (studentProfile?.recent_sessions ?? [])
    .filter((s) => s.session_type === "diagnostic")
    .slice(0, 3);

  if (phase === "reporting" && sessionResult && studentProfile) {
    return (
      <div className="space-y-8 py-4">
        <div className="flex items-center justify-between border-b-4 border-slate-200 pb-6">
          <h1 className="text-4xl font-black text-slate-900">Quest Report</h1>
          <button
            onClick={() => setPhase("landing")}
            className="btn-3d rounded-2xl bg-slate-800 border-slate-900 px-6 py-3 font-black text-white"
          >
            Done
          </button>
        </div>
        <DiagnosticReport result={sessionResult} profile={studentProfile} />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {phase === "landing" ? (
        <>
          <section className="card-clean p-12 bg-white relative overflow-hidden">
            <div className="grid gap-12 lg:grid-cols-2 items-center relative z-10">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-sky-100 border-2 border-sky-200 px-4 py-1.5 mb-6">
                  <Sparkles className="w-5 h-5 text-sky-600" />
                  <span className="text-xs font-black uppercase tracking-widest text-sky-600">Reading Quest</span>
                </div>
                <h1 className="text-6xl font-black text-slate-900 leading-[1.1] tracking-tight">
                  Ready to show your <span className="text-sky-500">Super Powers?</span>
                </h1>
                <p className="mt-8 text-xl font-bold text-slate-500 leading-relaxed max-w-xl">
                  We'll track your eyes and voice while you read a fun story. It only takes 5 minutes!
                </p>
                <div className="mt-12 flex flex-wrap gap-6">
                  <button
                    onClick={beginDiagnostic}
                    disabled={startMutation.isPending}
                    className="btn-3d rounded-[2rem] bg-emerald-500 border-emerald-600 px-12 py-6 text-2xl font-black text-white hover:bg-emerald-400 active:bg-emerald-600"
                  >
                    {startMutation.isPending ? "Getting ready..." : "Launch Quest!"}
                  </button>
                </div>
              </div>
              <div className="flex justify-center">
                <motion.img 
                  animate={{ y: [0, -20, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  src="/diagnostic-mascot.png" 
                  alt="Mascot" 
                  className="w-full max-w-[400px] drop-shadow-2xl"
                />
              </div>
            </div>
          </section>

          <section className="mt-12">
            <div className="flex items-center gap-4 mb-8">
              <Award className="w-8 h-8 text-amber-500" />
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest">Your Achievement History</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {recentDiagnostics.length > 0 ? (
                recentDiagnostics.map((session) => (
                  <div key={session.session_id} className="card-clean p-8 bg-slate-50 border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                      {new Date(session.started_at).toLocaleDateString()}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black text-slate-900">Quest #{String(session.session_id).slice(-4)}</span>
                      <div className="h-10 w-10 rounded-xl bg-white border-2 border-slate-200 flex items-center justify-center font-black text-emerald-500">
                        ✓
                      </div>
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-2xl p-4 border-2 border-slate-200 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Accuracy</p>
                        <p className="text-xl font-black text-slate-900">{session.accuracy_pct}%</p>
                      </div>
                      <div className="bg-white rounded-2xl p-4 border-2 border-slate-200 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Speed</p>
                        <p className="text-xl font-black text-slate-900">{session.speed_wpm}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="md:col-span-3 card-clean p-12 text-center bg-slate-50 border-dashed border-slate-300">
                  <p className="text-xl font-bold text-slate-400">Your mission reports will appear here!</p>
                </div>
              )}
            </div>
          </section>
        </>
      ) : null}

      {phase === "active" && passage ? (
        <section className="fixed inset-0 z-50 flex bg-white">
          {/* Vertical Control Bar - Left Side */}
          <div className="w-24 border-r-4 border-slate-100 bg-slate-50 flex flex-col items-center py-10 gap-6">
            <div className="h-14 w-14 rounded-2xl bg-sky-500 border-b-4 border-sky-600 flex items-center justify-center text-white mb-4">
              <Rocket className="w-8 h-8" />
            </div>
            
            <div className="flex-1 flex flex-col gap-6">
              {!isRecording ? (
                <button
                  onClick={startTest}
                  className="btn-3d flex flex-col items-center justify-center gap-2 rounded-2xl bg-emerald-500 border-emerald-600 w-16 h-24 text-white hover:bg-emerald-400 transition-all"
                >
                  <PlayCircle className="w-8 h-8" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Start</span>
                </button>
              ) : (
                <button
                  onClick={stopTest}
                  className="btn-3d flex flex-col items-center justify-center gap-2 rounded-2xl bg-rose-500 border-rose-600 w-16 h-24 text-white hover:bg-rose-400 animate-pulse transition-all"
                >
                  <Square className="w-8 h-8 fill-current" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Stop</span>
                </button>
              )}
            </div>

            <div className="mt-auto flex flex-col items-center gap-3 pb-4">
               <div className="h-10 w-10 rounded-full border-4 border-slate-200 flex items-center justify-center">
                  <div className={`h-3 w-3 rounded-full ${isRecording ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}`} />
               </div>
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Live</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col relative">
            {/* Gaze Pointer (GazePointer Visualizer) */}
            {phase === "active" && tracker.latestGaze && (
              <motion.div
                animate={{ 
                  x: tracker.latestGaze.x - 24, 
                  y: tracker.latestGaze.y - 24 
                }}
                transition={{ type: "spring", damping: 30, stiffness: 200, mass: 0.5 }}
                className="fixed top-0 left-0 w-12 h-12 rounded-full border-2 border-sky-400 bg-sky-400/20 pointer-events-none z-[60] flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.5)]"
              >
                <div className="w-2 h-2 rounded-full bg-sky-500 shadow-sm" />
                {/* Orbital ring */}
                <div className="absolute inset-[-4px] rounded-full border border-sky-300/30 animate-spin-slow" />
              </motion.div>
            )}

            <header className="flex items-center justify-between border-b-4 border-slate-100 px-12 py-6">
               <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Reading Quest</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <div className={`h-2 w-2 rounded-full ${
                      tracker.status === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                      tracker.status === 'error' ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'
                    }`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                      tracker.status === 'connected' ? 'text-emerald-600' : 
                      tracker.status === 'error' ? 'text-rose-500' : 'text-amber-500'
                    }`}>
                      {tracker.status === 'connected' ? 'Sensors Online & Recording' : 
                       tracker.status === 'error' ? 'Tracker Offline (Check Port 43333)' : 
                       'Syncing with GazePointer...'}
                    </span>
                  </div>
               </div>
               <div className="flex items-center gap-10">
                  <div className="flex flex-col items-end">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Gaze Telemetry</p>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`h-1 w-5 rounded-full transition-colors ${tracker.samples.length > (i*25) ? 'bg-sky-500' : 'bg-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={() => setPhase("landing")}
                    className="text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest border-b-2 border-transparent hover:border-rose-200 transition-all"
                  >
                    Abort
                  </button>
               </div>
            </header>

            <div className="flex-1 overflow-y-auto px-12 py-12 flex justify-center bg-[#fdfdfd]">
              <motion.div 
                ref={passageRef}
                initial={{ opacity: 0.8 }}
                animate={{ opacity: isRecording ? 1 : 0.8 }}
                className={`w-full max-w-5xl card-clean p-24 bg-white relative transition-all duration-700 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] ${!isRecording ? 'blur-[2px] grayscale-[0.5]' : ''}`}
              >
                {isRecording && (
                   <div className="absolute top-10 left-10 flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-emerald-50 border-2 border-emerald-200 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                      <Activity className="w-4 h-4 animate-bounce" />
                      Tracking Gaze
                   </div>
                )}
                
                <div className="space-y-16 text-center text-[2.75rem] font-black leading-[2.6] text-slate-800 tracking-tight">
                  {passageParagraphs.map((paragraph, pi) => (
                    <p key={pi}>
                      {paragraph.map((word, wi) => {
                        const idx = pi * 100 + wi;
                        return (
                          <span 
                            key={idx}
                            data-word-index={idx}
                            className={`inline-block px-3 py-1 rounded-2xl transition-all duration-300 ${
                              activeWordIndex === idx 
                                ? 'bg-sky-100 text-sky-600 scale-110 ring-4 ring-sky-200 shadow-sm' 
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            {word}{" "}
                          </span>
                        );
                      })}
                    </p>
                  ))}
                </div>

                {!isRecording && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[2px] rounded-[3rem] z-20">
                     <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center bg-white p-12 rounded-[2.5rem] shadow-2xl border-2 border-slate-100"
                     >
                        <div className="h-24 w-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                           <PlayCircle className="w-16 h-16 text-emerald-500 animate-pulse" />
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 leading-tight">Begin Quest</h3>
                        <p className="text-slate-500 font-bold mt-2 max-w-xs mx-auto">Click the green <span className="text-emerald-500">Start</span> button on the left to begin your recording!</p>
                        <div className="mt-8 flex items-center justify-center gap-4 text-slate-300">
                           <Mic className="w-5 h-5" />
                           <div className="h-1 w-1 bg-slate-300 rounded-full" />
                           <Activity className="w-5 h-5" />
                        </div>
                     </motion.div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </section>
      ) : null}

      {phase === "phonics" ? (
        <section className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-sky-500 text-white p-10">
          <AnimatePresence mode="wait">
            {countdown !== null ? (
              <motion.div
                key="countdown"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                className="text-center"
              >
                <p className="text-3xl font-black uppercase tracking-[0.5em] mb-12">Get Ready!</p>
                <span className="text-[25rem] font-black leading-none drop-shadow-2xl">{countdown}</span>
              </motion.div>
            ) : (
              <motion.div
                key="word-display"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-4xl text-center"
              >
                <p className="text-2xl font-black uppercase tracking-[0.5em] mb-16 text-sky-100">Repeat after me!</p>
                
                <div className="card-clean p-24 bg-white text-slate-900 border-none shadow-[0_20px_0_0_#0ea5e9]">
                  <h3 className="text-[10rem] font-black leading-tight tracking-tight mb-12">
                    {PHONICS_WORDS[phonicsStep]}
                  </h3>
                  <button 
                    onClick={() => speakPhonics(PHONICS_WORDS[phonicsStep])}
                    className="btn-3d rounded-2xl bg-sky-100 border-sky-200 px-10 py-5 text-xl font-black text-sky-600"
                  >
                    Listen Again 🔊
                  </button>
                </div>

                <div className="mt-20 flex justify-between items-center w-full max-w-2xl mx-auto">
                  <div className="flex gap-4">
                    {PHONICS_WORDS.map((_, i) => (
                      <div key={i} className={`h-4 w-12 rounded-full border-2 border-white/50 ${i <= phonicsStep ? 'bg-white' : 'bg-white/20'}`} />
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      if (phonicsStep < PHONICS_WORDS.length - 1) {
                        setPhonicsStep(s => s + 1);
                        startPhonicsCountdown();
                      } else {
                        completePhonics();
                      }
                    }}
                    className="btn-3d rounded-2xl bg-emerald-400 border-emerald-500 px-12 py-6 text-2xl font-black text-white hover:bg-emerald-300"
                  >
                    {phonicsStep < PHONICS_WORDS.length - 1 ? "Next Word" : "I'm Done! ✨"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      ) : null}

      {startMutation.isError && <ErrorBanner message={getErrorMessage(startMutation.error)} />}
      {submitMutation.isError && <ErrorBanner message={getErrorMessage(submitMutation.error)} />}
    </div>
  );
};
