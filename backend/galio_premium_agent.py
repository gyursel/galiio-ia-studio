import json
import os
import re
import html
import requests
try:
    from backend.galio_media import fetch_pexels_media
except ImportError:
    from galio_media import fetch_pexels_media


def _txt(value, fallback=""):
    value = "" if value is None else str(value).strip()
    return value or fallback


def _arr(value, fallback=None):
    if isinstance(value, list):
        clean = [str(x).strip() for x in value if str(x).strip()]
        return clean or (fallback or [])
    return fallback or []


def _slug_subject(prompt: str):
    text = (prompt or "").lower()
    patterns = [
        "website for", "site for", "сайт за", "уебсайт за",
        "premium website for", "make a", "create a", "направи"
    ]
    subject = prompt.strip()
    for p in patterns:
        if p in text:
            idx = text.find(p) + len(p)
            subject = prompt[idx:].strip()
            break
    subject = re.sub(r"\b(with|със|and|и)\b.*$", "", subject, flags=re.I).strip()
    return subject[:80] or "premium brand"


def _default_state(prompt: str):
    subject = _slug_subject(prompt)
    dark = any(w in prompt.lower() for w in ["dark", "black", "тъмен", "черен", "premium", "luxury"])
    green = any(w in prompt.lower() for w in ["green", "neon", "елект", "зелен"])
    primary = "#7CFFB2" if green else "#F59E0B"
    secondary = "#07070a" if dark else "#f8fafc"

    return {
        "brandName": subject.title()[:42],
        "tagline": f"Premium digital experience for {subject}",
        "industry": subject,
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
            "eyebrow": "Premium Experience",
            "headline": f"Premium {subject.title()} Built For Modern Buyers",
            "subheadline": f"A high-end, conversion-focused landing page for {subject}, with polished visuals, strong product storytelling and a premium brand feel.",
            "primaryCta": "Explore Collection",
            "secondaryCta": "View Details",
        },
        "sections": [
            {
                "title": "Signature Experience",
                "description": f"A carefully crafted presentation for {subject}, focused on trust, clarity and premium perception.",
                "items": ["Premium positioning", "Clear visual hierarchy", "Conversion-first layout"],
            },
            {
                "title": "Built To Convert",
                "description": "Every section guides visitors from first impression to action with strong messaging and elegant UI.",
                "items": ["Hero CTA", "Product highlights", "Trust signals"],
            },
            {
                "title": "Launch Ready Structure",
                "description": "Responsive sections, polished styling and a complete homepage flow ready for refinement.",
                "items": ["Responsive design", "Modern cards", "Premium footer"],
            },
        ],
        "features": [
            {"title": "Premium Design", "description": "Luxury spacing, cinematic contrast and high-end visual rhythm."},
            {"title": "Fast Experience", "description": "Clean HTML and CSS designed to render quickly in the preview."},
            {"title": "Brand Focused", "description": f"Copy and sections stay focused on {subject} without drifting."},
        ],
        "pricing": [],
        "footer": {
            "headline": f"Ready to build your {subject} experience?",
            "cta": "Start Now",
        },
    }


def generate_project_state_with_groq(prompt: str, current_state=None):
    api_key = os.environ.get("GROQ_API_KEY", "").strip()
    model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile").strip()

    fallback = _default_state(prompt)

    if not api_key:
        fallback["mediaAssets"] = fetch_pexels_media(prompt)
        return fallback

    system = """
You are Galio AI Studio's universal website agent.
Generate a structured WebsiteProjectState JSON object, not raw HTML.

Return ONLY valid JSON. No markdown. No explanations.

Schema:
{
  "brandName": string,
  "tagline": string,
  "industry": string,
  "style": string,
  "primaryColor": string,
  "secondaryColor": string,
  "visualSystem": {
    "backgroundType": "gradient" | "animated" | "video" | "image",
    "backgroundPrompt": string,
    "motion": string,
    "details": string[]
  },
  "hero": {
    "eyebrow": string,
    "headline": string,
    "subheadline": string,
    "primaryCta": string,
    "secondaryCta": string
  },
  "sections": [
    {"title": string, "description": string, "items": string[]}
  ],
  "features": [
    {"title": string, "description": string}
  ],
  "pricing": [
    {"name": string, "price": string, "description": string, "features": string[]}
  ],
  "footer": {
    "headline": string,
    "cta": string
  }
}

Rules:
- Stay strictly on the user's requested subject.
- Make it premium agency-quality.
- Prefer dark cinematic style unless user requests light.
- For luxury/tech products use strong product/feature sections.
- If user writes Bulgarian, output Bulgarian website copy.
- If user writes English, output English website copy.
- Do not include debug text, placeholders, Pexels notes, or implementation notes.
"""

    user = {
        "prompt": prompt,
        "currentState": current_state or {},
    }

    try:
        r = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": json.dumps(user, ensure_ascii=False)},
                ],
                "temperature": 0.72,
                "max_tokens": 5000,
            },
            timeout=90,
        )
        if r.status_code >= 400:
            return fallback

        content = r.json()["choices"][0]["message"]["content"].strip()
        content = re.sub(r"^```(?:json)?", "", content).strip()
        content = re.sub(r"```$", "", content).strip()
        start = content.find("{")
        end = content.rfind("}")
        if start >= 0 and end > start:
            content = content[start:end + 1]
        data = json.loads(content)
        if not isinstance(data, dict):
            return fallback

        merged = {**fallback, **data}
        merged["mediaAssets"] = fetch_pexels_media(prompt)
        return merged
    except Exception:
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
    headline = _txt(hero.get("headline"), f"Premium {brand}")
    subheadline = _txt(hero.get("subheadline"), tagline)
    primary_cta = _txt(hero.get("primaryCta"), "Get Started")
    secondary_cta = _txt(hero.get("secondaryCta"), "Explore")

    def esc(x):
        return html.escape(_txt(x), quote=True)

    feature_cards = ""
    for item in (features[:6] or [
        {"title": "Premium Strategy", "description": "A polished structure built for trust and conversion."},
        {"title": "Cinematic Visuals", "description": "Dark, modern, memorable presentation with strong hierarchy."},
        {"title": "Responsive Flow", "description": "Sections that feel clean on desktop and mobile."},
    ]):
        feature_cards += f"""
        <article class="g-feature-card">
          <div class="g-feature-icon"></div>
          <h3>{esc(item.get("title"))}</h3>
          <p>{esc(item.get("description"))}</p>
        </article>
        """

    section_blocks = ""
    for idx, sec in enumerate(sections[:4]):
        items = _arr(sec.get("items"), [])
        chips = "".join(f"<span>{esc(x)}</span>" for x in items[:5])
        section_blocks += f"""
        <article class="g-section-card {'g-section-card-large' if idx == 0 else ''}">
          <div class="g-section-number">0{idx + 1}</div>
          <h3>{esc(sec.get("title"))}</h3>
          <p>{esc(sec.get("description"))}</p>
          <div class="g-chip-row">{chips}</div>
        </article>
        """

    pricing_blocks = ""
    for plan in pricing[:3]:
        feats = "".join(f"<li>{esc(x)}</li>" for x in _arr(plan.get("features"), [])[:5])
        pricing_blocks += f"""
        <article class="g-price-card">
          <p class="g-plan">{esc(plan.get("name"))}</p>
          <h3>{esc(plan.get("price"))}</h3>
          <p>{esc(plan.get("description"))}</p>
          <ul>{feats}</ul>
        </article>
        """

    pricing_html = f"""
    <section class="g-pricing">
      <div class="g-section-head">
        <p>Offers</p>
        <h2>Choose the right experience</h2>
      </div>
      <div class="g-pricing-grid">{pricing_blocks}</div>
    </section>
    """ if pricing_blocks else ""

    html_out = f"""
<div class="g-site">
  <nav class="g-nav">
    <div class="g-logo"><span></span>{esc(brand)}</div>
    <div class="g-nav-links">
      <a>Experience</a>
      <a>Features</a>
      <a>Work</a>
      <a>Contact</a>
    </div>
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
      <div class="g-stats">
        <div><strong>Premium</strong><span>Visual system</span></div>
        <div><strong>Fast</strong><span>Launch flow</span></div>
        <div><strong>100%</strong><span>Responsive</span></div>
      </div>
    </div>
    <div class="g-hero-visual">
      <div class="g-phone">
        <div class="g-phone-top"></div>
        <div class="g-screen-card">
          <span>{esc(industry)}</span>
          <strong>{esc(brand)}</strong>
          <p>{esc(tagline)}</p>
        </div>
        <div class="g-product-row">
          <div></div><div></div><div></div>
        </div>
      </div>
      <div class="g-orb g-orb-a"></div>
      <div class="g-orb g-orb-b"></div>
    </div>
  </section>

  <section class="g-features">
    {feature_cards}
  </section>

  <section class="g-sections">
    <div class="g-section-head">
      <p>Experience Architecture</p>
      <h2>Designed like a premium product launch</h2>
    </div>
    <div class="g-section-grid">{section_blocks}</div>
  </section>

  {pricing_html}

  <section class="g-cta">
    <p>{esc(industry)}</p>
    <h2>{esc(footer.get("headline") or f'Ready to launch {brand}?')}</h2>
    <button>{esc(footer.get("cta") or primary_cta)}</button>
  </section>

  <footer class="g-footer">
    <span>{esc(brand)}</span>
    <span>{esc(tagline)}</span>
  </footer>
</div>
"""

    css_out = f"""
:root {{
  --g-primary: {primary};
  --g-secondary: {secondary};
  --g-bg: #06070b;
  --g-bg2: #0d1018;
  --g-text: #f8fafc;
  --g-muted: rgba(248,250,252,.68);
  --g-border: rgba(255,255,255,.12);
  --g-card: rgba(255,255,255,.055);
}}

* {{ box-sizing: border-box; }}

body {{
  margin: 0;
  background: var(--g-bg);
}}

.g-site {{
  min-height: 100vh;
  color: var(--g-text);
  background:
    radial-gradient(circle at 18% 10%, color-mix(in srgb, var(--g-primary) 28%, transparent), transparent 32%),
    radial-gradient(circle at 85% 15%, rgba(96,165,250,.18), transparent 30%),
    linear-gradient(135deg, #050509 0%, #0b0f18 52%, #050509 100%);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  overflow: hidden;
}}

.g-nav {{
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 22px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}}

.g-logo {{
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 900;
  letter-spacing: -.04em;
}}

.g-logo span {{
  width: 18px;
  height: 18px;
  border-radius: 7px;
  background: var(--g-primary);
  box-shadow: 0 0 28px color-mix(in srgb, var(--g-primary) 65%, transparent);
}}

.g-nav-links {{
  display: flex;
  gap: 24px;
  color: var(--g-muted);
  font-size: 14px;
}}

.g-nav-button,
.g-actions button,
.g-cta button {{
  border: 0;
  border-radius: 999px;
  background: var(--g-primary);
  color: #04110b;
  padding: 13px 19px;
  font-weight: 900;
  box-shadow: 0 18px 55px color-mix(in srgb, var(--g-primary) 28%, transparent);
}}

.g-hero {{
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  min-height: 720px;
  display: grid;
  grid-template-columns: 1.05fr .95fr;
  gap: 54px;
  align-items: center;
  padding: 54px 0 78px;
}}

.g-eyebrow {{
  width: fit-content;
  border: 1px solid var(--g-border);
  background: rgba(255,255,255,.06);
  color: var(--g-primary);
  border-radius: 999px;
  padding: 9px 14px;
  margin-bottom: 22px;
  font-size: 13px;
  font-weight: 800;
}}

.g-hero h1 {{
  max-width: 760px;
  margin: 0;
  font-size: clamp(48px, 7.6vw, 104px);
  line-height: .88;
  letter-spacing: -.085em;
}}

.g-hero p {{
  max-width: 680px;
  color: var(--g-muted);
  font-size: 19px;
  line-height: 1.72;
  margin: 26px 0 0;
}}

.g-actions {{
  display: flex;
  gap: 14px;
  margin-top: 32px;
}}

.g-actions .g-secondary {{
  color: var(--g-text);
  background: rgba(255,255,255,.075);
  border: 1px solid var(--g-border);
  box-shadow: none;
}}

.g-stats {{
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 42px;
  max-width: 620px;
}}

.g-stats div {{
  border: 1px solid var(--g-border);
  background: rgba(255,255,255,.045);
  border-radius: 22px;
  padding: 18px;
}}

.g-stats strong {{
  display: block;
  font-size: 22px;
}}

.g-stats span {{
  display: block;
  color: var(--g-muted);
  font-size: 13px;
  margin-top: 4px;
}}

.g-hero-visual {{
  position: relative;
  min-height: 580px;
  display: grid;
  place-items: center;
}}

.g-phone {{
  position: relative;
  z-index: 2;
  width: min(390px, 88vw);
  min-height: 530px;
  border-radius: 46px;
  border: 1px solid rgba(255,255,255,.2);
  background:
    linear-gradient(180deg, rgba(255,255,255,.13), rgba(255,255,255,.035)),
    radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--g-primary) 26%, transparent), transparent 42%);
  box-shadow: 0 42px 120px rgba(0,0,0,.55);
  padding: 22px;
  backdrop-filter: blur(22px);
}}

.g-phone-top {{
  width: 92px;
  height: 8px;
  border-radius: 999px;
  margin: 0 auto 52px;
  background: rgba(255,255,255,.22);
}}

.g-screen-card {{
  border-radius: 32px;
  border: 1px solid var(--g-border);
  background: rgba(0,0,0,.34);
  padding: 26px;
}}

.g-screen-card span {{
  color: var(--g-primary);
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: .12em;
}}

.g-screen-card strong {{
  display: block;
  font-size: 38px;
  letter-spacing: -.06em;
  line-height: .95;
  margin-top: 18px;
}}

.g-screen-card p {{
  font-size: 14px;
  margin-top: 18px;
}}

.g-product-row {{
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 18px;
}}

.g-product-row div {{
  height: 118px;
  border-radius: 24px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--g-primary) 28%, transparent), rgba(255,255,255,.06)),
    rgba(255,255,255,.06);
  border: 1px solid var(--g-border);
}}

.g-orb {{
  position: absolute;
  border-radius: 999px;
  filter: blur(8px);
}}

.g-orb-a {{
  width: 230px;
  height: 230px;
  right: 14px;
  top: 48px;
  background: color-mix(in srgb, var(--g-primary) 24%, transparent);
}}

.g-orb-b {{
  width: 160px;
  height: 160px;
  left: 22px;
  bottom: 70px;
  background: rgba(96,165,250,.2);
}}

.g-features,
.g-pricing-grid {{
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  padding: 24px 0 80px;
}}

.g-feature-card,
.g-section-card,
.g-price-card {{
  border: 1px solid var(--g-border);
  background: var(--g-card);
  border-radius: 30px;
  padding: 28px;
  box-shadow: 0 24px 80px rgba(0,0,0,.18);
}}

.g-feature-icon {{
  width: 42px;
  height: 42px;
  border-radius: 16px;
  background: var(--g-primary);
  box-shadow: 0 0 38px color-mix(in srgb, var(--g-primary) 45%, transparent);
  margin-bottom: 20px;
}}

.g-feature-card h3,
.g-section-card h3,
.g-price-card h3 {{
  margin: 0;
  font-size: 24px;
  letter-spacing: -.04em;
}}

.g-feature-card p,
.g-section-card p,
.g-price-card p,
.g-price-card li {{
  color: var(--g-muted);
  line-height: 1.65;
}}

.g-sections,
.g-pricing {{
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 24px 0 80px;
}}

.g-section-head {{
  margin-bottom: 24px;
}}

.g-section-head p {{
  color: var(--g-primary);
  text-transform: uppercase;
  letter-spacing: .12em;
  font-size: 13px;
  font-weight: 900;
}}

.g-section-head h2,
.g-cta h2 {{
  max-width: 790px;
  margin: 0;
  font-size: clamp(34px, 5vw, 68px);
  line-height: .95;
  letter-spacing: -.07em;
}}

.g-section-grid {{
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}}

.g-section-card-large {{
  grid-row: span 2;
}}

.g-section-number {{
  color: var(--g-primary);
  font-weight: 900;
  margin-bottom: 28px;
}}

.g-chip-row {{
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 22px;
}}

.g-chip-row span {{
  border: 1px solid var(--g-border);
  border-radius: 999px;
  padding: 8px 11px;
  color: rgba(255,255,255,.78);
  background: rgba(255,255,255,.045);
  font-size: 13px;
}}

.g-plan {{
  color: var(--g-primary) !important;
  font-weight: 900;
}}

.g-price-card ul {{
  padding-left: 18px;
}}

.g-cta {{
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto 40px;
  border: 1px solid var(--g-border);
  border-radius: 38px;
  padding: 56px;
  background:
    radial-gradient(circle at 80% 20%, color-mix(in srgb, var(--g-primary) 22%, transparent), transparent 38%),
    rgba(255,255,255,.055);
}}

.g-cta p {{
  color: var(--g-primary);
  font-weight: 900;
}}

.g-cta button {{
  margin-top: 26px;
}}

.g-footer {{
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 32px 0 48px;
  display: flex;
  justify-content: space-between;
  color: var(--g-muted);
  border-top: 1px solid var(--g-border);
}}

@media (max-width: 900px) {{
  .g-nav-links {{ display: none; }}
  .g-hero {{ grid-template-columns: 1fr; min-height: auto; }}
  .g-features,
  .g-pricing-grid,
  .g-section-grid,
  .g-stats {{ grid-template-columns: 1fr; }}
  .g-hero h1 {{ font-size: 52px; }}
  .g-cta {{ padding: 32px; }}
}}
"""

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
