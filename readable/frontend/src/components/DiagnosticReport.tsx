import { useMemo } from "react";

import type { StudentProfile } from "../types/profile";
import type { SessionResult } from "../types/session";
import { TextReader } from "./TextReader";

interface DiagnosticReportProps {
  result: SessionResult;
  profile: StudentProfile;
}

type ReportCard = {
  label: string;
  value: string;
  note: string;
};

export const DiagnosticReport = ({ result, profile }: DiagnosticReportProps) => {
  const modelScores = result.model_profile_scores ?? profile.model_profile_scores ?? {};
  const highlights = result.eye_metrics.focused_word_hits.slice(0, 6);
  const insightLines = useMemo(() => buildInsightLines(result), [result]);
  const supportMoves = useMemo(() => buildSupportMoves(result), [result]);
  const modelSummaries = useMemo(() => buildModelSummaries(modelScores), [modelScores]);

  const topCards: ReportCard[] = [
    {
      label: "Accuracy",
      value: `${result.accuracy_pct.toFixed(1)}%`,
      note: "word-reading precision",
    },
    {
      label: "Pace",
      value: `${result.speed_wpm.toFixed(0)} WPM`,
      note: "observed reading speed",
    },
    {
      label: "Attention",
      value: `${Math.round(result.attention_score * 100)}%`,
      note: "live gaze stability",
    },
    {
      label: "Fixation",
      value: `${Math.round(result.eye_metrics.fixation_duration_ms)} ms`,
      note: "average hold per word",
    },
  ];

  return (
    <div className="space-y-8 pb-16 pt-2">
      <section className="overflow-hidden rounded-[2.5rem] border border-sky-200 bg-[linear-gradient(135deg,#2f80ed_0%,#4fa6ff_100%)] p-10 text-white shadow-[0_8px_30px_rgba(47,128,237,0.3)] backdrop-blur">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-widest text-sky-100">Diagnostic Review</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">
              A clear reading report built from the live session
            </h2>
            <p className="mt-4 text-base font-medium leading-8 text-sky-50">
              This review blends live gaze movement, live voice timing, and the profile model
              output from the session that just finished.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-white/20 bg-white/10 px-6 py-5 backdrop-blur shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-sky-100">
              Session
            </p>
            <p className="mt-2 text-3xl font-semibold">#{result.session_id}</p>
            <p className="mt-1 font-medium text-sm text-sky-50">
              Level: {profile.reading_level ?? "Foundational"}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {topCards.map((card) => (
          <div
            key={card.label}
            className="rounded-[2rem] border border-sky-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-soft"
          >
            <p className="text-sm font-semibold text-slate-500">{card.label}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-ink">{card.value}</p>
            <p className="mt-2 text-sm font-medium text-slate-500">{card.note}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.15fr,0.85fr]">
        <div className="space-y-8">
          <div className="rounded-[2.5rem] border border-white/80 bg-white/80 p-8 shadow-soft backdrop-blur">
            <div className="flex items-center justify-between gap-4 border-b border-sky-50 pb-5">
              <div>
                <h3 className="text-xl font-semibold text-ink">Playback review</h3>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  The submitted passage with reading errors highlighted inline.
                </p>
              </div>
              <div className="rounded-full bg-[#eef6ff] px-4 py-2 text-sm font-bold text-sea ring-1 ring-sea/10 shadow-sm">
                {result.errors.length} marked errors
              </div>
            </div>
            <div className="mt-6">
              <TextReader text={[result.expected_text]} highlights={result.errors} />
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-white/80 bg-white/80 p-8 shadow-soft backdrop-blur">
            <h3 className="text-xl font-semibold text-ink">Live capture signals</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              These values come directly from the session’s real gaze and microphone capture.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <SignalCard
                label="Samples captured"
                value={String(result.eye_metrics.sample_count)}
                note="raw eye-tracking frames used in review"
              />
              <SignalCard
                label="Re-read events"
                value={String(result.eye_metrics.re_read_events.length)}
                note="times gaze moved back to earlier words or lines"
              />
              <SignalCard
                label="Skipped words"
                value={String(result.eye_metrics.skipped_words)}
                note="words not seen in the live focus trail"
              />
              <SignalCard
                label="Pause duration"
                value={`${Math.round(result.voice_metrics.pause_duration_ms)} ms`}
                note="silence span detected in the reading sample"
              />
              <SignalCard
                label="Speech rate"
                value={`${result.voice_metrics.speech_rate_wps.toFixed(2)} w/s`}
                note="voice pacing measured from the submitted audio"
              />
              <SignalCard
                label="Repetition rate"
                value={`${Math.round(result.voice_metrics.repetition_rate * 100)}%`}
                note="immediate repeated-word pattern in speech"
              />
            </div>
          </div>

          {Object.keys(modelScores).length > 0 ? (
            <div className="rounded-[2.5rem] border border-white/80 bg-white/80 p-8 shadow-soft backdrop-blur">
              <div className="flex items-center justify-between gap-4 border-b border-sky-50 pb-5">
                <div>
                  <h3 className="text-xl font-semibold text-ink">Profile model markers</h3>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    These values come from the local dyslexia profiler using live session features.
                  </p>
                </div>
                <div className="rounded-full bg-[#f4faff] px-4 py-2 text-sm font-bold text-sea ring-1 ring-sea/10 shadow-sm">
                  Model live
                </div>
              </div>
              <div className="mt-6 space-y-6">
                {modelSummaries.map((item) => (
                  <div key={item.key} className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-bold text-ink">{item.label}</p>
                      <p className="text-sm font-bold text-slate-600">
                        {(item.score * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[#eef6ff] ring-1 ring-sky-50">
                      <div
                        className={`h-full rounded-full ${item.tone} shadow-sm transition-all duration-1000`}
                        style={{ width: `${Math.max(item.score * 100, 6)}%` }}
                      />
                    </div>
                    <p className="text-sm font-medium leading-relaxed text-slate-500">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="space-y-8">
          <div className="rounded-[2.5rem] border border-sky-100 bg-[linear-gradient(180deg,#f7fbff_0%,#edf5ff_100%)] p-8 shadow-soft">
            <p className="text-sm font-bold uppercase tracking-widest text-sky-500">Session summary</p>
            <div className="mt-6 space-y-4">
              {result.review_text ? (
                <div className="rounded-[1.5rem] bg-white p-6 shadow-sm border border-sky-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-sky-50 px-3 py-1 rounded-bl-xl border-l border-b border-sky-100">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-sky-400">AI Insight</p>
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-slate-700 italic">
                    "{result.review_text}"
                  </p>
                </div>
              ) : (
                insightLines.map((line) => (
                  <div
                    key={line}
                    className="rounded-[1.5rem] bg-white p-5 text-sm font-medium leading-relaxed text-slate-700 shadow-sm border border-sky-50"
                  >
                    {line}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-white/80 bg-white/80 p-8 shadow-soft backdrop-blur">
            <h3 className="text-lg font-semibold text-ink">Focus hotspots</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Words that held the student’s gaze the longest during the session.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {highlights.length > 0 ? (
                highlights.map((item) => (
                  <span
                    key={`${item.word}-${item.count}`}
                    className="rounded-full bg-[#eef6ff] px-4 py-2 text-sm font-semibold text-sea ring-1 ring-sea/10 shadow-sm transition hover:bg-sea hover:text-white"
                  >
                    {item.word} x{item.count}
                  </span>
                ))
              ) : (
                <p className="text-sm font-medium text-slate-500">No eye-tracking hotspots were captured in this run.</p>
              )}
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-white/80 bg-white/80 p-8 shadow-soft backdrop-blur">
            <h3 className="text-lg font-semibold text-ink">Recommended support stack</h3>
            <div className="mt-6 space-y-4">
              {supportMoves.map((item) => (
                <div key={item.title} className="rounded-[1.5rem] border border-sky-100 bg-[#f7fbff] p-5 shadow-sm">
                  <p className="text-sm font-bold text-ink">{item.title}</p>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-dashed border-sky-200 bg-white/60 p-8 text-sm font-medium leading-relaxed text-slate-500 backdrop-blur">
            Running the diagnostic again will refresh this report with a new gaze path, new voice
            timing, and a fresh model pass.
          </div>
        </aside>
      </section>
    </div>
  );
};

const SignalCard = ({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) => (
  <div className="rounded-[1.5rem] border border-sky-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
    <p className="text-sm font-semibold text-slate-500">{label}</p>
    <p className="mt-3 text-2xl font-bold tracking-tight text-ink">{value}</p>
    <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">{note}</p>
  </div>
);

const buildInsightLines = (result: SessionResult): string[] => {
  const lines = [
    `Live eye capture recorded ${result.eye_metrics.sample_count} gaze samples and ${result.eye_metrics.re_read_events.length} re-read events during the passage.`,
    `Average fixation landed at ${Math.round(result.eye_metrics.fixation_duration_ms)} ms, showing how long words were held before moving on.`,
    `Voice timing measured ${result.voice_metrics.speech_rate_wps.toFixed(2)} words per second with ${Math.round(result.voice_metrics.pause_duration_ms)} ms of pause time.`,
  ];

  if (result.eye_metrics.skipped_words > 0) {
    lines.push(
      `${result.eye_metrics.skipped_words} words were not observed in the gaze trail, suggesting line loss or skipping under load.`,
    );
  } else {
    lines.push("The gaze trail covered the passage steadily, with no skipped-word signal in this capture.");
  }

  return lines;
};

const buildSupportMoves = (result: SessionResult) => {
  const moves: Array<{ title: string; description: string }> = [];

  if (result.eye_metrics.re_read_events.length > 0) {
    moves.push({
      title: "Gaze-guided ruler",
      description: "Keep the reading ruler active to stabilize line changes and reduce upward re-reads.",
    });
  }

  if (result.voice_metrics.pause_duration_ms > 800) {
    moves.push({
      title: "Echo reading",
      description: "Use model read-aloud first so the student can hear pacing before repeating the line.",
    });
  }

  if (result.accuracy_pct < 90) {
    moves.push({
      title: "Phonetic breakdown",
      description: "Expose syllable splits and tap-to-hear on harder words before the next passage.",
    });
  }

  if (result.attention_score < 0.8) {
    moves.push({
      title: "Chunked reading",
      description: "Shorter passage chunks will reduce visual drift and help maintain attention across lines.",
    });
  }

  return moves.slice(0, 4);
};

const buildModelSummaries = (scores: Record<string, number>) => {
  const entries = [
    {
      key: "reading_fluency",
      label: "Reading fluency",
      description: "How smoothly the model saw speech pacing and flow land in the session.",
      tone: "bg-blue-500",
    },
    {
      key: "decoding_difficulty",
      label: "Decoding difficulty",
      description: "How much word-level decoding load the model inferred from the session features.",
      tone: "bg-cyan-500",
    },
    {
      key: "phonological_difficulty",
      label: "Phonological difficulty",
      description: "How strongly sound-to-letter mapping strain showed up in the capture.",
      tone: "bg-amber-500",
    },
    {
      key: "visual_difficulty",
      label: "Visual tracking difficulty",
      description: "How much the live gaze pattern suggested instability across words and lines.",
      tone: "bg-sky-500",
    },
  ];

  return entries
    .map((entry) => ({
      ...entry,
      score: Number(scores[entry.key] ?? 0),
    }))
    .filter((entry) => !Number.isNaN(entry.score));
};
