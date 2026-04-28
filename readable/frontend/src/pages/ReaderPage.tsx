import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, ExternalLink, Copy, Check, ChevronLeft, ChevronRight,
  AlignLeft, Minus, Plus, Sun, Moon, Loader2, Volume2, VolumeX,
  Clock, Maximize2, Type, Sparkles,
} from "lucide-react";

/* ── Types ──────────────────────────────────────────────────────────────────── */

interface ReaderPayload {
  text: string;
  sourceUrl: string;
  sourceTitle: string;
  timestamp: number;
}

/* ── Helpers ─────────────────────────────────────────────────────────────────── */

function chunkText(text: string, wpp = 50): string[] {
  const sentences = text.match(/[^.!?]+[.!?]*/g) ?? [text];
  const pages: string[] = [];
  let cur = "";
  for (const s of sentences) {
    const c = cur + s;
    if (c.trim().split(/\s+/).length > wpp && cur) { pages.push(cur.trim()); cur = s; }
    else cur = c;
  }
  if (cur.trim()) pages.push(cur.trim());
  return pages;
}

function timeAgo(ts: number): string {
  const d = Date.now() - ts;
  if (d < 60_000) return "just now";
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`;
  return `${Math.floor(d / 3_600_000)}h ago`;
}

function wordCount(t: string) { return t.trim().split(/\s+/).length; }
function readTime(t: string) { return Math.max(1, Math.ceil(wordCount(t) / 200)); }

/* ── Config ──────────────────────────────────────────────────────────────────── */

const FONT_SIZES  = [20, 24, 28, 34, 42] as const;
const LINE_HEIGHTS = [1.6, 1.8, 2.0, 2.4] as const;
type FontSize   = (typeof FONT_SIZES)[number];
type LineHeight = (typeof LINE_HEIGHTS)[number];

type Theme = "light" | "cream" | "dark";
const THEMES: Record<Theme, {
  bg: string; card: string; text: string; muted: string;
  accent: string; border: string; hover: string; surface: string;
}> = {
  light: {
    bg: "#f8fafc", card: "#ffffff", text: "#0f172a", muted: "#94a3b8",
    accent: "#0ea5e9", border: "#e2e8f0", hover: "#f1f5f9", surface: "#f8fafc",
  },
  cream: {
    bg: "#fdf6e3", card: "#fffdf5", text: "#3d3929", muted: "#a09070",
    accent: "#d97706", border: "#e8dcc8", hover: "#f5ecd8", surface: "#faf3e0",
  },
  dark: {
    bg: "#0f172a", card: "#1e293b", text: "#e2e8f0", muted: "#64748b",
    accent: "#38bdf8", border: "#334155", hover: "#334155", surface: "#1e293b",
  },
};

/* ════════════════════════════════════════════════════════════════════════════ */

export const ReaderPage = () => {
  const [payload,    setPayload]    = useState<ReaderPayload | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [waiting,    setWaiting]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const [page,       setPage]       = useState(0);
  const [fontSize,   setFontSize]   = useState<FontSize>(34);
  const [lineHeight, setLineHeight] = useState<LineHeight>(2.0);
  const [theme,      setTheme]      = useState<Theme>("light");
  const [copied,     setCopied]     = useState(false);
  const [showFull,   setShowFull]   = useState(false);
  const [manualText, setManualText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Magic Features
  const [bionic,     setBionic]     = useState(false);
  const [syllables,  setSyllables]  = useState(false);
  const [pointer,    setPointer]    = useState(false);
  const [focusMode,  setFocusMode]  = useState(false);

  // TTS
  const [speaking,     setSpeaking]     = useState(false);
  const [spokenWord,   setSpokenWord]   = useState(-1);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Reading timer
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Data loading ─────────────────────────────────────────────────────────── */

  useEffect(() => {
    let alive = true;
    let lastTs = 0;
    const apply = (p: ReaderPayload) => {
      if (!alive || p.timestamp <= lastTs) return; // only accept NEWER text
      lastTs = p.timestamp;
      setPayload(p); setPage(0); setLoading(false); setWaiting(false); setError(null);
      setElapsed(0);
    };
    const stored = localStorage.getItem("readablePayload");
    if (stored) { try { apply(JSON.parse(stored)); } catch { /* */ } }
    const onEvt = (e: Event) => {
      const p = (e as CustomEvent<ReaderPayload>).detail;
      if (p) { localStorage.setItem("readablePayload", JSON.stringify(p)); apply(p); }
    };
    window.addEventListener("readable-payload", onEvt);
    const poll = async () => {
      try {
        const r = await fetch("http://localhost:8000/reader/latest");
        const d = await r.json();
        if (!alive) return;
        if (d.payload) apply(d.payload); // will be ignored if older than localStorage
        else if (!stored && lastTs === 0) { setLoading(false); setWaiting(true); }
      } catch {
        if (!alive) return;
        setLoading(false);
        if (!stored && lastTs === 0) setError("Could not reach localhost:8000.");
      }
    };
    poll();
    const id = setInterval(poll, 1500);
    return () => { alive = false; clearInterval(id); window.removeEventListener("readable-payload", onEvt); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Reading timer ────────────────────────────────────────────────────────── */

  useEffect(() => {
    if (payload && !waiting && !loading) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [payload, waiting, loading]);

  const fmtTime = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

  /* ── Magic Rendering ──────────────────────────────────────────────────────── */

  const renderWord = (word: string, i: number) => {
    let content: React.ReactNode = word;

    // Syllable splitting (simple dot insertion)
    if (syllables && word.length > 4) {
      content = word.replace(/([^aeiouy]*[aeiouy]+(?:[^aeiouy]*|(?![aeiouy])))/gi, "$1·").replace(/·$/, "");
    }

    // Bionic Reading (bold first half)
    if (bionic) {
      const match = word.match(/^([a-zA-Z0-9]+)(.*)$/);
      if (match) {
        const textPart = match[1];
        const puncPart = match[2];
        const len = textPart.length;
        const boldLen = len <= 3 ? 1 : Math.ceil(len / 2);
        content = (
          <>
            <b style={{ fontWeight: 800 }}>{textPart.slice(0, boldLen)}</b>
            {textPart.slice(boldLen)}
            {puncPart}
          </>
        );
      }
    }

    return (
      <span key={i}
        className="transition-all duration-300 rounded-lg px-0.5 inline-block"
        style={{
          background: spokenWord === i ? t.accent + "30" : "transparent",
          color: spokenWord === i ? t.accent : "inherit",
          fontWeight: spokenWord === i ? 900 : "inherit",
          transform: spokenWord === i ? "scale(1.1)" : "scale(1)",
          boxShadow: spokenWord === i ? `0 2px 0 0 ${t.accent}` : "none",
          marginRight: "0.25em"
        }}
      >
        {content}
      </span>
    );
  };

  /* ── Derived ──────────────────────────────────────────────────────────────── */

  const pages = useMemo(() => payload ? chunkText(payload.text) : [], [payload]);
  const t = THEMES[theme];
  const pageWords = useMemo(() => pages[page]?.split(/\s+/) ?? [], [pages, page]);

  /* ── Keyboard nav ─────────────────────────────────────────────────────────── */

  const copyText = useCallback(() => {
    if (!payload) return;
    navigator.clipboard.writeText(payload.text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }, [payload]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setPage(p => Math.min(p + 1, pages.length - 1));
      if (e.key === "ArrowLeft")  setPage(p => Math.max(p - 1, 0));
      if (e.key === "f") setFocusMode(v => !v);
      if (e.key === "b") setBionic(v => !v);
      if (e.key === "e") setPointer(v => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pages.length]);

  /* ── TTS ───────────────────────────────────────────────────────────────────── */

  const speak = useCallback(() => {
    if (!pages[page]) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(pages[page]);
    u.rate = 0.85; u.pitch = 1.05;
    let wordIdx = 0;
    u.onboundary = (ev) => {
      if (ev.name === "word") { setSpokenWord(wordIdx); wordIdx++; }
    };
    u.onend = () => { setSpeaking(false); setSpokenWord(-1); };
    u.onerror = () => { setSpeaking(false); setSpokenWord(-1); };
    utterRef.current = u;
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  }, [pages, page]);

  const stopSpeak = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false); setSpokenWord(-1);
  }, []);

  // Stop TTS on page change
  useEffect(() => { stopSpeak(); }, [page, stopSpeak]);

  /* ── Manual paste ─────────────────────────────────────────────────────────── */

  const submitManual = async () => {
    if (!manualText.trim()) return;
    setSubmitting(true);
    try {
      await fetch("http://localhost:8000/reader/push", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: manualText.trim(), source_url: "", source_title: "Pasted text" }),
      });
    } finally { setSubmitting(false); }
  };

  /* ── Button helper ────────────────────────────────────────────────────────── */

  const IconBtn = ({ onClick, title, active, children, pulse }: {
    onClick: () => void; title: string; active?: boolean;
    children: React.ReactNode; pulse?: boolean;
  }) => (
    <button onClick={onClick} title={title}
      className={`p-2 rounded-xl transition-all duration-300 ${pulse ? 'animate-pulse' : ''}`}
      style={{
        background: active ? t.accent : "transparent",
        color: active ? "#fff" : t.muted,
        border: `1.5px solid ${active ? t.accent : t.border}`,
        boxShadow: active ? `0 4px 12px ${t.accent}44` : "none",
        transform: active ? "scale(1.1)" : "scale(1)"
      }}
    >
      {children}
    </button>
  );

  /* ══ Render ═══════════════════════════════════════════════════════════════ */

  // Loading
  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: t.bg, fontFamily: "'Outfit', sans-serif" }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
        <div className="relative mb-8">
          <Loader2 className="w-16 h-16 animate-spin mx-auto" style={{ color: t.accent }} />
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-pulse" />
        </div>
        <p className="text-2xl font-black tracking-tight" style={{ color: t.text }}>Magically Preparing Content…</p>
        <p className="text-sm font-semibold mt-2" style={{ color: t.muted }}>Using AI to adapt your reading experience</p>
      </motion.div>
    </div>
  );

  // Error
  if (error) return (
    <div className="fixed inset-0 flex items-center justify-center p-6" style={{ background: t.bg, fontFamily: "'Outfit', sans-serif" }}>
      <div className="max-w-md w-full rounded-[40px] border-4 p-12 text-center" style={{ background: t.card, borderColor: t.border, boxShadow: `0 12px 0 0 ${t.border}` }}>
        <div className="w-20 h-20 bg-rose-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <BookOpen className="w-10 h-10" style={{ color: "#f43f5e" }} />
        </div>
        <h2 className="text-3xl font-black mb-3" style={{ color: t.text }}>Oops! Connection Lost</h2>
        <p className="font-semibold text-lg" style={{ color: t.muted }}>{error}</p>
        <button onClick={() => window.location.reload()} className="mt-8 px-8 py-3 bg-rose-500 text-white font-black rounded-2xl border-b-4 border-rose-700 active:border-b-0 active:translate-y-1 transition-all">
          Retry
        </button>
      </div>
    </div>
  );

  // Waiting
  if (waiting || !payload) return (
    <div className="fixed inset-0 flex flex-col" style={{ background: t.bg, fontFamily: "'Outfit', sans-serif" }}>

      {/* Header */}
      <div className="shrink-0 flex items-center gap-4 px-10 py-6 border-b-2" style={{ borderColor: t.border }}>
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center shadow-lg transform -rotate-3">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: t.text }}>Readable <span className="text-sky-500">Explorer</span></h1>
          <p className="text-sm font-bold" style={{ color: t.muted }}>
            Magic reading tools at your fingertips
          </p>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border-2 border-dashed" style={{ borderColor: t.border }}>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: t.muted }}>Ready for Selection</span>
          </div>
        </div>
      </div>

      {/* Main paste area */}
      <div className="flex-1 flex flex-col items-center justify-center px-10 py-12 gap-8 max-w-5xl mx-auto w-full">
        <div className="w-full text-center">
          <h2 className="text-4xl font-black mb-2" style={{ color: t.text }}>What shall we read today?</h2>
          <p className="text-lg font-semibold" style={{ color: t.muted }}>Right-click text on any site or paste it below for magic transformation.</p>
        </div>

        <textarea
          value={manualText}
          onChange={e => setManualText(e.target.value)}
          placeholder="Paste a story, an article, or your homework here..."
          className="w-full flex-1 rounded-[40px] border-4 p-10 font-bold text-xl resize-none outline-none transition-all shadow-xl"
          style={{
            borderColor: manualText ? t.accent : t.border,
            color: t.text,
            background: t.card,
            fontFamily: "'Outfit', sans-serif",
            lineHeight: 1.6,
            boxShadow: manualText ? `0 12px 0 0 ${t.accent}22` : "none",
          }}
        />

        <button onClick={submitManual} disabled={!manualText.trim() || submitting}
          className="w-full py-6 rounded-[30px] font-black text-2xl transition-all border-b-8 shadow-xl"
          style={{
            background: !manualText.trim() ? t.hover : `linear-gradient(135deg, ${t.accent}, #818cf8)`,
            borderColor: !manualText.trim() ? t.border : "#0369a1",
            color: !manualText.trim() ? t.muted : "#fff",
            cursor: !manualText.trim() ? "not-allowed" : "pointer",
            transform: submitting ? "translateY(4px)" : "none"
          }}
        >
          {submitting ? "Transforming..." : "✨ Start Reading"}
        </button>
      </div>
    </div>
  );

  /* ═══════════════ Main Reader (fullscreen) ═══════════════════════════════ */

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: t.bg, color: t.text, fontFamily: "'Outfit', sans-serif" }}>

      {/* ── Top bar ── */}
      <AnimatePresence>
        {!focusMode && (
          <motion.header 
            initial={{ y: -100 }} animate={{ y: 0 }} exit={{ y: -100 }}
            className="flex items-center gap-3 px-8 py-4 border-b-2 shrink-0 backdrop-blur-md z-50"
            style={{ background: t.card + "cc", borderColor: t.border }}>

            {/* Logo */}
            <div className="flex items-center gap-3 mr-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center shadow-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-black text-xl tracking-tight" style={{ color: t.text }}>Readable</span>
            </div>

            {/* Source */}
            <div className="flex-1 min-w-0 hidden lg:block">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-0.5 opacity-50">Content Origin</p>
              <div className="flex items-center gap-2">
                <p className="text-base font-black truncate max-w-[200px]" style={{ color: t.text }}>{payload.sourceTitle || "Pasted Text"}</p>
                {payload.sourceUrl && (
                  <a href={payload.sourceUrl} target="_blank" rel="noreferrer" className="hover:scale-110 transition-transform" style={{ color: t.accent }}>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Magic Tools Group */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-sky-50 border-2 border-sky-100 mr-2">
                <span className="text-[10px] font-black text-sky-600 uppercase mr-1">Magic Tools</span>
                <IconBtn title="Bionic Reading (B)" active={bionic} onClick={() => setBionic(!bionic)}>
                  <Type className="w-4 h-4" />
                </IconBtn>
                <IconBtn title="Syllable Splitter" active={syllables} onClick={() => setSyllables(!syllables)}>
                  <Sparkles className="w-4 h-4" />
                </IconBtn>
              </div>

              {/* Layout controls */}
              <div className="flex items-center gap-1.5 rounded-2xl px-2 py-1.5 border-2" style={{ borderColor: t.border }}>
                <button onClick={() => setFontSize(f => FONT_SIZES[Math.max(0, FONT_SIZES.indexOf(f) - 1)])}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" style={{ color: t.muted }}>
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-sm font-black w-8 text-center" style={{ color: t.text }}>{fontSize}px</span>
                <button onClick={() => setFontSize(f => FONT_SIZES[Math.min(FONT_SIZES.length - 1, FONT_SIZES.indexOf(f) + 1)])}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" style={{ color: t.muted }}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <IconBtn title="Line height" onClick={() => setLineHeight(lh => LINE_HEIGHTS[(LINE_HEIGHTS.indexOf(lh) + 1) % LINE_HEIGHTS.length])}>
                <Maximize2 className="w-4.5 h-4.5" />
              </IconBtn>

              <IconBtn title="Theme" onClick={() => setTheme(th => th === "light" ? "cream" : th === "cream" ? "dark" : "light")}>
                {theme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </IconBtn>

              <IconBtn title={speaking ? "Stop reading" : "Read aloud"} active={speaking} pulse={speaking}
                onClick={() => speaking ? stopSpeak() : speak()}>
                {speaking ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
              </IconBtn>

              <IconBtn title="Focus Mode (F)" active={focusMode} onClick={() => setFocusMode(true)}>
                <Maximize2 className="w-4.5 h-4.5" />
              </IconBtn>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* ── Content area ── */}
      <main className="flex-1 overflow-y-auto flex flex-col items-center justify-center relative">
        
        {/* Magic Background Gradient */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
          style={{ background: `radial-gradient(circle at 50% 50%, ${t.accent} 0%, transparent 70%)` }} />

        {showFull ? (
          <motion.div key="full" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-6xl rounded-[50px] border-4 p-12 md:p-24 shadow-2xl relative z-10"
            style={{ background: t.card, borderColor: t.border, boxShadow: `0 16px 0 0 ${t.border}` }}>
            <p style={{ fontSize, lineHeight, color: t.text, letterSpacing: "0.02em" }}>
               {payload.text.split(/\s+/).map((word, i) => renderWord(word, i))}
            </p>
          </motion.div>
        ) : (
          <>
            {/* ── Progress ── */}
            <div className="w-full max-w-6xl px-12 mb-8 relative z-10">
              <div className="flex justify-between items-end mb-3">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: t.muted }}>Reading Progress</span>
                  <span className="text-lg font-black" style={{ color: t.text }}>Page {page + 1} of {pages.length}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border shadow-sm text-xs font-black" style={{ color: t.muted }}>
                    <Clock className="w-3.5 h-3.5" /> {fmtTime(elapsed)}
                  </div>
                  <span className="text-xl font-black" style={{ color: t.accent }}>{Math.round(((page + 1) / pages.length) * 100)}%</span>
                </div>
              </div>
              <div className="h-4 rounded-full overflow-hidden border-2 shadow-inner" style={{ background: t.border, borderColor: t.border }}>
                <motion.div className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${t.accent}, #818cf8, #a855f7)` }}
                  animate={{ width: `${((page + 1) / pages.length) * 100}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>

            {/* ── Page card ── */}
            <div className="w-full max-w-6xl flex-1 flex items-center px-12 relative z-10">
              <AnimatePresence mode="wait">
                <motion.div key={page}
                  initial={{ opacity: 0, x: 100, rotateY: 10 }} 
                  animate={{ opacity: 1, x: 0, rotateY: 0 }} 
                  exit={{ opacity: 0, x: -100, rotateY: -10 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="w-full rounded-[60px] border-4 p-16 md:p-24 min-h-[60vh] flex items-center shadow-2xl overflow-hidden relative"
                  style={{ background: t.card, borderColor: t.border, boxShadow: `0 20px 0 0 ${t.border}` }}>
                  
                  {/* Subtle Page Number Decal */}
                  <div className="absolute -bottom-10 -right-10 text-[200px] font-black opacity-5 pointer-events-none" style={{ color: t.accent }}>
                    {page + 1}
                  </div>

                  <p style={{ fontSize, lineHeight, letterSpacing: "0.02em", color: t.text }} className="w-full relative z-10">
                    {pageWords.map((word, i) => renderWord(word, i))}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── Navigation ── */}
            {!focusMode && (
              <div className="flex items-center gap-10 mt-12 mb-10">
                <motion.button whileHover={{ scale: 1.05, x: -5 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setPage(p => Math.max(p - 1, 0))} disabled={page === 0}
                  className="group flex items-center gap-3 px-12 py-5 rounded-[25px] font-black text-lg border-b-8 transition-all"
                  style={{
                    background: page === 0 ? t.hover : t.card,
                    borderColor: page === 0 ? t.border : t.border,
                    color: page === 0 ? t.muted : t.text,
                    cursor: page === 0 ? "not-allowed" : "pointer",
                    opacity: page === 0 ? 0.5 : 1,
                  }}>
                  <ChevronLeft className="w-6 h-6 transition-transform group-hover:-translate-x-1" /> Back
                </motion.button>

                <div className="flex gap-3">
                  {pages.map((_, i) => (
                    <button key={i} onClick={() => setPage(i)}
                      className="rounded-full transition-all duration-500 hover:scale-125"
                      style={{
                        width: i === page ? 40 : 12,
                        height: 12,
                        background: i === page ? t.accent : i < page ? t.accent + "66" : t.border,
                        boxShadow: i === page ? `0 0 15px ${t.accent}66` : "none"
                      }} />
                  ))}
                </div>

                <motion.button whileHover={{ scale: 1.05, x: 5 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setPage(p => Math.min(p + 1, pages.length - 1))}
                  disabled={page === pages.length - 1}
                  className="group flex items-center gap-3 px-12 py-5 rounded-[25px] font-black text-lg border-b-8 transition-all"
                  style={{
                    background: page === pages.length - 1 ? t.hover : t.accent,
                    borderColor: page === pages.length - 1 ? "#0369a1" : "#0369a1",
                    color: page === pages.length - 1 ? t.muted : "#fff",
                    cursor: page === pages.length - 1 ? "not-allowed" : "pointer",
                    opacity: page === pages.length - 1 ? 0.5 : 1,
                  }}>
                  Next <ChevronRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
                </motion.button>
              </div>
            )}

            {/* Focus mode exit button */}
            {focusMode && (
              <button 
                onClick={() => setFocusMode(false)}
                className="fixed bottom-10 left-1/2 -translate-x-1/2 px-8 py-3 bg-white/80 backdrop-blur shadow-xl rounded-full border-2 border-sky-200 font-black text-sky-600 hover:bg-sky-50 transition-all z-50"
              >
                Exit Focus Mode
              </button>
            )}

            <p className="mb-10 text-sm font-black uppercase tracking-widest opacity-40">
              Keyboard: ← → navigate • B Bionic • F Focus
            </p>
          </>
        )}
      </main>

      {/* Eye Tracking Guide */}
      <AnimatePresence>
        {pointer && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed pointer-events-none z-[100] mix-blend-difference"
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${t.accent}88 0%, transparent 70%)`,
              border: `2px solid ${t.accent}`,
              boxShadow: `0 0 20px ${t.accent}44`,
            }}
            onUpdate={(latest) => {
              // This is a bit of a hack to make it follow mouse in React
              // We'll use a standard useEffect for actual mouse move
            }}
            id="eye-pointer-guide"
          />
        )}
      </AnimatePresence>

      <script dangerouslySetInnerHTML={{ __html: `
        document.addEventListener('mousemove', (e) => {
          const el = document.getElementById('eye-pointer-guide');
          if (el) {
            el.style.left = (e.clientX - 20) + 'px';
            el.style.top = (e.clientY - 20) + 'px';
          }
        });
      `}} />
    </div>
  );
};

export default ReaderPage;
