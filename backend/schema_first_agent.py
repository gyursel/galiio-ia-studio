import re
from typing import Any, Dict, List


def _txt(value: Any, fallback: str = "") -> str:
    text = str(value or "").strip()
    return text if text else fallback


def _clean_words(text: str, max_words: int = 6) -> str:
    text = re.sub(r"\s+", " ", str(text or "")).strip()
    bad_phrases = [
        "site pages",
        "built for modern buyers",
        "ready to build your",
        "project subject",
        "mode instructions",
        "fallback candidate",
        "exact media query",
        "subject match",
        "landing page",
        "conversion-focused",
    ]

    low = text.lower()
    for bad in bad_phrases:
        low = low.replace(bad, "")
        text = re.sub(re.escape(bad), "", text, flags=re.I)

    text = re.sub(r"[?]+$", "", text).strip(" ,.-")
    words = text.split()

    if len(words) > max_words:
        text = " ".join(words[:max_words])

    return text.strip() or "Premium Website"


def _subject_from_prompt(prompt: str) -> str:
    text = str(prompt or "").strip().lower()

    remove = [
        "направи ми",
        "направи",
        "искам",
        "сайт за",
        "website for",
        "premium website for",
        "premium",
        "премиум",
        "реални снимки",
        "с реални снимки",
        "видео фон",
        "video background",
        "video",
        "чист минималистичен layout",
        "чист минималистичен",
        "минималистичен дизайн",
        "минималистичен",
        "layout",
        "дизайн",
        "и",
        "с",
        "за",
    ]

    for item in remove:
        text = text.replace(item, " ")

    text = re.sub(r"[^a-zа-я0-9\s-]+", " ", text, flags=re.I)
    text = re.sub(r"\s+", " ", text).strip()

    if not text:
        text = "бизнес"

    return _clean_words(text, 4).lower()


def _title_case_bg(text: str) -> str:
    parts = str(text or "").split()
    return " ".join(p[:1].upper() + p[1:] for p in parts)


def _wants_dark(prompt: str) -> bool:
    t = str(prompt or "").lower()
    return any(x in t for x in ["dark", "тъмен", "тъмна", "тъмно", "черен", "черна", "black", "cinematic"])


def _wants_gold(prompt: str) -> bool:
    t = str(prompt or "").lower()
    return any(x in t for x in ["gold", "golden", "злат", "лукс", "luxury"])


def _wants_video(prompt: str) -> bool:
    t = str(prompt or "").lower()
    return any(x in t for x in ["video", "видео", "видео фон", "background video"])


def _section(title: str, description: str, items: List[str]) -> Dict[str, Any]:
    return {
        "title": title,
        "description": description,
        "items": items,
    }


def make_schema_first_project_state(prompt: str, current_state: Dict[str, Any] | None = None) -> Dict[str, Any]:
    """
    Deterministic schema-first output.
    The renderer must consume this projectState instead of trusting raw AI HTML text.
    """

    current_state = current_state if isinstance(current_state, dict) else {}
    subject = _subject_from_prompt(prompt)
    subject_title = _title_case_bg(subject)

    primary = "#8B5CF6"
    secondary = "#0B1020"

    if _wants_gold(prompt):
        primary = "#D4AF37"
        secondary = "#080704"
    elif not _wants_dark(prompt):
        primary = "#2563EB"
        secondary = "#F8FAFC"

    style_bits = [
        "schema-first",
        "premium",
        "responsive",
        "clean readable typography",
        "real media",
        "subject locked",
    ]

    if _wants_dark(prompt):
        style_bits.append("dark cinematic")
    else:
        style_bits.append("bright minimal")

    if _wants_gold(prompt):
        style_bits.append("gold accents")

    hero_headline = f"Premium {subject_title}"
    hero_subheadline = f"Модерен премиум сайт за {subject} с ясна структура, реални визуални елементи и професионално представяне."

    state = {
        "brandName": subject_title,
        "tagline": f"Премиум решения за {subject}",
        "industry": subject,
        "style": ", ".join(style_bits),
        "primaryColor": primary,
        "secondaryColor": secondary,
        "visualSystem": {
            "backgroundType": "video" if _wants_video(prompt) else "image",
            "backgroundPrompt": subject,
            "motion": "smooth premium transitions, subtle parallax feel, clean hover states",
            "details": [
                "schema-first output",
                "short safe headlines",
                "no raw prompt leakage",
                "real Pexels media required",
                "renderer-controlled layout",
            ],
        },
        "hero": {
            "eyebrow": subject_title,
            "headline": hero_headline,
            "subheadline": hero_subheadline,
            "primaryCta": "Разгледай",
            "secondaryCta": "Научи повече",
        },
        "sections": [
            _section(
                f"{subject_title} каталог",
                f"Подредено представяне на основните предложения за {subject}.",
                ["Категории", "Визуални карти", "Бърз избор"],
            ),
            _section(
                "Премиум представяне",
                f"Ясна визуална йерархия и доверие за клиенти, които търсят {subject}.",
                ["Доверие", "Качество", "Модерен вид"],
            ),
            _section(
                "Готово за развитие",
                "Структурата е подходяща за страници, подстраници, продукти и бъдещ publish flow.",
                ["Страници", "Подкатегории", "Редактиране"],
            ),
        ],
        "features": [
            {
                "title": "Професионален дизайн",
                "description": f"Премиум layout, фокусиран върху {subject}.",
            },
            {
                "title": "Реална медия",
                "description": "Снимки и видео се добавят през media layer, не като произволен AI текст.",
            },
            {
                "title": "Лесна редакция",
                "description": "Текстове, карти, изображения и layout могат да се редактират през projectState.",
            },
        ],
        "pricing": [],
        "footer": {
            "headline": f"Готови ли сте за {subject_title}?",
            "cta": "Започни сега",
        },
        "mediaAssets": current_state.get("mediaAssets") if isinstance(current_state.get("mediaAssets"), dict) else {
            "heroVideoUrl": "",
            "heroPosterUrl": "",
            "heroImageUrl": "",
            "backgroundVideoUrl": "",
            "backgroundImageUrl": "",
            "collectionImages": [],
            "source": "",
            "query": subject,
        },
        "overrides": current_state.get("overrides") if isinstance(current_state.get("overrides"), dict) else {},
        "customElements": current_state.get("customElements") if isinstance(current_state.get("customElements"), list) else [],
    }

    return normalize_schema_first_project_state(state, prompt)


def normalize_schema_first_project_state(state: Dict[str, Any], prompt: str = "") -> Dict[str, Any]:
    state = state if isinstance(state, dict) else {}
    subject = _subject_from_prompt(
        " ".join(
            [
                str(prompt or ""),
                str(state.get("industry") or ""),
                str(state.get("brandName") or ""),
            ]
        )
    )
    subject_title = _title_case_bg(subject)

    state["industry"] = _clean_words(state.get("industry") or subject, 4).lower()
    state["brandName"] = _clean_words(state.get("brandName") or subject_title, 5)
    state["tagline"] = _clean_words(state.get("tagline") or f"Премиум решения за {subject}", 8)

    hero = state.get("hero") if isinstance(state.get("hero"), dict) else {}
    headline = _clean_words(hero.get("headline") or f"Premium {subject_title}", 5)

    if "built for" in headline.lower() or "site pages" in headline.lower():
        headline = f"Premium {subject_title}"

    hero["headline"] = headline
    hero["eyebrow"] = _clean_words(hero.get("eyebrow") or subject_title, 4)
    hero["subheadline"] = _txt(
        hero.get("subheadline"),
        f"Модерен премиум сайт за {subject} с реални визуални елементи.",
    )

    if len(hero["subheadline"].split()) > 18 or "site pages" in hero["subheadline"].lower():
        hero["subheadline"] = f"Модерен премиум сайт за {subject} с реални визуални елементи."

    hero["primaryCta"] = _clean_words(hero.get("primaryCta") or "Разгледай", 3)
    hero["secondaryCta"] = _clean_words(hero.get("secondaryCta") or "Научи повече", 3)
    state["hero"] = hero

    if not isinstance(state.get("sections"), list) or not state["sections"]:
        state["sections"] = make_schema_first_project_state(prompt or subject, state).get("sections", [])

    if not isinstance(state.get("features"), list) or not state["features"]:
        state["features"] = make_schema_first_project_state(prompt or subject, state).get("features", [])

    media = state.get("mediaAssets")
    if not isinstance(media, dict):
        media = {}

    media.setdefault("heroVideoUrl", "")
    media.setdefault("heroPosterUrl", "")
    media.setdefault("heroImageUrl", "")
    media.setdefault("backgroundVideoUrl", "")
    media.setdefault("backgroundImageUrl", "")
    media.setdefault("collectionImages", [])
    media.setdefault("query", subject)
    state["mediaAssets"] = media

    visual = state.get("visualSystem")
    if not isinstance(visual, dict):
        visual = {}

    visual["backgroundType"] = visual.get("backgroundType") or ("video" if _wants_video(prompt) else "image")
    visual["backgroundPrompt"] = _clean_words(visual.get("backgroundPrompt") or subject, 6)
    visual["motion"] = _txt(visual.get("motion"), "smooth premium transitions")
    visual["details"] = visual.get("details") if isinstance(visual.get("details"), list) else []
    state["visualSystem"] = visual

    state["style"] = _txt(state.get("style"), "schema-first premium responsive")
    state["primaryColor"] = _txt(state.get("primaryColor"), "#8B5CF6")
    state["secondaryColor"] = _txt(state.get("secondaryColor"), "#0B1020")

    if not isinstance(state.get("overrides"), dict):
        state["overrides"] = {}

    if not isinstance(state.get("customElements"), list):
        state["customElements"] = []

    return state
