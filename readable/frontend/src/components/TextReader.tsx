import type { ErrorItem } from "../types/session";

interface TextReaderProps {
  text: string[];
  highlights: ErrorItem[];
  activeWordIndex?: number | null;
  onWordClick?: (wordIndex: number) => void;
  fontSize?: number;
  lineSpacing?: number;
}

const highlightPositions = (highlights: ErrorItem[]) =>
  new Set(highlights.map((item) => item.position));

export const TextReader = ({
  text,
  highlights,
  activeWordIndex,
  onWordClick,
  fontSize = 18,
  lineSpacing = 1.8,
}: TextReaderProps) => {
  const highlighted = highlightPositions(highlights);
  let wordIndex = 0;

  return (
    <div className="space-y-4">
      {text.map((segment, segmentIndex) => {
        const segmentWords = segment.split(" ");
        return (
          <div
            key={`${segmentIndex}-${segment.slice(0, 12)}`}
            className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-soft"
            style={{ fontSize: `${fontSize}px`, lineHeight: lineSpacing }}
          >
            {segmentWords.map((word) => {
              const currentIndex = wordIndex;
              wordIndex += 1;
              const isError = highlighted.has(currentIndex);
              const isActive = activeWordIndex === currentIndex;

              return (
                <button
                  type="button"
                  key={`${segmentIndex}-${currentIndex}-${word}`}
                  onClick={() => onWordClick?.(currentIndex)}
                  className={`mr-2 mb-2 inline rounded-lg px-1 text-left transition ${
                    isActive
                      ? "bg-sea text-white"
                      : isError
                        ? "bg-amber-200 text-amber-950"
                        : "hover:bg-slate-100"
                  }`}
                >
                  {word}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
