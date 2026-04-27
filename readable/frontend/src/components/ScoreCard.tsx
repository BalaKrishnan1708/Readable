import { motion, Variants } from "framer-motion";
import { Target, Zap, Brain, X } from "lucide-react";
import type { SessionResult } from "../types/session";
import type { StudentProfile } from "../types/profile";

interface ScoreCardProps {
  result: SessionResult;
  profile: StudentProfile;
  onClose: () => void;
}

export const ScoreCard = ({ result, profile, onClose }: ScoreCardProps) => {
  const cards = [
    {
      label: "Accuracy",
      value: `${result.accuracy_pct.toFixed(1)}%`,
      description: "Reading precision",
      icon: <Target className="w-8 h-8" />,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      accent: "bg-emerald-500",
      shadow: "shadow-[0_8px_0_0_#a7f3d0]"
    },
    {
      label: "Pacing",
      value: `${result.speed_wpm.toFixed(0)}`,
      unit: "WPM",
      description: "Reading speed",
      icon: <Zap className="w-8 h-8" />,
      color: "text-sky-600",
      bg: "bg-sky-50",
      border: "border-sky-200",
      accent: "bg-sky-500",
      shadow: "shadow-[0_8px_0_0_#bae6fd]"
    },
    {
      label: "Focus",
      value: `${Math.round(result.attention_score * 100)}%`,
      description: "Engagement level",
      icon: <Brain className="w-8 h-8" />,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-200",
      accent: "bg-purple-500",
      shadow: "shadow-[0_8px_0_0_#e9d5ff]"
    },
  ];

  return (
    <div className="card-clean p-10 bg-white relative">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-3 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Mission Accomplished!</h2>
        <p className="text-xl font-bold text-slate-400 mt-2">Here's how you performed in this reading quest.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`rounded-[2.5rem] border-2 ${card.border} ${card.bg} p-8 ${card.shadow} flex flex-col items-center text-center`}
          >
            <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white border-2 ${card.border} ${card.color}`}>
              {card.icon}
            </div>
            
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{card.label}</p>
            
            <div className="flex items-baseline gap-1">
              <p className={`text-4xl font-black ${card.color}`}>{card.value}</p>
              {card.unit && <span className="text-sm font-black text-slate-400">{card.unit}</span>}
            </div>
            
            <p className="mt-2 text-sm font-bold text-slate-500">{card.description}</p>

            <div className="mt-8 w-full h-3 rounded-full bg-white border-2 border-slate-100 overflow-hidden">
               <motion.div 
                initial={{ width: 0 }}
                animate={{ width: card.value }}
                className={`h-full ${card.accent}`}
               />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 flex justify-center">
        <Link 
          to="/dashboard"
          className="btn-3d rounded-2xl bg-slate-900 border-slate-950 px-12 py-5 text-xl font-black text-white hover:bg-slate-800"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
};
