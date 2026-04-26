import asyncio
import re


_PHONETIC_LIBRARY: dict[str, dict[str, object]] = {
    "hesitation": {
        "ipa": "/ˌhezɪˈteɪʃən/",
        "syllables": ["hes", "i", "ta", "tion"],
        "onset": "h",
        "rime": "esitation",
    },
    "photography": {
        "ipa": "/fəˈtɒɡrəfi/",
        "syllables": ["pho", "tog", "ra", "phy"],
        "onset": "ph",
        "rime": "otography",
    },
    "butterflies": {
        "ipa": "/ˈbʌtərˌflaɪz/",
        "syllables": ["but", "ter", "flies"],
        "onset": "b",
        "rime": "utterflies",
    },
    "difficult": {
        "ipa": "/ˈdɪfɪkəlt/",
        "syllables": ["dif", "fi", "cult"],
        "onset": "d",
        "rime": "ifficult",
    },
    "chrysalis": {
        "ipa": "/ˈkrɪsəlɪs/",
        "syllables": ["chry", "sa", "lis"],
        "onset": "chr",
        "rime": "ysalis",
    },
    "librarian": {
        "ipa": "/laɪˈbreriən/",
        "syllables": ["li", "brar", "i", "an"],
        "onset": "l",
        "rime": "ibrarian",
    },
    "notebook": {
        "ipa": "/ˈnoʊtbʊk/",
        "syllables": ["note", "book"],
        "onset": "n",
        "rime": "otebook",
    },
    "practice": {
        "ipa": "/ˈpræktɪs/",
        "syllables": ["prac", "tice"],
        "onset": "pr",
        "rime": "actice",
    },
}


def _normalize_word(value: str) -> str:
    return re.sub(r"[^a-z]", "", value.lower())


def _rough_syllables(word: str, explicit_break: str | None) -> list[str]:
    if explicit_break:
        return [part for part in explicit_break.split("-") if part]

    rough = re.findall(r"[^aeiouy]*[aeiouy]+(?:[^aeiouy]|$)?", word)
    return rough if rough else [word]


def _build_fallback_entry(word: str, explicit_break: str | None) -> dict[str, object]:
    syllables = _rough_syllables(word, explicit_break)
    onset_match = re.match(r"^[^aeiouy]+", word)
    onset = onset_match.group(0) if onset_match else word[:1]
    rime = word[len(onset) :] if len(word) > len(onset) else word
    pseudo_ipa = "/" + " ".join(syllables).replace("c", "k") + "/"
    return {
        "ipa": pseudo_ipa,
        "syllables": syllables,
        "onset": onset,
        "rime": rime,
    }


async def generate_pronunciations(
    content: str,
    syllable_breaks: dict[str, str],
) -> dict[str, dict[str, object]]:
    """Return lesson-wide pronunciation metadata that a real service would derive with eSpeak or CMUdict."""
    # STUB - replace with real model
    # TODO: Replace stub with a phonetic pipeline that generates IPA, onset-rime, and audio-ready pronunciations for uploaded lesson text.
    await asyncio.sleep(0.3)

    words = {
        _normalize_word(token)
        for token in content.split()
        if len(_normalize_word(token)) >= 3
    }
    pronunciations: dict[str, dict[str, object]] = {}

    for word in sorted(words):
        explicit_break = next(
            (
                value
                for key, value in syllable_breaks.items()
                if _normalize_word(key) == word
            ),
            None,
        )
        entry = _PHONETIC_LIBRARY.get(word, _build_fallback_entry(word, explicit_break))
        syllables = [str(part) for part in entry["syllables"]]
        pronunciations[word] = {
            "word": word,
            "ipa": str(entry["ipa"]),
            "syllables": syllables,
            "onset": str(entry["onset"]),
            "rime": str(entry["rime"]),
            "whisper_text": ". ".join(syllables),
        }

    return pronunciations
