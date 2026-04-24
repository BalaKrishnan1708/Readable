interface ScoreCardProps {
  accuracy: number;
  wpm: number;
  attention: number;
}

export const ScoreCard = ({ accuracy, wpm, attention }: ScoreCardProps) => {
  const cards = [
    { label: "Accuracy", value: `${accuracy.toFixed(1)}%`, tint: "bg-white" },
    { label: "Pacing", value: `${wpm} WPM`, tint: "bg-mist" },
    { label: "Attention", value: `${Math.round(attention * 100)}%`, tint: "bg-amber-50" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className={`rounded-3xl ${card.tint} p-5 shadow-soft`}>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{card.label}</p>
          <p className="mt-3 text-3xl font-semibold text-ink">{card.value}</p>
        </div>
      ))}
    </div>
  );
};
