import os
import re
import requests


def _clean_query(prompt: str) -> str:
    text = (prompt or "").lower()

    # махаме служебни части от backend prompt-а
    text = re.sub(r"mode:\s*\w+", " ", text)
    text = re.sub(r"page_path:\s*/?", " ", text)
    text = re.sub(r"user request:\s*", " ", text)

    replacements = {
        "website": "",
        "site": "",
        "premium": "",
        "make": "",
        "create": "",
        "dark design": "",
        "video hero feel": "",
        "neon green accents": "",
        "сайт": "",
        "направи": "",
        "премиум": "",
        "тъмен": "",
        "дизайн": "",
    }

    for a, b in replacements.items():
        text = text.replace(a, b)

    text = re.sub(r"[^a-zа-я0-9\s-]", " ", text, flags=re.I)
    text = re.sub(r"\s+", " ", text).strip()

    if not text:
        return "luxury technology product"

    return text[:90]


def fetch_pexels_media(prompt: str):
    api_key = os.environ.get("PEXELS_API_KEY", "").strip()
    if not api_key:
        return {
            "heroVideoUrl": "",
            "heroPosterUrl": "",
            "heroImageUrl": "",
            "backgroundVideoUrl": "",
            "backgroundImageUrl": "",
            "collectionImages": [],
        }

    query = _clean_query(prompt)
    headers = {"Authorization": api_key}

    media = {
        "heroVideoUrl": "",
        "heroPosterUrl": "",
        "heroImageUrl": "",
        "backgroundVideoUrl": "",
        "backgroundImageUrl": "",
        "collectionImages": [],
    }

    try:
        vr = requests.get(
            "https://api.pexels.com/videos/search",
            headers=headers,
            params={"query": query, "per_page": 6, "orientation": "landscape"},
            timeout=20,
        )

        if vr.status_code == 200:
            videos = vr.json().get("videos", []) or []
            for video in videos:
                files = video.get("video_files", []) or []
                files = sorted(
                    files,
                    key=lambda x: abs((x.get("width") or 1280) - 1280),
                )
                best = None
                for f in files:
                    if f.get("link") and (f.get("width") or 0) >= 960:
                        best = f
                        break
                if not best and files:
                    best = files[0]

                if best and best.get("link"):
                    media["heroVideoUrl"] = best["link"]
                    media["backgroundVideoUrl"] = best["link"]
                    media["heroPosterUrl"] = video.get("image", "") or ""
                    break
    except Exception:
        pass

    try:
        pr = requests.get(
            "https://api.pexels.com/v1/search",
            headers=headers,
            params={"query": query, "per_page": 8, "orientation": "landscape"},
            timeout=20,
        )

        if pr.status_code == 200:
            photos = pr.json().get("photos", []) or []
            if photos:
                first = photos[0].get("src", {}) or {}
                media["heroImageUrl"] = first.get("large2x") or first.get("large") or first.get("landscape") or ""
                media["backgroundImageUrl"] = media["heroImageUrl"]

            collection = []
            for idx, photo in enumerate(photos[:6]):
                src = photo.get("src", {}) or {}
                url = src.get("large") or src.get("landscape") or src.get("medium") or ""
                if not url:
                    continue
                collection.append({
                    "title": f"Visual {idx + 1}",
                    "subtitle": query.title(),
                    "tag": "Premium",
                    "imageUrl": url,
                })

            media["collectionImages"] = collection
    except Exception:
        pass

    return media
