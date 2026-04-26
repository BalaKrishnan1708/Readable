import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import { startReading, submitReading } from "../api/sessions";
import { ErrorBanner } from "../components/ErrorBanner";
import { RecordButton } from "../components/RecordButton";
import { ScoreCard } from "../components/ScoreCard";
import { useStudentProfileQuery } from "../hooks/useProfileQueries";
import { useReadableEyeTracker } from "../hooks/useGazeFlow";
import { getErrorMessage } from "../lib/errors";
import {
  allocateLessonSupports,
  normalizeLessonWord,
  splitIntoSyllables,
  type LessonSupportDefaults,
} from "../lib/lessonSupports";
import { authStore } from "../stores/authStore";
import { profileStore } from "../stores/profileStore";
import { sessionStore } from "../stores/sessionStore";
import type { GazeFlowSample } from "../types/eyeTracking";
import type { PhoneticSupportWord } from "../types/lesson";

type ReaderWord = {
  cleaned: string;
  display: string;
  index: number;
  lineIndex: number;
  syllables: string[];
  difficult: boolean;
  phoneticSupport?: PhoneticSupportWord;
};

type PhoneticAssist = {
  wordIndex: number;
  word: string;
  ipa: string;
  syllables: string[];
  onset: string;
  rime: string;
  left: number;
  top: number;
};

type ReadingRulerPosition = {
  top: number;
  height: number;
  visible: boolean;
};

type LineFocusEvent = {
  lineIndex: number;
  timestamp: number;
};

type ReReadEvent = {
  fromLineIndex: number;
  toLineIndex: number;
  timestamp: number;
};

const buildReaderLines = (
  segments: string[],
  difficultWords: string[],
  syllableBreaks: Record<string, string>,
  phoneticSupport: Record<string, PhoneticSupportWord>,
): ReaderWord[][] => {
  const difficultSet = new Set(difficultWords.map(normalizeLessonWord));
  let globalIndex = 0;

  return segments.map((segment, lineIndex) =>
    segment
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => {
        const cleaned = normalizeLessonWord(word);
        const readerWord: ReaderWord = {
          cleaned,
          display: word,
          index: globalIndex,
          lineIndex,
          syllables: splitIntoSyllables(word, syllableBreaks),
          difficult: difficultSet.has(cleaned),
          phoneticSupport: phoneticSupport[cleaned],
        };
        globalIndex += 1;
        return readerWord;
      }),
  );
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

const speakText = (text: string, rate: number, volume = 1) => {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !text.trim()) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = 1;
  utterance.volume = volume;
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
};

const renderBionicWord = (word: string) => {
  const midpoint = Math.max(1, Math.ceil(word.length / 2));
  return (
    <>
      <strong className="font-semibold">{word.slice(0, midpoint)}</strong>
      {word.slice(midpoint)}
    </>
  );
};

export const LessonPage = () => {
  const { lessonId } = useParams();
  const [searchParams] = useSearchParams();
  const contentId = Number(searchParams.get("contentId"));
  const user = authStore((state) => state.user);
  const studentProfile = profileStore((state) => state.studentProfile);
  const setStudentProfile = profileStore((state) => state.setStudentProfile);
  const profileQuery = useStudentProfileQuery(user?.id);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [activeLineIndex, setActiveLineIndex] = useState(0);
  const [speechRate, setSpeechRate] = useState(0.9);
  const [showSummary, setShowSummary] = useState(false);
  const [isPacerRunning, setIsPacerRunning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechSilent, setIsSpeechSilent] = useState(true);
  const [phoneticAssist, setPhoneticAssist] = useState<PhoneticAssist | null>(null);
  const requestedContentIdRef = useRef<number | null>(null);
  const fixationRef = useRef<{ wordIndex: number | null; startedAt: number; lastSeenAt: number }>({
    wordIndex: null,
    startedAt: 0,
    lastSeenAt: 0,
  });
  const whisperCooldownRef = useRef<Record<number, number>>({});
  const readingSurfaceRef = useRef<HTMLDivElement | null>(null);
  const lineRefs = useRef<Array<HTMLDivElement | null>>([]);
  const previousLineRef = useRef<{ lineIndex: number | null; timestamp: number }>({
    lineIndex: null,
    timestamp: 0,
  });
  const { currentSession, sessionResults, setCurrentSession, setSessionResults } = sessionStore();
  const [readingRuler, setReadingRuler] = useState<ReadingRulerPosition>({
    top: 0,
    height: 0,
    visible: false,
  });
  const [lineFocusEvents, setLineFocusEvents] = useState<LineFocusEvent[]>([]);
  const [reReadEvents, setReReadEvents] = useState<ReReadEvent[]>([]);
  const [trackerAppKey] = useState(
    import.meta.env.VITE_READABLE_EYE_TRACKER_APP_KEY ??
      import.meta.env.VITE_GAZEFLOW_APP_KEY ??
      "AppKeyTrial",
  );
  const [trackerPort] = useState(
    import.meta.env.VITE_READABLE_EYE_TRACKER_PORT ??
      import.meta.env.VITE_GAZEFLOW_PORT ??
      "43333",
  );
  const tracker = useReadableEyeTracker({
    appKey: trackerAppKey,
    port: Number.parseInt(trackerPort, 10) || 43333,
  });

  useEffect(() => {
    if (profileQuery.data) {
      setStudentProfile(profileQuery.data);
    }
  }, [profileQuery.data, setStudentProfile]);

  const startMutation = useMutation({
    mutationFn: startReading,
    onSuccess: (response) => {
      setCurrentSession({
        sessionId: response.session_id,
        sessionType: "reading",
        content: response.content,
      });
      setSessionResults(null);
      setActiveWordIndex(0);
      setActiveLineIndex(0);
      setIsPacerRunning(false);
      setPhoneticAssist(null);
      setReadingRuler({ top: 0, height: 0, visible: false });
      setLineFocusEvents([]);
      setReReadEvents([]);
      previousLineRef.current = { lineIndex: null, timestamp: 0 };
    },
    onError: () => {
      requestedContentIdRef.current = null;
    },
  });

  const content = currentSession?.content;
  const profile = profileQuery.data ?? studentProfile;

  const submitMutation = useMutation({
    mutationFn: (file: File) =>
      submitReading(
        currentSession?.sessionId ?? 0,
        file,
        {
          focused_word: activeWordIndex,
          click_path: [activeWordIndex ?? 0],
          hesitation_assist_word: phoneticAssist?.word ?? null,
          line_focus_events: lineFocusEvents,
          re_read_events: reReadEvents,
          active_line_index: activeLineIndex,
        },
        {
          expectedText: content?.segments.join(" "),
          personalizedContentId: contentId,
        },
      ),
    onSuccess: (response) => {
      setSessionResults(response.result);
      setStudentProfile(response.profile);
      setIsPacerRunning(false);
      setPhoneticAssist(null);
      toast.success("Reading session submitted.");
    },
  });

  useEffect(() => {
    if (Number.isNaN(contentId) || contentId <= 0) {
      requestedContentIdRef.current = null;
      setCurrentSession(null);
      return;
    }

    if (startMutation.isPending || requestedContentIdRef.current === contentId) {
      return;
    }

    requestedContentIdRef.current = contentId;
    setCurrentSession(null);
    setSessionResults(null);
    setPhoneticAssist(null);
    setReadingRuler({ top: 0, height: 0, visible: false });
    setLineFocusEvents([]);
    setReReadEvents([]);
    previousLineRef.current = { lineIndex: null, timestamp: 0 };
    startMutation.mutate({ personalized_content_id: contentId });
  }, [contentId, setCurrentSession, setSessionResults, startMutation]);

  useEffect(() => {
    if (!content?.id) {
      return;
    }

    tracker.connect();
    return () => tracker.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content?.id]);

  const supportAllocation = useMemo(() => {
    if (!content || !profile) {
      return null;
    }
    return allocateLessonSupports(profile, content);
  }, [content, profile]);

  const [supports, setSupports] = useState<LessonSupportDefaults | null>(null);

  useEffect(() => {
    if (supportAllocation) {
      setSupports(supportAllocation.defaults);
      setSpeechRate(Math.max(0.72, Math.min(1.08, supportAllocation.targetWpm / 140)));
    }
  }, [supportAllocation]);

  const readerLines = useMemo(() => {
    if (!content || !profile) {
      return [];
    }
    return buildReaderLines(
      content.segments,
      profile.difficult_words,
      content.syllable_breaks,
      content.phonetic_support,
    );
  }, [content, profile]);

  const flatWords = useMemo(() => readerLines.flat(), [readerLines]);

  useEffect(() => {
    if (!supportAllocation || !supports?.pacer || !isPacerRunning || flatWords.length === 0) {
      return;
    }

    const intervalMs = Math.max(350, Math.round(60000 / supportAllocation.targetWpm));
    const interval = window.setInterval(() => {
      setActiveWordIndex((current) => {
        const next = current === null ? 0 : Math.min(current + 1, flatWords.length - 1);
        const nextWord = flatWords[next];
        if (nextWord) {
          setActiveLineIndex(nextWord.lineIndex);
        }
        if (next >= flatWords.length - 1) {
          setIsPacerRunning(false);
        }
        return next;
      });
    }, intervalMs);

    return () => window.clearInterval(interval);
  }, [flatWords, isPacerRunning, supportAllocation, supports?.pacer]);

  const triggerPhoneticAssist = (word: ReaderWord, wordElement: HTMLElement) => {
    if (!word.phoneticSupport || !readingSurfaceRef.current) {
      return;
    }

    const surfaceRect = readingSurfaceRef.current.getBoundingClientRect();
    const wordRect = wordElement.getBoundingClientRect();
    const left = Math.min(
      Math.max(wordRect.left - surfaceRect.left + wordRect.width / 2, 120),
      Math.max(surfaceRect.width - 120, 120),
    );
    const top = Math.max(wordRect.top - surfaceRect.top - 18, 44);

    setPhoneticAssist({
      wordIndex: word.index,
      word: word.display,
      ipa: word.phoneticSupport.ipa,
      syllables: word.phoneticSupport.syllables,
      onset: word.phoneticSupport.onset,
      rime: word.phoneticSupport.rime,
      left,
      top,
    });

    speakText(word.phoneticSupport.whisper_text || word.display, 0.8, 0.35);
  };

  useEffect(() => {
    if (!tracker.latestSample || flatWords.length === 0) {
      return;
    }

    const viewport = screenToViewport(tracker.latestSample);
    const lineElements = lineRefs.current.filter(
      (element): element is HTMLDivElement => Boolean(element),
    );
    const surfaceRect = readingSurfaceRef.current?.getBoundingClientRect();
    let nearestLineIndex: number | null = null;

    if (
      surfaceRect &&
      lineElements.length > 0 &&
      viewport.x >= surfaceRect.left &&
      viewport.x <= surfaceRect.right &&
      viewport.y >= surfaceRect.top &&
      viewport.y <= surfaceRect.bottom
    ) {
      const nearestLine = lineElements
        .map((element, index) => {
          const rect = element.getBoundingClientRect();
          return {
            index,
            top: rect.top - surfaceRect.top,
            height: rect.height,
            distance: Math.abs(rect.top + rect.height / 2 - viewport.y),
          };
        })
        .sort((left, right) => left.distance - right.distance)[0];

      if (nearestLine) {
        nearestLineIndex = nearestLine.index;
        setActiveLineIndex(nearestLine.index);
        setReadingRuler({
          top: nearestLine.top,
          height: nearestLine.height,
          visible: true,
        });

        const previousLine = previousLineRef.current.lineIndex;
        const now = tracker.latestSample.receivedAt;

        if (previousLine !== nearestLine.index) {
          setLineFocusEvents((current) => [
            ...current.slice(-79),
            { lineIndex: nearestLine.index, timestamp: now },
          ]);
          if (
            previousLine !== null &&
            nearestLine.index < previousLine &&
            now - previousLineRef.current.timestamp > 160
          ) {
            setReReadEvents((current) => [
              ...current.slice(-19),
              {
                fromLineIndex: previousLine,
                toLineIndex: nearestLine.index,
                timestamp: now,
              },
            ]);
          }
          previousLineRef.current = { lineIndex: nearestLine.index, timestamp: now };
        }
      }
    } else {
      setReadingRuler((current) =>
        current.visible ? { ...current, visible: false } : current,
      );
    }

    const element = document.elementFromPoint(viewport.x, viewport.y) as HTMLElement | null;
    const wordElement = element?.closest<HTMLElement>("[data-word-index]");

    if (!wordElement) {
      if (tracker.latestSample.receivedAt - fixationRef.current.lastSeenAt > 320) {
        fixationRef.current = { wordIndex: null, startedAt: 0, lastSeenAt: 0 };
      }
      return;
    }

    const wordIndex = Number(wordElement.dataset.wordIndex);
    const lineIndex = Number(wordElement.dataset.lineIndex);
    if (Number.isNaN(wordIndex) || Number.isNaN(lineIndex)) {
      return;
    }

    const now = tracker.latestSample.receivedAt;
    if (
      fixationRef.current.wordIndex === wordIndex &&
      now - fixationRef.current.lastSeenAt < 360
    ) {
      fixationRef.current.lastSeenAt = now;
    } else {
      fixationRef.current = {
        wordIndex,
        startedAt: now,
        lastSeenAt: now,
      };
    }

    setActiveWordIndex(wordIndex);
    setActiveLineIndex(nearestLineIndex ?? lineIndex);

    const focusedWord = flatWords[wordIndex];
    const fixationDuration = now - fixationRef.current.startedAt;
    const currentlySilent = !isRecording || isSpeechSilent;
    const lastTriggeredAt = whisperCooldownRef.current[wordIndex] ?? 0;

    if (
      focusedWord?.phoneticSupport &&
      currentlySilent &&
      fixationDuration > 1200 &&
      now - lastTriggeredAt > 2600
    ) {
      whisperCooldownRef.current[wordIndex] = now;
      triggerPhoneticAssist(focusedWord, wordElement);
    }
  }, [flatWords, isRecording, isSpeechSilent, tracker.latestSample]);

  useEffect(() => {
    if (!phoneticAssist) {
      return;
    }

    if (!isSpeechSilent && isRecording) {
      setPhoneticAssist(null);
      return;
    }

    const timeout = window.setTimeout(() => {
      setPhoneticAssist((current) =>
        current?.wordIndex === phoneticAssist.wordIndex ? null : current,
      );
    }, 3200);

    return () => window.clearTimeout(timeout);
  }, [isRecording, isSpeechSilent, phoneticAssist]);

  const attentionTips = useMemo(() => {
    if (!sessionResults) {
      return [];
    }
    return [
      "Tap through the highlighted line before recording to settle your eye path.",
      sessionResults.attention_score < 0.75
        ? "Readable noticed some attention drift, so a shorter second read could help."
        : "Attention held together well through this lesson.",
      sessionResults.speed_wpm < 100
        ? "A slightly slower first pass with the pacer can build steadier fluency."
        : "Pacing is looking comfortable for supported reading.",
    ];
  }, [sessionResults]);

  const gazeRulerActive = supports?.lineFocus || tracker.status === "connected";

  if (Number.isNaN(contentId) || contentId <= 0) {
    return (
      <div className="rounded-[2rem] bg-white p-8 shadow-soft">
        <h1 className="text-2xl font-semibold text-ink">Reading session</h1>
        <p className="mt-3 text-slate-600">
          Open this page with a personalized content id, for example{" "}
          <code className="rounded bg-slate-100 px-2 py-1">/lesson/{lessonId}?contentId=1</code>.
        </p>
      </div>
    );
  }

  if (startMutation.isError && !content) {
    return (
      <div className="rounded-[2rem] bg-white p-8 shadow-soft">
        <h1 className="text-2xl font-semibold text-ink">Lesson unavailable</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          {getErrorMessage(startMutation.error)}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              requestedContentIdRef.current = null;
              startMutation.mutate({ personalized_content_id: contentId });
            }}
            className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Try again
          </button>
          <Link
            to="/dashboard"
            className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-sea hover:text-sea"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!content || !profile || !supportAllocation || !supports) {
    return (
      <div className="rounded-[2rem] bg-white p-8 shadow-soft">
        <h1 className="text-2xl font-semibold text-ink">Preparing lesson</h1>
        <p className="mt-3 text-slate-600">
          Readable is shaping the support stack for this student and loading the personalized passage.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2.25rem] bg-[linear-gradient(135deg,#f5fbf9_0%,#fffaf2_48%,#f6f8ff_100%)] shadow-soft">
        <div className="grid gap-6 p-8 lg:grid-cols-[1.1fr,0.9fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-sea">Readable Studio</p>
            <h1 className="mt-3 text-3xl font-semibold text-ink lg:text-[2.2rem]">
              A calm lesson, already tuned to this reader.
            </h1>
            <p className="mt-3 max-w-2xl text-[0.98rem] leading-8 text-slate-600">
              {supportAllocation.supportReason}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {supportAllocation.supportLabels.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-white/80 bg-white/90 px-3 py-2 text-sm font-medium text-ink"
                >
                  {label}
                </span>
              ))}
              <span className="rounded-full border border-white/80 bg-white/90 px-3 py-2 text-sm font-medium text-ink">
                Gaze-guided ruler
              </span>
              <span className="rounded-full border border-white/80 bg-white/90 px-3 py-2 text-sm font-medium text-ink">
                Real-time phonetic whisper
              </span>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span className="rounded-full bg-white/85 px-4 py-2 shadow-sm">Lesson {lessonId}</span>
              <span className="rounded-full bg-white/85 px-4 py-2 shadow-sm">
                {content.segments.length} guided segments
              </span>
              <span className="rounded-full bg-white/85 px-4 py-2 shadow-sm">
                Fixation help triggers after 1.2s
              </span>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.35rem] bg-white/90 p-5 shadow-soft">
              <p className="text-sm text-slate-500">Reading level</p>
              <p className="mt-2 text-2xl font-semibold text-ink">
                {profile.reading_level ?? "Pending"}
              </p>
            </div>
            <div className="rounded-[1.35rem] bg-white/90 p-5 shadow-soft">
              <p className="text-sm text-slate-500">Target pace</p>
              <p className="mt-2 text-2xl font-semibold text-ink">
                {supportAllocation.targetWpm} WPM
              </p>
            </div>
            <div className="rounded-[1.35rem] bg-white/90 p-5 shadow-soft">
              <p className="text-sm text-slate-500">Difficult words</p>
              <p className="mt-2 text-2xl font-semibold text-ink">
                {supportAllocation.glossary.length}
              </p>
            </div>
            <div className="rounded-[1.35rem] bg-white/90 p-5 shadow-soft">
              <p className="text-sm text-slate-500">Whisper readiness</p>
              <p className="mt-2 text-2xl font-semibold text-ink">
                {tracker.status === "connected" ? "Live" : "Warming"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {startMutation.isError ? <ErrorBanner message={getErrorMessage(startMutation.error)} /> : null}
      {submitMutation.isError ? <ErrorBanner message={getErrorMessage(submitMutation.error)} /> : null}

      <section className="grid gap-6 xl:grid-cols-[0.88fr,1.12fr]">
        <div className="space-y-6">
          {supports.glossary && supportAllocation.glossary.length > 0 ? (
            <div className="rounded-[1.75rem] bg-[linear-gradient(180deg,#ffffff_0%,#fffaf5_100%)] p-6 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-ink">Vocabulary preview</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    A gentle warm-up before the reading begins.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSupports((current) =>
                      current ? { ...current, glossary: !current.glossary } : current,
                    )
                  }
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    supports.glossary
                      ? "bg-sea text-white"
                      : "border border-slate-200 text-slate-600"
                  }`}
                >
                  {supports.glossary ? "Glossary On" : "Glossary Off"}
                </button>
              </div>
              <div className="mt-5 grid gap-3">
                {supportAllocation.glossary.map((entry) => (
                  <div
                    key={entry.word}
                    className="rounded-[1.35rem] border border-white bg-white/90 p-4 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.38)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-ink">{entry.word}</p>
                        {entry.syllables ? (
                          <p className="mt-1 text-sm font-medium text-sea">{entry.syllables}</p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => speakText(entry.word, speechRate)}
                        className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:ring-sea"
                      >
                        Hear
                      </button>
                    </div>
                    <p className="mt-3 text-sm text-slate-700">{entry.simpleDefinition}</p>
                    <p className="mt-2 text-sm text-slate-500">{entry.cue}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-[1.75rem] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-ink">Support stack</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Readable chooses a starting set, and the student can gently tune it for this session.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSummary((current) => !current)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-sea hover:text-sea"
              >
                {showSummary ? "Hide Summary" : "Plain Summary"}
              </button>
            </div>

            {showSummary ? (
              <div className="mt-4 rounded-[1.35rem] bg-mist p-4 text-sm leading-7 text-slate-700">
                {supportAllocation.summary}
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2">
              {([
                ["phonics", "Phonics"],
                ["audio", "Audio"],
                ["lineFocus", "Line focus"],
                ["pacer", "Pacer"],
                ["bionic", "Anchor bolding"],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    setSupports((current) =>
                      current ? { ...current, [key]: !current[key] } : current,
                    )
                  }
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    supports[key]
                      ? "bg-sea text-white shadow-sm"
                      : "border border-slate-200 bg-white/80 text-slate-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  speakText(content.segments[activeLineIndex] ?? content.segments[0] ?? "", speechRate)
                }
                className="rounded-[1.1rem] bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Read active line
              </button>
              <button
                type="button"
                onClick={() => speakText(content.segments.join(" "), speechRate)}
                className="rounded-[1.1rem] border border-slate-200 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-sea hover:text-sea"
              >
                Echo full passage
              </button>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
                <span>Voice speed</span>
                <span>{speechRate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.15"
                step="0.05"
                value={speechRate}
                onChange={(event) => setSpeechRate(Number(event.target.value))}
                className="w-full accent-sea"
              />
            </div>

            <div className="mt-5 grid gap-3 rounded-[1.35rem] bg-[#f8fbfd] p-4 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-4">
                <span>Eye tracker</span>
                <span className="rounded-full bg-white px-3 py-1.5 font-semibold text-ink ring-1 ring-slate-200">
                  {tracker.status}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Speech monitor</span>
                <span className="rounded-full bg-white px-3 py-1.5 font-semibold text-ink ring-1 ring-slate-200">
                  {isRecording ? (isSpeechSilent ? "Listening for voice" : "Voice detected") : "Idle"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Phonetic whisper</span>
                <span className="rounded-full bg-white px-3 py-1.5 font-semibold text-ink ring-1 ring-slate-200">
                  {phoneticAssist ? "Helping now" : "Ready"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Re-read events</span>
                <span className="rounded-full bg-white px-3 py-1.5 font-semibold text-ink ring-1 ring-slate-200">
                  {reReadEvents.length}
                </span>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPacerRunning((current) => !current)}
                className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                  isPacerRunning
                    ? "bg-rose-500 text-white hover:bg-rose-600"
                    : "bg-amber-100 text-amber-900 hover:bg-amber-200"
                }`}
              >
                {isPacerRunning ? "Pause Pacer" : `Guide Pace at ${supportAllocation.targetWpm} WPM`}
              </button>
              <RecordButton
                label="Start Reading"
                onRecordingStateChange={setIsRecording}
                onAudioActivityChange={setIsSpeechSilent}
                onStop={async (file) => {
                  await submitMutation.mutateAsync(file);
                }}
              />
              <Link
                to="/dashboard"
                className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-sea hover:text-sea"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-[1.9rem] bg-[linear-gradient(180deg,#fffefb_0%,#fff9f1_100%)] p-6 shadow-soft">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-ink">Adaptive reading surface</h2>
              <p className="mt-1 text-sm text-slate-500">
                A quieter, more supportive reading canvas with phonics help, touch audio, visual anchors, and live hesitation rescue.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-full bg-mist px-4 py-2 text-sm font-semibold text-sea">
                Active line {activeLineIndex + 1} / {readerLines.length}
              </div>
              <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-500 ring-1 ring-slate-200">
                {supports.lineFocus ? "Line focus on" : "Free reading mode"}
              </div>
            </div>
          </div>

          <div
            ref={readingSurfaceRef}
            className="relative mt-6 rounded-[1.7rem] bg-white/72 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:p-6"
            style={{
              fontFamily: supports.bionic
                ? `"Lexend", "Trebuchet MS", "Segoe UI", sans-serif`
                : `"Lexend", "Segoe UI", "Trebuchet MS", sans-serif`,
            }}
          >
            {gazeRulerActive ? (
              <div
                className={`pointer-events-none absolute left-3 right-3 z-0 rounded-[1.45rem] bg-[linear-gradient(90deg,rgba(95,190,176,0.18)_0%,rgba(95,190,176,0.1)_52%,rgba(95,190,176,0.04)_100%)] ring-1 ring-sea/10 transition-[top,height,opacity] duration-75 ease-out sm:left-5 sm:right-5 ${
                  readingRuler.visible ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  top: readingRuler.top,
                  height: readingRuler.height,
                }}
              />
            ) : null}
            {phoneticAssist ? (
              <div
                className="pointer-events-none absolute z-10 w-[min(320px,82vw)] -translate-x-1/2 -translate-y-full rounded-[1.35rem] border border-white/70 bg-[#fffdf8]/95 p-4 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.45)] backdrop-blur"
                style={{ left: phoneticAssist.left, top: phoneticAssist.top }}
              >
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-amber-700">
                  Hesitation detected...
                </p>
                <div className="mt-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xl font-semibold text-ink">{phoneticAssist.word}</p>
                    <p className="mt-1 text-sm font-medium text-sea">
                      {phoneticAssist.syllables.join("·")}
                    </p>
                  </div>
                  <span className="rounded-full bg-mist px-3 py-1.5 text-xs font-semibold text-sea">
                    whisper
                  </span>
                </div>
                <p className="mt-3 text-base font-medium text-slate-700">{phoneticAssist.ipa}</p>
                <p className="mt-2 text-sm text-slate-500">
                  onset-rime:{" "}
                  <span className="font-semibold text-ink">{phoneticAssist.onset}</span>
                  {" – "}
                  <span className="font-semibold text-ink">{phoneticAssist.rime}</span>
                </p>
              </div>
            ) : null}

            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[1.35rem] bg-[#f8fbfd] px-4 py-3 text-sm text-slate-500">
              <p>
                Hold your gaze on a hard word for a moment and Readable softly reveals the pronunciation.
              </p>
              <p className="font-semibold text-sea">Target pace {supportAllocation.targetWpm} WPM</p>
            </div>

            <div className="relative z-[1] space-y-4">
              {readerLines.map((line, lineIndex) => {
                const isFocusedLine = activeLineIndex === lineIndex;
                return (
                  <div
                    key={`line-${lineIndex}`}
                    ref={(element) => {
                      lineRefs.current[lineIndex] = element;
                    }}
                    className={`rounded-[1.45rem] border px-5 py-5 transition ${
                      gazeRulerActive
                        ? isFocusedLine
                          ? "border-sea/15 bg-[#fffdf8] opacity-100"
                          : "border-transparent bg-[#faf7f0] opacity-50"
                        : "border-slate-100 bg-[#fcfaf6]"
                    }`}
                  >
                    <div className="flex flex-wrap gap-x-2 gap-y-3 text-left">
                      {line.map((word) => {
                        const isActive = activeWordIndex === word.index;
                        const wordTone = word.difficult
                          ? "bg-amber-50 text-amber-950 ring-amber-100"
                          : "bg-white/96 text-ink ring-slate-100";
                        return (
                          <button
                            key={`${word.index}-${word.display}`}
                            type="button"
                            data-word-index={word.index}
                            data-line-index={word.lineIndex}
                            onClick={() => {
                              setActiveWordIndex(word.index);
                              setActiveLineIndex(word.lineIndex);
                              if (supports.audio) {
                                speakText(word.cleaned || word.display, speechRate);
                              }
                              if (word.phoneticSupport) {
                                const clickedElement = document.querySelector<HTMLElement>(
                                  `[data-word-index="${word.index}"]`,
                                );
                                if (clickedElement) {
                                  triggerPhoneticAssist(word, clickedElement);
                                }
                              }
                            }}
                            className={`rounded-[1rem] px-3 py-2.5 text-left align-top transition ${
                              isActive
                                ? "bg-sea text-white shadow-soft ring-2 ring-sea/25"
                                : `${wordTone} ring-1 hover:ring-sea/25`
                            }`}
                          >
                            <div className="text-[1.18rem] leading-[1.9] sm:text-[1.32rem]">
                              {supports.bionic ? renderBionicWord(word.display) : word.display}
                            </div>
                            {supports.phonics && word.difficult ? (
                              <div className="mt-1.5 flex flex-wrap gap-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em]">
                                {word.syllables.map((syllable, syllableIndex) => (
                                  <span
                                    key={`${word.index}-${syllable}-${syllableIndex}`}
                                    className={`rounded-full px-2 py-1 ${
                                      syllableIndex % 2 === 0
                                        ? isActive
                                          ? "bg-white/20 text-white"
                                          : "bg-teal-100 text-teal-900"
                                        : isActive
                                          ? "bg-white/10 text-white"
                                          : "bg-amber-100 text-amber-900"
                                    }`}
                                  >
                                    {syllable}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {sessionResults ? (
        <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
          <div className="space-y-6">
            <ScoreCard
              accuracy={sessionResults.accuracy_pct}
              wpm={sessionResults.speed_wpm}
              attention={sessionResults.attention_score}
            />
            <div className="rounded-[1.5rem] bg-white p-6 shadow-soft">
              <h2 className="text-lg font-semibold text-ink">Errors and pacing</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {sessionResults.errors.map((error) => (
                  <li
                    key={`${error.word}-${error.position}`}
                    className="rounded-2xl bg-blush px-4 py-3"
                  >
                    <span className="font-semibold text-ink">{error.word}</span> at position{" "}
                    {error.position + 1} was marked as{" "}
                    <span className="text-amber-700">{error.type}</span>.
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="rounded-[1.5rem] bg-white p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Feedback panel</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              {attentionTips.map((tip) => (
                <p key={tip} className="rounded-2xl bg-mist px-4 py-3">
                  {tip}
                </p>
              ))}
              <p className="rounded-2xl bg-amber-50 px-4 py-3">
                Hesitation points: {sessionResults.hesitation_points.join(", ")}
              </p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
};
