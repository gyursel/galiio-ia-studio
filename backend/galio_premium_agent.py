"""
galio_premium_agent.py
======================
Galio AI Studio — Premium Website Generation Agent
Generates structured, template-aware, language-aware premium website state
and renders it to production-quality HTML + CSS.
 
Architecture
------------
  1. _extract_subject()            → clean subject from raw user prompt
  2. _default_state()              → safe fallback project state
  3. _build_subject_generation()   → AI-powered universal subject extraction (Groq)
  4. _apply_subject_generation()   → merge subject data into project state
  5. _enforce_universal_generation_field()  → post-AI contract enforcement
  6. generate_project_state_with_groq()    → orchestrate full state build
  7. render_premium_website()      → render final HTML + CSS from state
  8. generate_premium_site()       → public entry point
 
External dependencies
---------------------
  - universal_subject.UNIVERSAL_SUBJECT_AGENT_CONTRACT
  - galio_media.fetch_pexels_media
  - template_layer.build_template_context
  - requests
  - GROQ_API_KEY / GROQ_MODEL env vars (optional — graceful fallback)
"""
 
from __future__ import annotations
 
import html
import json
import logging
import os
import re
from typing import Any
 
import requests
try:
    from backend.state_guard import guard_post_ai, guard_pre_render
except Exception:
    from state_guard import guard_post_ai, guard_pre_render


def _guard_repaired_state(result, fallback_state):
    """Return repaired_state from GuardResult/dict, otherwise fallback_state."""
    repaired = None

    if isinstance(result, dict):
        repaired = result.get("repaired_state")
    else:
        repaired = getattr(result, "repaired_state", None)

    return repaired if isinstance(repaired, dict) else fallback_state


 
# ---------------------------------------------------------------------------
# Imports with graceful path fallback
# ---------------------------------------------------------------------------
try:
    from universal_subject import UNIVERSAL_SUBJECT_AGENT_CONTRACT
except ImportError:
    from backend.universal_subject import UNIVERSAL_SUBJECT_AGENT_CONTRACT
 
try:
    from backend.galio_media import fetch_pexels_media
except ImportError:
    from galio_media import fetch_pexels_media
 
try:
    from backend.template_layer import build_template_context
except ImportError:
    from template_layer import build_template_context
 
# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logger = logging.getLogger(__name__)
 
# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
_GROQ_DEFAULT_MODEL = "llama-3.3-70b-versatile"
_GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
 
_NOISE_WORDS: frozenset[str] = frozenset({
    # Bulgarian
    "направи", "създай", "генерирай", "искам", "ми", "сайт", "уебсайт", "страница",
    "napravi", "sazdai", "suzdai", "generirai", "iskam", "mi", "sait", "site", "websait",
    "премиум", "реални", "снимки", "снимка", "видео", "фон", "чист",
    "минималистичен", "минималистична", "модерен", "модерна",
    "тъмен", "тъмна", "светъл", "светла", "дизайн", "layout",
    "с", "за", "и", "или", "на", "от", "по", "при", "към", "без",
    "но", "а", "со", "със",
    # English
    "make", "create", "build", "generate", "me", "a", "an", "the",
    "site", "website", "page", "landing", "premium", "real", "photos",
    "video", "background", "clean", "minimal", "minimalist", "modern",
    "dark", "light", "with", "and", "or", "for", "of", "design", "layout",
    "responsive", "luxury", "high", "end", "conversion", "focused",
})
 
_STOP_PHRASES: tuple[str, ...] = (
    " с реални", " със реални", " с видео", " и видео", " с фон",
    " видео фон", " с снимки", " с картинки", " с дизайн",
    " with video", " with real", " with photos", " with background",
    " dark theme", " light theme", " clean layout", " minimal",
)
 
_BAD_COPY_PATTERNS: tuple[str, ...] = (
    r"built for modern buyers",
    r"ready to build your",
    r"a high-end,?\s*conversion-focused landing page for",
    r"with polished visuals",
    r"strong product storytelling",
    r"premium brand feel",
    r"site pages",
    r"page_path",
    r"user request",
    r"mode:",
    r"с видео фон",
    r"видео фон",
    r"с реални снимки",
    r"реални снимки",
)
 
# Template-specific nav links
_TEMPLATE_NAV: dict[str, list[str]] = {
    "saas-product":            ["Product", "Workflow", "Pricing", "Demo"],
    "local-business":          ["Services", "About", "Reviews", "Contact"],
    "hospitality-experience":  ["Experience", "Gallery", "Booking", "Reviews"],
    "portfolio-personal":      ["About", "Work", "Skills", "Contact"],
    "professional-service":    ["Trust", "Services", "Process", "Contact"],
    "ecommerce-product":       ["Products", "Benefits", "Details", "Buy"],
    "real-estate":             ["Highlights", "Gallery", "Location", "Contact"],
    "event-conference":        ["Agenda", "Speakers", "Venue", "Tickets"],
    "mobile-app":              ["App", "Features", "Reviews", "Download"],
    "agency-studio":           ["Services", "Work", "Process", "Clients"],
    "blog-magazine":           ["Featured", "Categories", "Latest", "Subscribe"],
}
 
_TEMPLATE_CTA: dict[str, tuple[str, str]] = {
    "saas-product":            ("Start Free", "Watch Demo"),
    "local-business":          ("Book a Call", "View Services"),
    "hospitality-experience":  ("Reserve Now", "Explore Gallery"),
    "portfolio-personal":      ("View Work", "Contact Me"),
    "professional-service":    ("Request Consultation", "See Process"),
    "ecommerce-product":       ("Shop Now", "Compare Details"),
    "real-estate":             ("Schedule Viewing", "See Location"),
    "event-conference":        ("Get Tickets", "View Agenda"),
    "mobile-app":              ("Download App", "See Features"),
    "agency-studio":           ("Start Project", "View Work"),
    "blog-magazine":           ("Subscribe", "Read Latest"),
}
 
_TEMPLATE_HEADLINE: dict[str, str] = {
    "saas-product":            "Built as a polished product system",
    "local-business":          "Everything visitors need to trust you",
    "hospitality-experience":  "A cinematic journey from first glance to booking",
    "portfolio-personal":      "A personal story with proof and momentum",
    "professional-service":    "Credibility, process and trust in one page",
    "ecommerce-product":       "Product discovery with strong buying flow",
    "real-estate":             "Space, location and details presented clearly",
    "event-conference":        "Schedule, speakers and tickets with urgency",
    "mobile-app":              "App benefits, previews and download action",
    "agency-studio":           "Work, services and process with studio energy",
    "blog-magazine":           "Editorial structure for content discovery",
}
 
_TEMPLATE_VISUAL_LABEL: dict[str, str] = {
    "saas-product":            "Live Dashboard",
    "local-business":          "Trusted Service",
    "hospitality-experience":  "Premium Stay",
    "portfolio-personal":      "Selected Work",
    "professional-service":    "Expert Process",
    "ecommerce-product":       "Featured Drop",
    "real-estate":             "Signature Space",
    "event-conference":        "Live Event",
    "mobile-app":              "App Preview",
    "agency-studio":           "Studio System",
    "blog-magazine":           "Featured Story",
}
 
# ---------------------------------------------------------------------------
# Small utility helpers
# ---------------------------------------------------------------------------
 
def _txt(value: Any, fallback: str = "") -> str:
    """Return a clean, stripped string from *value*, or *fallback* if empty."""
    value = "" if value is None else str(value).strip()
    return value or fallback
 
 
def _arr(value: Any, fallback: list | None = None) -> list:
    """Return a clean list of non-empty strings from *value*, or *fallback*."""
    if isinstance(value, list):
        cleaned = [str(x).strip() for x in value if str(x).strip()]
        return cleaned or (fallback or [])
    return fallback or []
 
 
def _title(text: str) -> str:
    """Capitalise the first letter of each word."""
    return " ".join(w[:1].upper() + w[1:] for w in str(text or "").split())
 
 
def _is_bulgarian(text: str) -> bool:
    """Return True when *text* contains at least one Cyrillic character."""
    return bool(re.search(r"[а-яА-Я]", text))
 
 
def _safe_json(text: str) -> dict | None:
    """Strip optional markdown fences and return parsed JSON dict, or None."""
    text = re.sub(r"^```(?:json)?", "", text.strip()).strip()
    text = re.sub(r"```$", "", text).strip()
    start, end = text.find("{"), text.rfind("}")
    if start < 0 or end <= start:
        return None
    try:
        return json.loads(text[start : end + 1])
    except json.JSONDecodeError:
        return None
 
 
# ---------------------------------------------------------------------------
# Subject extraction from a raw prompt
# ---------------------------------------------------------------------------
 
def _extract_subject(prompt: str) -> str:
    """
    Extract a clean, concise subject (≤ 4 words) from a raw user prompt.
 
    Strips leading instructional phrases, common noise words, and cuts
    off at known style-modifier phrases so only the core topic remains.
    """
    s = re.sub(r"\s+", " ", str(prompt or "").strip())
 
    # Remove leading "create a website for …" style phrases
    s = re.sub(
        r"^.*?\b(?:сайт|уебсайт|страница|website|site|landing\s*page)\s*(?:за|for)?\s*",
        "",
        s,
        flags=re.I,
    ).strip()
 
    # Cut off at the first style-modifier phrase
    low = s.lower()
    cut_at: int | None = None
    for phrase in _STOP_PHRASES:
        idx = low.find(phrase)
        if idx > 0:
            cut_at = idx if cut_at is None else min(cut_at, idx)
    if cut_at:
        s = s[:cut_at].strip()
 
    # Drop noise words
    words = [
        w.strip(".,!?;:()[]{}\"'`|-")
        for w in s.split()
    ]
    words = [w for w in words if w and w.lower() not in _NOISE_WORDS]
 
    subject = " ".join(words[:4]).strip(".,!?;:")
    return subject or "Premium Brand"
 
 
# ---------------------------------------------------------------------------
# Default (fallback) project state
# ---------------------------------------------------------------------------
 

def _clean_subject_title(value: str) -> str:
    """Clean display title so prompt words do not appear in the website copy."""
    raw = _txt(value, "Premium Brand")
    raw = re.sub(r"\b(iskam|napravi|sazdai|suzdai|generirai|mi|sait|site|websait|website|for|za)\b", " ", raw, flags=re.I)
    raw = re.sub(r"\s+", " ", raw).strip(" -–—:,.")
    return _title(raw) if raw else "Premium Brand"


def _subject_from_state(state: dict) -> str:
    generation = state.get("generation") if isinstance(state.get("generation"), dict) else {}
    return _clean_subject_title(
        generation.get("subject")
        or generation.get("mediaSubject")
        or state.get("industry")
        or state.get("brandName")
        or "Premium Brand"
    )


def _subject_nav(subject_title: str) -> list[str]:
    """Universal real-site navigation. No template/demo labels."""
    return ["Overview", "Benefits", "Gallery", "Contact"]


def _subject_ctas(subject_title: str) -> tuple[str, str]:
    """Universal real-site CTA labels. No SaaS/product hardcoding."""
    return ("Explore", "Contact")


def _subject_stats(subject_title: str) -> list[tuple[str, str]]:
    """Universal real-site stats. No Template system / Subject locked copy."""
    return [
        ("Premium", "Experience"),
        ("Visual", "Story"),
        ("Ready", "Contact"),
    ]


def _default_state(prompt: str) -> dict:
    """
    Build a safe, prompt-aware fallback project state without any AI calls.
    Detects language (BG / EN) and colour preferences from the prompt.
    """
    subject = _extract_subject(prompt)
    subject_title = _title(subject)
    bulgarian = _is_bulgarian(prompt)
 
    # Colour detection
    low = prompt.lower()
    dark = any(w in low for w in ("dark", "black", "тъмен", "черен", "premium", "luxury"))
    green = any(w in low for w in ("green", "neon", "елект", "зелен"))
 
    primary_color = "#7CFFB2" if green else "#F59E0B"
    secondary_color = "#07070a" if dark else "#f8fafc"
 
    if bulgarian:
        copy = dict(
            tagline=f"Премиум онлайн присъствие за {subject_title}",
            headline=subject_title,
            subheadline=f"Модерен уебсайт за {subject_title} с изчистен дизайн и силно послание.",
            eyebrow="Премиум Преживяване",
            cta1="Разгледай",
            cta2="Научи повече",
            footer_headline=f"Готов да стартираш с {subject_title}?",
            footer_cta="Започни сега",
            sec_titles=["Предимства", "Колекция", "Качество"],
            sec_desc=f"Премиум представяне за {subject_title}.",
            features=[
                {"title": "Премиум Дизайн",      "description": f"Изчистена модерна визия за {subject_title}."},
                {"title": "Бързо Зареждане",      "description": "Оптимизиран код за максимална скорост."},
                {"title": "Силно Послание",        "description": f"Съдържание насочено към {subject_title}."},
            ],
        )
    else:
        copy = dict(
            tagline=f"Premium digital experience for {subject_title}",
            headline=subject_title,
            subheadline=f"A premium website for {subject_title} — clean design, strong message, built to convert.",
            eyebrow=f"Premium {subject_title}",
            cta1="Explore",
            cta2="Contact",
            footer_headline=f"Ready to launch {subject_title}?",
            footer_cta="Start Now",
            sec_titles=["Our Advantage", "Collection", "Quality"],
            sec_desc=f"Premium presentation for {subject_title}.",
            features=[
                {"title": "Premium Design",        "description": f"Clean modern visuals for {subject_title}."},
                {"title": "Fast Experience",        "description": "Optimised for speed and smooth navigation."},
                {"title": "Strong Messaging",       "description": f"Copy focused entirely on {subject_title}."},
            ],
        )
 
    bg_sec = _is_bulgarian(prompt)
    return {
        "brandName": subject_title,
        "tagline": copy["tagline"],
        "industry": subject_title,
        "style": "dark premium cinematic, modern, responsive, conversion focused",
        "primaryColor": primary_color,
        "secondaryColor": secondary_color,
        "visualSystem": {
            "backgroundType": "gradient",
            "backgroundPrompt": f"premium cinematic visuals for {subject}",
            "motion": "soft reveals, premium hover states, smooth transitions",
            "details": ["premium spacing", "glass cards", "large typography", "conversion focused"],
        },
        "hero": {
            "eyebrow": copy["eyebrow"],
            "headline": copy["headline"],
            "subheadline": copy["subheadline"],
            "primaryCta": copy["cta1"],
            "secondaryCta": copy["cta2"],
        },
        "sections": [
            {
                "title": copy["sec_titles"][0],
                "description": copy["sec_desc"],
                "items": (
                    ["Премиум позициониране", "Ясна йерархия", "Конверсия"]
                    if bg_sec else
                    ["Premium positioning", "Clear visual hierarchy", "Conversion-first"]
                ),
            },
            {
                "title": copy["sec_titles"][1],
                "description": (
                    "Всяка секция води към действие."
                    if bg_sec else
                    "Every section guides visitors to action."
                ),
                "items": (
                    ["Hero CTA", "Продуктови акценти", "Доверие"]
                    if bg_sec else
                    ["Hero CTA", "Product highlights", "Trust signals"]
                ),
            },
            {
                "title": copy["sec_titles"][2],
                "description": (
                    "Респонсив дизайн за всички устройства."
                    if bg_sec else
                    "Responsive design for any device."
                ),
                "items": (
                    ["Респонсив", "Модерни карти", "Премиум футър"]
                    if bg_sec else
                    ["Responsive", "Modern cards", "Premium footer"]
                ),
            },
        ],
        "features": copy["features"],
        "pricing": [],
        "footer": {
            "headline": copy["footer_headline"],
            "cta": copy["footer_cta"],
        },
    }
 
 
# ---------------------------------------------------------------------------
# Post-generation copy sanitisation
# ---------------------------------------------------------------------------
 
def _post_clean(state: dict, subject: str) -> dict:
    """
    Remove boilerplate / template-bleed patterns from generated copy fields
    and enforce word-count limits so the UI stays tight.
    """
    def clean(value: Any, max_words: int | None = None) -> str:
        if not isinstance(value, str):
            return value
        s = value
        for pat in _BAD_COPY_PATTERNS:
            s = re.sub(pat, "", s, flags=re.I).strip(" ,-.")
        s = re.sub(r"\s+", " ", s).strip()
        if max_words and len(s.split()) > max_words:
            s = " ".join(s.split()[:max_words]).strip(" ,-.")
        return s or subject
 
    hero = state.get("hero")
    if isinstance(hero, dict):
        hero["headline"]    = clean(hero.get("headline", ""),    max_words=6)
        hero["subheadline"] = clean(hero.get("subheadline", ""), max_words=20)
        hero["eyebrow"]     = clean(hero.get("eyebrow", ""),     max_words=4)
        state["hero"] = hero
 
    footer = state.get("footer")
    if isinstance(footer, dict):
        footer["headline"] = clean(footer.get("headline", ""), max_words=8)
        state["footer"] = footer
 
    state["brandName"] = clean(state.get("brandName", subject), max_words=3)
    state["tagline"]   = clean(state.get("tagline", ""),        max_words=12)
    state["industry"]  = clean(state.get("industry", subject),  max_words=3)
    return state
 
 
# ---------------------------------------------------------------------------
# Template context helpers
# ---------------------------------------------------------------------------
 
def _apply_template_context(state: dict, template_context: dict) -> dict:
    """
    Merge template metadata into *state* without overwriting existing values.
    """
    if not isinstance(state, dict):
        state = {}
    if not isinstance(template_context, dict):
        return state
 
    for key in ("templateId", "templateName", "templateSections", "templateVisualStyle"):
        state[key] = state.get(key) or template_context.get(key)
 
    return state
 
 
# ---------------------------------------------------------------------------
# Universal subject / generation contract helpers
# ---------------------------------------------------------------------------
 
def _apply_subject_generation(state: dict, subject_data: dict) -> dict:
    """
    Merge subject-extraction results into *state*.
    Sets brandName, mainSubject, media.backgroundPrompt etc.
    """
    if not isinstance(state, dict):
        state = {}
 
    generation = subject_data.get("generation") if isinstance(subject_data.get("generation"), dict) else {}
    media      = subject_data.get("media")      if isinstance(subject_data.get("media"), dict) else {}
 
    subject = str(generation.get("subject") or subject_data.get("subject") or "").strip()
    if not subject:
        return state
 
    state["universalSubject"] = subject_data
    state["generation"]       = generation
    state["subject"]          = subject
    state["mainSubject"]      = generation.get("mainSubject") or subject
    state["brandName"]        = generation.get("brandName")   or subject
 
    existing_media = state.get("media") if isinstance(state.get("media"), dict) else {}
    existing_media.update(media)
    state["media"] = existing_media
 
    visual = state.get("visualSystem") if isinstance(state.get("visualSystem"), dict) else {}
    visual["backgroundPrompt"] = generation.get("mediaSubject") or subject
    state["visualSystem"] = visual
 
    return state
 
 
def _enforce_universal_generation_field(
    state: dict,
    prompt: str,
    subject_contract: dict,
    legacy_subject: str,
) -> dict:
    """
    Post-AI contract enforcement pass.
 
    Guarantees that universalSubject + generation are always present and
    correctly formed, regardless of what the LLM returned. The latest prompt
    is always the source of truth; legacy_subject is an emergency fallback only.
    """
    if not isinstance(state, dict):
        state = {}
 
    universal  = state.get("universalSubject") if isinstance(state.get("universalSubject"), dict) else {}
    generation = state.get("generation")       if isinstance(state.get("generation"), dict) else {}
    media      = state.get("media")            if isinstance(state.get("media"), dict) else {}
 
    subject = (
        str(generation.get("subject")  or "").strip()
        or str(universal.get("subject") or "").strip()
        or str(state.get("subject")     or "").strip()
        or str(legacy_subject           or "").strip()
    )
 
    media_subject = (
        str(generation.get("mediaSubject") or "").strip()
        or str(media.get("subject")        or "").strip()
        or subject
    )
 
    generation = {
        "sourceOfTruth":       "latest_prompt",
        "mustFollowLatestPrompt": True,
        "subject":             subject,
        "mainSubject":         str(generation.get("mainSubject")    or subject).strip(),
        "brandName":           str(generation.get("brandName")      or subject).strip(),
        "headlineSubject":     str(generation.get("headlineSubject") or subject).strip(),
        "mediaSubject":        media_subject,
        "confidence":          generation.get("confidence") or universal.get("confidence") or 0.9,
    }
 
    queries = [str(q).strip() for q in _arr(media.get("queries")) if str(q).strip()]
    if media_subject and media_subject.lower() not in {q.lower() for q in queries}:
        queries.insert(0, media_subject)
 
    negative_hints = [str(h).strip() for h in _arr(media.get("negativeHints")) if str(h).strip()]
 
    media = {
        **media,
        "subject":       media_subject,
        "queries":       queries[:8],
        "negativeHints": negative_hints[:8],
    }
 
    state["universalSubject"] = {
        "subject":     subject,
        "clean_prompt": str(universal.get("clean_prompt") or prompt).strip(),
        "source":      "latest_prompt",
        "confidence":  generation["confidence"],
        "reason":      str(universal.get("reason") or "Enforced from universal subject contract.").strip(),
        "generation":  generation,
        "media":       media,
        "rules":       list(subject_contract.get("rules") or []),
    }
 
    state["generation"] = generation
    state["media"]      = media
 
    if subject:
        state["subject"]     = subject
        state["mainSubject"] = generation["mainSubject"]
        state["brandName"]   = generation["brandName"]
 
    visual = state.get("visualSystem") if isinstance(state.get("visualSystem"), dict) else {}
    if media_subject:
        visual["backgroundPrompt"] = str(visual.get("backgroundPrompt") or media_subject).strip()
    state["visualSystem"] = visual
 
    return state
 
 
# ---------------------------------------------------------------------------
# Groq helpers
# ---------------------------------------------------------------------------
 
def _groq_post(api_key: str, model: str, messages: list[dict], **kwargs) -> dict | None:
    """
    POST to the Groq chat-completions endpoint and return the parsed response,
    or None on any error.
    """
    try:
        response = requests.post(
            _GROQ_API_URL,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"model": model, "messages": messages, **kwargs},
            timeout=kwargs.pop("timeout", 90),
        )
        if response.status_code >= 400:
            logger.warning("Groq returned HTTP %s", response.status_code)
            return None
        return response.json()
    except Exception as exc:
        logger.warning("Groq request failed: %s", exc)
        return None
 
 
# ---------------------------------------------------------------------------
# Step 1: Universal subject extraction
# ---------------------------------------------------------------------------
 
def _build_subject_generation(prompt: str, current_state: dict | None = None) -> dict:
    """
    Call Groq to extract a structured universalSubject + generation + media
    object from *prompt*.
 
    Returns a validated dict; falls back to a simple regex-based extraction
    when the API is unavailable or returns unusable data.
    """
    api_key = os.environ.get("GROQ_API_KEY", "").strip()
    model   = os.environ.get("GROQ_MODEL", _GROQ_DEFAULT_MODEL).strip()
 
    fallback_subject = _extract_subject(prompt)
    fallback: dict = {
        "subject":     fallback_subject,
        "clean_prompt": prompt,
        "confidence":  0.35,
        "reason":      "Regex fallback — AI subject pre-step unavailable.",
        "generation": {
            "sourceOfTruth":         "latest_prompt",
            "mustFollowLatestPrompt": True,
            "subject":               fallback_subject,
            "mainSubject":           fallback_subject,
            "brandName":             fallback_subject,
            "headlineSubject":       fallback_subject,
            "mediaSubject":          fallback_subject,
            "confidence":            0.35,
        },
        "media": {
            "subject":       fallback_subject,
            "queries":       [fallback_subject] if fallback_subject else [prompt],
            "negativeHints": [],
        },
    }
 
    if not api_key:
        return fallback
 
    contract = {
        **dict(UNIVERSAL_SUBJECT_AGENT_CONTRACT),
        "latestPrompt":  prompt,
        "previousState": current_state or {},
    }
 
    system = (
        "You are Galio IA Studio's universal subject extractor.\n"
        "Return ONLY valid JSON. No markdown. No explanations.\n"
        "Use the latestPrompt as the sole source of truth.\n"
        "Previous state is context only — never authority.\n"
        "Do not use fixed categories. Do not use examples.\n"
        "Populate generation and media from the requested subject."
    )
 
    raw = _groq_post(
        api_key, model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": json.dumps(contract, ensure_ascii=False)},
        ],
        temperature=0.15,
        max_tokens=1200,
        timeout=45,
    )
    if raw is None:
        return fallback
 
    try:
        content = raw["choices"][0]["message"]["content"]
    except (KeyError, IndexError):
        return fallback
 
    data = _safe_json(content)
    if not isinstance(data, dict):
        return fallback
 
    generation = data.get("generation") if isinstance(data.get("generation"), dict) else {}
    media      = data.get("media")      if isinstance(data.get("media"), dict) else {}
 
    subject = str(generation.get("subject") or data.get("subject") or "").strip()
    if not subject:
        return fallback
 
    generation = {
        "sourceOfTruth":         "latest_prompt",
        "mustFollowLatestPrompt": True,
        "subject":               subject,
        "mainSubject":           str(generation.get("mainSubject")    or subject).strip(),
        "brandName":             str(generation.get("brandName")      or subject).strip(),
        "headlineSubject":       str(generation.get("headlineSubject") or subject).strip(),
        "mediaSubject":          str(generation.get("mediaSubject")   or subject).strip(),
        "confidence":            generation.get("confidence") or data.get("confidence") or 0.9,
    }
 
    queries = [str(q).strip() for q in _arr(media.get("queries")) if str(q).strip()]
    if generation["mediaSubject"].lower() not in {q.lower() for q in queries}:
        queries.insert(0, generation["mediaSubject"])
 
    data["subject"]    = subject
    data["generation"] = generation
    data["media"] = {
        "subject":       generation["mediaSubject"],
        "queries":       queries[:8],
        "negativeHints": _arr(media.get("negativeHints")),
    }
    return data
 
 
# ---------------------------------------------------------------------------
# Step 2: Full project state generation
# ---------------------------------------------------------------------------
 
_GROQ_STATE_SCHEMA = """\
{
  "universalSubject": {
    "subject": string,
    "clean_prompt": string,
    "source": "latest_prompt",
    "confidence": number,
    "reason": string
  },
  "generation": {
    "sourceOfTruth": "latest_prompt",
    "mustFollowLatestPrompt": true,
    "subject": string,
    "mainSubject": string,
    "brandName": string,
    "headlineSubject": string,
    "mediaSubject": string,
    "confidence": number
  },
  "media": {
    "subject": string,
    "queries": [string],
    "negativeHints": [string]
  },
  "templateId": string,
  "templateName": string,
  "templateSections": [string],
  "brandName": string,
  "tagline": string,
  "industry": string,
  "style": string,
  "primaryColor": string,
  "secondaryColor": string,
  "visualSystem": {"backgroundType": string, "backgroundPrompt": string, "motion": string, "details": []},
  "hero": {"eyebrow": string, "headline": string, "subheadline": string, "primaryCta": string, "secondaryCta": string},
  "sections": [{"title": string, "description": string, "items": []}],
  "features": [{"title": string, "description": string}],
  "pricing": [],
  "footer": {"headline": string, "cta": string}
}"""
 
_GROQ_STATE_RULES = """\
CRITICAL RULES:
- hero.headline = 2–5 words MAX. Brand/product name only. NEVER descriptive marketing phrases.
- footer.headline = max 8 words. Short CTA only.
- brandName = max 3 words. NO style modifiers.
- Subject authority: projectState.generation.subject.
- Use templateContext.templateSections as layout guidance only — NOT subject authority.
- Do NOT copy template examples as business topic.
- Default to dark cinematic style unless the user explicitly requests light."""
 
 
def generate_project_state_with_groq(prompt: str, current_state: dict | None = None) -> dict:
    """
    Orchestrate the full project state build:
 
    1. Extract a structured subject via AI (or regex fallback).
    2. Resolve template context.
    3. Build a safe fallback state.
    4. If GROQ_API_KEY is set, call Groq for rich content generation.
    5. Enforce universal subject contract post-AI.
    6. Sanitise copy fields.
    7. Fetch Pexels media assets.
 
    Always returns a valid project state dict.
    """
    api_key = os.environ.get("GROQ_API_KEY", "").strip()
    model   = os.environ.get("GROQ_MODEL", _GROQ_DEFAULT_MODEL).strip()
 
    # --- Step 1: Subject extraction ---
    subject_data   = _build_subject_generation(prompt, current_state)
    subject        = (
        subject_data.get("generation", {}).get("subject")
        or subject_data.get("subject")
        or _extract_subject(prompt)
    )
    media_subject = (
        subject_data.get("generation", {}).get("mediaSubject")
        or subject_data.get("media", {}).get("subject")
        or subject
        or prompt
    )
 
    # --- Step 2: Template context ---
    template_context = build_template_context(
        prompt=prompt,
        subject=subject,
        requested_template_id=(
            (current_state or {}).get("templateId")
            if isinstance(current_state, dict) else None
        ),
    )
 
    # --- Step 3: Safe fallback ---
    fallback = _apply_template_context(
        _apply_subject_generation(_default_state(prompt), subject_data),
        template_context,
    )
 
    if not api_key:
        fallback["mediaAssets"] = fetch_pexels_media(media_subject)
        guarded = guard_pre_render(fallback, prompt=prompt)
        return _guard_repaired_state(guarded, fallback)
 
    # --- Step 4: AI content generation ---
    lang_instruction = (
        "The user wrote in Bulgarian. Output ALL website copy in Bulgarian (Cyrillic)."
        if _is_bulgarian(prompt) else
        "The user wrote in English. Output all website copy in English."
    )
 
    subject_contract = {
        **dict(UNIVERSAL_SUBJECT_AGENT_CONTRACT),
        "latestPrompt":    prompt,
        "previousState":   current_state or {},
        "extractedSubject": subject_data,
        "templateContext": template_context,
    }
 
    system = (
        "You are Galio AI Studio's universal website content agent.\n\n"
        "CRITICAL UNIVERSAL SUBJECT CONTRACT:\n"
        "- The latest user prompt is the ONLY source of truth.\n"
        "- The previous/current project state is context only — never authority.\n"
        "- Do NOT retain an old subject when the latest prompt changes it.\n"
        "- Do NOT use fixed categories or examples.\n"
        "- Use subjectContract to extract the main subject.\n"
        "- projectState MUST include universalSubject and generation.\n"
        "- projectState.generation.subject MUST drive brandName, headline, sections, cards, and media queries.\n"
        "- mediaAssets and media queries MUST follow projectState.generation.mediaSubject.\n"
        "- templateId controls page structure ONLY — never subject authority.\n\n"
        "Generate a structured WebsiteProjectState JSON from subjectContract.latestPrompt.\n\n"
        f"{lang_instruction}\n\n"
        "Return ONLY valid JSON. No markdown. No explanations.\n\n"
        f"Schema:\n{_GROQ_STATE_SCHEMA}\n\n"
        f"{_GROQ_STATE_RULES}"
    )
 
    raw = _groq_post(
        api_key, model,
        messages=[
            {"role": "system", "content": system},
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "subjectContract":      subject_contract,
                        "templateContext":      template_context,
                        "latestPrompt":         prompt,
                        "currentState":         current_state or {},
                        "legacyFallbackSubject": subject,
                    },
                    ensure_ascii=False,
                ),
            },
        ],
        temperature=0.65,
        max_tokens=5000,
        timeout=90,
    )
 
    if raw is None:
        fallback["mediaAssets"] = fetch_pexels_media(media_subject)
        guarded = guard_pre_render(fallback, prompt=prompt)
        return _guard_repaired_state(guarded, fallback)
 
    try:
        content = raw["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError):
        fallback["mediaAssets"] = fetch_pexels_media(media_subject)
        guarded = guard_pre_render(fallback, prompt=prompt)
        return _guard_repaired_state(guarded, fallback)
 
    data = _safe_json(content)
    if not isinstance(data, dict):
        fallback["mediaAssets"] = fetch_pexels_media(media_subject)
        guarded = guard_pre_render(fallback, prompt=prompt)
        return _guard_repaired_state(guarded, fallback)
 
    # --- Step 5: Enforce contract ---
    data = _enforce_universal_generation_field(data, prompt, subject_contract, subject)
    if not isinstance(data, dict):
        fallback["mediaAssets"] = fetch_pexels_media(media_subject)
        guarded = guard_pre_render(fallback, prompt=prompt)
        return _guard_repaired_state(guarded, fallback)
 
    # --- Step 5.5: Guard post-AI state ---
    guarded_ai = guard_post_ai(data, prompt=prompt)
    data = _guard_repaired_state(guarded_ai, data)

    # --- Step 6: Merge + sanitise ---
    merged = {**fallback, **data}
    if isinstance(data.get("hero"), dict):
        merged["hero"] = {**fallback["hero"], **data["hero"]}
    merged = _post_clean(merged, subject)
 
    # --- Step 7: Pexels media ---
    resolved_media_subject = (
        merged.get("generation", {}).get("mediaSubject")
        or merged.get("media", {}).get("subject")
        or media_subject
    )
    merged["mediaAssets"] = fetch_pexels_media(resolved_media_subject)
    guarded_render = guard_pre_render(merged, prompt=prompt)
    return _guard_repaired_state(guarded_render, merged)
 
 
# ---------------------------------------------------------------------------
# HTML / CSS renderer
# ---------------------------------------------------------------------------
 
def render_premium_website(state: dict) -> dict:
    """
    Render a complete premium landing page from a validated project state dict.
 
    Returns a dict with keys: html, css, js, summary, projectState.
    """
    # ---- Extract state fields ----
    brand        = _txt(state.get("brandName"),     "Galio Studio")
    tagline      = _txt(state.get("tagline"),        "Premium digital experience")
    industry     = _txt(state.get("industry"),       "premium brand")
    primary      = _txt(state.get("primaryColor"),   "#F59E0B")
    secondary    = _txt(state.get("secondaryColor"), "#07070a")
 
    hero         = state.get("hero")     if isinstance(state.get("hero"), dict)     else {}
    sections     = state.get("sections") if isinstance(state.get("sections"), list)  else []
    features     = state.get("features") if isinstance(state.get("features"), list)  else []
    pricing      = state.get("pricing")  if isinstance(state.get("pricing"), list)   else []
    footer_data  = state.get("footer")   if isinstance(state.get("footer"), dict)    else {}
 
    eyebrow       = _txt(hero.get("eyebrow"),     industry)
    headline      = _txt(hero.get("headline"),    brand)
    subheadline   = _txt(hero.get("subheadline"), tagline)
    primary_cta   = _txt(hero.get("primaryCta"),  "Explore")
    secondary_cta = _txt(hero.get("secondaryCta"), "Learn More")
 
    template_id       = _txt(state.get("templateId"), "premium-landing")
    template_sections = _arr(state.get("templateSections"), ["hero", "features", "showcase", "cta"])
 
    subject_title = _subject_from_state(state)

    # Real-site CTAs should follow the subject, not the template/demo category.
    if primary_cta in ("Explore", "Learn More", "Get Started", "Start Free", "Book a Call", "Reserve Now"):
        primary_cta, secondary_cta = _subject_ctas(subject_title)
 
    def esc(x: Any) -> str:
        return html.escape(_txt(x), quote=True)
 
    # ---- Nav ----
    nav_items = _arr(state.get("navLinks"), []) or _arr(state.get("navigation"), []) or _subject_nav(subject_title)
    nav_links = "".join(f"<a>{esc(x)}</a>" for x in nav_items[:6])
 
    # ---- Feature cards ----
    default_features = [
        {"title": "Premium Design",   "description": "Clean visuals."},
        {"title": "Fast Experience",  "description": "Optimised for speed."},
        {"title": "Brand Focused",    "description": f"Content for {industry}."},
    ]
    feature_cards = "".join(
        f'<article class="g-feature-card">'
        f'<div class="g-feature-icon"></div>'
        f'<h3>{esc(item.get("title"))}</h3>'
        f'<p>{esc(item.get("description"))}</p>'
        f'</article>'
        for item in (features[:6] or default_features)
    )
 
    # ---- Section blocks ----
    section_blocks = "".join(
        f'<article class="g-section-card {"g-section-card-large" if idx == 0 else ""}">'
        f'<div class="g-section-number">0{idx + 1}</div>'
        f'<h3>{esc(sec.get("title"))}</h3>'
        f'<p>{esc(sec.get("description"))}</p>'
        f'<div class="g-chip-row">'
        + "".join(f"<span>{esc(x)}</span>" for x in _arr(sec.get("items"))[:5])
        + '</div></article>'
        for idx, sec in enumerate(sections[:4])
    )
 
    # ---- Pricing ----
    pricing_blocks = "".join(
        f'<article class="g-price-card">'
        f'<p class="g-plan">{esc(plan.get("name"))}</p>'
        f'<h3>{esc(plan.get("price"))}</h3>'
        f'<p>{esc(plan.get("description"))}</p>'
        f'<ul>' + "".join(f"<li>{esc(x)}</li>" for x in _arr(plan.get("features"))[:5]) + "</ul>"
        f'</article>'
        for plan in pricing[:3]
    )
    pricing_html = (
        f'<section class="g-pricing">'
        f'<div class="g-section-head"><p>Offers</p><h2>Choose the right experience</h2></div>'
        f'<div class="g-pricing-grid">{pricing_blocks}</div>'
        f'</section>'
        if pricing_blocks else ""
    )
 
    # ---- Template chips ----
    template_chips = "".join(f"<span>{esc(x)}</span>" for x in template_sections[:6])
 
    # ---- Template-level labels ----
    template_headline   = _TEMPLATE_HEADLINE.get(template_id,     "Designed like a premium product launch")
    visual_label        = _TEMPLATE_VISUAL_LABEL.get(template_id, industry)
    footer_headline_txt = _txt(footer_data.get("headline"), f"Ready to launch {brand}?")
    footer_cta_txt      = _txt(footer_data.get("cta"),      primary_cta)
 
    # ---- Assemble HTML ----
    html_out = f"""\
<div class="g-site g-template-{esc(template_id)}">
  <nav class="g-nav">
    <div class="g-logo"><span></span>{esc(brand)}</div>
    <div class="g-nav-links">{nav_links}</div>
    <button class="g-nav-button">{esc(primary_cta)}</button>
  </nav>
 
  <section class="g-hero">
    <div class="g-hero-copy">
      <div class="g-eyebrow">{esc(eyebrow)}</div>
      <h1>{esc(headline)}</h1>
      <p>{esc(subheadline)}</p>
      <div class="g-actions">
        <button>{esc(primary_cta)}</button>
        <button class="g-secondary">{esc(secondary_cta)}</button>
      </div>
      <div class="g-template-chips">{template_chips}</div>
      <div class="g-stats">
        {''.join(f'<div><strong>{esc(a)}</strong><span>{esc(b)}</span></div>' for a, b in _subject_stats(subject_title))}
      </div>
    </div>
    <div class="g-hero-visual">
      <div class="g-phone">
        <div class="g-phone-top"></div>
        <div class="g-screen-card">
          <span>{esc(visual_label)}</span>
          <strong>{esc(brand)}</strong>
          <p>{esc(tagline)}</p>
        </div>
        <div class="g-product-row"><div></div><div></div><div></div></div>
      </div>
      <div class="g-orb g-orb-a"></div>
      <div class="g-orb g-orb-b"></div>
    </div>
  </section>
 
  <section class="g-features">{feature_cards}</section>
 
  <section class="g-sections">
    <div class="g-section-head">
      <p>{esc(template_id)}</p>
      <h2>{esc(template_headline)}</h2>
    </div>
    <div class="g-section-grid">{section_blocks}</div>
  </section>
 
  {pricing_html}
 
  <section class="g-cta">
    <p>{esc(industry)}</p>
    <h2>{esc(footer_headline_txt)}</h2>
    <button>{esc(footer_cta_txt)}</button>
  </section>
 
  <footer class="g-footer">
    <span>{esc(brand)}</span>
    <span>{esc(tagline)}</span>
  </footer>
</div>"""
 
    # ---- Base CSS ----
    css_out = (
        f":root{{--g-primary:{primary};--g-secondary:{secondary};"
        "--g-bg:#06070b;--g-text:#f8fafc;--g-muted:rgba(248,250,252,.68);"
        "--g-border:rgba(255,255,255,.12);--g-card:rgba(255,255,255,.055)}}"
        "*{box-sizing:border-box}body{margin:0;background:var(--g-bg)}"
        ".g-site{min-height:100vh;color:var(--g-text);"
        "background:radial-gradient(circle at 18% 10%,color-mix(in srgb,var(--g-primary) 28%,transparent),transparent 32%),"
        "radial-gradient(circle at 85% 15%,rgba(96,165,250,.18),transparent 30%),"
        "linear-gradient(135deg,#050509 0%,#0b0f18 52%,#050509 100%);"
        "font-family:Inter,ui-sans-serif,system-ui,sans-serif;overflow:hidden}"
        ".g-nav{width:min(1180px,calc(100% - 32px));margin:0 auto;padding:22px 0;"
        "display:flex;align-items:center;justify-content:space-between}"
        ".g-logo{display:flex;align-items:center;gap:10px;font-weight:900;letter-spacing:-.04em}"
        ".g-logo span{width:18px;height:18px;border-radius:7px;background:var(--g-primary);"
        "box-shadow:0 0 28px color-mix(in srgb,var(--g-primary) 65%,transparent)}"
        ".g-nav-links{display:flex;gap:24px;color:var(--g-muted);font-size:14px}"
        ".g-nav-button,.g-actions button,.g-cta button{border:0;border-radius:999px;"
        "background:var(--g-primary);color:#04110b;padding:13px 19px;font-weight:900;cursor:pointer}"
        ".g-hero{width:min(1180px,calc(100% - 32px));margin:0 auto;min-height:720px;"
        "display:grid;grid-template-columns:1.05fr .95fr;gap:54px;align-items:center;padding:54px 0 78px}"
        ".g-eyebrow{width:fit-content;border:1px solid var(--g-border);"
        "background:rgba(255,255,255,.06);color:var(--g-primary);border-radius:999px;"
        "padding:9px 14px;margin-bottom:22px;font-size:13px;font-weight:800}"
        ".g-hero h1{max-width:760px;margin:0;font-size:clamp(48px,7.6vw,104px);"
        "line-height:.88;letter-spacing:-.085em}"
        ".g-hero p{max-width:680px;color:var(--g-muted);font-size:19px;line-height:1.72;margin:26px 0 0}"
        ".g-actions{display:flex;gap:14px;margin-top:32px}"
        ".g-actions .g-secondary{color:var(--g-text);background:rgba(255,255,255,.075);"
        "border:1px solid var(--g-border);box-shadow:none}"
        ".g-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;"
        "margin-top:42px;max-width:620px}"
        ".g-stats div{border:1px solid var(--g-border);background:rgba(255,255,255,.045);"
        "border-radius:22px;padding:18px}"
        ".g-stats strong{display:block;font-size:22px}"
        ".g-stats span{display:block;color:var(--g-muted);font-size:13px;margin-top:4px}"
        ".g-hero-visual{position:relative;min-height:580px;display:grid;place-items:center}"
        ".g-phone{position:relative;z-index:2;width:min(390px,88vw);min-height:530px;"
        "border-radius:46px;border:1px solid rgba(255,255,255,.2);"
        "background:linear-gradient(180deg,rgba(255,255,255,.13),rgba(255,255,255,.035)),"
        "radial-gradient(circle at 50% 0%,color-mix(in srgb,var(--g-primary) 26%,transparent),transparent 42%);"
        "box-shadow:0 42px 120px rgba(0,0,0,.55);padding:22px;backdrop-filter:blur(22px)}"
        ".g-phone-top{width:92px;height:8px;border-radius:999px;margin:0 auto 52px;"
        "background:rgba(255,255,255,.22)}"
        ".g-screen-card{border-radius:32px;border:1px solid var(--g-border);"
        "background:rgba(0,0,0,.34);padding:26px}"
        ".g-screen-card span{color:var(--g-primary);font-size:12px;font-weight:900;"
        "text-transform:uppercase;letter-spacing:.12em}"
        ".g-screen-card strong{display:block;font-size:38px;letter-spacing:-.06em;"
        "line-height:.95;margin-top:18px}"
        ".g-screen-card p{font-size:14px;margin-top:18px}"
        ".g-product-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:18px}"
        ".g-product-row div{height:118px;border-radius:24px;"
        "background:linear-gradient(180deg,color-mix(in srgb,var(--g-primary) 28%,transparent),"
        "rgba(255,255,255,.06)),rgba(255,255,255,.06);border:1px solid var(--g-border)}"
        ".g-orb{position:absolute;border-radius:999px;filter:blur(8px)}"
        ".g-orb-a{width:230px;height:230px;right:14px;top:48px;"
        "background:color-mix(in srgb,var(--g-primary) 24%,transparent)}"
        ".g-orb-b{width:160px;height:160px;left:22px;bottom:70px;background:rgba(96,165,250,.2)}"
        ".g-features,.g-pricing-grid{width:min(1180px,calc(100% - 32px));margin:0 auto;"
        "display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;padding:24px 0 80px}"
        ".g-feature-card,.g-section-card,.g-price-card{border:1px solid var(--g-border);"
        "background:var(--g-card);border-radius:30px;padding:28px;box-shadow:0 24px 80px rgba(0,0,0,.18)}"
        ".g-feature-icon{width:42px;height:42px;border-radius:16px;background:var(--g-primary);"
        "box-shadow:0 0 38px color-mix(in srgb,var(--g-primary) 45%,transparent);margin-bottom:20px}"
        ".g-feature-card h3,.g-section-card h3,.g-price-card h3{margin:0;font-size:24px;letter-spacing:-.04em}"
        ".g-feature-card p,.g-section-card p,.g-price-card p,.g-price-card li{color:var(--g-muted);line-height:1.65}"
        ".g-sections,.g-pricing{width:min(1180px,calc(100% - 32px));margin:0 auto;padding:24px 0 80px}"
        ".g-section-head{margin-bottom:24px}"
        ".g-section-head p{color:var(--g-primary);text-transform:uppercase;letter-spacing:.12em;"
        "font-size:13px;font-weight:900}"
        ".g-section-head h2,.g-cta h2{max-width:790px;margin:0;font-size:clamp(34px,5vw,68px);"
        "line-height:.95;letter-spacing:-.07em}"
        ".g-section-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}"
        ".g-section-card-large{grid-row:span 2}"
        ".g-section-number{color:var(--g-primary);font-weight:900;margin-bottom:28px}"
        ".g-chip-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}"
        ".g-chip-row span{border:1px solid var(--g-border);border-radius:999px;padding:8px 11px;"
        "color:rgba(255,255,255,.78);background:rgba(255,255,255,.045);font-size:13px}"
        ".g-cta{width:min(1180px,calc(100% - 32px));margin:0 auto 40px;"
        "border:1px solid var(--g-border);border-radius:38px;padding:56px;"
        "background:radial-gradient(circle at 80% 20%,color-mix(in srgb,var(--g-primary) 22%,transparent),transparent 38%),"
        "rgba(255,255,255,.055)}"
        ".g-cta p{color:var(--g-primary);font-weight:900}"
        ".g-cta button{margin-top:26px}"
        ".g-footer{width:min(1180px,calc(100% - 32px));margin:0 auto;padding:32px 0 48px;"
        "display:flex;justify-content:space-between;color:var(--g-muted);"
        "border-top:1px solid var(--g-border)}"
        "@media(max-width:900px){"
        ".g-nav-links{display:none}"
        ".g-hero{grid-template-columns:1fr;min-height:auto}"
        ".g-features,.g-pricing-grid,.g-section-grid,.g-stats{grid-template-columns:1fr}"
        ".g-hero h1{font-size:52px}"
        ".g-cta{padding:32px}}"
    )
 
    # ---- Template-specific CSS overrides ----
    template_css = """\
.g-template-chips{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}
.g-template-chips span{border:1px solid var(--g-border);border-radius:999px;padding:7px 10px;color:rgba(255,255,255,.72);background:rgba(255,255,255,.045);font-size:12px;font-weight:800}
.g-template-saas-product .g-hero{grid-template-columns:.9fr 1.1fr}.g-template-saas-product .g-phone{width:min(520px,90vw);border-radius:28px}.g-template-saas-product .g-product-row{grid-template-columns:1fr}.g-template-saas-product .g-product-row div{height:70px}
.g-template-local-business .g-hero{grid-template-columns:1fr .8fr}.g-template-local-business .g-features{grid-template-columns:repeat(2,minmax(0,1fr))}.g-template-local-business .g-nav-button,.g-template-local-business .g-actions button{border-radius:14px}
.g-template-hospitality-experience .g-hero{min-height:780px}.g-template-hospitality-experience .g-phone{width:min(470px,90vw);min-height:620px;border-radius:52px}.g-template-hospitality-experience .g-section-grid{grid-template-columns:1.2fr .8fr}
.g-template-portfolio-personal .g-hero{text-align:left;grid-template-columns:.85fr 1.15fr}.g-template-portfolio-personal .g-features{grid-template-columns:repeat(4,minmax(0,1fr))}.g-template-portfolio-personal .g-feature-card{border-radius:18px}
.g-template-professional-service .g-site,.g-template-professional-service{letter-spacing:-.01em}.g-template-professional-service .g-hero{grid-template-columns:1fr 1fr}.g-template-professional-service .g-feature-card,.g-template-professional-service .g-section-card{border-radius:10px}
.g-template-ecommerce-product .g-hero{grid-template-columns:1fr 1fr}.g-template-ecommerce-product .g-product-row{grid-template-columns:repeat(2,1fr)}.g-template-ecommerce-product .g-product-row div{height:150px}.g-template-ecommerce-product .g-actions button{border-radius:10px;text-transform:uppercase;letter-spacing:.08em}
.g-template-real-estate .g-hero{grid-template-columns:1.15fr .85fr}.g-template-real-estate .g-phone{width:min(560px,92vw);min-height:430px;border-radius:34px}.g-template-real-estate .g-section-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
.g-template-event-conference .g-hero{grid-template-columns:1fr}.g-template-event-conference .g-hero-copy{max-width:900px;text-align:center;margin:0 auto}.g-template-event-conference .g-actions,.g-template-event-conference .g-template-chips{justify-content:center}.g-template-event-conference .g-hero-visual{display:none}
.g-template-mobile-app .g-hero{grid-template-columns:1fr .75fr}.g-template-mobile-app .g-phone{width:min(330px,86vw);min-height:650px;border-radius:54px}.g-template-mobile-app .g-features{grid-template-columns:repeat(2,minmax(0,1fr))}
.g-template-agency-studio .g-hero{grid-template-columns:1.2fr .8fr}.g-template-agency-studio .g-hero h1{font-size:clamp(58px,8.5vw,118px)}.g-template-agency-studio .g-section-grid{grid-template-columns:1fr 1fr 1fr}
.g-template-blog-magazine .g-hero{grid-template-columns:1fr}.g-template-blog-magazine .g-hero-copy{max-width:980px}.g-template-blog-magazine .g-phone{display:none}.g-template-blog-magazine .g-features{grid-template-columns:1.4fr .8fr .8fr}.g-template-blog-magazine .g-section-card{border-radius:0;border-left:0;border-right:0}
@media(max-width:900px){.g-template-portfolio-personal .g-features,.g-template-real-estate .g-section-grid,.g-template-agency-studio .g-section-grid,.g-template-blog-magazine .g-features{grid-template-columns:1fr}}
"""
 
    return {
        "html":         html_out,
        "css":          css_out + template_css,
        "js":           "",
        "summary":      f"Generated premium structured website for {industry}.",
        "projectState": state,
    }
 
 
# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------
 
def generate_premium_site(prompt: str, current_state: dict | None = None) -> dict:
    """
    Generate a complete premium website from a user *prompt*.
 
    Parameters
    ----------
    prompt : str
        Free-form user description of the desired website (BG or EN).
    current_state : dict | None
        Optional existing project state for iterative updates.
 
    Returns
    -------
    dict
        Keys: html, css, js, summary, projectState
    """
    state = generate_project_state_with_groq(prompt, current_state=current_state)
    guarded = guard_pre_render(state, prompt=prompt)
    state = _guard_repaired_state(guarded, state)
    return render_premium_website(state)
