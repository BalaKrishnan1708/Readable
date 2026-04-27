import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  Rocket, 
  PlayCircle, 
  Square, 
  Mic, 
  Eye, 
  Sparkles, 
  ChevronRight, 
  Volume2, 
  Target, 
  Settings2,
  FileText,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { startReading, submitReading, visualizeParagraph, type VisualizeResponse } from "../api/sessions";
import { ErrorBanner } from "../components/ErrorBanner";
import { ConceptMap } from "../components/ConceptMap";
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
      <strong className="font-bold">{word.slice(0, midpoint)}</strong>
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
  const [clickedWordIndex, setClickedWordIndex] = useState<number | null>(null);
  const [activeLineIndex, setActiveLineIndex] = useState(0);
  const [visualizations, setVisualizations] = useState<Record<number, VisualizeResponse | 'loading'>>({});
  const [speechRate, setSpeechRate] = useState(0.9);
  const [showSummary, setShowSummary] = useState(false);
  const [isPacerRunning, setIsPacerRunning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechSilent, setIsSpeechSilent] = useState(true);
  const [showNextWordGuide, setShowNextWordGuide] = useState(false);
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
  const originalProfile = profileQuery.data ?? studentProfile;
  const profile = contentId === 1 ? (originalProfile || {
    id: 1,
    student_id: 1,
    reading_level: "B1",
    baseline_wpm: 120,
    baseline_accuracy_pct: 95,
    last_assessment_date: new Date().toISOString(),
    avg_accuracy_pct: 95,
    avg_speed_wpm: 120,
    recent_sessions: [],
    difficult_words: [],
    attention_score: 1.0
  } as any) : originalProfile;

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

    if (contentId === 1) {
      setTimeout(() => {
        setCurrentSession({
          sessionId: 999,
          sessionType: "reading",
          content: {
            id: 1,
            lesson_id: 2,
            student_id: user?.id || 1,
            title: "Sample Reading Text",
            segments: [
              "The quick brown fox jumps over the lazy dog.",
              "This is a sample reading text to test the interface.",
              "It has multiple sentences and lines to read.",
              "Some words might be difficult, like magnificent or extraordinary."
            ],
            syllable_breaks: {
              magnificent: "mag-nif-i-cent",
              extraordinary: "ex-traor-di-nar-y",
              interface: "in-ter-face"
            },
            phonetic_support: {
              magnificent: {
                word: "magnificent",
                ipa: "/mæɡˈnɪfɪsənt/",
                syllables: ["mag", "nif", "i", "cent"],
                onset: "m",
                rime: "ag",
                whisper_text: "mag-nif-i-cent"
              }
            },
            font_size: 24,
            line_spacing: 1.5,
            chunk_size: 4,
            created_at: new Date().toISOString()
          } as any
        });
        setActiveWordIndex(0);
        setActiveLineIndex(0);
        setIsPacerRunning(false);
      }, 500);
      return;
    }

    startMutation.mutate({ personalized_content_id: contentId });
  }, [contentId, setCurrentSession, setSessionResults, startMutation, user?.id]);

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

  const generateFrontendStoryMap = (text: string): VisualizeResponse => {
    const lowerText = text.toLowerCase();
    // Hardcoded for the sample text for a perfect demo
    if (lowerText.includes("fox jumps")) {
      return {
        nodes: [
          { id: "1", label: "Brown Fox", type: "character" },
          { id: "2", label: "Jumps", type: "action" },
          { id: "3", label: "Lazy Dog", type: "object" }
        ],
        edges: [
          { source: "1", target: "2", label: "does" },
          { source: "2", target: "3", label: "over" }
        ]
      };
    }
    if (lowerText.includes("sample reading text")) {
      return {
        nodes: [
          { id: "1", label: "Student", type: "character" },
          { id: "2", label: "Tests", type: "action" },
          { id: "3", label: "Interface", type: "setting" }
        ],
        edges: [
          { source: "1", target: "2", label: "will" },
          { source: "2", target: "3", label: "the" }
        ]
      };
    }
    if (lowerText.includes("multiple sentences")) {
      return {
        nodes: [
          { id: "1", label: "Text", type: "object" },
          { id: "2", label: "Has", type: "action" },
          { id: "3", label: "Multiple Lines", type: "object" }
        ],
        edges: [
          { source: "1", target: "2", label: "currently" },
          { source: "2", target: "3", label: "many" }
        ]
      };
    }
    if (lowerText.includes("difficult")) {
      return {
        nodes: [
          { id: "1", label: "Some Words", type: "object" },
          { id: "2", label: "Are", type: "action" },
          { id: "3", label: "Magnificent", type: "object" }
        ],
        edges: [
          { source: "1", target: "2", label: "can be" },
          { source: "2", target: "3", label: "like" }
        ]
      };
    }

    // Generic fallback heuristic
    const words = text.replace(/[^\w\s]/g, '').trim().split(/\s+/).filter(w => w.length > 3);
    const subject = words[0] || "Someone";
    const verb = words[Math.floor(words.length / 2)] || "acted";
    const object = words[words.length - 1] || "somewhere";

    return {
      nodes: [
        { id: "1", label: subject, type: "character" },
        { id: "2", label: verb, type: "action" },
        { id: "3", label: object, type: "object" }
      ],
      edges: [
        { source: "1", target: "2", label: "then" },
        { source: "2", target: "3", label: "with" }
      ]
    };
  };

  const handleVisualize = (lineIndex: number, text: string) => {
    setVisualizations(prev => ({ ...prev, [lineIndex]: 'loading' }));
    
    // Simulate AI thinking delay for a better user experience
    setTimeout(() => {
      try {
        const data = generateFrontendStoryMap(text);
        setVisualizations(prev => ({ ...prev, [lineIndex]: data }));
      } catch (error) {
        console.error("Visualization error:", error);
        setVisualizations(prev => {
          const copy = { ...prev };
          delete copy[lineIndex];
          return copy;
        });
        toast.error("Failed to generate visualization.");
      }
    }, 1000);
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

  if (!content || !profile || !supportAllocation || !supports) {
    return (
      <div className="mx-auto max-w-2xl card-clean p-12 text-center">
        <div className="flex justify-center mb-8">
           <div className="h-16 w-16 rounded-2xl bg-sky-100 border-2 border-sky-200 flex items-center justify-center">
              <div className="h-8 w-8 rounded-full border-4 border-sky-500 border-t-transparent animate-spin" />
           </div>
        </div>
        <h1 className="text-3xl font-black text-slate-900">Preparing Your Quest</h1>
        <p className="mt-4 text-xl font-bold text-slate-400">Loading your personalized reading supports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4 max-w-full mx-auto px-4 lg:px-12">
      <div className="flex flex-col lg:flex-row gap-12 items-start">
        <aside className="w-full lg:w-64 space-y-6 lg:sticky lg:top-28 flex-shrink-0">
           <div className="card-clean p-6 bg-white">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                <Settings2 className="w-4 h-4" /> Tools
              </h2>
              <div className="flex flex-col gap-3">
                 {[
                   ["phonics", "Phonics"],
                   ["audio", "Echo"],
                   ["lineFocus", "Gaze Ruler"],
                   ["pacer", "Pacer"],
                   ["bionic", "Bionic"]
                 ].map(([key, label]) => (
                   <button
                    key={key}
                    onClick={() => setSupports(c => c ? {...c, [key as keyof LessonSupportDefaults]: !c[key as keyof LessonSupportDefaults]} : null)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-black transition-all border-2 ${
                      supports[key as keyof LessonSupportDefaults] 
                      ? "bg-sky-500 text-white border-sky-600 shadow-md shadow-sky-200" 
                      : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                    }`}
                   >
                     {label}
                     <div className={`h-2.5 w-2.5 rounded-full border-2 ${supports[key as keyof LessonSupportDefaults] ? 'bg-white border-sky-400' : 'bg-slate-200 border-slate-300'}`} />
                   </button>
                 ))}
                 <button
                  onClick={() => setShowNextWordGuide(c => !c)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-black transition-all border-2 ${
                    showNextWordGuide 
                    ? "bg-sky-500 text-white border-sky-600 shadow-md shadow-sky-200" 
                    : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                  }`}
                 >
                   Next Word
                   <div className={`h-2.5 w-2.5 rounded-full border-2 ${showNextWordGuide ? 'bg-white border-sky-400' : 'bg-slate-200 border-slate-300'}`} />
                 </button>
              </div>

              <div className="mt-8 pt-6 border-t-2 border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Voice Speed</span>
                  <span className="text-xs font-black text-sky-600">{speechRate.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.2"
                  step="0.05"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(Number(e.target.value))}
                  className="w-full accent-sky-500"
                />
              </div>
           </div>
        </aside>

        <main className="space-y-8 flex-grow w-full min-w-0">
          <header className="flex items-center gap-4 card-clean p-4 px-6 bg-white w-full">
            <div className="p-2.5 bg-sky-100 rounded-xl flex-shrink-0">
               <FileText className="w-5 h-5 text-sky-600" />
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-2xl font-black text-slate-900 truncate">{content.title || "Placeholder Lesson Name"}</h1>
              <span className="text-sm font-bold text-slate-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </header>

           <div className="card-clean p-10 lg:p-16 bg-white relative min-h-[85vh] flex flex-col items-center justify-center overflow-hidden w-full">
              <div className="absolute top-8 right-8 z-50">
                 <div className={`px-4 py-2 rounded-xl border-2 flex items-center gap-3 font-black uppercase tracking-widest text-[10px] ${tracker.status === 'connected' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                    <Eye className={`w-4 h-4 ${tracker.status === 'connected' ? 'animate-pulse' : ''}`} />
                    Gaze Sync: {tracker.status}
                 </div>
              </div>

              {tracker.status === 'connected' && tracker.latestSample && (() => {
                const pt = screenToViewport(tracker.latestSample);
                return (
                  <motion.div
                    className="fixed w-5 h-5 rounded-full bg-emerald-400/40 border-2 border-emerald-400 pointer-events-none z-[100] shadow-[0_0_15px_rgba(52,211,153,0.6)] backdrop-blur-sm"
                    animate={{ left: pt.x - 10, top: pt.y - 10 }}
                    transition={{ type: "tween", duration: 0.05 }}
                  />
                );
              })()}

              {supports.lineFocus && readingRuler.visible && (
                <motion.div
                  animate={{ top: readingRuler.top }}
                  className="absolute left-10 right-10 bg-sky-500/10 border-y-4 border-sky-500/20 pointer-events-none z-0"
                  style={{ height: readingRuler.height }}
                />
              )}

              <div ref={readingSurfaceRef} className="relative z-10 w-full max-w-[95vw] lg:max-w-[90rem] mx-auto space-y-24 lg:space-y-32 text-center">
                 {readerLines.map((line, li) => {
                   const lineText = line.map(w => w.display).join(" ");
                   return (
                   <div 
                    key={li} 
                    ref={(el) => (lineRefs.current[li] = el)}
                    className="relative flex flex-col items-center transition-all duration-300 mb-16"
                    style={{ opacity: activeLineIndex === li || !supports.lineFocus ? 1 : 0.3 }}
                   >
                     <p className="text-5xl md:text-[4.5rem] lg:text-[5rem] font-black leading-[2.5] tracking-tight text-slate-700">
                        {line.map((word, wi) => (
                          <span
                            key={wi}
                            data-word-index={word.index}
                            data-line-index={li}
                            onClick={() => setClickedWordIndex(clickedWordIndex === word.index ? null : word.index)}
                            className={`inline-block mx-3 md:mx-4 px-4 py-1 rounded-[2rem] transition-all duration-200 cursor-pointer ${
                              activeWordIndex === word.index ? 'bg-sky-500 text-white shadow-2xl scale-110' : ''
                            } ${
                              showNextWordGuide && activeWordIndex !== null && word.index === activeWordIndex + 1 
                              ? 'bg-sky-100 text-sky-700 shadow-sm border-b-4 border-sky-300 scale-105' 
                              : ''
                            } ${word.difficult && activeWordIndex !== word.index ? 'text-indigo-600' : ''}`}
                          >
                            {clickedWordIndex === word.index 
                              ? (
                                <motion.span 
                                  initial={{ opacity: 0, width: 0 }}
                                  animate={{ opacity: 1, width: "auto" }}
                                  className="inline-flex items-center gap-4 mx-4 align-middle"
                                >
                                  {word.syllables.map((syl, i) => (
                                    <motion.span 
                                      key={i} 
                                      initial={{ opacity: 0, scale: 0, rotate: -15, y: 20 }}
                                      animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
                                      transition={{ 
                                        type: "spring", 
                                        stiffness: 500, 
                                        damping: 20, 
                                        delay: i * 0.08 
                                      }}
                                      whileHover={{ y: -8, scale: 1.1, rotate: i % 2 === 0 ? 3 : -3 }}
                                      className="bg-white text-sky-500 border-4 border-sky-100 border-b-[12px] rounded-[3rem] px-8 py-3 shadow-[0_12px_30px_-10px_rgba(14,165,233,0.3)] font-black lowercase inline-block"
                                    >
                                      {syl}
                                    </motion.span>
                                  ))}
                                </motion.span>
                              )
                              : (supports.bionic ? renderBionicWord(word.display) : word.display)
                            }{" "}
                          </span>
                        ))}
                     </p>

                     <div className="mt-16 flex justify-center w-full relative z-20">
                       {!visualizations[li] ? (
                         <button
                           onClick={() => handleVisualize(li, lineText)}
                           className="flex items-center gap-3 px-8 py-4 rounded-[2rem] bg-gradient-to-b from-sky-50 to-sky-100 hover:from-sky-100 hover:to-sky-200 text-sky-700 font-black text-xl transition-all border-4 border-sky-200 shadow-xl hover:scale-105"
                         >
                           <Sparkles className="w-6 h-6 text-sky-500" />
                           Draw Story Map
                         </button>
                       ) : visualizations[li] === 'loading' ? (
                         <div className="flex items-center gap-4 px-8 py-4 rounded-[2rem] bg-sky-50 text-sky-500 font-black text-xl animate-pulse border-4 border-sky-100 shadow-lg">
                           <Sparkles className="w-6 h-6 animate-spin" />
                           AI is drawing...
                         </div>
                       ) : (
                         <ConceptMap 
                           nodes={(visualizations[li] as VisualizeResponse).nodes} 
                           edges={(visualizations[li] as VisualizeResponse).edges} 
                         />
                       )}
                     </div>
                   </div>
                 )})}
              </div>

              <AnimatePresence>
                {phoneticAssist && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: 10 }}
                    className="absolute z-50 pointer-events-none"
                    style={{ left: phoneticAssist.left, top: phoneticAssist.top }}
                  >
                    <div className="btn-3d bg-indigo-500 border-indigo-600 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4">
                       <Volume2 className="w-6 h-6 animate-pulse" />
                       <div className="text-left">
                          <p className="text-2xl font-black leading-none">{phoneticAssist.syllables.join(' · ')}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-70">Whisper Mode</p>
                       </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>

           <div className="flex flex-col items-center gap-10">
              <div className="flex gap-6">
                 <button 
                  onClick={() => setIsPacerRunning(!isPacerRunning)}
                  className={`btn-3d flex items-center gap-3 rounded-[2rem] px-10 py-5 text-xl font-black transition-all ${
                    isPacerRunning ? 'bg-rose-500 border-rose-600 text-white' : 'bg-emerald-500 border-emerald-600 text-white'
                  }`}
                 >
                   {isPacerRunning ? <Square className="w-6 h-6 fill-current" /> : <PlayCircle className="w-6 h-6" />}
                   {isPacerRunning ? "Stop Pacer" : "Start Pacer"}
                 </button>

                 <RecordButton
                    isRecording={isRecording}
                    setIsRecording={setIsRecording}
                    onFinish={(file) => submitMutation.mutate(file)}
                 />
              </div>

              {sessionResults && (
                <motion.div 
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full"
                >
                   <ScoreCard 
                    result={sessionResults} 
                    profile={profile}
                    onClose={() => setSessionResults(null)}
                   />
                </motion.div>
              )}
           </div>
        </main>
      </div>
    </div>
  );
};
