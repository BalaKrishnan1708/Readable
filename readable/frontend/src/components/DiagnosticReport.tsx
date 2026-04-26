import { useMemo } from "react";
import type { SessionResult } from "../types/session";
import type { StudentProfile } from "../types/profile";
import { TextReader } from "./TextReader";

interface DiagnosticReportProps {
  result: SessionResult;
  profile: StudentProfile;
}

export const DiagnosticReport = ({ result, profile }: DiagnosticReportProps) => {
  const modelScores = result.model_profile_scores ?? profile.model_profile_scores ?? {};

  const insights = useMemo(() => {
    return generateInsights(result, modelScores);
  }, [result, modelScores]);

  const recommendations = useMemo(() => {
    return generateRecommendations(result, modelScores);
  }, [result, modelScores]);

  const scoreInterpretation = useMemo(() => {
    return interpretModelScores(modelScores);
  }, [modelScores]);

  const stats = [
    {
      label: "Accuracy",
      value: `${result.accuracy_pct.toFixed(1)}%`,
      description: "Reading precision",
      icon: "🎯",
      gradient: "from-[#f0fdfa] to-[#ccfbf1]",
      textColor: "text-teal-900",
      accentColor: "bg-teal-500",
    },
    {
      label: "Pacing",
      value: `${result.speed_wpm}`,
      unit: "WPM",
      description: "Reading speed",
      icon: "⚡",
      gradient: "from-[#f8fafc] to-[#e2e8f0]",
      textColor: "text-slate-900",
      accentColor: "bg-slate-500",
    },
    {
      label: "Attention",
      value: `${Math.round(result.attention_score * 100)}%`,
      description: "Focus level",
      icon: "🧠",
      gradient: "from-[#fffbeb] to-[#fef3c7]",
      textColor: "text-amber-900",
      accentColor: "bg-amber-500",
    },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-12 pb-16 pt-6">
      {/* Report Header */}
      <div className="border-b border-slate-200 pb-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sea/10 text-sea">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </span>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sea">
                Diagnostic Analysis
              </p>
            </div>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-ink">Reading Profile Report</h2>
            <div className="mt-2 flex items-center gap-4 text-xs font-medium text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                Session #{result.session_id}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <p className="mt-3 text-slate-500">
              A comprehensive review of your reading mechanics and cognitive focus markers.
            </p>
          </div>
          
          <div className="flex items-center gap-4 rounded-[2rem] bg-white p-4 shadow-soft border border-slate-100">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-hero-radial text-3xl shadow-sm">
              🎓
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Level</p>
              <p className="text-xl font-bold text-ink">{profile.reading_level ?? "Foundational"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Statistics */}
      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((card) => (
          <div
            key={card.label}
            className={`group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br ${card.gradient} p-8 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-3xl">{card.icon}</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Metric Verified
                </span>
              </div>
              <div className="mt-6">
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <div className="mt-1 flex items-baseline gap-1">
                  <p className={`text-5xl font-black tracking-tight ${card.textColor}`}>
                    {card.value}
                  </p>
                  {card.unit && (
                    <p className="text-sm font-bold text-slate-500">{card.unit}</p>
                  )}
                </div>
              </div>
              <div className="mt-6 flex items-center gap-2">
                <div className="h-2 flex-1 rounded-full bg-black/5">
                  <div
                    className={`h-full rounded-full ${card.accentColor} transition-all duration-1000`}
                    style={{
                      width: card.label === "Pacing" ? `${Math.min((Number(card.value) / 150) * 100, 100)}%` : card.value,
                    }}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                  {card.description}
                </span>
              </div>
            </div>
            <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-white/30 blur-3xl transition-all duration-500 group-hover:scale-150" />
          </div>
        ))}
      </div>

      {/* Detailed Analysis Section */}
      <div className="grid gap-12 lg:grid-cols-[1fr,360px]">
        <div className="space-y-12">
          {/* AI Analysis Grid */}
          <section>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-2xl font-bold text-ink">AI Mechanic Profile</h3>
              <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold text-white uppercase tracking-widest">
                Deep Analysis Live
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-500 leading-relaxed">
              Our ML models have mapped your vocal patterns and eye-tracking stability to these 
              core reading difficulty markers.
            </p>
            <div className="mt-8 grid gap-8 sm:grid-cols-2">
              {scoreInterpretation.map((item) => (
                <div key={item.name} className="space-y-3 p-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-ink">{item.name}</p>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${getSeverityColor(item.severity)}`}>
                      {item.severity}
                    </span>
                  </div>
                  <div className="relative h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full ${getSeverityBg(item.severity)} transition-all duration-1000 ease-out`}
                      style={{ width: `${Math.max(8, item.score * 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight italic">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Text Playback Analysis */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-ink">Playback Analysis</h3>
              <div className="flex gap-2">
                <span className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold text-amber-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> HESITATIONS
                </span>
              </div>
            </div>
            <TextReader text={[result.expected_text]} highlights={result.errors} />
          </section>
        </div>

        {/* Right Sidebar: Path & Insights */}
        <aside className="space-y-8">
          <section className="rounded-[2.5rem] bg-ink p-8 text-white shadow-2xl">
            <div className="flex items-center gap-2 text-sea">
              <span className="text-xl">🎯</span>
              <h3 className="text-lg font-bold uppercase tracking-wider">Your Path</h3>
            </div>
            <p className="mt-4 text-sm text-slate-300 leading-relaxed">
              Based on this diagnostic, your first lesson is being prepared with:
            </p>
            <ul className="mt-6 space-y-4">
              {recommendations.map((rec, idx) => (
                <li key={idx} className="flex gap-3 items-start">
                  <span className="mt-1 text-lg shrink-0">{rec.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-white leading-tight">{rec.title}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{rec.description}</p>
                  </div>
                </li>
              ))}
            </ul>
            <button 
              type="button"
              className="mt-8 w-full rounded-2xl bg-sea py-4 text-sm font-bold text-white transition hover:bg-teal-700 shadow-lg shadow-sea/20"
            >
              Start First Lesson
            </button>
          </section>

          <section className="rounded-[2.5rem] bg-blush/10 p-8 border border-blush/20">
            <h3 className="text-lg font-bold text-ink flex items-center gap-2">
              <span>💡</span> Key Insights
            </h3>
            <div className="mt-6 space-y-5">
              {insights.map((insight, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="mt-2 h-1.5 w-1.5 rounded-full bg-ink shrink-0" />
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">{insight}</p>
                </div>
              ))}
            </div>
          </section>

          {profile.difficult_words.length > 0 && (
            <section className="px-2">
              <h3 className="text-lg font-bold text-ink">Focus Vocabulary</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.difficult_words.slice(0, 12).map((word) => (
                  <span
                    key={word}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-100 text-xs font-bold text-slate-600 shadow-sm hover:border-sea/30 transition cursor-default"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-[2rem] border border-dashed border-slate-200 p-6">
            <p className="text-xs text-slate-400 text-center leading-relaxed">
              If you feel these results don't reflect your typical reading pace, 
              you can run another diagnostic at any time.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
};

// Helper Functions
const getSeverityColor = (sev: string) => {
  switch (sev) {
    case "Minimal": return "text-teal-500";
    case "Mild": return "text-emerald-400";
    case "Moderate": return "text-amber-400";
    case "High": return "text-orange-500";
    case "Severe": return "text-rose-500";
    default: return "text-slate-400";
  }
};

const getSeverityBg = (sev: string) => {
  switch (sev) {
    case "Minimal": return "bg-teal-500";
    case "Mild": return "bg-emerald-400";
    case "Moderate": return "bg-amber-400";
    case "High": return "bg-orange-500";
    case "Severe": return "bg-rose-500";
    default: return "bg-slate-400";
  }
};

function generateInsights(result: SessionResult, modelScores: Record<string, number>): string[] {
  const insights: string[] = [];

  if (result.accuracy_pct >= 95) {
    insights.push("Exceptional accuracy markers indicate strong word-form recognition.");
  } else if (result.accuracy_pct >= 85) {
    insights.push("Steady accuracy maintained, with minor phonological hesitations.");
  } else {
    insights.push("Reading accuracy suggests potential decoding gaps with complex graphemes.");
  }

  const speed = result.speed_wpm;
  if (speed >= 120) {
    insights.push("Pacing is brisk, potentially masking subtle decoding fatigue.");
  } else if (speed < 70) {
    insights.push("Slower cadence observed, likely due to intensive focus on word segments.");
  } else {
    insights.push("Flow and rhythm are stable, aligning with targets.");
  }

  if (result.attention_score >= 0.85) {
    insights.push("High fixation stability confirms excellent engagement with the text.");
  } else if (result.attention_score < 0.65) {
    insights.push("Occasional gaze drifts detected; shorter segments may improve focus.");
  }

  return insights.slice(0, 4);
}

function generateRecommendations(
  result: SessionResult,
  modelScores: Record<string, number>
): Array<{ icon: string; title: string; description: string }> {
  const recs: Array<{ icon: string; title: string; description: string }> = [];

  if (result.accuracy_pct < 90) {
    recs.push({
      icon: "🧩",
      title: "Segmented Decoding",
      description: "Break multisyllabic words into manageable chunks.",
    });
  }

  if (result.speed_wpm < 90) {
    recs.push({
      icon: "🌊",
      title: "Flow Induction",
      description: "Echo-reading to build rhythmic confidence.",
    });
  }

  if (result.attention_score < 0.8) {
    recs.push({
      icon: "👁️",
      title: "Focus Pacing",
      description: "Use the gaze-guided ruler for line transitions.",
    });
  }

  const decodingDiff = modelScores["decoding_difficulty"];
  if (decodingDiff && decodingDiff > 0.4) {
    recs.push({
      icon: "🔤",
      title: "Morphology Focus",
      description: "Building awareness of prefixes and suffixes.",
    });
  }

  if (recs.length < 4) {
    recs.push({
      icon: "🌟",
      title: "Next Mastery Level",
      description: "Transitioning to descriptive narratives.",
    });
  }

  return recs.slice(0, 4);
}

function interpretModelScores(
  modelScores: Record<string, number>
): Array<{
  name: string;
  score: number;
  severity: string;
  description: string;
}> {
  const interpretations = [
    {
      name: "Fluency Flow",
      key: "reading_fluency",
      description: "Smoothness and rhythm of spoken output.",
      inverted: true,
    },
    {
      name: "Decoding Load",
      key: "decoding_difficulty",
      description: "Cognitive effort required to parse words.",
      inverted: false,
    },
    {
      name: "Phonetic Mapping",
      key: "phonological_difficulty",
      description: "Ability to map sounds to letter clusters.",
      inverted: false,
    },
    {
      name: "Visual Tracking",
      key: "visual_difficulty",
      description: "Eye-movement stability and line-finding.",
      inverted: false,
    },
  ];

  return interpretations
    .map((interp) => {
      const score = modelScores[interp.key] ?? 0.5;
      const normalizedScore = interp.inverted ? 1 - score : score;

      let severity = "Minimal";
      if (normalizedScore >= 0.8) severity = "Severe";
      else if (normalizedScore >= 0.6) severity = "High";
      else if (normalizedScore >= 0.4) severity = "Moderate";
      else if (normalizedScore >= 0.2) severity = "Mild";

      return {
        name: interp.name,
        score: normalizedScore,
        severity,
        description: interp.description,
      };
    })
    .filter((_, idx) => idx < 4);
}
