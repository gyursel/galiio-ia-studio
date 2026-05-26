import re
from typing import Any, Dict, List


BAD_META_PATTERNS = [
    r"MODE:",
    r"PAGE_PATH:",
    r"USER REQUEST:",
    r"SITE PAGES",
    r"CURRENT PAGE STATE",
    r"---HTML---",
    r"---CSS---",
    r"---JS---",
    r"Built For Modern Buyers",
    r"Ready to build your",
    r"project subject",
    r"mode instructions",
]


def _text(value: Any, fallback: str = "") -> str:
    if value is None:
        return fallback
    value = str(value).replace("\n", " ").replace("\r", " ")
    value = re.sub(r"\s+", " ", value).strip()
    return value or fallback


def _contains_meta(value: str) -> bool:
    low = value.lower()
    return any(p.lower() in low for p in BAD_META_PATTERNS)


def _clean_words(value: Any, fallback: str, max_words: int = 8) -> str:
    text = _text(value, fallback)

    if _contains_meta(text):
        text = fallback

    # Remove ugly AI suffixes / boilerplate.
    text = re.sub(r"\bBuilt For Modern Buyers\b", "", text, flags=re.I).strip()
    text = re.sub(r"\bSITE PAGES\b.*$", "", text, flags=re.I).strip()
    text = re.sub(r"\bwith polished visuals.*$", "", text, flags=re.I).strip()
    text = re.sub(r"\bA high-end.*$", "", text, flags=re.I).strip()

    words = text.split()
    if len(words) > max_words:
        text = " ".join(words[:max_words]).strip()

    return text or fallback


def _title_case_bg_safe(value: str) -> str:
    value = _text(value, "Premium Website")
    parts = value.split()
    return " ".join(p[:1].upper() + p[1:] for p in parts[:7])


def _infer_subject(project_state: Dict[str, Any], prompt: str = "") -> str:
    candidates = [
        project_state.get("industry"),
        project_state.get("brandName"),
        project_state.get("tagline"),
        prompt,
    ]

    raw = " ".join(_text(x) for x in candidates if x)
    raw = raw.lower()

    # Remove common prompt words.
    raw = re.sub(
        r"\b(направи|направи ми|искам|сайт|website|site|premium|премиум|дизайн|layout|чист|минималистичен|фон|video|видео|реални|снимки|with|and|за)\b",
        " ",
        raw,
        flags=re.I,
    )
    raw = re.sub(r"[^a-zA-Zа-яА-Я0-9\s\-]", " ", raw)
    raw = re.sub(r"\s+", " ", raw).strip()

    words = raw.split()
    if not words:
        return "премиум продукт"

    return " ".join(words[:4])


def clean_project_state_schema(project_state: Dict[str, Any], prompt: str = "") -> Dict[str, Any]:
    if not isinstance(project_state, dict):
        project_state = {}

    subject = _infer_subject(project_state, prompt)
    subject_title = _title_case_bg_safe(subject)

    clean: Dict[str, Any] = dict(project_state)

    clean["industry"] = _clean_words(clean.get("industry"), subject, 6).lower()
    clean["brandName"] = _clean_words(clean.get("brandName"), subject_title, 6)
    clean["tagline"] = _clean_words(
        clean.get("tagline"),
        f"Премиум решения за {subject}",
        10,
    )

    clean["style"] = _text(
        clean.get("style"),
        "premium responsive cinematic layout with clean typography",
    )

    clean["primaryColor"] = _text(clean.get("primaryColor"), "#8b5cf6")
    clean["secondaryColor"] = _text(clean.get("secondaryColor"), "#111827")

    hero = clean.get("hero") if isinstance(clean.get("hero"), dict) else {}
    hero_headline = _clean_words(hero.get("headline"), f"Премиум {subject_title}", 7)
    if hero_headline.lower().startswith("premium website for"):
        hero_headline = f"Премиум {subject_title}"

    hero_sub = _clean_words(
        hero.get("subheadline"),
        f"Модерен сайт за {subject} с ясна структура, реална медия и премиум визия.",
        18,
    )

    clean["hero"] = {
        "eyebrow": _clean_words(hero.get("eyebrow"), "Premium Experience", 4),
        "headline": hero_headline,
        "subheadline": hero_sub,
        "primaryCta": _clean_words(hero.get("primaryCta"), "Разгледай", 4),
        "secondaryCta": _clean_words(hero.get("secondaryCta"), "Научи повече", 4),
    }

    visual = clean.get("visualSystem") if isinstance(clean.get("visualSystem"), dict) else {}
    clean["visualSystem"] = {
        "backgroundType": visual.get("backgroundType") or "video",
        "backgroundPrompt": _clean_words(
            visual.get("backgroundPrompt"),
            f"premium cinematic visuals for {subject}",
            10,
        ),
        "motion": _clean_words(
            visual.get("motion"),
            "soft premium transitions and smooth section reveals",
            10,
        ),
        "details": [
            _clean_words(x, "", 6)
            for x in (visual.get("details") if isinstance(visual.get("details"), list) else [])
            if _clean_words(x, "", 6)
        ][:6],
    }

    def clean_items(items: Any) -> List[str]:
        if not isinstance(items, list):
            return []
        out = []
        for item in items:
            t = _clean_words(item, "", 5)
            if t:
                out.append(t)
        return out[:5]

    sections = clean.get("sections")
    if not isinstance(sections, list) or not sections:
        sections = [
            {
                "title": f"{subject_title} решения",
                "description": f"Премиум представяне за {subject}.",
                "items": ["Визия", "Доверие", "Конверсия"],
            }
        ]

    clean_sections = []
    for section in sections[:5]:
        if not isinstance(section, dict):
            continue
        clean_sections.append(
            {
                "title": _clean_words(section.get("title"), f"{subject_title} секция", 6),
                "description": _clean_words(
                    section.get("description"),
                    f"Ясно и премиум съдържание за {subject}.",
                    16,
                ),
                "items": clean_items(section.get("items")),
            }
        )
    clean["sections"] = clean_sections

    features = clean.get("features")
    if not isinstance(features, list) or not features:
        features = [
            {"title": "Premium Design", "description": "Чиста визия и силна йерархия."},
            {"title": "Fast Experience", "description": "Бърз и responsive layout."},
            {"title": "Brand Focused", "description": f"Фокус върху {subject}."},
        ]

    clean_features = []
    for feature in features[:6]:
        if not isinstance(feature, dict):
            continue
        clean_features.append(
            {
                "title": _clean_words(feature.get("title"), "Premium Feature", 4),
                "description": _clean_words(
                    feature.get("description"),
                    f"Премиум предимство за {subject}.",
                    14,
                ),
            }
        )
    clean["features"] = clean_features

    media = clean.get("mediaAssets")
    if not isinstance(media, dict):
        media = {}
    clean["mediaAssets"] = media

    footer = clean.get("footer") if isinstance(clean.get("footer"), dict) else {}
    clean["footer"] = {
        "headline": _clean_words(
            footer.get("headline"),
            f"Готови ли сте за {subject_title}?",
            8,
        ),
        "cta": _clean_words(footer.get("cta"), "Започни сега", 4),
    }

    # Keep editor data if present.
    if isinstance(project_state.get("overrides"), dict):
        clean["overrides"] = project_state.get("overrides")
    if isinstance(project_state.get("customElements"), list):
        clean["customElements"] = project_state.get("customElements")

    return clean
