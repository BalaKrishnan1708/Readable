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
  const [fontSize,   setFontSize]   = useState<FontSize>(28);
  const [lineHeight, setLineHeight] = useState<LineHeight>(2.0);
  const [theme,      setTheme]      = useState<Theme>("light");
  const [copied,     setCopied]     = useState(false);
  const [showFull,   setShowFull]   = useState(false);
  const [manualText, setManualText] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const IconBtn = ({ onClick, title, active, children }: {
    onClick: () => void; title: string; active?: boolean;
    children: React.ReactNode;
  }) => (
    <button onClick={onClick} title={title}
      className="p-2 rounded-xl transition-all duration-200"
      style={{
        background: active ? t.accent + "22" : "transparent",
        color: active ? t.accent : t.muted,
        border: `1.5px solid ${active ? t.accent + "44" : t.border}`,
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
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: t.accent }} />
        <p className="text-lg font-bold" style={{ color: t.muted }}>Connecting…</p>
      </motion.div>
    </div>
  );

  // Error
  if (error) return (
    <div className="fixed inset-0 flex items-center justify-center p-6" style={{ background: t.bg, fontFamily: "'Outfit', sans-serif" }}>
      <div className="max-w-md w-full rounded-3xl border-2 p-12 text-center" style={{ background: t.card, borderColor: t.border }}>
        <BookOpen className="w-10 h-10 mx-auto mb-4" style={{ color: "#f43f5e" }} />
        <h2 className="text-2xl font-black mb-3" style={{ color: t.text }}>Cannot Connect</h2>
        <p className="font-semibold" style={{ color: t.muted }}>{error}</p>
      </div>
    </div>
  );

  // Waiting
  if (waiting || !payload) return (
    <div className="fixed inset-0 flex flex-col" style={{ background: t.bg, fontFamily: "'Outfit', sans-serif" }}>

      {/* Header */}
      <div className="shrink-0 flex items-center gap-4 px-8 py-5 border-b-2" style={{ borderColor: t.border }}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center shadow-md">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black" style={{ color: t.text }}>Readable</h1>
          <p className="text-xs font-semibold" style={{ color: t.muted }}>
            Right-click selected text → <span style={{ color: t.accent }} className="font-black">📖 Open in Readable</span>
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs font-bold" style={{ color: t.muted }}>
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping inline-block" />
          Listening for text…
        </div>
      </div>

      {/* Main paste area — fills the remaining space */}
      <div className="flex-1 flex flex-col px-6 py-4 gap-3 min-h-0 overflow-hidden">
        <textarea
          value={manualText}
          onChange={e => setManualText(e.target.value)}
          placeholder="Paste any text here to start reading…"
          className="flex-1 w-full rounded-2xl border-2 p-6 font-semibold text-base resize-none outline-none transition-all min-h-0"
          style={{
            borderColor: manualText ? t.accent + "66" : t.border,
            color: t.text,
            background: t.surface,
            fontFamily: "'Outfit', sans-serif",
            lineHeight: 1.8,
            boxShadow: manualText ? `0 0 0 3px ${t.accent}15` : "none",
          }}
        />

        <button onClick={submitManual} disabled={!manualText.trim() || submitting}
          className="shrink-0 w-full py-4 rounded-2xl font-black text-lg transition-all border-b-4"
          style={{
            background: !manualText.trim() ? t.hover : t.accent,
            borderColor: !manualText.trim() ? t.border : t.accent,
            color: !manualText.trim() ? t.muted : "#fff",
            cursor: !manualText.trim() ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Loading…" : "📖 Load Text"}
        </button>
      </div>
    </div>
  );

  /* ═══════════════ Main Reader (fullscreen) ═══════════════════════════════ */

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: t.bg, color: t.text, fontFamily: "'Outfit', sans-serif" }}>

      {/* ── Top bar ── */}
      <header className="flex items-center gap-3 px-6 py-3 border-b-2 shrink-0 backdrop-blur-sm"
        style={{ background: t.card + "ee", borderColor: t.border }}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 mr-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center shadow-md">
            <BookOpen className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-black text-lg" style={{ color: t.text }}>Readable</span>
        </div>

        {/* Source */}
        <div className="flex-1 min-w-0 hidden sm:block">
          <p className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: t.muted }}>Source</p>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold truncate" style={{ color: t.text }}>{payload.sourceTitle || "Pasted Text"}</p>
            {payload.sourceUrl && (
              <a href={payload.sourceUrl} target="_blank" rel="noreferrer" style={{ color: t.muted }}>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Stats pills */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black"
            style={{ background: t.surface, color: t.muted, border: `1px solid ${t.border}` }}>
            <Type className="w-3.5 h-3.5" />
            {wordCount(payload.text)} words
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black"
            style={{ background: t.surface, color: t.muted, border: `1px solid ${t.border}` }}>
            <Clock className="w-3.5 h-3.5" />
            ~{readTime(payload.text)} min read
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black"
            style={{ background: t.surface, color: t.accent, border: `1px solid ${t.accent}33` }}>
            <Sparkles className="w-3.5 h-3.5" />
            {fmtTime(elapsed)}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 ml-3">
          {/* Font size */}
          <div className="flex items-center gap-0.5 rounded-xl px-1.5 py-1 border"
            style={{ borderColor: t.border }}>
            <button onClick={() => setFontSize(f => FONT_SIZES[Math.max(0, FONT_SIZES.indexOf(f) - 1)])}
              className="p-1 rounded-lg" style={{ color: t.muted }}>
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-black w-6 text-center" style={{ color: t.text }}>{fontSize}</span>
            <button onClick={() => setFontSize(f => FONT_SIZES[Math.min(FONT_SIZES.length - 1, FONT_SIZES.indexOf(f) + 1)])}
              className="p-1 rounded-lg" style={{ color: t.muted }}>
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Line height */}
          <IconBtn title="Line spacing" onClick={() => setLineHeight(lh => LINE_HEIGHTS[(LINE_HEIGHTS.indexOf(lh) + 1) % LINE_HEIGHTS.length])}>
            <Maximize2 className="w-4 h-4" />
          </IconBtn>

          {/* Theme */}
          <IconBtn title="Theme" onClick={() => setTheme(th => th === "light" ? "cream" : th === "cream" ? "dark" : "light")}>
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </IconBtn>

          {/* TTS */}
          <IconBtn title={speaking ? "Stop reading" : "Read aloud"} active={speaking}
            onClick={() => speaking ? stopSpeak() : speak()}>
            {speaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </IconBtn>

          {/* View */}
          <IconBtn title={showFull ? "Page view" : "Full text"} active={showFull}
            onClick={() => setShowFull(v => !v)}>
            <AlignLeft className="w-4 h-4" />
          </IconBtn>

          {/* Copy */}
          <IconBtn title="Copy all" active={copied} onClick={copyText}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </IconBtn>
        </div>
      </header>

      {/* ── Content area ── */}
      <main className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-6 py-10">

        {showFull ? (
          /* ── Full text ── */
          <motion.div key="full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="w-full max-w-4xl rounded-3xl border-2 p-10 md:p-16"
            style={{ background: t.card, borderColor: t.border, boxShadow: `0 8px 0 0 ${t.border}` }}>
            <p style={{ fontSize, lineHeight, color: t.text, letterSpacing: "0.01em" }}>
              {payload.text}
            </p>
          </motion.div>
        ) : (
          <>
            {/* ── Progress ── */}
            <div className="w-full max-w-4xl mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-widest" style={{ color: t.muted }}>
                  Page {page + 1} / {pages.length}
                </span>
                <span className="text-xs font-semibold" style={{ color: t.muted }}>
                  {Math.round(((page + 1) / pages.length) * 100)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: t.border }}>
                <motion.div className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${t.accent}, #818cf8)` }}
                  animate={{ width: `${((page + 1) / pages.length) * 100}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* ── Page card ── */}
            <div className="w-full max-w-4xl flex-1 flex items-center">
              <AnimatePresence mode="wait">
                <motion.div key={page}
                  initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.25 }}
                  className="w-full rounded-3xl border-2 p-10 md:p-16 min-h-[60vh] flex items-center"
                  style={{ background: t.card, borderColor: t.border, boxShadow: `0 8px 0 0 ${t.border}` }}>
                  <p style={{ fontSize, lineHeight, letterSpacing: "0.01em", color: t.text }} className="w-full">
                    {pageWords.map((word, i) => (
                      <span key={i}
                        className="transition-all duration-200 rounded-lg px-0.5"
                        style={{
                          background: spokenWord === i ? t.accent + "30" : "transparent",
                          color: spokenWord === i ? t.accent : t.text,
                          fontWeight: spokenWord === i ? 900 : "inherit",
                          boxShadow: spokenWord === i ? `0 2px 0 0 ${t.accent}` : "none",
                        }}
                      >
                        {word}{" "}
                      </span>
                    ))}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── Navigation ── */}
            <div className="flex items-center gap-6 mt-8">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setPage(p => Math.max(p - 1, 0))} disabled={page === 0}
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-sm border-b-4 transition-all"
                style={{
                  background: page === 0 ? t.hover : t.card,
                  borderColor: page === 0 ? t.border : t.border,
                  color: page === 0 ? t.muted : t.text,
                  cursor: page === 0 ? "not-allowed" : "pointer",
                  opacity: page === 0 ? 0.5 : 1,
                }}>
                <ChevronLeft className="w-4 h-4" /> Back
              </motion.button>

              <div className="flex gap-1.5">
                {pages.map((_, i) => (
                  <button key={i} onClick={() => setPage(i)}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: i === page ? 24 : 10,
                      height: 10,
                      background: i === page ? t.accent : i < page ? t.accent + "55" : t.border,
                    }} />
                ))}
              </div>

              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setPage(p => Math.min(p + 1, pages.length - 1))}
                disabled={page === pages.length - 1}
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-sm border-b-4 transition-all"
                style={{
                  background: page === pages.length - 1 ? t.hover : t.accent,
                  borderColor: page === pages.length - 1 ? t.border : t.accent,
                  color: page === pages.length - 1 ? t.muted : "#fff",
                  cursor: page === pages.length - 1 ? "not-allowed" : "pointer",
                  opacity: page === pages.length - 1 ? 0.5 : 1,
                }}>
                Next <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>

            <p className="mt-4 text-xs font-semibold" style={{ color: t.muted }}>
              ← → arrow keys • {speaking ? "🔊 reading aloud" : "press 🔊 to listen"}
            </p>
          </>
        )}
      </main>
    </div>
  );
};
