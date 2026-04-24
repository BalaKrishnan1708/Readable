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
      {/* Constrain reading measure and make scrollable */}
      <div className="max-h-[60vh] overflow-auto">
        {text.map((segment, segmentIndex) => {
          // split on any whitespace and remove empty tokens
          const segmentWords = segment.split(/\s+/).filter(Boolean);
          return (
            <div
              key={`${segmentIndex}-${segment.slice(0, 12)}`}
              className="mx-auto max-w-[70ch] rounded-3xl border border-white/70 bg-white/90 p-4 md:p-6 shadow-soft"
              style={{ fontSize: `${fontSize}px`, lineHeight: lineSpacing }}
            >
              <p className="text-slate-800 text-base md:text-lg lg:text-xl text-justify whitespace-normal break-words">
                {segmentWords.map((word) => {
                  const currentIndex = wordIndex;
                  wordIndex += 1;
                  const isError = highlighted.has(currentIndex);
                  const isActive = activeWordIndex === currentIndex;

                  return (
                    <button
                      type="button"
                      aria-label={`word ${currentIndex}`}
                      key={`${segmentIndex}-${currentIndex}-${word}`}
                      onClick={() => onWordClick?.(currentIndex)}
                      aria-pressed={isActive}
                      className={`mr-1 mb-1 inline-block rounded px-1.5 py-0.5 text-left align-baseline transition duration-150 ease-in-out ${
                        isActive
                          ? "bg-sea text-white shadow-md ring-2 ring-sea/40 transform scale-100"
                          : isError
                            ? "bg-amber-200 text-amber-950"
                            : "hover:bg-slate-100"
                      }`}
                    >
                      {word}
                    </button>
                  );
                })}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
