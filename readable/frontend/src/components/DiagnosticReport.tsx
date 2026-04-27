import { useMemo, useState } from "react";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, 
  Zap, 
  Eye, 
  MousePointer2, 
  Star, 
  Award, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Info,
  TrendingUp,
  Brain
} from "lucide-react";

import type { StudentProfile } from "../types/profile";
import type { SessionResult } from "../types/session";

interface DiagnosticReportProps {
  result: SessionResult;
  profile: StudentProfile;
}

const MetricCard = ({ 
  value, 
  label, 
  icon: Icon, 
  color = "text-sky-600",
  bg = "bg-sky-50",
  border = "border-sky-200",
  shadow = "shadow-[0_8px_0_0_#bae6fd]"
}: { 
  value: string | number; 
  label: string; 
  icon: any; 
  color?: string;
  bg?: string;
  border?: string;
  shadow?: string;
}) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className={`card-clean p-8 ${bg} ${border} ${shadow} flex flex-col items-center text-center`}
  >
    <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white border-2 ${border} ${color}`}>
      <Icon className="w-8 h-8" />
    </div>
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{label}</p>
    <p className={`text-3xl font-black ${color}`}>{value}</p>
  </motion.div>
);

const MascotBubble = ({ text }: { text: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col md:flex-row items-center gap-10 p-12 card-clean bg-white relative overflow-hidden"
  >
    <div className="flex-shrink-0 relative">
      <motion.img 
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        src="/diagnostic-mascot.png" 
        alt="Mascot" 
        className="w-44 h-44 drop-shadow-xl" 
      />
      <div className="absolute -bottom-2 -right-2 bg-amber-400 p-3 rounded-2xl shadow-lg border-4 border-white">
        <Star className="w-6 h-6 text-white" fill="currentColor" />
      </div>
    </div>
    <div className="flex-1">
      <div className="bg-slate-50 p-8 rounded-[2.5rem] rounded-tl-none border-4 border-slate-100 relative">
        <div className="absolute -left-4 top-0 w-4 h-4 bg-slate-50 border-l-4 border-t-4 border-slate-100 transform -rotate-45 -translate-x-1/2 hidden md:block" />
        <p className="text-xs font-black text-sky-600 uppercase tracking-widest mb-4 flex items-center gap-3">
          <Award className="w-5 h-5" /> Mission Debrief
        </p>
        <p className="text-xl font-bold leading-relaxed text-slate-700 italic">
          "{text}"
        </p>
      </div>
    </div>
  </motion.div>
);

export const DiagnosticReport = ({ result, profile }: DiagnosticReportProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const modelScores = result.model_profile_scores ?? profile.model_profile_scores ?? {};
  const highlights = result.eye_metrics.focused_word_hits.slice(0, 8);
  
  const radarData = [
    { subject: 'Fluency', A: modelScores.reading_fluency ?? 50 },
    { subject: 'Decoding', A: modelScores.decoding_ability ?? 50 },
    { subject: 'Phonology', A: modelScores.phonological_awareness ?? 50 },
    { subject: 'Memory', A: modelScores.working_memory ?? 50 },
    { subject: 'Focus', A: modelScores.attention_focus ?? 50 },
  ];

  return (
    <div className="space-y-12 py-4">
      <MascotBubble text={result.review_text || "You did an amazing job on this mission! Your focus was steady and your pacing is improving."} />

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          value={`${result.accuracy_pct.toFixed(1)}%`} 
          label="Accuracy" 
          icon={Target} 
          color="text-emerald-600"
          bg="bg-emerald-50"
          border="border-emerald-200"
          shadow="shadow-[0_8px_0_0_#a7f3d0]"
        />
        <MetricCard 
          value={`${result.speed_wpm.toFixed(0)} WPM`} 
          label="Pacing" 
          icon={Zap} 
          color="text-amber-600"
          bg="bg-amber-50"
          border="border-amber-200"
          shadow="shadow-[0_8px_0_0_#fde68a]"
        />
        <MetricCard 
          value={`${Math.round(result.attention_score * 100)}%`} 
          label="Focus" 
          icon={Eye} 
          color="text-sky-600"
          bg="bg-sky-50"
          border="border-sky-200"
          shadow="shadow-[0_8px_0_0_#bae6fd]"
        />
        <MetricCard 
          value={`${Math.round(result.eye_metrics.fixation_duration_ms)}ms`} 
          label="Hold Time" 
          icon={MousePointer2} 
          color="text-purple-600"
          bg="bg-purple-50"
          border="border-purple-200"
          shadow="shadow-[0_8px_0_0_#e9d5ff]"
        />
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card-clean p-10 bg-white">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-12 w-12 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600">
               <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Skill Radar</h3>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 900 }} />
                <Radar
                  name="Skills"
                  dataKey="A"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
          <div className="card-clean p-10 bg-white">
            <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-4">
               <Sparkles className="w-6 h-6 text-amber-500" />
               Focus Hotspots
            </h3>
            <div className="flex flex-wrap gap-3">
              {highlights.length > 0 ? (
                highlights.map((item, i) => (
                  <span
                    key={i}
                    className="rounded-2xl bg-slate-50 border-2 border-slate-100 px-6 py-4 text-base font-black text-slate-600 shadow-sm"
                  >
                    {item.word} <span className="ml-2 text-xs text-slate-400">x{item.count}</span>
                  </span>
                ))
              ) : (
                <p className="text-slate-400 font-bold italic">No specific hotspots detected.</p>
              )}
            </div>
          </div>

          <div className="card-clean p-8">
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex w-full items-center justify-between text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
            >
              <span>Mission Telemetry</span>
              {showAdvanced ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
            </button>
            
            <AnimatePresence>
              {showAdvanced && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-8 grid gap-4">
                    {[
                      { label: "Eye Samples", value: result.eye_metrics.sample_count },
                      { label: "Speech Rate", value: `${result.voice_metrics.speech_rate_wps.toFixed(2)} w/s` },
                      { label: "Pause Time", value: `${Math.round(result.voice_metrics.pause_duration_ms)}ms` }
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 border-2 border-slate-100">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</span>
                        <span className="font-black text-slate-800">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
