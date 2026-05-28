import json
import os
import re
import html
import requests
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


def _txt(value, fallback=""):
    value = "" if value is None else str(value).strip()
    return value or fallback


def _arr(value, fallback=None):
    if isinstance(value, list):
        clean = [str(x).strip() for x in value if str(x).strip()]
        return clean or (fallback or [])
    return fallback or []


def _apply_template_context(state, template_context):
    if not isinstance(state, dict):
        state = {}
    if not isinstance(template_context, dict):
        return state

    state["templateId"] = state.get("templateId") or template_context.get("templateId")
    state["templateName"] = state.get("templateName") or template_context.get("templateName")
    state["templateSections"] = state.get("templateSections") or template_context.get("templateSections")
    state["templateVisualStyle"] = state.get("templateVisualStyle") or template_context.get("templateVisualStyle")
    return state



_NOISE_WORDS = {
    "направи", "създай", "генерирай", "ми", "сайт", "уебсайт", "страница",
    "премиум", "реални", "снимки", "снимка", "видео", "фон", "чист",
    "минималистичен", "минималистична", "модерен", "модерна", "тъмен", "тъмна",
    "светъл", "светла", "дизайн", "layout", "с", "за", "и", "или", "на",
    "от", "по", "при", "към", "без", "но", "а", "со", "със",
    "make", "create", "build", "generate", "me", "a", "an", "the",
    "site", "website", "page", "landing", "premium", "real", "photos",
    "video", "background", "clean", "minimal", "minimalist", "modern",
    "dark", "light", "with", "and", "or", "for", "of", "design", "layout",
    "responsive", "luxury", "high", "end", "conversion", "focused",
}

_STOP_AFTER = [
    " с реални", " със реални", " с видео", " и видео", " с фон",
    " видео фон", " с снимки", " с картинки", " с дизайн",
    " with video", " with real", " with photos", " with background",
    " dark theme", " light theme", " clean layout", " minimal",
]


def _extract_subject(prompt: str) -> str:
    s = str(prompt or "").strip()
    s = re.sub(r"\s+", " ", s)
    s = re.sub(
        r"^.*?\b(?:сайт|уебсайт|страница|website|site|landing\s*page)\s*(?:за|for)?\s*",
        "",
        s,
        flags=re.I,
    ).strip()
    low = s.lower()
    cut_at = None
    for phrase in _STOP_AFTER:
        idx = low.find(phrase)
        if idx > 0:
            cut_at = idx if cut_at is None else min(cut_at, idx)
    if cut_at:
        s = s[:cut_at].strip()
    words = []
    for w in s.split():
        clean = w.strip(".,!?;:()[]{}\"'`|-")
        if clean.lower() not in _NOISE_WORDS and clean:
            words.append(clean)
    subject = " ".join(words[:4]).strip(".,!?;:")
    return subject or "Premium Brand"


def _title(s: str) -> str:
    return " ".join(w[:1].upper() + w[1:] for w in str(s or "").split())


def _default_state(prompt: str):
    subject = _extract_subject(prompt)
    subject_title = _title(subject)
    dark = any(w in prompt.lower() for w in ["dark", "black", "тъмен", "черен", "premium", "luxury"])
    green = any(w in prompt.lower() for w in ["green", "neon", "елект", "зелен"])
    primary = "#7CFFB2" if green else "#F59E0B"
    secondary = "#07070a" if dark else "#f8fafc"
    bg = bool(re.search(r"[а-яА-Я]", prompt))
    if bg:
        tagline = f"Премиум онлайн присъствие за {subject_title}"
        headline = subject_title
        subheadline = f"Модерен уебсайт за {subject_title} с изчистен дизайн и силно послание."
        eyebrow = "Премиум Преживяване"
        cta1 = "Разгледай"
        cta2 = "Научи повече"
        footer_headline = f"Готов да стартираш с {subject_title}?"
        footer_cta = "Започни сега"
        sec_titles = ["Предимства", "Колекция", "Качество"]
        sec_desc = f"Премиум представяне за {subject_title}."
        feat = [
            {"title": "Премиум Дизайн", "description": f"Изчистена модерна визия за {subject_title}."},
            {"title": "Бързо Зареждане", "description": "Оптимизиран код за максимална скорост."},
            {"title": "Силно Послание", "description": f"Съдържание насочено към {subject_title}."},
        ]
    else:
        tagline = f"Premium digital experience for {subject_title}"
        headline = subject_title
        subheadline = f"A premium website for {subject_title} — clean design, strong message, built to convert."
        eyebrow = "Premium Experience"
        cta1 = "Explore"
        cta2 = "Learn More"
        footer_headline = f"Ready to launch {subject_title}?"
        footer_cta = "Start Now"
        sec_titles = ["Our Advantage", "Collection", "Quality"]
        sec_desc = f"Premium presentation for {subject_title}."
        feat = [
            {"title": "Premium Design", "description": f"Clean modern visuals for {subject_title}."},
            {"title": "Fast Experience", "description": "Optimized for speed and smooth navigation."},
            {"title": "Strong Messaging", "description": f"Copy focused entirely on {subject_title}."},
        ]
    return {
        "brandName": subject_title,
        "tagline": tagline,
        "industry": subject_title,
        "style": "dark premium cinematic, modern, responsive, conversion focused",
        "primaryColor": primary,
        "secondaryColor": secondary,
        "visualSystem": {
            "backgroundType": "gradient",
            "backgroundPrompt": f"premium cinematic visuals for {subject}",
            "motion": "soft reveals, premium hover states, smooth transitions",
            "details": ["premium spacing", "glass cards", "large typography", "conversion focused"],
        },
        "hero": {
            "eyebrow": eyebrow,
            "headline": headline,
            "subheadline": subheadline,
            "primaryCta": cta1,
            "secondaryCta": cta2,
        },
        "sections": [
            {"title": sec_titles[0], "description": sec_desc, "items": ["Премиум позициониране" if bg else "Premium positioning", "Ясна йерархия" if bg else "Clear visual hierarchy", "Конверсия" if bg else "Conversion-first"]},
            {"title": sec_titles[1], "description": "Всяка секция води към действие." if bg else "Every section guides visitors to action.", "items": ["Hero CTA", "Продуктови акценти" if bg else "Product highlights", "Доверие" if bg else "Trust signals"]},
            {"title": sec_titles[2], "description": "Респонсив дизайн за всички устройства." if bg else "Responsive design for any device.", "items": ["Респонсив" if bg else "Responsive", "Модерни карти" if bg else "Modern cards", "Премиум футър" if bg else "Premium footer"]},
        ],
        "features": feat,
        "pricing": [],
        "footer": {"headline": footer_headline, "cta": footer_cta},
    }


def _post_clean(state: dict, subject: str) -> dict:
    bad_patterns = [
        r"built for modern buyers", r"ready to build your",
        r"a high-end,?\s*conversion-focused landing page for",
        r"with polished visuals", r"strong product storytelling",
        r"premium brand feel", r"site pages", r"page_path",
        r"user request", r"mode:", r"с видео фон", r"видео фон",
        r"с реални снимки", r"реални снимки",
    ]
    def clean(value, max_words=None):
        if not isinstance(value, str):
            return value
        s = value
        for pat in bad_patterns:
            s = re.sub(pat, "", s, flags=re.I).strip(" ,-.")
        s = re.sub(r"\s+", " ", s).strip()
        if max_words and len(s.split()) > max_words:
            s = " ".join(s.split()[:max_words]).strip(" ,-.")
        return s or subject
    hero = state.get("hero", {})
    if isinstance(hero, dict):
        hero["headline"] = clean(hero.get("headline", ""), max_words=6)
        hero["subheadline"] = clean(hero.get("subheadline", ""), max_words=20)
        hero["eyebrow"] = clean(hero.get("eyebrow", ""), max_words=4)
        state["hero"] = hero
    footer = state.get("footer", {})
    if isinstance(footer, dict):
        footer["headline"] = clean(footer.get("headline", ""), max_words=8)
        state["footer"] = footer
    state["brandName"] = clean(state.get("brandName", subject), max_words=3)
    state["tagline"] = clean(state.get("tagline", ""), max_words=12)
    state["industry"] = clean(state.get("industry", subject), max_words=3)
    return state


def _enforce_universal_generation_field(state, prompt: str, subject_contract: dict, legacy_subject: str):
    """
    Enforce universalSubject + generation after AI response.

    Important:
    - latestPrompt/subjectContract are the source of truth
    - legacy_subject is emergency fallback only
    - no category lists
    - no topic hardcoding
    """
    if not isinstance(state, dict):
        state = {}

    universal = state.get("universalSubject") if isinstance(state.get("universalSubject"), dict) else {}
    generation = state.get("generation") if isinstance(state.get("generation"), dict) else {}
    media = state.get("media") if isinstance(state.get("media"), dict) else {}

    subject = (
        str(generation.get("subject") or "").strip()
        or str(universal.get("subject") or "").strip()
        or str(state.get("subject") or "").strip()
        or str(legacy_subject or "").strip()
    )

    media_subject = (
        str(generation.get("mediaSubject") or "").strip()
        or str(media.get("subject") or "").strip()
        or subject
    )

    generation = {
        "sourceOfTruth": "latest_prompt",
        "mustFollowLatestPrompt": True,
        "subject": subject,
        "mainSubject": str(generation.get("mainSubject") or subject).strip(),
        "brandName": str(generation.get("brandName") or subject).strip(),
        "headlineSubject": str(generation.get("headlineSubject") or subject).strip(),
        "mediaSubject": media_subject,
        "confidence": generation.get("confidence") or universal.get("confidence") or 0.9,
    }

    queries = media.get("queries") if isinstance(media.get("queries"), list) else []
    queries = [str(q).strip() for q in queries if str(q).strip()]
    if media_subject and media_subject.lower() not in [q.lower() for q in queries]:
        queries.insert(0, media_subject)

    negative_hints = media.get("negativeHints") if isinstance(media.get("negativeHints"), list) else []
    negative_hints = [str(h).strip() for h in negative_hints if str(h).strip()]

    media = {
        **media,
        "subject": media_subject,
        "queries": queries[:8],
        "negativeHints": negative_hints[:8],
    }

    state["universalSubject"] = {
        "subject": subject,
        "clean_prompt": str(universal.get("clean_prompt") or prompt).strip(),
        "source": "latest_prompt",
        "confidence": generation["confidence"],
        "reason": str(universal.get("reason") or "Enforced from universal subject contract.").strip(),
        "generation": generation,
        "media": media,
        "rules": list(subject_contract.get("rules") or []),
    }

    state["generation"] = generation
    state["media"] = media

    if subject:
        state["subject"] = subject
        state["mainSubject"] = generation["mainSubject"]
        state["brandName"] = generation["brandName"]

    visual = state.get("visualSystem") if isinstance(state.get("visualSystem"), dict) else {}
    if media_subject:
        visual["backgroundPrompt"] = str(visual.get("backgroundPrompt") or media_subject).strip()
    state["visualSystem"] = visual

    return state


def _build_subject_generation_from_prompt(prompt: str, current_state=None):
    """
    Universal subject pre-step.

    This is the bridge between universal_subject.py contract and the main generator.
    No category hardcoding. Latest prompt is source of truth.
    """
    api_key = os.environ.get("GROQ_API_KEY", "").strip()
    model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile").strip()

    contract = dict(UNIVERSAL_SUBJECT_AGENT_CONTRACT)
    contract["latestPrompt"] = prompt
    contract["previousState"] = current_state or {}

    fallback_subject = _extract_subject(prompt)

    fallback = {
        "subject": fallback_subject,
        "clean_prompt": prompt,
        "confidence": 0.35,
        "reason": "Fallback only because subject pre-step did not return usable JSON.",
        "generation": {
            "sourceOfTruth": "latest_prompt",
            "mustFollowLatestPrompt": True,
            "subject": fallback_subject,
            "mainSubject": fallback_subject,
            "brandName": fallback_subject,
            "headlineSubject": fallback_subject,
            "mediaSubject": fallback_subject,
            "confidence": 0.35,
        },
        "media": {
            "subject": fallback_subject,
            "queries": [fallback_subject] if fallback_subject else [prompt],
            "negativeHints": [],
        },
    }

    if not api_key:
        return fallback

    system = """You are Galio IA Studio's universal subject extractor.
Return ONLY valid JSON.
No markdown.
No explanations.
Use the latestPrompt as the only source of truth.
Previous state is context only.
Do not use fixed categories.
Do not use examples.
Fill generation and media fields exactly from the requested subject."""

    try:
        r = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": json.dumps(contract, ensure_ascii=False)},
                ],
                "temperature": 0.15,
                "max_tokens": 1200,
            },
            timeout=45,
        )
        if r.status_code >= 400:
            return fallback

        content = r.json()["choices"][0]["message"]["content"].strip()
        content = re.sub(r"^```(?:json)?", "", content).strip()
        content = re.sub(r"```$", "", content).strip()
        data = json.loads(content)
        data = _apply_subject_generation(data, subject_data)

        if not isinstance(data, dict):
            return fallback

        generation = data.get("generation") if isinstance(data.get("generation"), dict) else {}
        media = data.get("media") if isinstance(data.get("media"), dict) else {}

        subject = str(generation.get("subject") or data.get("subject") or "").strip()
        if not subject:
            return fallback

        generation = {
            "sourceOfTruth": "latest_prompt",
            "mustFollowLatestPrompt": True,
            "subject": subject,
            "mainSubject": str(generation.get("mainSubject") or subject).strip(),
            "brandName": str(generation.get("brandName") or subject).strip(),
            "headlineSubject": str(generation.get("headlineSubject") or subject).strip(),
            "mediaSubject": str(generation.get("mediaSubject") or subject).strip(),
            "confidence": generation.get("confidence") or data.get("confidence") or 0.9,
        }

        queries = media.get("queries") if isinstance(media.get("queries"), list) else []
        queries = [str(q).strip() for q in queries if str(q).strip()]
        if generation["mediaSubject"].lower() not in [q.lower() for q in queries]:
            queries.insert(0, generation["mediaSubject"])

        data["subject"] = subject
        data["generation"] = generation
        data["media"] = {
            "subject": generation["mediaSubject"],
            "queries": queries[:8],
            "negativeHints": media.get("negativeHints") if isinstance(media.get("negativeHints"), list) else [],
        }
        return data
    except Exception:
        return fallback


def _apply_subject_generation(state, subject_data):
    if not isinstance(state, dict):
        state = {}

    generation = subject_data.get("generation") if isinstance(subject_data.get("generation"), dict) else {}
    media = subject_data.get("media") if isinstance(subject_data.get("media"), dict) else {}

    subject = str(generation.get("subject") or subject_data.get("subject") or "").strip()
    if not subject:
        return state

    state["universalSubject"] = subject_data
    state["generation"] = generation
    state["subject"] = subject
    state["mainSubject"] = generation.get("mainSubject") or subject
    state["brandName"] = generation.get("brandName") or subject

    existing_media = state.get("media") if isinstance(state.get("media"), dict) else {}
    existing_media.update(media)
    state["media"] = existing_media

    visual = state.get("visualSystem") if isinstance(state.get("visualSystem"), dict) else {}
    visual["backgroundPrompt"] = generation.get("mediaSubject") or subject
    state["visualSystem"] = visual

    return state


def generate_project_state_with_groq(prompt: str, current_state=None):
    api_key = os.environ.get("GROQ_API_KEY", "").strip()
    model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile").strip()

    subject_data = _build_subject_generation_from_prompt(prompt, current_state)
    subject = subject_data.get("generation", {}).get("subject") or subject_data.get("subject") or _extract_subject(prompt)
    media_subject = subject_data.get("generation", {}).get("mediaSubject") or subject_data.get("media", {}).get("subject") or subject or prompt

    template_context = build_template_context(
        prompt=prompt,
        subject=subject,
        requested_template_id=(current_state or {}).get("templateId") if isinstance(current_state, dict) else None,
    )

    fallback = _apply_template_context(_apply_subject_generation(_default_state(prompt), subject_data), template_context)
    if not api_key:
        fallback["mediaAssets"] = fetch_pexels_media(media_subject)
        return fallback

    bg = bool(re.search(r"[а-яА-Я]", prompt))
    lang_instruction = (
        "The user wrote in Bulgarian. Output ALL website copy in Bulgarian (Cyrillic)."
        if bg else
        "The user wrote in English. Output all website copy in English."
    )
    subject_contract = dict(UNIVERSAL_SUBJECT_AGENT_CONTRACT)
    subject_contract["latestPrompt"] = prompt
    subject_contract["previousState"] = current_state or {}
    subject_contract["extractedSubject"] = subject_data
    subject_contract["templateContext"] = template_context

    system = f"""You are Galio AI Studio's universal website content agent.

CRITICAL UNIVERSAL SUBJECT CONTRACT:
- The latest user prompt is the ONLY source of truth.
- The previous/current project state is context only, never authority.
- Do NOT keep an old subject when the latest prompt asks for a new one.
- Do NOT use fixed categories or examples.
- Use the provided subjectContract to extract the main subject.
- projectState MUST include universalSubject.
- projectState MUST include generation.
- projectState.generation.subject MUST control brandName, headline, sections, cards, generated files and media queries.
- mediaAssets and media queries MUST follow projectState.generation.mediaSubject.
- Use subjectContract.templateContext only as layout guidance, never as subject authority.
- templateId controls page structure only. It must NOT change the website subject.
Generate a structured WebsiteProjectState JSON from subjectContract.latestPrompt. The extracted generation.subject is the website authority.

{lang_instruction}

Return ONLY valid JSON. No markdown. No explanations.

Schema:
{{
  "universalSubject": {{
    "subject": string,
    "clean_prompt": string,
    "source": "latest_prompt",
    "confidence": number,
    "reason": string
  }},
  "generation": {{
    "sourceOfTruth": "latest_prompt",
    "mustFollowLatestPrompt": true,
    "subject": string,
    "mainSubject": string,
    "brandName": string,
    "headlineSubject": string,
    "mediaSubject": string,
    "confidence": number
  }},
  "media": {{
    "subject": string,
    "queries": [string],
    "negativeHints": [string]
  }},
  "templateId": string,
  "templateName": string,
  "templateSections": [string],
  "brandName": string,
  "tagline": string,
  "industry": string,
  "style": string,
  "primaryColor": string,
  "secondaryColor": string,
  "visualSystem": {{"backgroundType": string, "backgroundPrompt": string, "motion": string, "details": []}},
  "hero": {{"eyebrow": string, "headline": string, "subheadline": string, "primaryCta": string, "secondaryCta": string}},
  "sections": [{{"title": string, "description": string, "items": []}}],
  "features": [{{"title": string, "description": string}}],
  "pricing": [],
  "footer": {{"headline": string, "cta": string}}
}}

CRITICAL RULES:
- hero.headline = 2-5 words MAX. Just the product/brand name. NEVER "Built For Modern Buyers", NEVER prompt text.
- footer.headline = max 8 words. Short CTA only.
- brandName = max 3 words, NO style modifiers.
- Stay on topic: projectState.generation.subject from the universal subject contract
- Use templateContext.templateSections to shape the one-page website sections.
- Do NOT copy template examples as business topic. Template is layout only.
- Dark cinematic style unless user requests light.
"""
    try:
        r = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": json.dumps({
                        "subjectContract": subject_contract,
                        "templateContext": template_context,
                        "latestPrompt": prompt,
                        "currentState": current_state or {},
                        "legacyFallbackSubject": subject,
                    }, ensure_ascii=False)},
                ],
                "temperature": 0.65,
                "max_tokens": 5000,
            },
            timeout=90,
        )
        if r.status_code >= 400:
            fallback["mediaAssets"] = fetch_pexels_media(prompt)
            return fallback
        content = r.json()["choices"][0]["message"]["content"].strip()
        content = re.sub(r"^```(?:json)?", "", content).strip()
        content = re.sub(r"```$", "", content).strip()
        start = content.find("{")
        end = content.rfind("}")
        if start >= 0 and end > start:
            content = content[start:end + 1]
        data = json.loads(content)

        data = _enforce_universal_generation_field(data, prompt, subject_contract, subject)
        if not isinstance(data, dict):
            fallback["mediaAssets"] = fetch_pexels_media(prompt)
            return fallback
        merged = {**fallback, **data}
        if isinstance(data.get("hero"), dict):
            merged["hero"] = {**fallback["hero"], **data["hero"]}
        merged = _post_clean(merged, subject)
        merged["mediaAssets"] = fetch_pexels_media((state.get("generation", {}) if isinstance(state, dict) else {}).get("mediaSubject") or (state.get("media", {}) if isinstance(state, dict) else {}).get("subject") or prompt)
        return merged
    except Exception:
        fallback = _apply_template_context(fallback, template_context if "template_context" in locals() else {})
        fallback["mediaAssets"] = fetch_pexels_media(prompt)
        return fallback


def render_premium_website(state: dict):
    brand = _txt(state.get("brandName"), "Galio Studio")
    tagline = _txt(state.get("tagline"), "Premium digital experience")
    industry = _txt(state.get("industry"), "premium brand")
    primary = _txt(state.get("primaryColor"), "#F59E0B")
    secondary = _txt(state.get("secondaryColor"), "#07070a")
    hero = state.get("hero") if isinstance(state.get("hero"), dict) else {}
    sections = state.get("sections") if isinstance(state.get("sections"), list) else []
    features = state.get("features") if isinstance(state.get("features"), list) else []
    pricing = state.get("pricing") if isinstance(state.get("pricing"), list) else []
    footer = state.get("footer") if isinstance(state.get("footer"), dict) else {}
    eyebrow = _txt(hero.get("eyebrow"), industry)
    headline = _txt(hero.get("headline"), brand)
    subheadline = _txt(hero.get("subheadline"), tagline)
    primary_cta = _txt(hero.get("primaryCta"), "Explore")
    secondary_cta = _txt(hero.get("secondaryCta"), "Learn More")

    def esc(x):
        return html.escape(_txt(x), quote=True)

    feature_cards = ""
    for item in (features[:6] or [{"title": "Premium Design", "description": "Clean visuals."}, {"title": "Fast Experience", "description": "Optimized for speed."}, {"title": "Brand Focused", "description": f"Content for {industry}."}]):
        feature_cards += f'<article class="g-feature-card"><div class="g-feature-icon"></div><h3>{esc(item.get("title"))}</h3><p>{esc(item.get("description"))}</p></article>'

    section_blocks = ""
    for idx, sec in enumerate(sections[:4]):
        items = _arr(sec.get("items"), [])
        chips = "".join(f"<span>{esc(x)}</span>" for x in items[:5])
        section_blocks += f'<article class="g-section-card {"g-section-card-large" if idx == 0 else ""}"><div class="g-section-number">0{idx + 1}</div><h3>{esc(sec.get("title"))}</h3><p>{esc(sec.get("description"))}</p><div class="g-chip-row">{chips}</div></article>'

    pricing_blocks = ""
    for plan in pricing[:3]:
        feats = "".join(f"<li>{esc(x)}</li>" for x in _arr(plan.get("features"), [])[:5])
        pricing_blocks += f'<article class="g-price-card"><p class="g-plan">{esc(plan.get("name"))}</p><h3>{esc(plan.get("price"))}</h3><p>{esc(plan.get("description"))}</p><ul>{feats}</ul></article>'
    pricing_html = f'<section class="g-pricing"><div class="g-section-head"><p>Offers</p><h2>Choose the right experience</h2></div><div class="g-pricing-grid">{pricing_blocks}</div></section>' if pricing_blocks else ""

    template_id = _txt(state.get("templateId"), "premium-landing")
    template_sections = _arr(state.get("templateSections"), ["hero", "features", "showcase", "cta"])

    template_nav = {
        "saas-product": ["Product", "Workflow", "Pricing", "Demo"],
        "local-business": ["Services", "About", "Reviews", "Contact"],
        "hospitality-experience": ["Experience", "Gallery", "Booking", "Reviews"],
        "portfolio-personal": ["About", "Work", "Skills", "Contact"],
        "professional-service": ["Trust", "Services", "Process", "Contact"],
        "ecommerce-product": ["Products", "Benefits", "Details", "Buy"],
        "real-estate": ["Highlights", "Gallery", "Location", "Contact"],
        "event-conference": ["Agenda", "Speakers", "Venue", "Tickets"],
        "mobile-app": ["App", "Features", "Reviews", "Download"],
        "agency-studio": ["Services", "Work", "Process", "Clients"],
        "blog-magazine": ["Featured", "Categories", "Latest", "Subscribe"],
    }.get(template_id, ["Experience", "Features", "Work", "Contact"])

    template_cta = {
        "saas-product": ("Start Free", "Watch Demo"),
        "local-business": ("Book a Call", "View Services"),
        "hospitality-experience": ("Reserve Now", "Explore Gallery"),
        "portfolio-personal": ("View Work", "Contact Me"),
        "professional-service": ("Request Consultation", "See Process"),
        "ecommerce-product": ("Shop Now", "Compare Details"),
        "real-estate": ("Schedule Viewing", "See Location"),
        "event-conference": ("Get Tickets", "View Agenda"),
        "mobile-app": ("Download App", "See Features"),
        "agency-studio": ("Start Project", "View Work"),
        "blog-magazine": ("Subscribe", "Read Latest"),
    }.get(template_id, (primary_cta, secondary_cta))

    primary_cta, secondary_cta = template_cta
    nav_links = "".join(f"<a>{esc(x)}</a>" for x in template_nav)

    template_headline = {
        "saas-product": "Built as a polished product system",
        "local-business": "Everything visitors need to trust you",
        "hospitality-experience": "A cinematic journey from first glance to booking",
        "portfolio-personal": "A personal story with proof and momentum",
        "professional-service": "Credibility, process and trust in one page",
        "ecommerce-product": "Product discovery with strong buying flow",
        "real-estate": "Space, location and details presented clearly",
        "event-conference": "Schedule, speakers and tickets with urgency",
        "mobile-app": "App benefits, previews and download action",
        "agency-studio": "Work, services and process with studio energy",
        "blog-magazine": "Editorial structure for content discovery",
    }.get(template_id, "Designed like a premium product launch")

    visual_label = {
        "saas-product": "Live Dashboard",
        "local-business": "Trusted Service",
        "hospitality-experience": "Premium Stay",
        "portfolio-personal": "Selected Work",
        "professional-service": "Expert Process",
        "ecommerce-product": "Featured Drop",
        "real-estate": "Signature Space",
        "event-conference": "Live Event",
        "mobile-app": "App Preview",
        "agency-studio": "Studio System",
        "blog-magazine": "Featured Story",
    }.get(template_id, industry)

    template_chips = "".join(f"<span>{esc(x)}</span>" for x in template_sections[:6])

    html_out = f"""<div class="g-site g-template-{esc(template_id)}">
  <nav class="g-nav"><div class="g-logo"><span></span>{esc(brand)}</div><div class="g-nav-links">{nav_links}</div><button class="g-nav-button">{esc(primary_cta)}</button></nav>
  <section class="g-hero"><div class="g-hero-copy"><div class="g-eyebrow">{esc(eyebrow)}</div><h1>{esc(headline)}</h1><p>{esc(subheadline)}</p><div class="g-actions"><button>{esc(primary_cta)}</button><button class="g-secondary">{esc(secondary_cta)}</button></div><div class="g-template-chips">{template_chips}</div><div class="g-stats"><div><strong>{esc(template_id.split("-")[0].title())}</strong><span>Template system</span></div><div><strong>AI</strong><span>Subject locked</span></div><div><strong>1 Page</strong><span>Premium flow</span></div></div></div><div class="g-hero-visual"><div class="g-phone"><div class="g-phone-top"></div><div class="g-screen-card"><span>{esc(visual_label)}</span><strong>{esc(brand)}</strong><p>{esc(tagline)}</p></div><div class="g-product-row"><div></div><div></div><div></div></div></div><div class="g-orb g-orb-a"></div><div class="g-orb g-orb-b"></div></div></section>
  <section class="g-features">{feature_cards}</section>
  <section class="g-sections"><div class="g-section-head"><p>{esc(template_id)}</p><h2>{esc(template_headline)}</h2></div><div class="g-section-grid">{section_blocks}</div></section>
  {pricing_html}
  <section class="g-cta"><p>{esc(industry)}</p><h2>{esc(footer.get("headline") or f"Ready to launch {brand}?")}</h2><button>{esc(footer.get("cta") or primary_cta)}</button></section>
  <footer class="g-footer"><span>{esc(brand)}</span><span>{esc(tagline)}</span></footer>
</div>"""

    css_out = f""":root{{--g-primary:{primary};--g-secondary:{secondary};--g-bg:#06070b;--g-text:#f8fafc;--g-muted:rgba(248,250,252,.68);--g-border:rgba(255,255,255,.12);--g-card:rgba(255,255,255,.055)}}*{{box-sizing:border-box}}body{{margin:0;background:var(--g-bg)}}.g-site{{min-height:100vh;color:var(--g-text);background:radial-gradient(circle at 18% 10%,color-mix(in srgb,var(--g-primary) 28%,transparent),transparent 32%),radial-gradient(circle at 85% 15%,rgba(96,165,250,.18),transparent 30%),linear-gradient(135deg,#050509 0%,#0b0f18 52%,#050509 100%);font-family:Inter,ui-sans-serif,system-ui,sans-serif;overflow:hidden}}.g-nav{{width:min(1180px,calc(100% - 32px));margin:0 auto;padding:22px 0;display:flex;align-items:center;justify-content:space-between}}.g-logo{{display:flex;align-items:center;gap:10px;font-weight:900;letter-spacing:-.04em}}.g-logo span{{width:18px;height:18px;border-radius:7px;background:var(--g-primary);box-shadow:0 0 28px color-mix(in srgb,var(--g-primary) 65%,transparent)}}.g-nav-links{{display:flex;gap:24px;color:var(--g-muted);font-size:14px}}.g-nav-button,.g-actions button,.g-cta button{{border:0;border-radius:999px;background:var(--g-primary);color:#04110b;padding:13px 19px;font-weight:900;cursor:pointer}}.g-hero{{width:min(1180px,calc(100% - 32px));margin:0 auto;min-height:720px;display:grid;grid-template-columns:1.05fr .95fr;gap:54px;align-items:center;padding:54px 0 78px}}.g-eyebrow{{width:fit-content;border:1px solid var(--g-border);background:rgba(255,255,255,.06);color:var(--g-primary);border-radius:999px;padding:9px 14px;margin-bottom:22px;font-size:13px;font-weight:800}}.g-hero h1{{max-width:760px;margin:0;font-size:clamp(48px,7.6vw,104px);line-height:.88;letter-spacing:-.085em}}.g-hero p{{max-width:680px;color:var(--g-muted);font-size:19px;line-height:1.72;margin:26px 0 0}}.g-actions{{display:flex;gap:14px;margin-top:32px}}.g-actions .g-secondary{{color:var(--g-text);background:rgba(255,255,255,.075);border:1px solid var(--g-border);box-shadow:none}}.g-stats{{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:42px;max-width:620px}}.g-stats div{{border:1px solid var(--g-border);background:rgba(255,255,255,.045);border-radius:22px;padding:18px}}.g-stats strong{{display:block;font-size:22px}}.g-stats span{{display:block;color:var(--g-muted);font-size:13px;margin-top:4px}}.g-hero-visual{{position:relative;min-height:580px;display:grid;place-items:center}}.g-phone{{position:relative;z-index:2;width:min(390px,88vw);min-height:530px;border-radius:46px;border:1px solid rgba(255,255,255,.2);background:linear-gradient(180deg,rgba(255,255,255,.13),rgba(255,255,255,.035)),radial-gradient(circle at 50% 0%,color-mix(in srgb,var(--g-primary) 26%,transparent),transparent 42%);box-shadow:0 42px 120px rgba(0,0,0,.55);padding:22px;backdrop-filter:blur(22px)}}.g-phone-top{{width:92px;height:8px;border-radius:999px;margin:0 auto 52px;background:rgba(255,255,255,.22)}}.g-screen-card{{border-radius:32px;border:1px solid var(--g-border);background:rgba(0,0,0,.34);padding:26px}}.g-screen-card span{{color:var(--g-primary);font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.12em}}.g-screen-card strong{{display:block;font-size:38px;letter-spacing:-.06em;line-height:.95;margin-top:18px}}.g-screen-card p{{font-size:14px;margin-top:18px}}.g-product-row{{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:18px}}.g-product-row div{{height:118px;border-radius:24px;background:linear-gradient(180deg,color-mix(in srgb,var(--g-primary) 28%,transparent),rgba(255,255,255,.06)),rgba(255,255,255,.06);border:1px solid var(--g-border)}}.g-orb{{position:absolute;border-radius:999px;filter:blur(8px)}}.g-orb-a{{width:230px;height:230px;right:14px;top:48px;background:color-mix(in srgb,var(--g-primary) 24%,transparent)}}.g-orb-b{{width:160px;height:160px;left:22px;bottom:70px;background:rgba(96,165,250,.2)}}.g-features,.g-pricing-grid{{width:min(1180px,calc(100% - 32px));margin:0 auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;padding:24px 0 80px}}.g-feature-card,.g-section-card,.g-price-card{{border:1px solid var(--g-border);background:var(--g-card);border-radius:30px;padding:28px;box-shadow:0 24px 80px rgba(0,0,0,.18)}}.g-feature-icon{{width:42px;height:42px;border-radius:16px;background:var(--g-primary);box-shadow:0 0 38px color-mix(in srgb,var(--g-primary) 45%,transparent);margin-bottom:20px}}.g-feature-card h3,.g-section-card h3,.g-price-card h3{{margin:0;font-size:24px;letter-spacing:-.04em}}.g-feature-card p,.g-section-card p,.g-price-card p,.g-price-card li{{color:var(--g-muted);line-height:1.65}}.g-sections,.g-pricing{{width:min(1180px,calc(100% - 32px));margin:0 auto;padding:24px 0 80px}}.g-section-head{{margin-bottom:24px}}.g-section-head p{{color:var(--g-primary);text-transform:uppercase;letter-spacing:.12em;font-size:13px;font-weight:900}}.g-section-head h2,.g-cta h2{{max-width:790px;margin:0;font-size:clamp(34px,5vw,68px);line-height:.95;letter-spacing:-.07em}}.g-section-grid{{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}}.g-section-card-large{{grid-row:span 2}}.g-section-number{{color:var(--g-primary);font-weight:900;margin-bottom:28px}}.g-chip-row{{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}}.g-chip-row span{{border:1px solid var(--g-border);border-radius:999px;padding:8px 11px;color:rgba(255,255,255,.78);background:rgba(255,255,255,.045);font-size:13px}}.g-cta{{width:min(1180px,calc(100% - 32px));margin:0 auto 40px;border:1px solid var(--g-border);border-radius:38px;padding:56px;background:radial-gradient(circle at 80% 20%,color-mix(in srgb,var(--g-primary) 22%,transparent),transparent 38%),rgba(255,255,255,.055)}}.g-cta p{{color:var(--g-primary);font-weight:900}}.g-cta button{{margin-top:26px}}.g-footer{{width:min(1180px,calc(100% - 32px));margin:0 auto;padding:32px 0 48px;display:flex;justify-content:space-between;color:var(--g-muted);border-top:1px solid var(--g-border)}}@media(max-width:900px){{.g-nav-links{{display:none}}.g-hero{{grid-template-columns:1fr;min-height:auto}}.g-features,.g-pricing-grid,.g-section-grid,.g-stats{{grid-template-columns:1fr}}.g-hero h1{{font-size:52px}}.g-cta{{padding:32px}}}}"""

    template_css = """
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
    css_out = css_out + template_css

    return {
        "html": html_out,
        "css": css_out,
        "js": "",
        "summary": f"Generated premium structured website for {industry}.",
        "projectState": state,
    }


def generate_premium_site(prompt: str, current_state=None):
    state = generate_project_state_with_groq(prompt, current_state=current_state)
    return render_premium_website(state)
