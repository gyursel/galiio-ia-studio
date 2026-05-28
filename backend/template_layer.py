"""
Universal template layer for Galio IA Studio 2.

Important:
- Templates are layout presets, not hardcoded business niches.
- Subject comes from universal_subject.py / latest prompt.
- This layer helps the agent pick a professional one-page structure.
- Never lock the generated website to a category because of templateId.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Any, Dict, List
import re


@dataclass(frozen=True)
class TemplatePreset:
    id: str
    name: str
    description: str
    best_for: List[str]
    sections: List[str]
    visual_style: str


TEMPLATE_PRESETS: List[TemplatePreset] = [
    TemplatePreset(
        id="premium-landing",
        name="Premium Landing Page",
        description="Universal premium landing page for almost any subject.",
        best_for=["general", "premium", "brand", "service", "product"],
        sections=["hero", "trust", "features", "showcase", "benefits", "cta"],
        visual_style="premium, cinematic, polished, conversion-focused",
    ),
    TemplatePreset(
        id="saas-product",
        name="SaaS / Digital Product",
        description="Modern product page for software, platforms, AI tools, dashboards and apps.",
        best_for=["software", "ai", "platform", "dashboard", "tool", "app"],
        sections=["hero", "product-preview", "features", "workflow", "pricing", "cta"],
        visual_style="clean, modern, glassy, tech-focused",
    ),
    TemplatePreset(
        id="local-business",
        name="Local Business",
        description="Professional one-page site for services, shops, clinics and local companies.",
        best_for=["business", "service", "clinic", "shop", "local", "company"],
        sections=["hero", "services", "about", "gallery", "testimonials", "contact"],
        visual_style="trustworthy, clear, friendly, practical",
    ),
    TemplatePreset(
        id="hospitality-experience",
        name="Hospitality / Experience",
        description="Atmospheric layout for hotels, restaurants, travel, venues and premium experiences.",
        best_for=["hotel", "restaurant", "travel", "venue", "experience", "luxury"],
        sections=["hero", "experience", "rooms-or-offers", "gallery", "reviews", "booking"],
        visual_style="cinematic, warm, immersive, editorial",
    ),
    TemplatePreset(
        id="portfolio-personal",
        name="Portfolio / Personal Brand",
        description="Elegant personal or creative portfolio for experts, creators and professionals.",
        best_for=["portfolio", "creator", "designer", "developer", "artist", "personal"],
        sections=["hero", "about", "work", "skills", "proof", "contact"],
        visual_style="minimal, elegant, personal, creative",
    ),
    TemplatePreset(
        id="professional-service",
        name="Professional Service",
        description="Trust-heavy layout for lawyers, consultants, finance, agencies and expert services.",
        best_for=["lawyer", "consultant", "finance", "advisor", "agency", "expert"],
        sections=["hero", "trust", "services", "process", "case-studies", "contact"],
        visual_style="serious, premium, credible, structured",
    ),
    TemplatePreset(
        id="ecommerce-product",
        name="Ecommerce / Product",
        description="Product-focused page for physical products, collections and premium goods.",
        best_for=["product", "shop", "ecommerce", "fashion", "device", "collection"],
        sections=["hero", "product-grid", "benefits", "details", "social-proof", "cta"],
        visual_style="commercial, sharp, visual, high-converting",
    ),
    TemplatePreset(
        id="real-estate",
        name="Real Estate / Property",
        description="Visual layout for properties, spaces, rentals, architecture and places.",
        best_for=["real estate", "property", "apartment", "villa", "office", "architecture"],
        sections=["hero", "property-highlights", "gallery", "location", "details", "contact"],
        visual_style="spacious, elegant, image-led, premium",
    ),
    TemplatePreset(
        id="event-conference",
        name="Event / Conference",
        description="One-page layout for events, conferences, launches and scheduled experiences.",
        best_for=["event", "conference", "festival", "launch", "workshop", "meetup"],
        sections=["hero", "agenda", "speakers", "venue", "tickets", "cta"],
        visual_style="energetic, bold, organized, time-focused",
    ),
    TemplatePreset(
        id="mobile-app",
        name="Mobile App",
        description="App landing page with screenshots, benefits, features and download CTA.",
        best_for=["mobile app", "ios", "android", "startup", "social app", "utility app"],
        sections=["hero", "app-preview", "features", "how-it-works", "reviews", "download"],
        visual_style="modern, playful, clear, app-store-ready",
    ),
    TemplatePreset(
        id="agency-studio",
        name="Agency / Studio",
        description="Premium studio layout for creative agencies, design teams and production companies.",
        best_for=["agency", "studio", "creative", "marketing", "branding", "production"],
        sections=["hero", "services", "selected-work", "process", "clients", "contact"],
        visual_style="bold, creative, premium, portfolio-led",
    ),
    TemplatePreset(
        id="blog-magazine",
        name="Blog / Magazine",
        description="Editorial one-page structure for content brands, publications and knowledge hubs.",
        best_for=["blog", "magazine", "news", "content", "education", "publication"],
        sections=["hero", "featured", "categories", "latest", "newsletter", "cta"],
        visual_style="editorial, clean, readable, content-first",
    ),
]


def list_template_presets() -> List[Dict[str, Any]]:
    thumbnails = [
        "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=900",
        "https://images.unsplash.com/photo-1551434678-e076c223a692?w=900",
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900",
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900",
        "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=900",
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=900",
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900",
        "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=900",
        "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=900",
        "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=900",
        "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=900",
    ]

    items = []
    for index, preset in enumerate(TEMPLATE_PRESETS):
        item = asdict(preset)
        item["thumbnail"] = thumbnails[index % len(thumbnails)]
        item["prompt"] = (
            f"Create a premium one-page website for {preset.name} Demo. "
            f"Use the template id {preset.id}. "
            f"Use the {preset.name} template only as page structure. "
            "Keep it universal and premium, not locked to a fixed industry."
        )
        items.append(item)
    return items


def choose_template(prompt: str = "", subject: str = "", requested_template_id: str | None = None) -> Dict[str, Any]:
    text = f"{prompt} {subject}".lower().strip()

    explicit_template_id = ""
    match = re.search(r"template\s*id\s*[:=]?\s*([a-z0-9-]+)", text, re.I)
    if match:
        explicit_template_id = match.group(1).strip()

    selected_id = requested_template_id or explicit_template_id
    if selected_id:
        for preset in TEMPLATE_PRESETS:
            if preset.id == selected_id:
                return asdict(preset)

    best = TEMPLATE_PRESETS[0]
    best_score = 0

    for preset in TEMPLATE_PRESETS:
        score = 0
        for keyword in preset.best_for:
            if keyword.lower() in text:
                score += 3
        for part in preset.id.split("-"):
            if part and part in text:
                score += 1
        if score > best_score:
            best = preset
            best_score = score

    return asdict(best)


def build_template_context(prompt: str = "", subject: str = "", requested_template_id: str | None = None) -> Dict[str, Any]:
    selected = choose_template(prompt=prompt, subject=subject, requested_template_id=requested_template_id)

    return {
        "templateId": selected["id"],
        "templateName": selected["name"],
        "templateDescription": selected["description"],
        "templateSections": selected["sections"],
        "templateVisualStyle": selected["visual_style"],
        "availableTemplates": list_template_presets(),
        "rule": "Template controls only layout structure. Subject, text, media and brand must stay based on the latest user prompt and universalSubject.",
    }
