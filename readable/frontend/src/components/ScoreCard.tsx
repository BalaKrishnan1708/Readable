import { motion, Variants } from "framer-motion";

interface ScoreCardProps {
  accuracy: number;
  wpm: number;
  attention: number;
}

export const ScoreCard = ({ accuracy, wpm, attention }: ScoreCardProps) => {
  const cards = [
    {
      label: "Accuracy",
      value: `${accuracy.toFixed(1)}%`,
      description: "Reading precision",
      icon: "🎯",
      textColor: "text-emerald-700",
      accentColor: "bg-emerald-400",
      progressBg: "bg-emerald-100",
      shadow: "shadow-[0_8px_16px_rgba(52,211,153,0.3)]",
      border: "border-emerald-200",
      bg: "bg-emerald-50",
    },
    {
      label: "Pacing",
      value: `${wpm}`,
      unit: "WPM",
      description: "Reading speed",
      icon: "⚡",
      textColor: "text-amber-700",
      accentColor: "bg-amber-400",
      progressBg: "bg-amber-100",
      shadow: "shadow-[0_8px_16px_rgba(251,191,36,0.3)]",
      border: "border-amber-200",
      bg: "bg-amber-50",
    },
    {
      label: "Attention",
      value: `${Math.round(attention * 100)}%`,
      description: "Focus level",
      icon: "🧠",
      textColor: "text-purple-700",
      accentColor: "bg-purple-400",
      progressBg: "bg-purple-100",
      shadow: "shadow-[0_8px_16px_rgba(168,85,247,0.3)]",
      border: "border-purple-200",
      bg: "bg-purple-50",
    },
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", bounce: 0.5 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid gap-6 md:grid-cols-3"
    >
      {cards.map((card) => (
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -8, scale: 1.02 }}
          key={card.label}
          className={`relative overflow-hidden rounded-[2.5rem] border-2 ${card.border} ${card.bg} p-6 transition-shadow hover:${card.shadow}`}
        >
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm mb-4">
              {card.icon}
            </div>
            
            <p className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-2">
              {card.label}
            </p>
            
            <div className="flex items-baseline justify-center gap-1">
              <p className={`text-5xl font-extrabold tracking-tight ${card.textColor}`}>
                {card.value}
              </p>
              {card.unit && (
                <p className="text-base font-bold text-slate-500">{card.unit}</p>
              )}
            </div>
            
            <span className="mt-2 text-sm font-semibold text-slate-500">
              {card.description}
            </span>

            <div className="mt-6 w-full">
              <div className={`h-3 w-full rounded-full ${card.progressBg} overflow-hidden`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ 
                    width: card.label === "Pacing" ? `${Math.min((Number(card.value) / 150) * 100, 100)}%` : card.value 
                  }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                  className={`h-full rounded-full ${card.accentColor}`}
                />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};
