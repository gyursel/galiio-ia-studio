import json
import os
import re
import requests


class UserMessage:
    def __init__(self, text=None, content=None, **kwargs):
        self.text = text or content or ""
        self.content = self.text


def _safe_json(text: str) -> str:
    text = (text or "").strip()
    text = re.sub(r"^```(?:json)?", "", text).strip()
    text = re.sub(r"```$", "", text).strip()

    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        return text[start:end + 1]

    return json.dumps({
        "html": "<section class='g-page'><h1>Generation returned invalid JSON</h1><p>Please try again.</p></section>",
        "css": ".g-page{min-height:100vh;background:#07070a;color:white;font-family:Inter,system-ui;padding:80px}",
        "js": "",
        "summary": text[:500] or "Invalid AI output."
    })


class LlmChat:
    def __init__(self, *args, **kwargs):
        self.args = args
        self.kwargs = kwargs
        self.provider = None
        self.model = None
        self.system_message = kwargs.get("system_message", "")

    def with_model(self, provider=None, model=None, *args, **kwargs):
        self.provider = provider
        self.model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
        return self

    def with_system_message(self, message=None, *args, **kwargs):
        if message:
            self.system_message = message
        return self

    def with_temperature(self, *args, **kwargs):
        return self

    def with_max_tokens(self, *args, **kwargs):
        return self

    async def send_message(self, message):
        prompt = getattr(message, "text", None) or getattr(message, "content", "") or str(message)
        api_key = os.environ.get("GROQ_API_KEY", "").strip()

        if not api_key:
            return json.dumps({
                "html": "<section class='g-page'><h1>GROQ_API_KEY missing</h1><p>Add GROQ_API_KEY to backend/.env.</p></section>",
                "css": ".g-page{min-height:100vh;background:#07070a;color:white;font-family:Inter,system-ui;padding:80px}",
                "js": "",
                "summary": "GROQ_API_KEY missing."
            })

        system = """
You are the premium website generation engine inside Galio AI Studio.

Your job:
Generate a complete, beautiful, modern, premium landing page from the user's request.

CRITICAL OUTPUT RULES:
Return ONLY valid JSON.
No markdown.
No explanation.
No comments outside JSON.
Do NOT wrap in ```json.
Do NOT return <html>, <head>, <body>, <!DOCTYPE>, external CDN scripts, Tailwind CDN, Google Fonts links, or meta tags.
Return body HTML only in "html".
Return complete vanilla CSS only in "css".
Return optional vanilla JS only in "js".

JSON schema:
{
  "html": "...",
  "css": "...",
  "js": "...",
  "summary": "..."
}

QUALITY BAR:
The page must look like a premium $10k+ agency design, not a basic template.
Use dark premium layout unless the user clearly asks otherwise.
Use strong visual hierarchy, luxury spacing, glass cards, gradients, large typography, realistic sections, conversion buttons, product/service cards, feature grids, testimonials, stats, CTA, footer.
Use responsive CSS.
Use only class names prefixed with "g-".
Do not use generic browser styles.
Do not output plain white background unless user asks.
Do not make a tiny page.
Do not mix subjects. Follow the exact user request subject.
If the user asks in Bulgarian, write website copy in Bulgarian.
If the user asks in English, write website copy in English.

DESIGN STYLE:
- Premium SaaS / luxury brand feel
- Deep black / graphite backgrounds
- Electric green or subject-appropriate accent
- Big hero section with visual mockup/card
- Smooth gradients and soft shadows
- Modern rounded cards
- Professional navigation
- Strong CTA buttons
- Polished footer

TECH:
HTML must be renderable inside an existing preview container.
CSS must style all generated classes.
No external dependencies.
"""

        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.85,
                "max_tokens": 6000,
            },
            timeout=90,
        )

        if response.status_code >= 400:
            raise RuntimeError(f"Groq API error {response.status_code}: {response.text[:500]}")

        data = response.json()
        content = data["choices"][0]["message"]["content"]
        return _safe_json(content)

    async def chat(self, message):
        return await self.send_message(message)
