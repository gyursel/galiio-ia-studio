"""
galio_document_guard.py
=======================
Galio AI Studio — Universal Base Document Guard

Validates and auto-repairs a WebsiteProjectState dict at every critical
pipeline boundary:

  1. Post-AI (after Groq response, before merge)
  2. Pre-render (before render_premium_website())
  3. Standalone (unit tests, CLI inspection)

Usage
-----
    from galio_document_guard import guard_state, GuardResult

    result = guard_state(raw_state, prompt="coffee shop Sofia")

    if not result.is_valid:
        print(result.errors)          # list of human-readable issues found

    safe_state = result.repaired_state  # always a usable dict

Integration shortcuts
---------------------
    # 1 — post-AI, before merge
    result = guard_state(groq_data, prompt=prompt, mode="post_ai")

    # 2 — pre-render gate
    result = guard_state(merged_state, prompt=prompt, mode="pre_render")
    return render_premium_website(result.repaired_state)

    # 3 — standalone / test
    result = guard_state(some_dict)
    assert result.is_valid, result.errors
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any


# ---------------------------------------------------------------------------
# Public contract: what a valid projectState must contain
# ---------------------------------------------------------------------------

#: Fields that must be non-empty strings at the top level.
REQUIRED_STRING_FIELDS: tuple[str, ...] = (
    "brandName",
    "tagline",
    "industry",
    "primaryColor",
    "secondaryColor",
    "style",
)

#: hero sub-fields that must be non-empty strings.
REQUIRED_HERO_FIELDS: tuple[str, ...] = (
    "eyebrow",
    "headline",
    "subheadline",
    "primaryCta",
    "secondaryCta",
)

#: generation sub-fields that must be present (post-AI mode only).
REQUIRED_GENERATION_FIELDS: tuple[str, ...] = (
    "subject",
    "mainSubject",
    "brandName",
    "headlineSubject",
    "mediaSubject",
)

#: Minimum number of sections and features expected.
MIN_SECTIONS: int = 1
MIN_FEATURES: int = 1

#: Hard word-count limits (enforced during repair).
WORD_LIMITS: dict[str, int] = {
    "brandName":          3,
    "industry":           3,
    "hero.eyebrow":       4,
    "hero.headline":      6,
    "hero.subheadline":  20,
    "footer.headline":    8,
}

#: Copy patterns that must never appear in generated fields.
BAD_COPY_PATTERNS: tuple[str, ...] = (
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

#: Valid CSS hex colour pattern.
_HEX_COLOR_RE = re.compile(r"^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")

#: Known template IDs (guard warns on unknown values but does not fail).
KNOWN_TEMPLATE_IDS: frozenset[str] = frozenset({
    "saas-product", "local-business", "hospitality-experience",
    "portfolio-personal", "professional-service", "ecommerce-product",
    "real-estate", "event-conference", "mobile-app", "agency-studio",
    "blog-magazine",
})

# ---------------------------------------------------------------------------
# Default fallback values used during repair
# ---------------------------------------------------------------------------

_FALLBACK_BRAND      = "Premium Brand"
_FALLBACK_TAGLINE    = "Premium digital experience"
_FALLBACK_INDUSTRY   = "premium brand"
_FALLBACK_PRIMARY    = "#F59E0B"
_FALLBACK_SECONDARY  = "#07070a"
_FALLBACK_STYLE      = "dark premium cinematic, modern, responsive, conversion focused"

_FALLBACK_HERO: dict[str, str] = {
    "eyebrow":      "Premium Experience",
    "headline":     _FALLBACK_BRAND,
    "subheadline":  _FALLBACK_TAGLINE,
    "primaryCta":   "Explore",
    "secondaryCta": "Learn More",
}

_FALLBACK_SECTION: dict[str, Any] = {
    "title":       "Our Advantage",
    "description": "Every section guides visitors to action.",
    "items":       ["Premium positioning", "Clear hierarchy", "Conversion-first"],
}

_FALLBACK_FEATURE: dict[str, str] = {
    "title":       "Premium Design",
    "description": "Clean, modern visuals built to convert.",
}

_FALLBACK_FOOTER: dict[str, str] = {
    "headline": f"Ready to launch {_FALLBACK_BRAND}?",
    "cta":      "Start Now",
}


# ---------------------------------------------------------------------------
# Result dataclass
# ---------------------------------------------------------------------------

@dataclass
class GuardResult:
    """
    Returned by every :func:`guard_state` call.

    Attributes
    ----------
    is_valid : bool
        True when no errors were detected before repair.
    errors : list[str]
        Human-readable descriptions of every problem found.
    warnings : list[str]
        Non-blocking issues (unknown templateId, low confidence, etc.).
    repaired_state : dict
        A safe, fully-populated projectState ready for the next pipeline step.
        Always present, even when ``is_valid`` is False.
    mode : str
        The guard mode used: ``"post_ai"``, ``"pre_render"``, or ``"standalone"``.
    """
    is_valid:       bool
    errors:         list[str]       = field(default_factory=list)
    warnings:       list[str]       = field(default_factory=list)
    repaired_state: dict            = field(default_factory=dict)
    mode:           str             = "standalone"

    def __bool__(self) -> bool:
        return self.is_valid

    def summary(self) -> str:
        """One-line human-readable summary."""
        status = "✓ valid" if self.is_valid else f"✗ {len(self.errors)} error(s)"
        warn   = f", {len(self.warnings)} warning(s)" if self.warnings else ""
        return f"[guard:{self.mode}] {status}{warn}"


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _txt(value: Any, fallback: str = "") -> str:
    value = "" if value is None else str(value).strip()
    return value or fallback


def _arr(value: Any, fallback: list | None = None) -> list:
    if isinstance(value, list):
        cleaned = [str(x).strip() for x in value if str(x).strip()]
        return cleaned or (fallback or [])
    return fallback or []


def _trim_words(text: str, max_words: int) -> str:
    words = text.split()
    if len(words) <= max_words:
        return text
    return " ".join(words[:max_words]).rstrip(".,!?;: -")


def _has_bad_copy(text: str) -> str | None:
    """Return the first matching bad-copy pattern found in *text*, or None."""
    for pat in BAD_COPY_PATTERNS:
        if re.search(pat, text, flags=re.I):
            return pat
    return None


def _is_valid_hex(color: str) -> bool:
    return bool(_HEX_COLOR_RE.match(color.strip()))


def _subject_from_state(state: dict, prompt: str) -> str:
    """Best-effort subject extraction for fallback repair."""
    return (
        _txt(state.get("generation", {}).get("subject") if isinstance(state.get("generation"), dict) else "")
        or _txt(state.get("universalSubject", {}).get("subject") if isinstance(state.get("universalSubject"), dict) else "")
        or _txt(state.get("subject"))
        or _txt(state.get("brandName"))
        or _txt(state.get("industry"))
        or _extract_simple_subject(prompt)
        or _FALLBACK_BRAND
    )


def _extract_simple_subject(prompt: str) -> str:
    """Minimal regex subject extractor (no imports from agent)."""
    s = re.sub(r"\s+", " ", str(prompt or "").strip())
    s = re.sub(
        r"^.*?\b(?:сайт|уебсайт|страница|website|site|landing\s*page)\s*(?:за|for)?\s*",
        "", s, flags=re.I,
    ).strip()
    words = [w.strip(".,!?;:()[]{}\"'`|-") for w in s.split()]
    words = [w for w in words if w]
    return " ".join(words[:4]).strip(".,!?;:") or ""


# ---------------------------------------------------------------------------
# Field-level validators
# ---------------------------------------------------------------------------

def _check_string_fields(state: dict, errors: list, warnings: list, subject: str) -> None:
    for key in REQUIRED_STRING_FIELDS:
        val = state.get(key)
        if not isinstance(val, str) or not val.strip():
            errors.append(f"Missing or empty required field: '{key}'")
        else:
            pat = _has_bad_copy(val)
            if pat:
                errors.append(f"Bad copy pattern in '{key}': matched /{pat}/")
            if key in WORD_LIMITS and len(val.split()) > WORD_LIMITS[key]:
                errors.append(
                    f"'{key}' exceeds {WORD_LIMITS[key]}-word limit "
                    f"(got {len(val.split())} words): \"{val}\""
                )

    # Colour format check
    for color_key in ("primaryColor", "secondaryColor"):
        val = _txt(state.get(color_key))
        if val and not _is_valid_hex(val):
            errors.append(f"'{color_key}' is not a valid CSS hex colour: \"{val}\"")


def _check_hero(state: dict, errors: list, warnings: list) -> None:
    hero = state.get("hero")
    if not isinstance(hero, dict):
        errors.append("'hero' is missing or not a dict")
        return
    for key in REQUIRED_HERO_FIELDS:
        val = hero.get(key)
        if not isinstance(val, str) or not val.strip():
            errors.append(f"Missing or empty hero field: 'hero.{key}'")
        else:
            dotkey = f"hero.{key}"
            pat = _has_bad_copy(val)
            if pat:
                errors.append(f"Bad copy pattern in 'hero.{key}': matched /{pat}/")
            if dotkey in WORD_LIMITS and len(val.split()) > WORD_LIMITS[dotkey]:
                errors.append(
                    f"'hero.{key}' exceeds {WORD_LIMITS[dotkey]}-word limit "
                    f"(got {len(val.split())} words): \"{val}\""
                )


def _check_sections(state: dict, errors: list, warnings: list) -> None:
    sections = state.get("sections")
    if not isinstance(sections, list) or len(sections) < MIN_SECTIONS:
        errors.append(
            f"'sections' must be a list with at least {MIN_SECTIONS} item(s) "
            f"(got {len(sections) if isinstance(sections, list) else type(sections).__name__})"
        )
        return
    for i, sec in enumerate(sections):
        if not isinstance(sec, dict):
            errors.append(f"sections[{i}] is not a dict")
            continue
        for key in ("title", "description"):
            if not _txt(sec.get(key)):
                errors.append(f"sections[{i}].{key} is missing or empty")
        if not isinstance(sec.get("items"), list):
            warnings.append(f"sections[{i}].items is missing or not a list")


def _check_features(state: dict, errors: list, warnings: list) -> None:
    features = state.get("features")
    if not isinstance(features, list) or len(features) < MIN_FEATURES:
        errors.append(
            f"'features' must be a list with at least {MIN_FEATURES} item(s) "
            f"(got {len(features) if isinstance(features, list) else type(features).__name__})"
        )
        return
    for i, feat in enumerate(features):
        if not isinstance(feat, dict):
            errors.append(f"features[{i}] is not a dict")
            continue
        for key in ("title", "description"):
            if not _txt(feat.get(key)):
                errors.append(f"features[{i}].{key} is missing or empty")


def _check_footer(state: dict, errors: list, warnings: list) -> None:
    footer = state.get("footer")
    if not isinstance(footer, dict):
        errors.append("'footer' is missing or not a dict")
        return
    for key in ("headline", "cta"):
        if not _txt(footer.get(key)):
            errors.append(f"footer.{key} is missing or empty")
    hl = _txt(footer.get("headline"))
    if hl and len(hl.split()) > WORD_LIMITS["footer.headline"]:
        errors.append(
            f"footer.headline exceeds {WORD_LIMITS['footer.headline']}-word limit: \"{hl}\""
        )


def _check_generation(state: dict, errors: list, warnings: list) -> None:
    """Only called in post_ai mode."""
    gen = state.get("generation")
    if not isinstance(gen, dict):
        errors.append("'generation' is missing or not a dict (required post-AI)")
        return
    for key in REQUIRED_GENERATION_FIELDS:
        if not _txt(gen.get(key)):
            errors.append(f"generation.{key} is missing or empty")
    if gen.get("sourceOfTruth") != "latest_prompt":
        errors.append(
            f"generation.sourceOfTruth must be 'latest_prompt' "
            f"(got '{gen.get('sourceOfTruth')}')"
        )
    confidence = gen.get("confidence")
    if isinstance(confidence, (int, float)) and confidence < 0.5:
        warnings.append(
            f"generation.confidence is low ({confidence:.2f}) — subject may be unreliable"
        )


def _check_template(state: dict, errors: list, warnings: list) -> None:
    tid = _txt(state.get("templateId"))
    if tid and tid not in KNOWN_TEMPLATE_IDS:
        warnings.append(
            f"Unknown templateId: '{tid}'. "
            f"Known: {', '.join(sorted(KNOWN_TEMPLATE_IDS))}"
        )


def _check_pricing(state: dict, errors: list, warnings: list) -> None:
    pricing = state.get("pricing")
    if pricing is None:
        warnings.append("'pricing' key is absent — defaulting to empty list")
        return
    if not isinstance(pricing, list):
        errors.append(f"'pricing' must be a list (got {type(pricing).__name__})")
        return
    for i, plan in enumerate(pricing):
        if not isinstance(plan, dict):
            errors.append(f"pricing[{i}] is not a dict")
            continue
        for key in ("name", "price"):
            if not _txt(plan.get(key)):
                errors.append(f"pricing[{i}].{key} is missing or empty")


# ---------------------------------------------------------------------------
# Repair engine
# ---------------------------------------------------------------------------

def _repair(state: dict, errors: list[str], prompt: str, mode: str) -> dict:
    """
    Return a fully-populated, safe copy of *state* with every detected
    error fixed using sensible fallbacks.  Original dict is never mutated.
    """
    s = dict(state)  # shallow copy is enough — we rebuild nested dicts explicitly
    subject = _subject_from_state(s, prompt)

    # ---- top-level strings ----
    for key, fallback in (
        ("brandName",     subject or _FALLBACK_BRAND),
        ("tagline",       _FALLBACK_TAGLINE),
        ("industry",      subject or _FALLBACK_INDUSTRY),
        ("primaryColor",  _FALLBACK_PRIMARY),
        ("secondaryColor", _FALLBACK_SECONDARY),
        ("style",         _FALLBACK_STYLE),
    ):
        val = _txt(s.get(key))
        if not val or _has_bad_copy(val) or not _is_valid_hex(val) and key.endswith("Color"):
            s[key] = fallback
        elif key in WORD_LIMITS:
            s[key] = _trim_words(val, WORD_LIMITS[key])

    # ---- hero ----
    hero = s.get("hero") if isinstance(s.get("hero"), dict) else {}
    repaired_hero: dict[str, str] = {}
    for key in REQUIRED_HERO_FIELDS:
        val = _txt(hero.get(key))
        dotkey = f"hero.{key}"
        if not val or _has_bad_copy(val):
            repaired_hero[key] = _FALLBACK_HERO.get(key, "")
        elif dotkey in WORD_LIMITS:
            repaired_hero[key] = _trim_words(val, WORD_LIMITS[dotkey])
        else:
            repaired_hero[key] = val
    # Preserve any extra hero keys (e.g. custom fields)
    s["hero"] = {**hero, **repaired_hero}

    # ---- sections ----
    sections = s.get("sections") if isinstance(s.get("sections"), list) else []
    repaired_sections = []
    for sec in sections:
        if not isinstance(sec, dict):
            continue
        repaired_sections.append({
            "title":       _txt(sec.get("title")) or _FALLBACK_SECTION["title"],
            "description": _txt(sec.get("description")) or _FALLBACK_SECTION["description"],
            "items":       _arr(sec.get("items"), _FALLBACK_SECTION["items"]),
        })
    if not repaired_sections:
        repaired_sections = [dict(_FALLBACK_SECTION)]
    s["sections"] = repaired_sections

    # ---- features ----
    features = s.get("features") if isinstance(s.get("features"), list) else []
    repaired_features = []
    for feat in features:
        if not isinstance(feat, dict):
            continue
        repaired_features.append({
            "title":       _txt(feat.get("title")) or _FALLBACK_FEATURE["title"],
            "description": _txt(feat.get("description")) or _FALLBACK_FEATURE["description"],
        })
    if not repaired_features:
        repaired_features = [dict(_FALLBACK_FEATURE)]
    s["features"] = repaired_features

    # ---- footer ----
    footer = s.get("footer") if isinstance(s.get("footer"), dict) else {}
    footer_hl = _txt(footer.get("headline")) or _FALLBACK_FOOTER["headline"]
    if len(footer_hl.split()) > WORD_LIMITS["footer.headline"]:
        footer_hl = _trim_words(footer_hl, WORD_LIMITS["footer.headline"])
    s["footer"] = {
        **footer,
        "headline": footer_hl,
        "cta":      _txt(footer.get("cta")) or _FALLBACK_FOOTER["cta"],
    }

    # ---- pricing ----
    if not isinstance(s.get("pricing"), list):
        s["pricing"] = []

    # ---- generation (post_ai mode) ----
    if mode == "post_ai":
        gen = s.get("generation") if isinstance(s.get("generation"), dict) else {}
        repaired_gen = dict(gen)
        repaired_gen["sourceOfTruth"]         = "latest_prompt"
        repaired_gen["mustFollowLatestPrompt"] = True
        for key in REQUIRED_GENERATION_FIELDS:
            if not _txt(repaired_gen.get(key)):
                repaired_gen[key] = subject
        s["generation"] = repaired_gen

    return s


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def guard_state(
    state: Any,
    *,
    prompt: str = "",
    mode: str = "standalone",
) -> GuardResult:
    """
    Validate and auto-repair a WebsiteProjectState dict.

    Parameters
    ----------
    state : Any
        The raw project state to validate.  Should be a dict; anything
        else is treated as a total failure and replaced with a clean default.
    prompt : str
        The original user prompt — used to extract a subject for fallback
        repairs when the state contains no usable subject.
    mode : str
        One of ``"post_ai"``, ``"pre_render"``, or ``"standalone"``.

        - ``"post_ai"``   — also validates generation contract fields
        - ``"pre_render"``— stricter hero + section checks, no generation check
        - ``"standalone"``— full check except generation contract

    Returns
    -------
    GuardResult
        ``is_valid`` is True when zero errors were found *before* repair.
        ``repaired_state`` is always a safe, usable dict.

    Examples
    --------
    >>> result = guard_state(groq_data, prompt="coffee shop Sofia", mode="post_ai")
    >>> safe = result.repaired_state
    >>> if not result.is_valid:
    ...     logger.warning("Guard errors: %s", result.errors)
    """
    errors:   list[str] = []
    warnings: list[str] = []

    # ---- type guard ----
    if not isinstance(state, dict):
        errors.append(
            f"projectState must be a dict (got {type(state).__name__}) — full fallback applied"
        )
        repaired = _repair({}, errors, prompt, mode)
        return GuardResult(
            is_valid=False,
            errors=errors,
            warnings=warnings,
            repaired_state=repaired,
            mode=mode,
        )

    subject = _subject_from_state(state, prompt)

    # ---- run checks ----
    _check_string_fields(state, errors, warnings, subject)
    _check_hero(state, errors, warnings)
    _check_sections(state, errors, warnings)
    _check_features(state, errors, warnings)
    _check_footer(state, errors, warnings)
    _check_pricing(state, errors, warnings)
    _check_template(state, errors, warnings)

    if mode == "post_ai":
        _check_generation(state, errors, warnings)

    # ---- repair ----
    repaired = _repair(state, errors, prompt, mode)

    return GuardResult(
        is_valid=len(errors) == 0,
        errors=errors,
        warnings=warnings,
        repaired_state=repaired,
        mode=mode,
    )


# ---------------------------------------------------------------------------
# Convenience wrappers (drop-in for common pipeline positions)
# ---------------------------------------------------------------------------

def guard_post_ai(state: Any, prompt: str = "") -> GuardResult:
    """Validate immediately after the Groq response, before merge."""
    return guard_state(state, prompt=prompt, mode="post_ai")


def guard_pre_render(state: Any, prompt: str = "") -> GuardResult:
    """Validate just before render_premium_website()."""
    return guard_state(state, prompt=prompt, mode="pre_render")


# ---------------------------------------------------------------------------
# CLI / standalone usage
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import json as _json
    import sys

    _prompt = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else ""
    _raw    = _json.load(sys.stdin) if not sys.stdin.isatty() else {}
    _result = guard_state(_raw, prompt=_prompt, mode="standalone")

    print(_result.summary())
    if _result.errors:
        print("\nErrors:")
        for e in _result.errors:
            print(f"  ✗ {e}")
    if _result.warnings:
        print("\nWarnings:")
        for w in _result.warnings:
            print(f"  ⚠ {w}")

    print("\nRepaired state (JSON):")
    print(_json.dumps(_result.repaired_state, ensure_ascii=False, indent=2))

    sys.exit(0 if _result.is_valid else 1)