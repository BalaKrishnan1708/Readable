import type { PersonalizedContent } from "../types/lesson";
import type { StudentProfile } from "../types/profile";

export interface GlossaryEntry {
  word: string;
  simpleDefinition: string;
  cue: string;
  syllables?: string;
}

export interface LessonSupportDefaults {
  phonics: boolean;
  audio: boolean;
  glossary: boolean;
  lineFocus: boolean;
  pacer: boolean;
  summary: boolean;
  bionic: boolean;
}

export interface LessonSupportAllocation {
  defaults: LessonSupportDefaults;
  supportLabels: string[];
  targetWpm: number;
  glossary: GlossaryEntry[];
  summary: string;
  supportReason: string;
}

const glossaryLibrary: Record<string, { definition: string; cue: string }> = {
  butterflies: {
    definition: "Insects with colorful wings that change from caterpillars.",
    cue: "Picture a bright garden butterfly opening its wings.",
  },
  chrysalis: {
    definition: "A hard case where a caterpillar changes before becoming a butterfly.",
    cue: "Think of a butterfly resting in a hanging shell.",
  },
  librarian: {
    definition: "A person who helps people find and borrow books.",
    cue: "Imagine the helpful adult at the library desk.",
  },
  notebook: {
    definition: "A book of blank pages for writing notes.",
    cue: "Think of a school notebook in your backpack.",
  },
  practice: {
    definition: "Doing something again and again to improve.",
    cue: "Picture repeating a skill until it feels easier.",
  },
  garden: {
    definition: "A place where flowers, fruits, or vegetables grow.",
    cue: "Imagine rows of plants outside in sunlight.",
  },
  difficult: {
    definition: "Something that takes extra effort to do or understand.",
    cue: "Think of a hard puzzle that needs patience.",
  },
};

const normalizeWord = (value: string) => value.toLowerCase().replace(/[^a-z]/g, "");

const fallbackDefinition = (word: string) => ({
  definition: `${capitalize(word)} is an important reading word to practice in this lesson.`,
  cue: `Say ${word} slowly and notice each sound part before reading it in the sentence.`,
});

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const buildSummary = (segments: string[]) => {
  const firstSegment = segments[0] ?? "";
  const secondSegment = segments[1] ?? "";
  const combined = `${firstSegment} ${secondSegment}`.trim();

  if (!combined) {
    return "This lesson is ready for supported reading practice.";
  }

  return combined
    .replace(/\s+/g, " ")
    .replace(/Maya carried/gi, "The story begins with Maya carrying")
    .replace(/She discovered/gi, "Later, she discovers")
    .replace(/When Maya finished reading/gi, "At the end, Maya finishes reading and")
    .trim();
};

export const allocateLessonSupports = (
  profile: StudentProfile,
  content: PersonalizedContent,
): LessonSupportAllocation => {
  const avgSpeed = profile.avg_speed_wpm || 90;
  const difficultPool = new Set(profile.difficult_words.map(normalizeWord));
  const lessonWords = content.segments
    .flatMap((segment) => segment.split(/\s+/))
    .map(normalizeWord)
    .filter(Boolean);
  const focusWords = Array.from(
    new Set(
      lessonWords.filter((word) => difficultPool.has(word)).concat(
        Object.keys(content.syllable_breaks).map(normalizeWord),
      ),
    ),
  ).slice(0, 5);

  const phonics = profile.avg_accuracy_pct < 91 || focusWords.length > 0;
  const audio = avgSpeed < 100;
  const lineFocus = profile.attention_score < 0.78;
  const glossary = focusWords.length > 0;
  const pacer = avgSpeed > 0;
  const summary = profile.avg_accuracy_pct < 92;
  const bionic = profile.attention_score < 0.82 || profile.avg_accuracy_pct < 89;

  const supportLabels = [
    phonics ? "Phonetic breakdown" : null,
    audio ? "Audio scaffolding" : null,
    lineFocus ? "Reading ruler" : null,
    glossary ? "Vocabulary preview" : null,
    pacer ? "Adaptive pacer" : null,
    bionic ? "Anchor bolding" : null,
  ].filter((value): value is string => Boolean(value));

  const glossaryEntries = focusWords.map((word) => {
    const libraryEntry = glossaryLibrary[word] ?? fallbackDefinition(word);
    const matchingSyllables = Object.entries(content.syllable_breaks).find(
      ([key]) => normalizeWord(key) === word,
    )?.[1];

    return {
      word: capitalize(word),
      simpleDefinition: libraryEntry.definition,
      cue: libraryEntry.cue,
      syllables: matchingSyllables,
    };
  });

  const supportReason =
    lineFocus && audio
      ? "Readable noticed that steady pacing and attention support will help this session land better."
      : phonics && glossary
        ? "Readable leaned into word-level support here because this lesson overlaps with the student's harder vocabulary."
        : "Readable tuned the lesson toward fluency, decoding, and confidence for this student.";

  return {
    defaults: {
      phonics,
      audio,
      glossary,
      lineFocus,
      pacer,
      summary,
      bionic,
    },
    supportLabels,
    targetWpm: Math.max(80, Math.min(160, Math.round(avgSpeed * 1.12))),
    glossary: glossaryEntries,
    summary: buildSummary(content.segments),
    supportReason,
  };
};

export const splitIntoSyllables = (
  word: string,
  syllableBreaks: Record<string, string>,
): string[] => {
  const normalized = normalizeWord(word);
  const explicit = Object.entries(syllableBreaks).find(
    ([key]) => normalizeWord(key) === normalized,
  )?.[1];

  if (explicit) {
    return explicit.split("-").filter(Boolean);
  }

  if (normalized.length <= 5) {
    return [normalized];
  }

  const rough = normalized.match(/[^aeiou]*[aeiou]+(?:[^aeiou]|$)?/g);
  return rough && rough.length > 0 ? rough : [normalized];
};

export const normalizeLessonWord = normalizeWord;
