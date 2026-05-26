from __future__ import annotations

from typing import Any, Dict, List, Optional, Literal
from pydantic import BaseModel, Field, ConfigDict


class MediaImage(BaseModel):
    model_config = ConfigDict(extra="ignore")

    title: str = ""
    subtitle: str = ""
    tag: str = "Premium"
    imageUrl: str = ""
    source: str = ""
    photographer: str = ""
    photographerUrl: str = ""


class MediaAssets(BaseModel):
    model_config = ConfigDict(extra="ignore")

    heroVideoUrl: str = ""
    heroPosterUrl: str = ""
    heroImageUrl: str = ""
    backgroundVideoUrl: str = ""
    backgroundImageUrl: str = ""
    collectionImages: List[MediaImage] = Field(default_factory=list)
    source: str = ""
    query: str = ""


class VisualSystem(BaseModel):
    model_config = ConfigDict(extra="ignore")

    backgroundType: Literal["gradient", "animated", "video", "image"] = "video"
    backgroundPrompt: str = ""
    motion: str = "smooth premium motion"
    details: List[str] = Field(default_factory=list)


class HeroBlock(BaseModel):
    model_config = ConfigDict(extra="ignore")

    eyebrow: str = "Premium Experience"
    headline: str = ""
    subheadline: str = ""
    primaryCta: str = "Explore Collection"
    secondaryCta: str = "View Details"


class SectionItem(BaseModel):
    model_config = ConfigDict(extra="ignore")

    title: str = ""
    description: str = ""


class WebsiteSection(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = ""
    type: str = "section"
    title: str = ""
    subtitle: str = ""
    description: str = ""
    items: List[SectionItem] = Field(default_factory=list)


class CustomElement(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    type: Literal["text", "button", "image", "video", "card", "shape"] = "text"
    text: str = ""
    imageUrl: str = ""
    videoUrl: str = ""
    x: float = 80
    y: float = 80
    width: float = 240
    height: float = 80
    styles: Dict[str, Any] = Field(default_factory=dict)


class WebsiteProjectState(BaseModel):
    model_config = ConfigDict(extra="ignore")

    schemaVersion: str = "galio.schema.v1"
    brandName: str = ""
    tagline: str = ""
    industry: str = ""
    style: str = "dark premium cinematic, modern, responsive, conversion focused"
    primaryColor: str = "#8b5cf6"
    secondaryColor: str = "#f5c542"

    visualSystem: VisualSystem = Field(default_factory=VisualSystem)
    hero: HeroBlock = Field(default_factory=HeroBlock)
    sections: List[WebsiteSection] = Field(default_factory=list)
    features: List[SectionItem] = Field(default_factory=list)
    pricing: List[Dict[str, Any]] = Field(default_factory=list)
    footer: Dict[str, Any] = Field(default_factory=dict)
    mediaAssets: MediaAssets = Field(default_factory=MediaAssets)

    customElements: List[CustomElement] = Field(default_factory=list)
    overrides: Dict[str, Any] = Field(default_factory=dict)


def _clean_text(value: Any, fallback: str = "") -> str:
    text = str(value or "").strip()
    text = " ".join(text.split())
    return text or fallback


def _title_case_subject(subject: str) -> str:
    subject = _clean_text(subject, "Premium Brand")
    return " ".join(part[:1].upper() + part[1:] for part in subject.split())


def normalize_project_state(raw: Optional[Dict[str, Any]], prompt: str = "") -> Dict[str, Any]:
    """
    Schema-first safety layer.
    Takes any LLM/fallback output and returns stable projectState for React renderer.
    """
    raw = raw if isinstance(raw, dict) else {}

    subject = _clean_text(
        raw.get("industry")
        or raw.get("brandName")
        or raw.get("tagline")
        or prompt,
        "premium product"
    )

    brand = _clean_text(raw.get("brandName"), _title_case_subject(subject))
    industry = _clean_text(raw.get("industry"), subject.lower())

    hero_raw = raw.get("hero") if isinstance(raw.get("hero"), dict) else {}
    hero_headline = _clean_text(hero_raw.get("headline"), f"Premium {brand}")
    hero_subheadline = _clean_text(
        hero_raw.get("subheadline"),
        f"Premium digital experience for {industry} with real media, clean structure and conversion-focused design."
    )

    # Hard clamp: prevent giant broken AI headlines.
    if len(hero_headline) > 86:
        hero_headline = f"Premium {brand}"
    if len(hero_subheadline) > 180:
        hero_subheadline = f"Premium digital experience for {industry}."

    sections = raw.get("sections")
    if not isinstance(sections, list) or not sections:
        sections = [
            {
                "id": "experience",
                "type": "feature-grid",
                "title": "Designed like a premium product launch",
                "subtitle": "Experience Architecture",
                "description": f"A polished, responsive website for {industry}.",
                "items": [
                    {"title": "Signature Experience", "description": "Clear visual hierarchy and premium positioning."},
                    {"title": "Built To Convert", "description": "Every section guides visitors from first impression to action."},
                    {"title": "Launch Ready Structure", "description": "Responsive sections, polished styling and clean homepage flow."},
                ],
            },
            {
                "id": "media",
                "type": "media-gallery",
                "title": "Real media matched to the project subject",
                "subtitle": "Visual Direction",
                "description": "Images and video are selected from real media sources when API keys are configured.",
                "items": [],
            },
        ]

    safe = {
        **raw,
        "schemaVersion": "galio.schema.v1",
        "brandName": brand,
        "industry": industry,
        "tagline": _clean_text(raw.get("tagline"), f"Premium solutions for {industry}"),
        "style": _clean_text(raw.get("style"), "dark premium cinematic, modern, responsive, conversion focused"),
        "primaryColor": _clean_text(raw.get("primaryColor"), "#8b5cf6"),
        "secondaryColor": _clean_text(raw.get("secondaryColor"), "#f5c542"),
        "hero": {
            **hero_raw,
            "eyebrow": _clean_text(hero_raw.get("eyebrow"), "Premium Experience"),
            "headline": hero_headline,
            "subheadline": hero_subheadline,
            "primaryCta": _clean_text(hero_raw.get("primaryCta"), "Explore Collection"),
            "secondaryCta": _clean_text(hero_raw.get("secondaryCta"), "View Details"),
        },
        "visualSystem": raw.get("visualSystem") if isinstance(raw.get("visualSystem"), dict) else {},
        "sections": sections,
        "features": raw.get("features") if isinstance(raw.get("features"), list) else [],
        "pricing": raw.get("pricing") if isinstance(raw.get("pricing"), list) else [],
        "footer": raw.get("footer") if isinstance(raw.get("footer"), dict) else {},
        "mediaAssets": raw.get("mediaAssets") if isinstance(raw.get("mediaAssets"), dict) else {},
        "customElements": raw.get("customElements") if isinstance(raw.get("customElements"), list) else [],
        "overrides": raw.get("overrides") if isinstance(raw.get("overrides"), dict) else {},
    }

    parsed = WebsiteProjectState.model_validate(safe)
    return parsed.model_dump()
