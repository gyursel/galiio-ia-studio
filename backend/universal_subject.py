"""
Universal Subject Schema/Contract for Galio IA Studio 2.

This module is contract-only.

No extraction.
No parsing.
No fallback.
No regex.
No guessing.
No categories.
No examples.
No projectState mutation.

The AI agent must import this contract and fill the JSON from the latest user prompt.
"""

from __future__ import annotations

from typing import Any, Dict, List


SOURCE_OF_TRUTH: str = "latest_prompt"


UNIVERSAL_SUBJECT_RULES: List[str] = [
    "Latest user prompt is the only source of truth.",
    "Previous project state is context only, never authority.",
    "Never keep an old subject when the latest prompt requests a new subject.",
    "Do not use category lists.",
    "Do not use topic examples.",
    "Do not guess from predefined industries.",
    "Extract the exact main subject requested by the latest prompt.",
    "Keep the subject in the natural language of the latest prompt.",
    "All generated copy, media, layout, cards, sections, and files must follow generation.subject.",
    "Return only valid JSON matching UNIVERSAL_SUBJECT_OUTPUT_SCHEMA.",
]


GENERATION_FIELD_SCHEMA: Dict[str, Any] = {
    "sourceOfTruth": {
        "type": "string",
        "required": True,
        "value": "latest_prompt",
    },
    "mustFollowLatestPrompt": {
        "type": "boolean",
        "required": True,
        "value": True,
    },
    "subject": {
        "type": "string",
        "required": True,
        "description": "Exact normalized subject for generation.",
    },
    "mainSubject": {
        "type": "string",
        "required": True,
        "description": "Same core subject for project state.",
    },
    "brandName": {
        "type": "string",
        "required": True,
        "description": "Brand/title seed based on the latest subject, not old project state.",
    },
    "headlineSubject": {
        "type": "string",
        "required": True,
        "description": "Subject used in hero/headline copy.",
    },
    "mediaSubject": {
        "type": "string",
        "required": True,
        "description": "Subject used for media search.",
    },
    "confidence": {
        "type": "number",
        "required": True,
        "min": 0,
        "max": 1,
    },
}


MEDIA_FIELD_SCHEMA: Dict[str, Any] = {
    "subject": {
        "type": "string",
        "required": True,
        "description": "Media subject derived from generation.mediaSubject.",
    },
    "queries": {
        "type": "array[string]",
        "required": True,
        "description": "Search queries directly aligned with the extracted subject.",
    },
    "negativeHints": {
        "type": "array[string]",
        "required": True,
        "description": "Universal hints that prevent media/copy drift away from the subject.",
    },
}


UNIVERSAL_SUBJECT_OUTPUT_SCHEMA: Dict[str, Any] = {
    "subject": {
        "type": "string",
        "required": True,
        "description": "Exact main subject from latest prompt.",
    },
    "clean_prompt": {
        "type": "string",
        "required": True,
        "description": "Latest prompt cleaned only from broad build instructions.",
    },
    "confidence": {
        "type": "number",
        "required": True,
        "min": 0,
        "max": 1,
    },
    "reason": {
        "type": "string",
        "required": True,
        "description": "Short reason why this subject was selected.",
    },
    "generation": GENERATION_FIELD_SCHEMA,
    "media": MEDIA_FIELD_SCHEMA,
}


UNIVERSAL_SUBJECT_AGENT_CONTRACT: Dict[str, Any] = {
    "role": "universal_subject_extractor",
    "sourceOfTruth": SOURCE_OF_TRUTH,
    "previousStateIsContextOnly": True,
    "rules": UNIVERSAL_SUBJECT_RULES,
    "requiredOutputSchema": UNIVERSAL_SUBJECT_OUTPUT_SCHEMA,
}


EMPTY_GENERATION_FIELD: Dict[str, Any] = {
    "sourceOfTruth": SOURCE_OF_TRUTH,
    "mustFollowLatestPrompt": True,
    "subject": "",
    "mainSubject": "",
    "brandName": "",
    "headlineSubject": "",
    "mediaSubject": "",
    "confidence": 0.0,
}


EMPTY_MEDIA_FIELD: Dict[str, Any] = {
    "subject": "",
    "queries": [],
    "negativeHints": [],
}


EMPTY_UNIVERSAL_SUBJECT: Dict[str, Any] = {
    "subject": "",
    "clean_prompt": "",
    "confidence": 0.0,
    "reason": "",
    "generation": EMPTY_GENERATION_FIELD,
    "media": EMPTY_MEDIA_FIELD,
}


__all__ = [
    "SOURCE_OF_TRUTH",
    "UNIVERSAL_SUBJECT_RULES",
    "GENERATION_FIELD_SCHEMA",
    "MEDIA_FIELD_SCHEMA",
    "UNIVERSAL_SUBJECT_OUTPUT_SCHEMA",
    "UNIVERSAL_SUBJECT_AGENT_CONTRACT",
    "EMPTY_GENERATION_FIELD",
    "EMPTY_MEDIA_FIELD",
    "EMPTY_UNIVERSAL_SUBJECT",
]
