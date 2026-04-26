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
      gradient: "from-[#f0fdfa] to-[#ccfbf1]",
      textColor: "text-teal-900",
      accentColor: "bg-teal-500",
    },
    {
      label: "Pacing",
      value: `${wpm}`,
      unit: "WPM",
      description: "Reading speed",
      icon: "⚡",
      gradient: "from-[#f8fafc] to-[#e2e8f0]",
      textColor: "text-slate-900",
      accentColor: "bg-slate-500",
    },
    {
      label: "Attention",
      value: `${Math.round(attention * 100)}%`,
      description: "Focus level",
      icon: "🧠",
      gradient: "from-[#fffbeb] to-[#fef3c7]",
      textColor: "text-amber-900",
      accentColor: "bg-amber-500",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br ${card.gradient} p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{card.icon}</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Live Analysis
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <div className="mt-1 flex items-baseline gap-1">
                <p className={`text-4xl font-bold tracking-tight ${card.textColor}`}>
                  {card.value}
                </p>
                {card.unit && (
                  <p className="text-sm font-semibold text-slate-500">{card.unit}</p>
                )}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-black/5">
                <div
                  className={`h-full rounded-full ${card.accentColor} transition-all duration-1000`}
                  style={{
                    width: card.label === "Pacing" ? `${Math.min((Number(card.value) / 150) * 100, 100)}%` : card.value,
                  }}
                />
              </div>
              <span className="text-[10px] font-semibold text-slate-500">
                {card.description}
              </span>
            </div>
          </div>
          {/* Decorative background element */}
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/20 blur-2xl transition-all duration-500 group-hover:scale-150" />
        </div>
      ))}
    </div>
  );
};
