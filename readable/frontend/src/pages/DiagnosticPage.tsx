import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { PlayCircle, Award, Sparkles, Square } from "lucide-react";

import { startDiagnostic, submitDiagnostic } from "../api/sessions";
import { ErrorBanner } from "../components/ErrorBanner";
import { DiagnosticReport } from "../components/DiagnosticReport";
import { useReadableEyeTracker } from "../hooks/useGazeFlow";
import { useStudentProfileQuery } from "../hooks/useProfileQueries";
import { getErrorMessage } from "../lib/errors";
import { authStore } from "../stores/authStore";
import { profileStore } from "../stores/profileStore";
import { sessionStore } from "../stores/sessionStore";
import type { GazeFlowSample } from "../types/eyeTracking";

const sentenceSplitPattern = /(?<=[.!?])\s+/;

const buildParagraphs = (passage: string): string[][] => {
  const sentences = passage
    .split(sentenceSplitPattern)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const grouped: string[][] = [];
  for (let index = 0; index < sentences.length; index += 2) {
    grouped.push(sentences.slice(index, index + 2).join(" ").split(/\s+/).filter(Boolean));
  }

  return grouped;
};

const screenToViewport = (sample: GazeFlowSample): { x: number; y: number } => {
  const horizontalChrome = Math.max(window.outerWidth - window.innerWidth, 0);
  const verticalChrome = Math.max(window.outerHeight - window.innerHeight, 0);
  const sideBorder = horizontalChrome / 2;
  const topChrome = Math.max(verticalChrome - sideBorder, 0);

  return {
    x: sample.GazeX - window.screenX - sideBorder,
    y: sample.GazeY - window.screenY - topChrome,
  };
};

const analysisSteps = [
  "Reading the voice timing and pauses",
  "Tracing gaze movement across the passage",
  "Turning the session into a support plan",
] as const;

export const DiagnosticPage = () => {
  const user = authStore((state) => state.user);
  const profileQuery = useStudentProfileQuery(user?.id);
  const {
    currentSession,
    sessionResults,
    eyeTrackingFocusEvents,
    setCurrentSession,
    setSessionResults,
    addEyeTrackingFocusEvent,
    clearEyeTrackingFocusEvents,
  } = sessionStore();
  const studentProfile = profileStore((state) => state.studentProfile);
  const setStudentProfile = profileStore((state) => state.setStudentProfile);
  const [appKey] = useState(
    import.meta.env.VITE_READABLE_EYE_TRACKER_APP_KEY ??
      import.meta.env.VITE_GAZEFLOW_APP_KEY ??
      "AppKeyTrial",
  );
  const [port] = useState(
    import.meta.env.VITE_READABLE_EYE_TRACKER_PORT ??
      import.meta.env.VITE_GAZEFLOW_PORT ??
      "43333",
  );
  const [phase, setPhase] = useState<"landing" | "active" | "processing" | "report">(() => {
    if (sessionResults) {
      return "report";
    }
    if (currentSession?.expectedText) {
      return "active";
    }
    return "landing";
  });
  const [processingIndex, setProcessingIndex] = useState(0);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [gazeDot, setGazeDot] = useState<{ x: number; y: number } | null>(null);
  const [focusedWordCounts, setFocusedWordCounts] = useState<Record<number, number>>({});
  const passageRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const tracker = useReadableEyeTracker({
    appKey,
    port: Number.parseInt(port, 10) || 43333,
  });

  useEffect(() => {
    if (profileQuery.data) {
      setStudentProfile(profileQuery.data);
    }
  }, [profileQuery.data, setStudentProfile]);

  useEffect(() => {
    if (phase !== "processing") {
      return;
    }

    const interval = window.setInterval(() => {
      setProcessingIndex((current) => (current + 1) % analysisSteps.length);
    }, 1400);

    return () => window.clearInterval(interval);
  }, [phase]);

  const startMutation = useMutation({
    mutationFn: startDiagnostic,
    onMutate: () => {
      setSessionResults(null);
      setPhase("landing");
    },
    onSuccess: (response) => {
      setCurrentSession({
        sessionId: response.session_id,
        sessionType: "diagnostic",
        expectedText: response.expected_text,
      });
      setSessionResults(null);
      setActiveWordIndex(null);
      setGazeDot(null);
      setFocusedWordCounts({});
      clearEyeTrackingFocusEvents();
      tracker.clearSamples();
      setPhase("active");
      toast.success("Diagnostic passage ready.");
    },
  });

  const submitMutation = useMutation({
    mutationFn: ({ file, eyePayload }: { file: File; eyePayload: Record<string, unknown> }) =>
      submitDiagnostic(currentSession?.sessionId ?? -1, file, eyePayload),
    onSuccess: (response) => {
      setSessionResults(response.result);
      setStudentProfile(response.profile);
      setCurrentSession(null);
      clearEyeTrackingFocusEvents();
      setActiveWordIndex(null);
      setGazeDot(null);
      setFocusedWordCounts({});
      tracker.clearSamples();
      setPhase("report");
    },
    onError: () => {
      setPhase("active");
      tracker.disconnect();
    },
  });

  const passage = currentSession?.expectedText ?? "";
  const passageParagraphs = useMemo(() => buildParagraphs(passage), [passage]);
  const passageWords = useMemo(
    () => passage.split(/\s+/).filter(Boolean).map((word) => word.replace(/[.,!?]/g, "")),
    [passage],
  );
  const topFocusedWords = useMemo(
    () =>
      Object.entries(focusedWordCounts)
        .map(([index, count]) => ({
          word: passageWords[Number(index)] ?? `Word ${Number(index) + 1}`,
          count,
        }))
        .sort((left, right) => right.count - left.count)
        .slice(0, 5),
    [focusedWordCounts, passageWords],
  );

  const recentDiagnostics = useMemo(
    () =>
      (profileQuery.data?.recent_sessions ?? [])
        .filter((session) => session.session_type === "diagnostic")
        .slice(0, 6),
    [profileQuery.data?.recent_sessions],
  );

  useEffect(() => {
    if (!tracker.latestSample || !passageRef.current || phase !== "active") {
      return;
    }

    const viewport = screenToViewport(tracker.latestSample);
    const rect = passageRef.current.getBoundingClientRect();
    const insidePassage =
      viewport.x >= rect.left &&
      viewport.x <= rect.right &&
      viewport.y >= rect.top &&
      viewport.y <= rect.bottom;

    setGazeDot(
      insidePassage
        ? {
            x: viewport.x - rect.left,
            y: viewport.y - rect.top,
          }
        : null,
    );

    const element = document.elementFromPoint(viewport.x, viewport.y) as HTMLElement | null;
    const wordElement = element?.closest<HTMLElement>("[data-word-index]");
    if (!wordElement) {
      return;
    }

    const wordIndex = Number(wordElement.dataset.wordIndex);
    if (Number.isNaN(wordIndex)) {
      return;
    }

    setActiveWordIndex(wordIndex);
    addEyeTrackingFocusEvent({
      wordIndex,
      timestamp: tracker.latestSample.receivedAt,
    });
    setFocusedWordCounts((current) => ({
      ...current,
      [wordIndex]: (current[wordIndex] ?? 0) + 1,
    }));
  }, [addEyeTrackingFocusEvent, phase, tracker.latestSample]);

  const buildEyeTrackingPayload = (): Record<string, unknown> => {
    const samples = tracker.samples.slice(-180).map((sample) => ({
      ...sample,
      viewport: screenToViewport(sample),
    }));

    return {
      provider: "readable_local_eye_tracker",
      source: "local_webcam_service",
      authorization_status: tracker.authorizationStatus,
      connection_status: tracker.status,
      sample_count: tracker.samples.length,
      focused_word_hits: topFocusedWords,
      focus_events: eyeTrackingFocusEvents,
      active_word_index: activeWordIndex,
      screen_metrics: {
        screen_x: window.screenX,
        screen_y: window.screenY,
        inner_width: window.innerWidth,
        inner_height: window.innerHeight,
        outer_width: window.outerWidth,
        outer_height: window.outerHeight,
      },
      samples,
    };
  };

  const submitCapturedAudio = async (file: File) => {
    setPhase("processing");
    await submitMutation.mutateAsync({ file, eyePayload: buildEyeTrackingPayload() });
    tracker.disconnect();
  };

  const startTest = async () => {
    if (!currentSession?.sessionId || isRecording || submitMutation.isPending) {
      return;
    }

    tracker.connect();
    if (!navigator.mediaDevices || typeof MediaRecorder === "undefined") {
      setIsRecording(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaStreamRef.current = stream;
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
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        setIsRecording(false);
        await submitCapturedAudio(file);
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      setIsRecording(true);
      toast("Microphone access failed, using a simulated recording.");
    }
  };

  const stopTest = async () => {
    if (!isRecording || submitMutation.isPending) {
      return;
    }

    if (!mediaRecorderRef.current) {
      const fallbackFile = new File(["mock audio"], "reading-session.webm", { type: "audio/webm" });
      setIsRecording(false);
      await submitCapturedAudio(fallbackFile);
      return;
    }

    mediaRecorderRef.current.stop();
  };

  const beginDiagnostic = () => {
    setSessionResults(null);
    setPhase("landing");
    startMutation.mutate();
  };

  const profile = studentProfile ?? profileQuery.data;

  return (
    <div className="space-y-8">
      {phase === "landing" ? (
        <>
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-[3rem] bg-[linear-gradient(140deg,#a855f7_0%,#3b82f6_100%)] p-8 text-white shadow-soft relative"
          >
            <div className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr] items-center relative z-10">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 backdrop-blur-md mb-4">
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span className="text-sm font-bold uppercase tracking-wider text-white">Reading Quest</span>
                </div>
                <h1 className="mt-2 text-5xl font-extrabold leading-tight">
                  Ready to show off your reading powers?
                </h1>
                <p className="mt-4 max-w-2xl text-lg font-medium text-white/90">
                  Read out loud to your friendly sidekick! We'll track your eyes and voice to see how you're doing.
                </p>

                <div className="mt-10 flex flex-wrap gap-4 items-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={beginDiagnostic}
                    disabled={startMutation.isPending}
                    className="flex items-center gap-2 rounded-full bg-yellow-400 px-8 py-4 text-lg font-bold text-slate-900 shadow-[0_0_20px_rgba(250,204,21,0.4)] transition hover:bg-yellow-300 disabled:opacity-60"
                  >
                    <PlayCircle className="w-6 h-6" />
                    {startMutation.isPending ? "Getting ready..." : "Let's Read!"}
                  </motion.button>
                  <div className="flex items-center gap-2 rounded-full border-2 border-white/30 bg-white/10 px-6 py-4 text-base font-bold text-white backdrop-blur">
                    <Award className="w-5 h-5 text-yellow-300" />
                    Quests done: {recentDiagnostics.length}
                  </div>
                </div>
              </div>

              <div className="flex justify-center relative">
                <motion.img 
                  animate={{ y: [0, -10, 0] }} 
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  src="/diagnostic-mascot.png" 
                  alt="Friendly reading mascot" 
                  className="w-full max-w-[320px] drop-shadow-2xl"
                />
              </div>
            </div>
            
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-400/30 rounded-full blur-3xl pointer-events-none" />
          </motion.section>

          {startMutation.isError ? (
            <ErrorBanner
              message={
                getErrorMessage(startMutation.error) === "Invalid token"
                  ? "Your session has expired. Please log out and log back in."
                  : getErrorMessage(startMutation.error)
              }
            />
          ) : null}

          <section className="rounded-[2rem] border border-white/80 bg-white/88 p-6 shadow-soft backdrop-blur mt-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-purple-500 flex items-center gap-2">
                  <Award className="w-4 h-4" /> Past Quests
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-ink">Your Reading Journey</h2>
                <p className="mt-2 text-sm font-medium leading-7 text-slate-500">
                  Every time you practice, you get a new badge here!
                </p>
              </div>
              <div className="rounded-full bg-mist px-4 py-2 text-sm font-semibold text-sea">
                {profileQuery.isLoading ? "Refreshing history..." : "History ready"}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {recentDiagnostics.length > 0 ? (
                recentDiagnostics.map((session) => (
                  <div
                    key={session.session_id}
                    className="rounded-[1.6rem] bg-[linear-gradient(180deg,#ffffff_0%,#f6fbff_100%)] p-5 ring-1 ring-sky-50"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="rounded-full bg-mist px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-sea">
                        Test #{session.session_id}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {new Date(session.started_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="mt-5 text-lg font-semibold text-ink">{session.status}</p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-[1.15rem] bg-white p-3 ring-1 ring-sky-50">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Accuracy</p>
                        <p className="mt-2 text-lg font-semibold text-ink">
                          {session.accuracy_pct !== null ? `${session.accuracy_pct}%` : "--"}
                        </p>
                      </div>
                      <div className="rounded-[1.15rem] bg-white p-3 ring-1 ring-sky-50">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Speed</p>
                        <p className="mt-2 text-lg font-semibold text-ink">
                          {session.speed_wpm !== null ? `${session.speed_wpm} WPM` : "--"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.8rem] bg-[#f7fbff] p-6 text-sm leading-7 text-slate-500 md:col-span-2 xl:col-span-3">
                  No completed diagnostics yet. Once the first test is done, past results will show
                  up here as clear summary boxes.
                </div>
              )}
            </div>
          </section>
        </>
      ) : null}

      {phase === "active" && passage ? (
        <section className="fixed inset-0 z-30 flex flex-col bg-[linear-gradient(180deg,#f7fbff_0%,#edf5ff_100%)]">
          <header className="flex flex-col items-center justify-between gap-4 border-b border-sky-100 bg-white/70 px-6 py-5 backdrop-blur sm:flex-row sm:px-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-[linear-gradient(135deg,#2f80ed_0%,#4fa6ff_100%)] text-white shadow-soft">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-ink">Diagnostic Check</h2>
                <p className="text-sm font-medium tracking-wide text-sky-600">
                  Read naturally. Gaze is tracked.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-4 py-2.5 text-sm font-medium text-slate-500 shadow-sm backdrop-blur">
                Samples
                <span className="font-semibold text-sea">{tracker.samples.length}</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-4 py-2.5 text-sm font-medium text-slate-500 shadow-sm backdrop-blur">
                Tracker
                <span className={tracker.status === "idle" ? "font-semibold text-amber-500" : "font-semibold text-emerald-500"}>
                  {tracker.status}
                </span>
              </div>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-4 py-8 sm:px-6">
            {tracker.error ? (
              <div className="mb-6 w-full max-w-4xl shrink-0">
                <ErrorBanner message={tracker.error} />
              </div>
            ) : null}

            {submitMutation.isError ? (
              <div className="mb-6 w-full max-w-4xl shrink-0">
                <ErrorBanner message={getErrorMessage(submitMutation.error)} />
              </div>
            ) : null}

            <div
              ref={passageRef}
              className="relative my-auto w-full max-w-7xl rounded-[3.5rem] border border-white/80 bg-white/95 px-10 py-20 shadow-soft backdrop-blur sm:px-24 sm:py-32 shrink-0"
            >
              {gazeDot ? (
                <div
                  className="pointer-events-none absolute z-10 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-sea bg-sea/10 shadow-[0_0_15px_rgba(47,128,237,0.3)]"
                  style={{ left: `${gazeDot.x}px`, top: `${gazeDot.y}px` }}
                />
              ) : null}

              <div className="mx-auto w-full text-center">
                <div className="space-y-14 text-[clamp(1.5rem,2.5vw+1rem,2.8rem)] font-medium leading-[2.8] tracking-wide text-ink">
                  {(() => {
                    let globalWordIndex = 0;
                    return passageParagraphs.map((paragraph, paragraphIndex) => (
                      <p key={`${paragraphIndex}-${paragraph[0] ?? "paragraph"}`} className="mx-auto">
                        {paragraph.map((word) => {
                          const currentIndex = globalWordIndex;
                          globalWordIndex += 1;

                          return (
                            <span
                              key={`${currentIndex}-${word}`}
                              data-word-index={currentIndex}
                              className={`inline rounded-2xl px-2.5 py-1.5 transition-all duration-300 ${
                                activeWordIndex === currentIndex
                                  ? "bg-[#eef6ff] text-sea shadow-[0_4px_12px_rgba(47,128,237,0.15)] ring-1 ring-sea/20"
                                  : "text-ink"
                              }`}
                            >
                              {word}{" "}
                            </span>
                          );
                        })}
                      </p>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </div>

          <aside className="absolute left-6 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-4">
            <button
              type="button"
              onClick={() => void startTest()}
              disabled={isRecording || submitMutation.isPending}
              title="Start Test"
              className="flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,#2f80ed_0%,#4fa6ff_100%)] text-white shadow-[0_8px_20px_rgba(47,128,237,0.35)] transition hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
            >
              <PlayCircle className="h-8 w-8" />
            </button>
            <button
              type="button"
              onClick={() => void stopTest()}
              disabled={!isRecording || submitMutation.isPending}
              title="Stop Test"
              className="flex h-16 w-16 items-center justify-center rounded-full border border-sky-100 bg-white text-rose-500 shadow-lg transition hover:scale-105 hover:bg-rose-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Square className="h-6 w-6" fill="currentColor" />
            </button>
          </aside>
        </section>
      ) : null}

      {phase === "processing" ? (
        <section className="flex min-h-[72vh] items-center justify-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-3xl rounded-[3rem] border border-white/80 bg-white/88 p-12 shadow-soft backdrop-blur relative overflow-hidden"
          >
            <div className="mx-auto max-w-xl text-center relative z-10">
              <motion.img 
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                src="/diagnostic-mascot.png" 
                alt="Processing mascot" 
                className="w-40 h-40 mx-auto drop-shadow-xl mb-6"
              />
              <h2 className="text-4xl font-extrabold text-ink">Magic is happening!</h2>
              <p className="mt-4 text-lg font-medium text-slate-600">
                Our reading sidekick is checking your amazing work. Just a sec!
              </p>

              <div className="mt-10 grid gap-4">
                {analysisSteps.map((step, index) => (
                  <motion.div
                    key={step}
                    initial={false}
                    animate={{
                      scale: processingIndex === index ? 1.05 : 1,
                      backgroundColor: processingIndex === index ? "#fdf4ff" : "#f8fbff",
                      borderColor: processingIndex === index ? "#e879f9" : "#e0f2fe",
                    }}
                    className="rounded-[1.4rem] border-2 px-6 py-5 text-left transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className={`text-base font-bold ${processingIndex === index ? "text-purple-600" : "text-slate-500"}`}>
                        {step}
                      </p>
                      <span
                        className={`h-3 w-3 rounded-full ${
                          processingIndex === index ? "bg-purple-500 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.5)]" : "bg-sky-200"
                        }`}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-10 h-4 overflow-hidden rounded-full bg-sky-100/50">
                <motion.div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#a855f7_0%,#3b82f6_100%)]"
                  initial={{ width: "0%" }}
                  animate={{ width: `${((processingIndex + 1) / analysisSteps.length) * 100}%` }}
                  transition={{ ease: "easeInOut", duration: 0.8 }}
                />
              </div>
            </div>
          </motion.div>
        </section>
      ) : null}

      {phase === "report" && sessionResults && profile ? (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={beginDiagnostic}
              className="rounded-full bg-[linear-gradient(135deg,#2f80ed_0%,#4fa6ff_100%)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105"
            >
              Run Another Diagnostic
            </button>
          </div>
          <DiagnosticReport result={sessionResults} profile={profile} />
        </div>
      ) : null}
    </div>
  );
};
