"""
Galio AI Studio - FastAPI Backend (v2)
Adds: multi-page sites, role-based team collaboration, mocked custom domains.
"""
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Cookie
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
try:
    from backend.schema_first_agent import make_schema_first_project_state, normalize_schema_first_project_state
except ImportError:
    from schema_first_agent import make_schema_first_project_state, normalize_schema_first_project_state
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import io
import json
import logging
import uuid
import zipfile
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timezone, timedelta
import httpx
try:
    from backend.template_layer import list_template_presets
except ImportError:
    from template_layer import list_template_presets

try:
    from backend.emergentintegrations.llm.chat import LlmChat, UserMessage
except ImportError:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
try:
    from backend.galio_premium_agent import generate_premium_site
except ImportError:
    from galio_premium_agent import generate_premium_site


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
PEXELS_API_KEY = os.environ.get('PEXELS_API_KEY', '')

app = FastAPI(title="Galio AI Studio API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("galio")

# ============================================================
# Models
# ============================================================
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Page(BaseModel):
    """A single page in a multi-page site/tree."""
    id: str = Field(default_factory=lambda: f"page_{uuid.uuid4().hex[:10]}")
    path: str = "/"             # URL path, "/" for home
    name: str = "Home"
    parentId: Optional[str] = None
    order: int = 0
    html: str = ""
    css: str = ""
    js: str = ""
    projectState: Optional[Dict[str, Any]] = None
    generatedFiles: Optional[List[Dict[str, Any]]] = None


class Member(BaseModel):
    """Project member with a role."""
    user_id: str
    email: str
    name: Optional[str] = ""
    picture: Optional[str] = ""
    role: str = "viewer"        # owner | editor | viewer
    added_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    project_id: str = Field(default_factory=lambda: f"prj_{uuid.uuid4().hex[:12]}")
    user_id: str                # owner user_id (kept for backwards compat)
    name: str
    description: str = ""
    # Legacy single-page fields (still kept as the active/home page mirror)
    html: str = ""
    css: str = ""
    js: str = ""
    pages: List[Page] = Field(default_factory=list)
    members: List[Member] = Field(default_factory=list)
    custom_domain: Optional[str] = None
    prompt: str = ""
    mode: str = "build"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ProjectCreate(BaseModel):
    name: str
    prompt: Optional[str] = ""


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    html: Optional[str] = None
    css: Optional[str] = None
    js: Optional[str] = None
    description: Optional[str] = None


class PageCreate(BaseModel):
    path: str
    name: str
    prompt: Optional[str] = ""
    parentId: Optional[str] = None
    order: Optional[int] = None


class PageUpdate(BaseModel):
    name: Optional[str] = None
    html: Optional[str] = None
    css: Optional[str] = None
    js: Optional[str] = None
    projectState: Optional[Dict[str, Any]] = None
    generatedFiles: Optional[List[Dict[str, Any]]] = None
    generatedFiles: Optional[List[Dict[str, Any]]] = None


class InviteRequest(BaseModel):
    email: EmailStr
    role: str = "editor"        # editor | viewer


class MemberRoleUpdate(BaseModel):
    role: str                    # editor | viewer (cannot be owner)


class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    message_id: str = Field(default_factory=lambda: f"msg_{uuid.uuid4().hex[:12]}")
    project_id: str
    user_id: str
    role: str
    content: str
    mode: str = "build"
    page_path: str = "/"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class GenerateRequest(BaseModel):
    project_id: str
    prompt: str
    mode: str = "build"
    page_path: str = "/"
    current_html: Optional[str] = ""
    current_css: Optional[str] = ""
    current_js: Optional[str] = ""


class ProjectVersion(BaseModel):
    model_config = ConfigDict(extra="ignore")
    version_id: str = Field(default_factory=lambda: f"v_{uuid.uuid4().hex[:10]}")
    project_id: str
    user_id: str
    page_path: str = "/"
    html: str
    css: str
    js: str
    note: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DomainConnectRequest(BaseModel):
    domain: str


# ============================================================
# Helpers
# ============================================================
async def get_current_user(
    request: Request,
    session_token: Optional[str] = Cookie(default=None),
) -> User:
    if os.environ.get("LOCAL_DEV_AUTH", "").lower() == "true":
        user_doc = {
            "user_id": "local_dev_user",
            "email": "local@galio.dev",
            "name": "Local Galio Dev",
            "picture": "",
            "created_at": datetime.now(timezone.utc),
        }
        await db.users.update_one(
            {"user_id": user_doc["user_id"]},
            {"$set": user_doc},
            upsert=True,
        )
        return User(**user_doc)

    token = session_token
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session_doc = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")

    expires_at = session_doc.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at and expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")

    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    if isinstance(user_doc.get("created_at"), str):
        user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])
    return User(**user_doc)


ROLE_RANK = {"viewer": 0, "editor": 1, "owner": 2}


def _user_role(project: Dict[str, Any], user: User) -> Optional[str]:
    if project.get("user_id") == user.user_id:
        return "owner"
    for m in project.get("members", []) or []:
        if m.get("user_id") == user.user_id:
            return m.get("role", "viewer")
        if m.get("email") and m["email"].lower() == user.email.lower():
            return m.get("role", "viewer")
    return None


async def get_project_for_user(project_id: str, user: User, min_role: str = "viewer") -> Dict[str, Any]:
    doc = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")
    role = _user_role(doc, user)
    if role is None:
        raise HTTPException(status_code=404, detail="Project not found")
    if ROLE_RANK[role] < ROLE_RANK[min_role]:
        raise HTTPException(status_code=403, detail=f"Requires {min_role} role")
    doc["_role"] = role
    # Backfill pages if legacy doc
    if not doc.get("pages"):
        doc["pages"] = [{
            "id": "home",
            "path": "/",
            "name": "Home",
            "parentId": None,
            "order": 0,
            "html": doc.get("html", ""),
            "css": doc.get("css", ""),
            "js": doc.get("js", ""),
            "projectState": doc.get("projectState"),
        }]

    changed = False
    normalized_pages = []
    for idx, page in enumerate(doc.get("pages", []) or []):
        next_page = dict(page)
        if not next_page.get("id"):
            next_page["id"] = "home" if next_page.get("path") == "/" else f"page_{uuid.uuid4().hex[:10]}"
            changed = True
        if "parentId" not in next_page:
            next_page["parentId"] = None
            changed = True
        if "order" not in next_page:
            next_page["order"] = idx
            changed = True
        if "projectState" not in next_page:
            next_page["projectState"] = None
            changed = True
        normalized_pages.append(next_page)

    doc["pages"] = normalized_pages

    if changed:
        await db.projects.update_one(
            {"project_id": doc["project_id"]},
            {"$set": {"pages": normalized_pages, "updated_at": datetime.now(timezone.utc).isoformat()}},
        )

    return doc


def _find_page(project: Dict[str, Any], page_path: str) -> Optional[Dict[str, Any]]:
    for p in project.get("pages", []) or []:
        if p.get("path") == page_path:
            return p
    return None


def _projects_query_for_user(user: User) -> Dict[str, Any]:
    """Returns project query filtering by owner OR membership."""
    return {
        "$or": [
            {"user_id": user.user_id},
            {"members.user_id": user.user_id},
            {"members.email": user.email},
        ]
    }


# ============================================================
# Auth Endpoints
# ============================================================
@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")

    async with httpx.AsyncClient(timeout=15) as http:
        r = await http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
        )
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Emergent session")
    data = r.json()

    email = data["email"]
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": data.get("name", existing.get("name")),
                       "picture": data.get("picture", existing.get("picture"))}},
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": data.get("name", ""),
            "picture": data.get("picture", ""),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        # Reconcile any pending email-based invites for this email
        await db.projects.update_many(
            {"members.email": email},
            {"$set": {"members.$[m].user_id": user_id,
                       "members.$[m].name": data.get("name", ""),
                       "members.$[m].picture": data.get("picture", "")}},
            array_filters=[{"m.email": email}],
        )

    session_token = data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc),
    })

    response.set_cookie(
        key="session_token", value=session_token,
        httponly=True, secure=True, samesite="none",
        path="/", max_age=7 * 24 * 60 * 60,
    )
    return {
        "user_id": user_id,
        "email": email,
        "name": data.get("name", ""),
        "picture": data.get("picture", ""),
    }


@api_router.get("/auth/me")
async def auth_me(user: User = Depends(get_current_user)):
    return user.model_dump()


@api_router.post("/auth/logout")
async def logout(response: Response, request: Request, session_token: Optional[str] = Cookie(default=None)):
    token = session_token
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/", samesite="none", secure=True)
    return {"ok": True}


# ============================================================
# Projects
# ============================================================
@api_router.get("/projects")
async def list_projects(user: User = Depends(get_current_user)):
    docs = await db.projects.find(_projects_query_for_user(user), {"_id": 0}).sort("updated_at", -1).to_list(500)
    for d in docs:
        for k in ("created_at", "updated_at"):
            if isinstance(d.get(k), str):
                d[k] = datetime.fromisoformat(d[k])
        d["role"] = _user_role(d, user)
    return docs


@api_router.post("/projects")
async def create_project(payload: ProjectCreate, user: User = Depends(get_current_user)):
    project = Project(
        user_id=user.user_id,
        name=payload.name,
        prompt=payload.prompt or "",
        pages=[Page(path="/", name="Home")],
        members=[Member(user_id=user.user_id, email=user.email, name=user.name,
                         picture=user.picture or "", role="owner")],
    )
    doc = project.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    for m in doc["members"]:
        if isinstance(m.get("added_at"), datetime):
            m["added_at"] = m["added_at"].isoformat()
    await db.projects.insert_one(doc)
    response = project.model_dump()
    response["role"] = "owner"
    return response


@api_router.get("/projects/{project_id}")
async def get_project(project_id: str, user: User = Depends(get_current_user)):
    doc = await get_project_for_user(project_id, user, "viewer")
    doc["role"] = _user_role(doc, user)
    return doc


@api_router.patch("/projects/{project_id}")
async def update_project(project_id: str, payload: ProjectUpdate, user: User = Depends(get_current_user)):
    project = await get_project_for_user(project_id, user, "editor")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No updates provided")

    # When html/css/js are sent, also mirror into the home page
    page_updates: Dict[str, str] = {}
    for k in ("html", "css", "js"):
        if k in updates:
            page_updates[k] = updates[k]

    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.projects.update_one({"project_id": project_id}, {"$set": updates})

    if page_updates:
        pages = project.get("pages", []) or []
        if not pages:
            pages = [{"path": "/", "name": "Home", "html": "", "css": "", "js": ""}]
        # Update home page
        for p in pages:
            if p["path"] == "/":
                p.update(page_updates)
                break
        await db.projects.update_one({"project_id": project_id}, {"$set": {"pages": pages}})

    doc = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    return doc


@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, user: User = Depends(get_current_user)):
    project = await get_project_for_user(project_id, user, "owner")
    await db.projects.delete_one({"project_id": project["project_id"]})
    await db.chat_messages.delete_many({"project_id": project_id})
    await db.project_versions.delete_many({"project_id": project_id})
    return {"ok": True}


# ============================================================
# Pages
# ============================================================
@api_router.get("/projects/{project_id}/pages")
async def list_pages(project_id: str, user: User = Depends(get_current_user)):
    project = await get_project_for_user(project_id, user, "viewer")
    return project.get("pages", [])


@api_router.post("/projects/{project_id}/pages")
async def create_page(project_id: str, payload: PageCreate, user: User = Depends(get_current_user)):
    project = await get_project_for_user(project_id, user, "editor")
    path = payload.path if payload.path.startswith("/") else f"/{payload.path}"
    pages = project.get("pages", []) or []
    if any(p["path"] == path for p in pages):
        raise HTTPException(status_code=400, detail="Page path already exists")
    page_id = f"page_{uuid.uuid4().hex[:10]}"
    sibling_count = len([p for p in pages if p.get("parentId") == payload.parentId])
    new_page = {
        "id": page_id,
        "path": path,
        "name": payload.name,
        "parentId": payload.parentId,
        "order": payload.order if payload.order is not None else sibling_count,
        "html": "",
        "css": "",
        "js": "",
        "projectState": None,
    }
    pages.append(new_page)
    await db.projects.update_one(
        {"project_id": project_id},
        {"$set": {"pages": pages, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    return new_page


@api_router.patch("/projects/{project_id}/pages")
async def update_page(project_id: str, path: str, payload: PageUpdate, user: User = Depends(get_current_user)):
    project = await get_project_for_user(project_id, user, "editor")
    pages = project.get("pages", []) or []
    page = next((p for p in pages if p["path"] == path), None)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    page.update(updates)
    set_doc: Dict[str, Any] = {"pages": pages, "updated_at": datetime.now(timezone.utc).isoformat()}
    if path == "/":
        # mirror into top-level for backward compat
        if "html" in updates: set_doc["html"] = updates["html"]
        if "css" in updates: set_doc["css"] = updates["css"]
        if "js" in updates: set_doc["js"] = updates["js"]
        if "projectState" in updates: set_doc["projectState"] = updates["projectState"]
        if "generatedFiles" in updates: set_doc["generatedFiles"] = updates["generatedFiles"]
        if "projectState" in updates: set_doc["projectState"] = updates["projectState"]
        if "generatedFiles" in updates: set_doc["generatedFiles"] = updates["generatedFiles"]
    await db.projects.update_one({"project_id": project_id}, {"$set": set_doc})
    return page


@api_router.delete("/projects/{project_id}/pages")
async def delete_page(project_id: str, path: str, user: User = Depends(get_current_user)):
    if path == "/":
        raise HTTPException(status_code=400, detail="Cannot delete the home page")
    project = await get_project_for_user(project_id, user, "editor")
    pages = [p for p in (project.get("pages", []) or []) if p["path"] != path]
    await db.projects.update_one(
        {"project_id": project_id},
        {"$set": {"pages": pages, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    return {"ok": True}


# ============================================================
# Collaboration (members)
# ============================================================
@api_router.get("/projects/{project_id}/members")
async def list_members(project_id: str, user: User = Depends(get_current_user)):
    project = await get_project_for_user(project_id, user, "viewer")
    return project.get("members", [])


@api_router.post("/projects/{project_id}/invite")
async def invite_member(project_id: str, payload: InviteRequest, user: User = Depends(get_current_user)):
    if payload.role not in ("editor", "viewer"):
        raise HTTPException(status_code=400, detail="role must be editor or viewer")
    project = await get_project_for_user(project_id, user, "owner")
    email = payload.email.lower()
    if email == user.email.lower():
        raise HTTPException(status_code=400, detail="You're already the owner")

    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    invited_user_id = existing_user["user_id"] if existing_user else f"pending_{uuid.uuid4().hex[:10]}"

    members = project.get("members", []) or []
    for m in members:
        if (m.get("email") or "").lower() == email:
            raise HTTPException(status_code=400, detail="User already invited")

    new_member = {
        "user_id": invited_user_id,
        "email": email,
        "name": (existing_user or {}).get("name", ""),
        "picture": (existing_user or {}).get("picture", ""),
        "role": payload.role,
        "added_at": datetime.now(timezone.utc).isoformat(),
    }
    members.append(new_member)
    await db.projects.update_one(
        {"project_id": project_id},
        {"$set": {"members": members, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    return new_member


@api_router.patch("/projects/{project_id}/members/{member_user_id}")
async def update_member_role(project_id: str, member_user_id: str, payload: MemberRoleUpdate, user: User = Depends(get_current_user)):
    if payload.role not in ("editor", "viewer"):
        raise HTTPException(status_code=400, detail="role must be editor or viewer")
    project = await get_project_for_user(project_id, user, "owner")
    members = project.get("members", []) or []
    target = next((m for m in members if m.get("user_id") == member_user_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Member not found")
    if target.get("role") == "owner":
        raise HTTPException(status_code=400, detail="Cannot change owner role")
    target["role"] = payload.role
    await db.projects.update_one(
        {"project_id": project_id},
        {"$set": {"members": members}},
    )
    return target


@api_router.delete("/projects/{project_id}/members/{member_user_id}")
async def remove_member(project_id: str, member_user_id: str, user: User = Depends(get_current_user)):
    project = await get_project_for_user(project_id, user, "owner")
    members = project.get("members", []) or []
    target = next((m for m in members if m.get("user_id") == member_user_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Member not found")
    if target.get("role") == "owner":
        raise HTTPException(status_code=400, detail="Cannot remove the owner")
    members = [m for m in members if m.get("user_id") != member_user_id]
    await db.projects.update_one(
        {"project_id": project_id},
        {"$set": {"members": members}},
    )
    return {"ok": True}


# ============================================================
# AI Generation
# ============================================================
SYSTEM_PROMPT = """You are Galio, a world-class AI website architect inside Galio AI Studio.

You generate complete, beautiful, production-ready single-page websites in HTML + Tailwind CSS (via CDN) + vanilla JavaScript based on ANY topic. You can also generate ADDITIONAL pages of an existing site (about, contact, pricing, etc.) keeping the same visual language.

OUTPUT FORMAT — STRICT:
Return ONLY a single JSON object with these keys (no markdown fences, no commentary):
{
  "html": "<!DOCTYPE html>... full HTML body using Tailwind CDN ...",
  "css": "/* extra custom CSS if needed */",
  "js": "// vanilla JS for interactions",
  "summary": "1-2 sentences about what you built or changed"
}

HARD RULES:
1. HTML must be a COMPLETE valid document starting with <!DOCTYPE html>, include <head> with <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" /> and <script src=\"https://cdn.tailwindcss.com\"></script>.
2. Inline custom CSS in a <style> tag in <head> AND duplicate it in "css".
3. Inline JS in a <script> tag at end of <body> AND duplicate it in "js".
4. Modern, premium design — ample whitespace, beautiful typography (Google Fonts via <link>), proper sections (hero, features, etc.), responsive mobile-first.
5. Use real, on-topic copy. NEVER use lorem ipsum.
6. Images: use https://images.unsplash.com/photo-{id}?w=1200 or https://source.unsplash.com/1200x800/?<keyword>.
7. Icons: lucide via https://unpkg.com/lucide@latest or inline SVG.
8. No backend, no API calls, no external auth.
9. For navigation links between site pages, use relative anchors like href="/about", href="/contact" so they match the user's page paths.

MODES:
- "plan": Reply with a short numbered plan in "summary". html/css/js may be empty.
- "build": Generate the full page from scratch.
- "refine"/"debug": Modify the CURRENT page (provided in user message). Return the FULL updated html/css/js (never partial diffs).

If a PAGE_PATH other than "/" is provided, build that specific page (e.g. /about, /contact) consistent with the rest of the site if context is given.

10. ALWAYS include this CSS in every <style> tag: html,body{width:100%;max-width:100%;overflow-x:hidden}*,*::before,*::after{box-sizing:border-box}img,video,iframe{max-width:100%}

Return JSON ONLY."""




def _galio_title_case_bg(value: Any, fallback: str = "Premium Brand") -> str:
    s = str(value or fallback or "").strip()
    s = re.sub(r"\s+", " ", s)
    bad = [
        "SITE PAGES", "Pages Work", "Built For Modern Buyers", "Built For Modern",
        "Ready to build your", "project subject", "USER REQUEST", "PAGE_PATH",
        "MODE", "premium product detail", "modern premium product",
    ]
    for b in bad:
        s = re.sub(re.escape(b), " ", s, flags=re.IGNORECASE)
    s = re.sub(r"\s+", " ", s).strip(" -,.|")
    return s or fallback


def _galio_subject_rules() -> List[Dict[str, Any]]:
    return [
        {
            "id": "kitchen-oven",
            "bg": "готварски печки",
            "title": "Готварски печки",
            "subtitle": "Премиум решения за кухнята",
            "queries": [
                "built in kitchen oven cooking stove appliance",
                "modern kitchen oven appliance",
                "electric cooking stove kitchen",
                "built in oven kitchen interior",
            ],
            "positive": ["oven", "stove", "kitchen", "cooking", "appliance", "cooktop"],
            "negative": ["book", "books", "reading", "library", "page", "pages", "notebook", "magazine", "woman", "women", "girl", "model", "portrait", "fashion"],
            "tokens": ["готварска печка", "готварски печки", "печка", "печки", "фурна", "фурни", "oven", "ovens", "stove", "cooktop"],
        },
        {
            "id": "air-conditioner",
            "bg": "климатици",
            "title": "Климатици",
            "subtitle": "Премиум климатични решения",
            "queries": [
                "air conditioner hvac wall mounted ac",
                "modern wall mounted air conditioner",
                "hvac air conditioning unit interior",
                "home air conditioner appliance",
            ],
            "positive": ["air conditioner", "conditioner", "hvac", "ac", "cooling", "wall mounted"],
            "negative": ["book", "books", "oven", "stove", "camera", "phone", "car"],
            "tokens": ["климатик", "климатици", "климатична", "air conditioner", "air conditioning", "hvac", " ac "],
        },
        {
            "id": "camera",
            "bg": "фотоапарати",
            "title": "Фотоапарати",
            "subtitle": "Премиум техника за фотография",
            "queries": [
                "professional camera product",
                "dslr camera product close up",
                "premium camera lens photography",
                "modern mirrorless camera product",
            ],
            "positive": ["camera", "lens", "photography", "dslr", "mirrorless", "photo"],
            "negative": ["book", "books", "oven", "stove", "kitchen", "phone", "car"],
            "tokens": ["фотоапарат", "фотоапарати", "камера", "camera", "cameras", "photography", "dslr", "lens"],
        },
        {
            "id": "smartphone",
            "bg": "мобилни телефони",
            "title": "Мобилни телефони",
            "subtitle": "Премиум смартфон решения",
            "queries": [
                "smartphone product close up",
                "premium mobile phone product",
                "modern phone display technology",
                "smartphone screen product shot",
            ],
            "positive": ["phone", "smartphone", "mobile", "iphone", "screen"],
            "negative": ["book", "books", "oven", "stove", "kitchen", "camera lens"],
            "tokens": ["телефон", "телефони", "смартфон", "смартфони", "phone", "phones", "smartphone", "mobile"],
        },
    ]



def _galio_clean_subject_from_prompt(prompt: Any = "", fallback: str = "") -> str:
    raw = str(prompt or "").strip()
    if not raw:
        return _galio_title_case_bg(fallback, "Premium Brand")

    s = raw.replace("\n", " ")
    s = re.sub(r"\s+", " ", s).strip()

    s = re.sub(r"\b(MODE|PAGE_PATH|USER REQUEST|SITE PAGES|PROJECT SUBJECT)\b\s*:?\s*", " ", s, flags=re.I)
    s = re.sub(r"\s+", " ", s).strip(" -,.|")

    patterns = [
        r".*?\b(?:сайт|уебсайт|страница|website|site|landing page)\s+(?:за|for)\s+",
        r".*?\b(?:направи|създай|генерирай|make|create|build|generate)\s+(?:ми\s+)?(?:премиум\s+|premium\s+)?(?:сайт|уебсайт|website|site|landing page)?\s*(?:за|for)?\s+",
    ]
    for pat in patterns:
        ns = re.sub(pat, "", s, flags=re.I).strip()
        if ns and len(ns) < len(s):
            s = ns
            break

    stop_phrases = [
        " с реални", " със реални", " със снимки", " с картинки", " с видео", " и видео",
        " video background", " with video", " with real", " real photos",
        " premium design", " премиум дизайн", " златист", " тъмен", " светъл",
        " clean layout", " минималистичен", " модерен дизайн", " responsive",
    ]
    low = s.lower()
    cut_at = None
    for phrase in stop_phrases:
        idx = low.find(phrase)
        if idx > 0:
            cut_at = idx if cut_at is None else min(cut_at, idx)
    if cut_at is not None:
        s = s[:cut_at].strip()

    remove_words = [
        "направи", "създай", "генерирай", "ми", "сайт", "уебсайт", "страница",
        "website", "site", "landing", "page", "premium", "премиум",
        "за", "for", "with", "real", "photos", "video", "background",
    ]

    words = []
    for w in re.split(r"\s+", s):
        clean = w.strip(" ,.!?;:()[]{}\"'`|")
        if not clean:
            continue
        if clean.lower() in remove_words:
            continue
        words.append(clean)

    subject = " ".join(words[:5]).strip(" -,.|")
    subject = _galio_title_case_bg(subject, fallback or "Premium Brand")
    return subject or _galio_title_case_bg(fallback, "Premium Brand")


def _galio_media_keywords_for_subject(subject: str) -> str:
    """
    Universal subject-first media query.

    Do not map subjects to fixed categories.
    The latest extracted subject must stay the media query source.
    """
    clean = re.sub(r"\s+", " ", str(subject or "").strip())
    if not clean:
        return "premium realistic photography"

    return f"{clean} premium realistic photography"

def _galio_media_subject(prompt: Any = "", project_state: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    prompt_subject = _galio_clean_subject_from_prompt(prompt, "")
    has_prompt_subject = bool(prompt_subject and prompt_subject.lower() not in ["premium brand", "brand"])

    fallback_subject = ""
    if isinstance(project_state, dict):
        fallback_subject = (
            project_state.get("industry")
            or project_state.get("brandName")
            or ((project_state.get("hero") or {}).get("headline") if isinstance(project_state.get("hero"), dict) else "")
            or ""
        )

    subject = prompt_subject if has_prompt_subject else _galio_clean_subject_from_prompt("", fallback_subject)
    subject_title = subject[:1].upper() + subject[1:] if subject else "Premium Brand"
    subject_id = re.sub(r"[^a-z0-9а-я]+", "-", subject.lower()).strip("-") or "premium-product"

    prompt_raw = " " + str(prompt or "").lower() + " "

    if has_prompt_subject:
        for rule in _galio_subject_rules():
            if any(str(t).lower() in prompt_raw for t in rule.get("tokens", [])):
                r = dict(rule)
                r["title"] = r.get("title") or subject_title
                r["bg"] = r.get("bg") or subject.lower()
                return r

    query = _galio_media_keywords_for_subject(subject)
    positive = [w.lower() for w in re.split(r"[\s\-]+", query) if len(w) >= 3][:8]
    positive += [w.lower() for w in subject.split() if len(w) >= 3][:4]

    return {
        "id": subject_id,
        "bg": subject.lower(),
        "title": subject_title,
        "subtitle": f"Премиум решения за {subject}",
        "queries": [
            query,
            f"{query} detail",
            f"{query} lifestyle",
        ],
        "positive": list(dict.fromkeys(positive)),
        "negative": ["book", "books", "page", "pages", "reading", "library", "magazine"],
        "tokens": [],
    }


def _subject_media_query(project_state: Dict[str, Any], prompt: str = "") -> str:
    info = _galio_media_subject(prompt, project_state)
    queries = info.get("queries") or []
    return queries[0] if queries else info.get("id", "")


def _fallback_media_assets(project_state: Dict[str, Any], prompt: str = "") -> Dict[str, Any]:
    subject_info = _galio_media_subject(prompt, project_state)
    subject = subject_info["id"]
    title = subject_info.get("title") or _galio_title_case_bg(subject_info.get("bg"), "Premium Brand")
    subtitle = subject_info.get("subtitle") or f"Премиум решения за {title}"

    presets = {
        "air-conditioner": {
            "video": "https://videos.pexels.com/video-files/8107328/8107328-hd_1920_1080_25fps.mp4",
            "poster": "https://images.pexels.com/photos/4792509/pexels-photo-4792509.jpeg?auto=compress&cs=tinysrgb&w=1600",
            "images": [
                "https://images.pexels.com/photos/4792509/pexels-photo-4792509.jpeg?auto=compress&cs=tinysrgb&w=1200",
                "https://images.pexels.com/photos/7195659/pexels-photo-7195659.jpeg?auto=compress&cs=tinysrgb&w=1200",
                "https://images.pexels.com/photos/7195660/pexels-photo-7195660.jpeg?auto=compress&cs=tinysrgb&w=1200",
                "https://images.pexels.com/photos/7195680/pexels-photo-7195680.jpeg?auto=compress&cs=tinysrgb&w=1200",
            ],
        },
        "camera": {
            "video": "https://videos.pexels.com/video-files/3209828/3209828-uhd_2560_1440_25fps.mp4",
            "poster": "https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=1600",
            "images": [
                "https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=1200",
                "https://images.pexels.com/photos/1983037/pexels-photo-1983037.jpeg?auto=compress&cs=tinysrgb&w=1200",
                "https://images.pexels.com/photos/274973/pexels-photo-274973.jpeg?auto=compress&cs=tinysrgb&w=1200",
                "https://images.pexels.com/photos/225157/pexels-photo-225157.jpeg?auto=compress&cs=tinysrgb&w=1200",
            ],
        },
        "smartphone": {
            "video": "https://videos.pexels.com/video-files/4434242/4434242-uhd_2560_1440_30fps.mp4",
            "poster": "https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg?auto=compress&cs=tinysrgb&w=1600",
            "images": [
                "https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg?auto=compress&cs=tinysrgb&w=1200",
                "https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=1200",
                "https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=1200",
                "https://images.pexels.com/photos/1440727/pexels-photo-1440727.jpeg?auto=compress&cs=tinysrgb&w=1200",
            ],
        },
        "kitchen-oven": {
            "video": "",
            "poster": "",
            "images": [],
        },
        "premium-product": {
            "video": "",
            "poster": "",
            "images": [],
        },
    }

    preset = presets.get(subject) or presets["premium-product"]
    collection = []
    for url in preset.get("images", []):
        collection.append({
            "title": title,
            "subtitle": subtitle,
            "tag": "Pexels",
            "imageUrl": url,
            "source": "fallback",
        })

    return {
        "heroVideoUrl": preset.get("video", ""),
        "heroPosterUrl": preset.get("poster", ""),
        "heroImageUrl": preset.get("poster", ""),
        "backgroundVideoUrl": preset.get("video", ""),
        "backgroundImageUrl": preset.get("poster", ""),
        "collectionImages": collection,
        "source": "fallback-placeholder" if not collection else "fallback",
        "query": (subject_info.get("queries") or [subject])[0],
        "subjectId": subject,
    }


def _media_search_terms(project_state: Dict[str, Any], prompt: str = "") -> List[str]:
    info = _galio_media_subject(prompt, project_state)
    out = []
    for term in info.get("queries") or []:
        term = _galio_title_case_bg(term, "").strip()
        if term and term.lower() not in [x.lower() for x in out]:
            out.append(term)
    return out[:4]


def _rank_pexels_item(item: Dict[str, Any], query: str, kind: str = "photo", subject_info: Dict[str, Any] = None) -> int:
    subject_info = subject_info or {}
    positive = [str(x).lower() for x in subject_info.get("positive", [])]
    negative = [str(x).lower() for x in subject_info.get("negative", [])]

    score = 0
    q = query.lower()
    alt = str(item.get("alt") or "").lower()
    url = str(item.get("url") or "").lower()
    photographer = str(item.get("photographer") or "").lower()
    blob = f"{alt} {url} {photographer}"

    for word in negative:
        if word and word in blob:
            score -= 120

    for word in positive:
        if word and word in blob:
            score += 35

    for word in q.split()[:8]:
        if len(word) >= 3 and word in blob:
            score += 12

    if not any(word and word in blob for word in positive):
        score -= 35

    if kind == "photo":
        width = int(item.get("width") or 0)
        height = int(item.get("height") or 0)
        if width >= 1200:
            score += 8
        if height >= 700:
            score += 6
        if width > height:
            score += 4
    else:
        width = int(item.get("width") or 0)
        height = int(item.get("height") or 0)
        duration = int(item.get("duration") or 0)
        if width >= 1280:
            score += 8
        if height >= 720:
            score += 6
        if 4 <= duration <= 35:
            score += 6

    return score



async def _pexels_get_json(url: str, params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if not PEXELS_API_KEY:
        return None

    try:
        async with httpx.AsyncClient(timeout=12) as client:
            res = await client.get(
                url,
                params=params,
                headers={"Authorization": PEXELS_API_KEY},
            )

        if res.status_code != 200:
            logger.warning("Pexels API returned %s: %s", res.status_code, res.text[:200])
            return None

        return res.json()
    except Exception:
        logger.exception("Pexels API request failed")
        return None


async def _search_pexels_media(project_state: Dict[str, Any], prompt: str = "") -> Optional[Dict[str, Any]]:
    if not PEXELS_API_KEY:
        return None

    subject_info = _galio_media_subject(prompt, project_state)
    subject_id = subject_info["id"]
    label = subject_info["bg"]
    queries = _media_search_terms(project_state, prompt)
    photos = []
    videos = []

    for query in queries:
        photo_json = await _pexels_get_json(
            "https://api.pexels.com/v1/search",
            {"query": query, "per_page": 20, "orientation": "landscape"},
        )
        if photo_json and isinstance(photo_json.get("photos"), list):
            for item in photo_json["photos"]:
                item["_query"] = query
                item["_score"] = _rank_pexels_item(item, query, "photo", subject_info)
                photos.append(item)

        video_json = await _pexels_get_json(
            "https://api.pexels.com/videos/search",
            {"query": query, "per_page": 10, "orientation": "landscape"},
        )
        if video_json and isinstance(video_json.get("videos"), list):
            for item in video_json["videos"]:
                item["_query"] = query
                item["_score"] = _rank_pexels_item(item, query, "video", subject_info)
                videos.append(item)

        if len(photos) >= 24 and len(videos) >= 4:
            break

    photos.sort(key=lambda x: x.get("_score", 0), reverse=True)
    videos.sort(key=lambda x: x.get("_score", 0), reverse=True)

    photos = [p for p in photos if int(p.get("_score", 0)) >= 20]

    if not photos:
        return None

    def photo_url(item: Dict[str, Any], size: str = "large2x") -> str:
        src = item.get("src") or {}
        return src.get(size) or src.get("large") or src.get("landscape") or src.get("original") or ""

    best_photo = photos[0]
    hero_image = photo_url(best_photo, "large2x")

    hero_video = ""
    if videos:
        videos = [v for v in videos if int(v.get("_score", 0)) >= 15] or []
        files = []

        if videos:

            files = []
            if videos:
                files = videos[0].get("video_files") or []
        files = sorted(
            files,
            key=lambda f: (
                1 if str(f.get("quality") or "").lower() in ("hd", "uhd") else 0,
                int(f.get("width") or 0),
            ),
            reverse=True,
        )
        hero_video = next((f.get("link") for f in files if f.get("link") and str(f.get("file_type", "")).startswith("video/")), "")

    collection = []
    seen = set()
    for item in photos[:10]:
        url = photo_url(item, "large")
        if not url or url in seen:
            continue
        seen.add(url)
        collection.append({
            "title": f"Премиум {label}",
            "subtitle": label,
            "tag": "Pexels",
            "imageUrl": url,
            "source": "pexels",
            "photographer": item.get("photographer", ""),
            "photographerUrl": item.get("photographer_url", ""),
        })

    if len(collection) < 3:
        return None

    return {
        "heroVideoUrl": hero_video,
        "heroPosterUrl": hero_image,
        "heroImageUrl": hero_image,
        "backgroundVideoUrl": hero_video,
        "backgroundImageUrl": hero_image,
        "collectionImages": collection[:8],
        "source": "pexels",
        "query": queries[0] if queries else "",
        "subjectId": subject_id,
    }


async def _ensure_media_assets_async(project_state: Dict[str, Any], prompt: str = "") -> Dict[str, Any]:
    if not isinstance(project_state, dict):
        project_state = {}

    subject_info = _galio_media_subject(prompt, project_state)
    subject_id = subject_info["id"]

    media = project_state.get("mediaAssets")
    if not isinstance(media, dict):
        media = {}

    has_hero = bool(media.get("heroVideoUrl") or media.get("backgroundVideoUrl") or media.get("heroImageUrl") or media.get("backgroundImageUrl"))
    has_collection = isinstance(media.get("collectionImages"), list) and any(
        isinstance(item, dict) and item.get("imageUrl") for item in media.get("collectionImages", [])
    )

    # Important: if prompt subject changed or old media is polluted, do NOT reuse it.
    subject_changed = media.get("subjectId") and media.get("subjectId") != subject_id

    allowed_queries = [str(q).lower() for q in (subject_info.get("queries") or [])]
    media_query = str(media.get("query") or "").lower()
    bad_query = bool(media_query) and all(q not in media_query and media_query not in q for q in allowed_queries)

    polluted_words = ["pages work", "site pages", "built for", "ready to build", "project subject", "user request", "page_path", "mode"]
    polluted_titles = False
    if isinstance(media.get("collectionImages"), list):
        for item in media.get("collectionImages", [])[:8]:
            blob = f"{item.get('title', '')} {item.get('subtitle', '')}".lower() if isinstance(item, dict) else ""
            if any(w in blob for w in polluted_words):
                polluted_titles = True
                break

    if has_hero and has_collection and not subject_changed and not bad_query and not polluted_titles:
        return project_state

    pexels_media = await _search_pexels_media(project_state, prompt)

    if pexels_media:
        project_state["mediaAssets"] = pexels_media

        visual = project_state.get("visualSystem")
        if not isinstance(visual, dict):
            visual = {}
        visual["backgroundType"] = "video" if pexels_media.get("heroVideoUrl") else "image"
        visual["backgroundPrompt"] = f"real premium media for {subject_info['bg']}"
        project_state["visualSystem"] = visual

        return project_state

    return _ensure_media_assets(project_state, prompt)


def _ensure_media_assets(project_state: Dict[str, Any], prompt: str = "") -> Dict[str, Any]:
    if not isinstance(project_state, dict):
        project_state = {}

    fallback = _fallback_media_assets(project_state, prompt)
    project_state["mediaAssets"] = fallback

    visual = project_state.get("visualSystem")
    if not isinstance(visual, dict):
        visual = {}
    visual["backgroundType"] = "video"
    visual["backgroundPrompt"] = f"fallback premium media for {fallback.get('query')}"
    project_state["visualSystem"] = visual

    return project_state




def _clean_short_text(value: Any, fallback: str = "", max_words: int = 8) -> str:
    s = str(value or fallback or "").strip()
    s = " ".join(s.replace("\n", " ").split())

    bad_phrases = [
        "Built For Modern Buyers",
        "Built For Modern",
        "Designed like a premium product launch",
        "premium product launch",
        "A high-end, conversion-focused landing page for",
    ]
    for bad in bad_phrases:
        s = s.replace(bad, "").strip()

    words = s.split()
    if len(words) > max_words:
        s = " ".join(words[:max_words]).strip()

    return s



def _clean_subject_name(value: Any, fallback: str = "Premium Brand") -> str:
    s = str(value or fallback or "").strip()
    s = " ".join(s.replace("\n", " ").replace(",", " ").split())

    remove_phrases = [
        "с реални снимки",
        "реални снимки",
        "снимки",
        "видео фон",
        "видео",
        "фон",
        "чист минималистичен layout",
        "чист layout",
        "минималистичен layout",
        "минималистичен дизайн",
        "премиум златист дизайн",
        "златист дизайн",
        "premium",
        "minimalist",
        "minimalistic",
        "layout",
        "design",
        "with real photos",
        "real photos",
        "video background",
        "clean layout",
        "clean minimal layout",
        "modern buyers",
        "built for",
    ]

    low = s.lower()
    for phrase in remove_phrases:
        low = low.replace(phrase.lower(), " ")

    s = " ".join(low.split()).strip(" -,.")
    if not s:
        s = str(fallback or "Premium Brand").strip()

    aliases = [
        ("фотоапарат", "Фотоапарати"),
        ("camera", "Фотоапарати"),
        ("климат", "Климатици"),
        ("air conditioner", "Климатици"),
        ("телефон", "Мобилни Телефони"),
        ("phone", "Мобилни Телефони"),
        ("фурн", "Готварски Печки"),
        ("печк", "Готварски Печки"),
        ("oven", "Готварски Печки"),
    ]

    s_low = s.lower()
    for key, label in aliases:
        if key in s_low:
            return label

    words = s.split()
    return " ".join(w.capitalize() for w in words[:3]) or "Premium Brand"


def _clean_marketing_sentence(value: Any, fallback: str = "", max_words: int = 14) -> str:
    s = str(value or fallback or "").strip()
    s = " ".join(s.replace("\n", " ").split())

    banned_tail = [
        "with polished visuals, strong product storytelling and a premium brand feel.",
        "with polished visuals",
        "strong product storytelling",
        "premium brand feel",
        "A high-end, conversion-focused landing page for",
    ]

    for bad in banned_tail:
        s = s.replace(bad, "").strip(" ,.-")

    words = s.split()
    if len(words) > max_words:
        s = " ".join(words[:max_words]).strip(" ,.-")

    return s


def _galio_color_video_director(project_state: Dict[str, Any], prompt: str = "") -> Dict[str, Any]:
    """
    Universal Color/Video Director.
    Does NOT hard-lock to appliances/categories.
    Uses the newest prompt as source of truth, then picks a premium palette/treatment.
    """
    if not isinstance(project_state, dict):
        project_state = {}

    raw = " ".join([
        str(prompt or ""),
        str(project_state.get("industry") or ""),
        str(project_state.get("brandName") or ""),
        str(project_state.get("style") or ""),
    ]).lower()

    palettes = [
        {
            "keys": ["ресторант", "restaurant", "food", "кухня", "chef", "pizza", "coffee", "кафе"],
            "primary": "#F97316",
            "secondary": "#120A05",
            "style": "warm cinematic food-grade amber",
        },
        {
            "keys": ["адвокат", "lawyer", "legal", "law firm", "право", "кантора"],
            "primary": "#D4AF37",
            "secondary": "#070A12",
            "style": "luxury legal navy gold",
        },
        {
            "keys": ["кола", "коли", "car", "cars", "auto", "automotive", "автомобил"],
            "primary": "#38BDF8",
            "secondary": "#05070A",
            "style": "glossy automotive blue black",
        },
        {
            "keys": ["яке", "якета", "jacket", "jackets", "fashion", "дрехи", "облекло"],
            "primary": "#F43F5E",
            "secondary": "#09090B",
            "style": "fashion editorial rose black",
        },
        {
            "keys": ["камера", "камери", "фотоапарат", "фотоапарати", "camera", "photography"],
            "primary": "#F59E0B",
            "secondary": "#050505",
            "style": "cinematic camera amber black",
        },
        {
            "keys": ["климатик", "климатици", "air conditioner", "hvac", "ac"],
            "primary": "#06B6D4",
            "secondary": "#07131A",
            "style": "clean cool hvac cyan",
        },
        {
            "keys": ["печка", "печки", "фурна", "oven", "stove", "kitchen appliance"],
            "primary": "#F59E0B",
            "secondary": "#0B0705",
            "style": "premium kitchen warm amber",
        },
        {
            "keys": ["хладилник", "хладилници", "fridge", "refrigerator"],
            "primary": "#22D3EE",
            "secondary": "#061016",
            "style": "fresh appliance ice cyan",
        },
        {
            "keys": ["телефон", "смартфон", "phone", "smartphone", "mobile"],
            "primary": "#22C55E",
            "secondary": "#050A07",
            "style": "tech product green black",
        },
    ]

    chosen = None
    for palette in palettes:
        if any(k in raw for k in palette["keys"]):
            chosen = palette
            break

    if not chosen:
        # Universal fallback, not purple.
        fallback_palettes = [
            {"primary": "#F59E0B", "secondary": "#07070A", "style": "premium amber cinematic"},
            {"primary": "#06B6D4", "secondary": "#061016", "style": "premium cyan cinematic"},
            {"primary": "#22C55E", "secondary": "#050A07", "style": "premium emerald cinematic"},
            {"primary": "#EF4444", "secondary": "#0A0505", "style": "premium red cinematic"},
            {"primary": "#EAB308", "secondary": "#0A0803", "style": "premium gold cinematic"},
        ]
        seed = sum(ord(c) for c in raw) if raw else 0
        chosen = fallback_palettes[seed % len(fallback_palettes)]

    bad_purple = {
        "#8b5cf6", "#8B5CF6", "#7c3aed", "#7C3AED",
        "#a855f7", "#A855F7", "#9333ea", "#9333EA",
    }

    current_primary = str(project_state.get("primaryColor") or "").strip()
    current_secondary = str(project_state.get("secondaryColor") or "").strip()

    if not current_primary or current_primary in bad_purple:
        project_state["primaryColor"] = chosen["primary"]

    if not current_secondary or current_secondary in bad_purple:
        project_state["secondaryColor"] = chosen["secondary"]

    visual = project_state.get("visualSystem")
    if not isinstance(visual, dict):
        visual = {}

    media = project_state.get("mediaAssets")
    if not isinstance(media, dict):
        media = {}

    has_video = bool(media.get("heroVideoUrl") or media.get("backgroundVideoUrl"))
    has_image = bool(media.get("heroImageUrl") or media.get("backgroundImageUrl"))

    visual["backgroundType"] = "video" if has_video else ("image" if has_image else "gradient")
    visual["videoTreatment"] = {
        "quality": "clear cinematic",
        "blur": "none",
        "overlay": "premium readable dark gradient",
        "motion": "slow elegant background motion",
    }
    visual["colorDirector"] = {
        "source": "universal-deterministic-director",
        "palette": chosen["style"],
        "primaryColor": project_state.get("primaryColor"),
        "secondaryColor": project_state.get("secondaryColor"),
    }

    subject_label = str(project_state.get("industry") or project_state.get("brandName") or prompt or "premium brand").strip()
    visual["backgroundPrompt"] = f"beautiful clear cinematic video background for {subject_label}, {chosen['style']}, sharp premium visuals"

    media["videoQuery"] = f"{subject_label} cinematic premium video background"
    media["videoTreatment"] = visual["videoTreatment"]
    project_state["mediaAssets"] = media
    project_state["visualSystem"] = visual

    return project_state


def _normalize_project_state_quality(project_state: Dict[str, Any], prompt: str = "") -> Dict[str, Any]:
    if not isinstance(project_state, dict):
        return {}

    industry = _clean_subject_name(
        project_state.get("industry") or project_state.get("brandName") or prompt,
        "Premium Brand",
    )

    brand = _clean_subject_name(project_state.get("brandName") or industry, industry)
    project_state["brandName"] = brand
    project_state["industry"] = industry

    hero = project_state.get("hero")
    if not isinstance(hero, dict):
        hero = {}

    hero["eyebrow"] = _clean_short_text(hero.get("eyebrow"), "Premium Experience", 3)

    raw_headline = str(hero.get("headline") or "").strip()
    if not raw_headline or len(raw_headline.split()) > 7 or "Built For" in raw_headline:
        hero["headline"] = f"Premium {brand}"
    else:
        hero["headline"] = _clean_short_text(raw_headline, f"Premium {brand}", 7)

    hero["subheadline"] = _clean_marketing_sentence(
        hero.get("subheadline"),
        f"Модерен премиум сайт за {industry}.",
        12,
    )
    if any(x in hero["subheadline"].lower() for x in ["with ", "landing page", "conversion-focused"]):
        hero["subheadline"] = f"Модерен премиум сайт за {industry}."
    hero["primaryCta"] = _clean_short_text(hero.get("primaryCta"), "Разгледай", 3)
    hero["secondaryCta"] = _clean_short_text(hero.get("secondaryCta"), "Научи повече", 3)
    project_state["hero"] = hero

    media = project_state.get("mediaAssets")
    if isinstance(media, dict):
        collection = media.get("collectionImages")
        if isinstance(collection, list):
            clean_collection = []
            for i, item in enumerate(collection[:8]):
                if not isinstance(item, dict):
                    continue
                clean_collection.append({
                    **item,
                    "title": _clean_short_text(item.get("title"), f"{brand} {i + 1}", 5),
                    "subtitle": _clean_short_text(item.get("subtitle"), industry, 5),
                    "tag": _clean_short_text(item.get("tag"), "Premium", 2),
                })
            media["collectionImages"] = clean_collection
        project_state["mediaAssets"] = media

    sections = project_state.get("sections")
    if isinstance(sections, list):
        fixed_sections = []
        for section in sections[:5]:
            if not isinstance(section, dict):
                continue
            fixed_sections.append({
                **section,
                "title": _clean_short_text(section.get("title"), "Premium Section", 5),
                "description": _clean_short_text(section.get("description"), "", 18),
                "items": [
                    _clean_short_text(item, "Feature", 5)
                    for item in (section.get("items") or [])[:6]
                ],
            })
        project_state["sections"] = fixed_sections

    features = project_state.get("features")
    if isinstance(features, list):
        project_state["features"] = [
            {
                **f,
                "title": _clean_short_text(f.get("title"), "Feature", 4),
                "description": _clean_short_text(f.get("description"), "", 14),
            }
            for f in features[:6]
            if isinstance(f, dict)
        ]

    return project_state



def _hard_subject_from_prompt(prompt: Any, project_state: Optional[Dict[str, Any]] = None) -> str:
    raw_parts = [
        str(prompt or ""),
    ]

    if isinstance(project_state, dict):
        raw_parts.extend([
            str(project_state.get("industry") or ""),
            str(project_state.get("brandName") or ""),
            str((project_state.get("hero") or {}).get("headline") or ""),
        ])

    raw = " ".join(raw_parts).lower()
    raw = raw.replace("site pages", " ")
    raw = raw.replace("built for modern buyers", " ")
    raw = raw.replace("built for modern", " ")
    raw = raw.replace("ready to build your", " ")

    subject_aliases = [
        (["фотоапарат", "фотоапарати", "camera", "cameras", "photography"], "Фотоапарати"),
        (["климатик", "климатици", "климатична", "air conditioner", "air conditioning", "hvac"], "Климатици"),
        (["готварска печка", "готварски печки", "печка", "печки", "фурна", "oven", "ovens"], "Готварски Печки"),
        (["телефон", "телефони", "смартфон", "смартфони", "phone", "phones", "smartphone"], "Мобилни Телефони"),
        (["лаптоп", "лаптопи", "laptop", "laptops"], "Лаптопи"),
        (["кола", "коли", "автомобил", "автомобили", "car", "cars"], "Автомобили"),
        (["часовник", "часовници", "watch", "watches"], "Часовници"),
    ]

    for keys, label in subject_aliases:
        if any(k in raw for k in keys):
            return label

    cleaned = raw
    remove_words = [
        "направи", "ми", "сайт", "website", "landing", "page",
        "premium", "премиум", "реални", "снимки", "снимка",
        "видео", "фон", "чист", "минималистичен", "минималистичен",
        "layout", "design", "дизайн", "златист", "модерен",
        "hero", "section", "sections", "страница", "страници",
        "и", "с", "за", "with", "real", "photos", "video", "background",
    ]

    for w in remove_words:
        cleaned = re.sub(rf"\b{re.escape(w)}\b", " ", cleaned, flags=re.IGNORECASE)

    cleaned = re.sub(r"[^a-zа-я0-9]+", " ", cleaned, flags=re.IGNORECASE).strip()
    words = cleaned.split()[:2]
    if not words:
        return "Premium Brand"

    return " ".join(w.capitalize() for w in words)


def _force_clean_site_copy(project_state: Dict[str, Any], prompt: str = "") -> Dict[str, Any]:
    if not isinstance(project_state, dict):
        project_state = {}

    subject = _hard_subject_from_prompt(prompt, project_state)

    project_state["brandName"] = subject
    project_state["industry"] = subject
    project_state["tagline"] = f"Премиум решения за {subject}"

    hero = project_state.get("hero")
    if not isinstance(hero, dict):
        hero = {}

    hero["eyebrow"] = "Premium Experience"
    hero["headline"] = f"Premium {subject}"
    hero["subheadline"] = f"Модерен премиум сайт за {subject}."
    hero["primaryCta"] = "Разгледай"
    hero["secondaryCta"] = "Научи повече"
    project_state["hero"] = hero

    media = project_state.get("mediaAssets")
    if isinstance(media, dict):
        imgs = media.get("collectionImages")
        if isinstance(imgs, list):
            fixed = []
            for i, item in enumerate(imgs[:8]):
                if not isinstance(item, dict):
                    continue
                fixed.append({
                    **item,
                    "title": subject,
                    "subtitle": f"Премиум {subject}",
                    "tag": "Pexels",
                })
            media["collectionImages"] = fixed
        project_state["mediaAssets"] = media

    sections = project_state.get("sections")
    if isinstance(sections, list):
        clean_titles = ["Предимства", "Колекция", "Качество", "Услуги", "Контакт"]
        fixed_sections = []
        for i, section in enumerate(sections[:5]):
            if not isinstance(section, dict):
                continue
            fixed_sections.append({
                **section,
                "title": clean_titles[i] if i < len(clean_titles) else "Секция",
                "description": f"Премиум представяне за {subject}.",
                "items": ["Премиум дизайн", "Бързо зареждане", "Респонсив визия"],
            })
        project_state["sections"] = fixed_sections

    features = project_state.get("features")
    if isinstance(features, list):
        labels = [
            ("Премиум дизайн", "Изчистена модерна визия."),
            ("Бързо преживяване", "Лесна навигация и ясен фокус."),
            ("Фокус върху бранда", f"Съдържание, насочено към {subject}."),
        ]
        project_state["features"] = [
            {"title": title, "description": desc}
            for title, desc in labels
        ]

    return project_state

def _safe_json_extract(text: str) -> Dict[str, Any]:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```", 2)
        text = text[1] if len(text) >= 2 else ""
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
        if text.endswith("```"):
            text = text[:-3].strip()
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        text = text[start:end + 1]
    try:
        return json.loads(text)
    except Exception:
        return {"html": "", "css": "", "js": "", "summary": text[:500]}



def _galio_clean_generated_text(value: Any, fallback: str = "", max_words: int = 12) -> str:
    raw = str(value or "").strip()
    bad_fragments = [
        "SITE PAGES",
        "Built For Modern Buyers",
        "Ready to build your",
        "project subject",
        "conversion-focused landing page",
        "with polished visuals",
        "strong product storytelling",
        "premium brand feel",
        "PAGE_PATH",
        "USER REQUEST",
        "MODE:",
    ]

    for bad in bad_fragments:
        raw = raw.replace(bad, "")

    raw = re.sub(r"\s+", " ", raw).strip(" -–—|,.")

    if not raw:
        raw = fallback

    words = raw.split()
    if len(words) > max_words:
        raw = " ".join(words[:max_words]).strip(" -–—|,.")

    return raw or fallback


def _galio_subject_from_prompt(prompt: str) -> str:
    t = str(prompt or "").lower()
    remove_words = [
        "направи", "ми", "сайт", "website", "premium", "премиум",
        "реални", "снимки", "видео", "фон", "чист", "минималистичен",
        "layout", "дизайн", "за", "със", "и", "with", "real", "photos",
        "video", "background", "clean", "minimal"
    ]
    for w in remove_words:
        t = re.sub(rf"\b{re.escape(w)}\b", " ", t, flags=re.I)
    t = re.sub(r"[^а-яa-z0-9\s-]", " ", t, flags=re.I)
    t = re.sub(r"\s+", " ", t).strip()
    return t or "премиум продукти"


def _galio_title_bg(value: str) -> str:
    value = str(value or "").strip()
    if not value:
        return "Премиум сайт"
    return " ".join([w[:1].upper() + w[1:] for w in value.split()])


def _sanitize_generated_project_state_bugfix(project_state: Dict[str, Any], prompt: str = "") -> Dict[str, Any]:
    if not isinstance(project_state, dict):
        project_state = {}

    subject = _galio_subject_from_prompt(prompt)
    subject_title = _galio_title_bg(subject)

    project_state["industry"] = _galio_clean_generated_text(
        project_state.get("industry"),
        subject,
        7,
    ).lower()

    project_state["brandName"] = _galio_clean_generated_text(
        project_state.get("brandName"),
        subject_title,
        6,
    )

    project_state["tagline"] = _galio_clean_generated_text(
        project_state.get("tagline"),
        f"Премиум решения за {subject}.",
        12,
    )

    hero = project_state.get("hero")
    if not isinstance(hero, dict):
        hero = {}

    hero["eyebrow"] = _galio_clean_generated_text(
        hero.get("eyebrow"),
        "Premium Experience",
        4,
    )

    current_headline = str(hero.get("headline") or "")
    if (
        len(current_headline.split()) > 8
        or "SITE PAGES" in current_headline
        or "Built For" in current_headline
        or "Ready to build" in current_headline
        or "project subject" in current_headline
    ):
        hero["headline"] = f"Premium {subject_title}"
    else:
        hero["headline"] = _galio_clean_generated_text(
            current_headline,
            f"Premium {subject_title}",
            8,
        )

    current_sub = str(hero.get("subheadline") or "")
    if (
        len(current_sub.split()) > 18
        or "SITE PAGES" in current_sub
        or "landing page" in current_sub.lower()
        or "with polished visuals" in current_sub.lower()
    ):
        hero["subheadline"] = f"Модерен премиум сайт за {subject}."
    else:
        hero["subheadline"] = _galio_clean_generated_text(
            current_sub,
            f"Модерен премиум сайт за {subject}.",
            18,
        )

    hero["primaryCta"] = _galio_clean_generated_text(
        hero.get("primaryCta"),
        "Разгледай",
        4,
    )
    hero["secondaryCta"] = _galio_clean_generated_text(
        hero.get("secondaryCta"),
        "Научи повече",
        4,
    )

    project_state["hero"] = hero

    footer = project_state.get("footer")
    if not isinstance(footer, dict):
        footer = {}
    footer["headline"] = _galio_clean_generated_text(
        footer.get("headline"),
        f"Готови ли сте за {subject}?",
        10,
    )
    footer["cta"] = _galio_clean_generated_text(
        footer.get("cta"),
        "Започни сега",
        4,
    )
    project_state["footer"] = footer

    # Clean sections/features/pricing text without deleting mediaAssets/overrides/customElements.
    for key in ["sections", "features", "pricing"]:
        arr = project_state.get(key)
        if isinstance(arr, list):
            for item in arr:
                if isinstance(item, dict):
                    for text_key in ["title", "name"]:
                        if text_key in item:
                            item[text_key] = _galio_clean_generated_text(item.get(text_key), subject_title, 7)
                    for text_key in ["description", "price"]:
                        if text_key in item:
                            item[text_key] = _galio_clean_generated_text(item.get(text_key), f"Премиум решения за {subject}.", 16)
                    if isinstance(item.get("items"), list):
                        item["items"] = [_galio_clean_generated_text(x, subject_title, 8) for x in item["items"]]
                    if isinstance(item.get("features"), list):
                        item["features"] = [_galio_clean_generated_text(x, subject_title, 8) for x in item["features"]]

    return project_state


def _make_generated_files(html: str = "", css: str = "", js: str = "", project_state: Dict[str, Any] | None = None) -> List[Dict[str, Any]]:
    """Build a stable Hercules-style generated file tree for the frontend editor."""
    state = project_state if isinstance(project_state, dict) else {}

    def file_doc(file_id: str, path: str, name: str, language: str, content: Any, editable: bool = True, kind: str = "source") -> Dict[str, Any]:
        if not isinstance(content, str):
            try:
                content = json.dumps(content or {}, ensure_ascii=False, indent=2)
            except Exception:
                content = "{}"

        return {
            "id": file_id,
            "path": path,
            "name": name,
            "language": language,
            "kind": kind,
            "editable": editable,
            "content": content or "",
        }

    return [
        file_doc("html", "src/generated/index.html", "index.html", "html", html or "", True, "source"),
        file_doc("css", "src/generated/styles.css", "styles.css", "css", css or "", True, "source"),
        file_doc("js", "src/generated/script.js", "script.js", "javascript", js or "", True, "source"),
        file_doc("projectState", "src/generated/projectState.json", "projectState.json", "json", state, False, "schema"),
        file_doc("theme", "src/generated/theme.json", "theme.json", "json", {
            "brandName": state.get("brandName"),
            "industry": state.get("industry"),
            "primaryColor": state.get("primaryColor"),
            "secondaryColor": state.get("secondaryColor"),
            "visualSystem": state.get("visualSystem"),
        }, False, "schema"),
        file_doc("media", "src/generated/media.json", "media.json", "json", state.get("mediaAssets") or {}, False, "schema"),
        file_doc("customCode", "src/generated/customCode.json", "customCode.json", "json", state.get("customCode") or {}, False, "schema"),
    ]



@api_router.get("/media/pexels/search")
async def search_pexels_for_media_picker(
    q: str,
    type: str = "photo",
    per_page: int = 18,
    user: User = Depends(get_current_user),
):
    api_key = os.environ.get("PEXELS_API_KEY", "").strip()
    query = str(q or "").strip()
    media_type = str(type or "photo").strip().lower()
    limit = max(1, min(int(per_page or 18), 30))

    if not api_key:
        raise HTTPException(status_code=500, detail="PEXELS_API_KEY is missing")
    if not query:
        raise HTTPException(status_code=400, detail="Search query is required")

    url = "https://api.pexels.com/videos/search" if media_type == "video" else "https://api.pexels.com/v1/search"

    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get(
            url,
            headers={"Authorization": api_key},
            params={"query": query, "per_page": limit, "orientation": "landscape"},
        )

    if resp.status_code >= 400:
        raise HTTPException(status_code=resp.status_code, detail=resp.text[:300])

    data = resp.json()
    items = []

    if media_type == "video":
        for video in data.get("videos", []):
            files = video.get("video_files") or []
            files = sorted(files, key=lambda f: int(f.get("width") or 0), reverse=True)
            video_url = files[0].get("link") if files else ""
            preview = video.get("image") or ""
            if video_url:
                items.append({
                    "id": str(video.get("id")),
                    "type": "video",
                    "url": video_url,
                    "preview": preview,
                    "alt": query,
                    "credit": video.get("user", {}).get("name", "Pexels"),
                })
    else:
        for photo in data.get("photos", []):
            src = photo.get("src") or {}
            image_url = src.get("large2x") or src.get("large") or src.get("medium") or photo.get("url")
            preview = src.get("medium") or src.get("small") or image_url
            if image_url:
                items.append({
                    "id": str(photo.get("id")),
                    "type": "image",
                    "url": image_url,
                    "preview": preview,
                    "alt": photo.get("alt") or query,
                    "credit": photo.get("photographer", "Pexels"),
                })

    return {"query": query, "type": media_type, "items": items}


@api_router.post("/ai/generate")
async def ai_generate(payload: GenerateRequest, user: User = Depends(get_current_user)):
    project = await get_project_for_user(payload.project_id, user, "editor")

    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not configured")

    page = _find_page(project, payload.page_path) or {"html": "", "css": "", "js": ""}

    context_block = ""
    if payload.mode in ("refine", "debug") and (payload.current_html or page.get("html")):
        current_html = payload.current_html or page.get("html", "")
        current_css = payload.current_css or page.get("css", "")
        current_js = payload.current_js or page.get("js", "")
        context_block = (
            f"\n\nCURRENT PAGE STATE:\n"
            f"---HTML---\n{current_html[:8000]}\n"
            f"---CSS---\n{current_css[:2000]}\n"
            f"---JS---\n{current_js[:2000]}\n"
        )

    site_pages_block = ""
    if len(project.get("pages", [])) > 1:
        site_pages_block = "\n\nSITE PAGES: " + ", ".join(p["path"] for p in project["pages"])

    # Keep AI input clean. Do not leak debug labels into generated site copy.
    user_text = str(payload.prompt or "").strip()

    user_msg = ChatMessage(
        project_id=payload.project_id, user_id=user.user_id,
        role="user", content=payload.prompt, mode=payload.mode, page_path=payload.page_path,
    )
    udoc = user_msg.model_dump()
    udoc["created_at"] = udoc["created_at"].isoformat()
    await db.chat_messages.insert_one(udoc)

    try:
        parsed = generate_premium_site(
            user_text,
            current_state={
                "html": page.get("html", ""),
                "css": page.get("css", ""),
                "js": page.get("js", ""),
            },
        )
    except Exception as e:
        logger.exception("Premium agent failed")
        err_text = str(e)
        low = err_text.lower()
        if "rate limit" in low or "429" in low:
            raise HTTPException(status_code=429, detail="AI rate limit reached. Try again in a moment.")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {err_text[:200]}")
    # Important:
    # Do NOT fallback to old page html/css/js on new AI generation.
    # Old pasted custom code can lock the preview to the previous website.
    # The generated projectState is now the source of truth for AI websites.
    new_html = parsed.get("html", "") or ""
    new_css = parsed.get("css", "") or ""
    new_js = parsed.get("js", "") or ""
    summary = parsed.get("summary", "Generated.")
    raw_project_state = parsed.get("projectState") or parsed.get("project_state") or None
    current_project_state = page.get("projectState") if isinstance(page.get("projectState"), dict) else {}

    # Build mode is a fresh generation. Do not leak old projectState/customCode/overrides
    # into the new subject. Refine/debug may keep context.
    keep_old_state = payload.mode in ("refine", "debug")
    base_project_state = current_project_state if keep_old_state else {}

    if isinstance(raw_project_state, dict):
        merged_project_state = {
            **base_project_state,
            **raw_project_state,
        }

        if keep_old_state:
            merged_project_state["overrides"] = current_project_state.get(
                "overrides",
                raw_project_state.get("overrides", {}),
            )
            merged_project_state["customElements"] = current_project_state.get(
                "customElements",
                raw_project_state.get("customElements", []),
            )
        else:
            merged_project_state["overrides"] = raw_project_state.get("overrides", {})
            merged_project_state["customElements"] = raw_project_state.get("customElements", [])
            merged_project_state.pop("customCode", None)
            merged_project_state.pop("galleryIntro", None)

        project_state = normalize_schema_first_project_state(
            merged_project_state,
            payload.prompt,
        )
    else:
        project_state = make_schema_first_project_state(payload.prompt, base_project_state)

    project_state = await _ensure_media_assets_async(project_state, payload.prompt)
    project_state = _galio_color_video_director(project_state, payload.prompt)
    project_state = normalize_schema_first_project_state(project_state, payload.prompt)
    project_state = _galio_color_video_director(project_state, payload.prompt)

    # Final fresh-build guard:
    # Build mode must not keep stale subject/custom code/overrides from previous websites.
    if payload.mode == "build":
        generation = project_state.get("generation") if isinstance(project_state.get("generation"), dict) else {}
        subject = str(
            generation.get("subject")
            or project_state.get("subject")
            or project_state.get("mainSubject")
            or ""
        ).strip()

        if subject:
            project_state["subject"] = subject
            project_state["mainSubject"] = generation.get("mainSubject") or subject
            project_state["brandName"] = generation.get("brandName") or subject

            hero = project_state.get("hero") if isinstance(project_state.get("hero"), dict) else {}
            hero["headline"] = generation.get("headlineSubject") or subject
            project_state["hero"] = hero

            media = project_state.get("media") if isinstance(project_state.get("media"), dict) else {}
            media["subject"] = generation.get("mediaSubject") or subject
            if not isinstance(media.get("queries"), list) or not media.get("queries"):
                media["queries"] = [media["subject"]]
            project_state["media"] = media

        project_state.pop("customCode", None)
        project_state.pop("galleryIntro", None)
        project_state["overrides"] = {}
        project_state["customElements"] = []

    generated_files = _make_generated_files(new_html, new_css, new_js, project_state)

    if page.get("html"):
        version = ProjectVersion(
            project_id=payload.project_id, user_id=user.user_id,
            page_path=payload.page_path,
            html=page.get("html", ""), css=page.get("css", ""), js=page.get("js", ""),
            note=f"Before: {payload.prompt[:60]}",
        )
        vdoc = version.model_dump()
        vdoc["created_at"] = vdoc["created_at"].isoformat()
        await db.project_versions.insert_one(vdoc)

    if payload.mode != "plan":
        pages = project.get("pages", []) or []
        if not any(p["path"] == payload.page_path for p in pages):
            page_doc = {"path": payload.page_path, "name": payload.page_path.strip("/").capitalize() or "Home",
                        "html": new_html, "css": new_css, "js": new_js}
            if project_state:
                page_doc["projectState"] = project_state
            page_doc["generatedFiles"] = generated_files
            pages.append(page_doc)
        else:
            for p in pages:
                if p["path"] == payload.page_path:
                    p["html"] = new_html; p["css"] = new_css; p["js"] = new_js
                    if project_state:
                        p["projectState"] = project_state
                    p["generatedFiles"] = generated_files
                    break

        set_doc = {"pages": pages, "updated_at": datetime.now(timezone.utc).isoformat()}
        if payload.page_path == "/":
            set_doc["html"] = new_html; set_doc["css"] = new_css; set_doc["js"] = new_js
            set_doc["projectState"] = project_state
            set_doc["generatedFiles"] = generated_files
        await db.projects.update_one({"project_id": payload.project_id}, {"$set": set_doc})

    asst_msg = ChatMessage(
        project_id=payload.project_id, user_id=user.user_id,
        role="assistant", content=summary, mode=payload.mode, page_path=payload.page_path,
    )
    adoc = asst_msg.model_dump()
    adoc["created_at"] = adoc["created_at"].isoformat()
    await db.chat_messages.insert_one(adoc)

    return {
        "summary": summary,
        "html": new_html,
        "css": new_css,
        "js": new_js,
        "projectState": project_state,
        "generatedFiles": generated_files,
        "mode": payload.mode,
    }


@api_router.get("/projects/{project_id}/messages")
async def get_messages(project_id: str, user: User = Depends(get_current_user)):
    await get_project_for_user(project_id, user, "viewer")
    docs = await db.chat_messages.find({"project_id": project_id}, {"_id": 0}).sort("created_at", 1).to_list(2000)
    return docs


@api_router.get("/projects/{project_id}/versions")
async def get_versions(project_id: str, user: User = Depends(get_current_user)):
    await get_project_for_user(project_id, user, "viewer")
    docs = await db.project_versions.find({"project_id": project_id}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


@api_router.post("/projects/{project_id}/restore/{version_id}")
async def restore_version(project_id: str, version_id: str, user: User = Depends(get_current_user)):
    project = await get_project_for_user(project_id, user, "editor")
    version = await db.project_versions.find_one(
        {"version_id": version_id, "project_id": project_id}, {"_id": 0}
    )
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    pages = project.get("pages", []) or []
    found = False
    for p in pages:
        if p["path"] == version.get("page_path", "/"):
            p["html"] = version["html"]; p["css"] = version["css"]; p["js"] = version["js"]
            found = True
            break
    if not found:
        pages.append({"path": version.get("page_path", "/"), "name": "Restored",
                       "html": version["html"], "css": version["css"], "js": version["js"]})

    set_doc = {"pages": pages, "updated_at": datetime.now(timezone.utc).isoformat()}
    if version.get("page_path", "/") == "/":
        set_doc["html"] = version["html"]; set_doc["css"] = version["css"]; set_doc["js"] = version["js"]
    await db.projects.update_one({"project_id": project_id}, {"$set": set_doc})
    doc = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    return doc


# ============================================================
# Export
# ============================================================
def _path_to_filename(path: str) -> str:
    if path == "/" or path == "":
        return "index.html"
    slug = path.strip("/").replace("/", "_") or "index"
    return f"{slug}.html"


@api_router.get("/projects/{project_id}/export")
async def export_project(project_id: str, user: User = Depends(get_current_user)):
    project = await get_project_for_user(project_id, user, "viewer")

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        pages = project.get("pages", []) or []
        if not pages:
            pages = [{"path": "/", "name": "Home",
                       "html": project.get("html") or "<html><body>Empty</body></html>",
                       "css": project.get("css") or "", "js": project.get("js") or ""}]
        for p in pages:
            filename = _path_to_filename(p["path"])
            zf.writestr(filename, p.get("html") or "<html><body>Empty</body></html>")
        # combined assets (page 0)
        zf.writestr("styles.css", pages[0].get("css") or "/* empty */")
        zf.writestr("script.js", pages[0].get("js") or "// empty")
        readme = (
            f"# {project.get('name', 'Galio Project')}\n\n"
            f"Generated by Galio AI Studio.\n\n"
            f"Pages:\n" + "\n".join(f"- {p['path']} ({_path_to_filename(p['path'])})" for p in pages) + "\n\n"
            f"Open index.html in a browser.\n"
        )
        zf.writestr("README.md", readme)
    buf.seek(0)
    safe_name = "".join(c for c in project.get("name", "project") if c.isalnum() or c in ("_", "-")) or "project"
    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=\"{safe_name}.zip\""},
    )


# ============================================================
# Templates
# ============================================================
TEMPLATES = [
    {"id": "tpl_portfolio", "name": "Personal Portfolio",
     "description": "Minimal dark portfolio with hero, projects, and contact.",
     "thumbnail": "https://static.prod-images.emergentagent.com/jobs/7603ccbe-97ca-4a50-a468-843d48ad91b0/images/9aa754c2219a7921f3d6e46331f48e33cf57ed32316505b87d13ca5ee4f6ad3d.png",
     "prompt": "A modern minimal personal portfolio for a senior product designer with hero, selected works grid, about, and contact form. Dark theme."},
    {"id": "tpl_saas", "name": "SaaS Landing",
     "description": "High-conversion SaaS landing page with features and pricing.",
     "thumbnail": "https://static.prod-images.emergentagent.com/jobs/7603ccbe-97ca-4a50-a468-843d48ad91b0/images/21c685e7be4b573ddf6984b614526721bd541818a79303d6dfb1860d5c1b3f2f.png",
     "prompt": "A premium SaaS landing page for an AI analytics product with hero, feature grid, testimonials, three-tier pricing, and CTA."},
    {"id": "tpl_restaurant", "name": "Restaurant",
     "description": "Elegant restaurant site with menu and reservation.",
     "thumbnail": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600",
     "prompt": "An elegant restaurant website for an Italian trattoria with hero image, signature menu, story, gallery, and reservation form."},
    {"id": "tpl_law", "name": "Law Firm",
     "description": "Trustworthy law firm site with practice areas.",
     "thumbnail": "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=600",
     "prompt": "A professional law firm website with hero, practice areas grid, attorneys section, case studies, and contact form. Navy and gold palette."},
    {"id": "tpl_camera", "name": "Camera Shop",
     "description": "E-commerce-style page for premium cameras.",
     "thumbnail": "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600",
     "prompt": "A premium camera shop landing page featuring a flagship mirrorless camera with hero, spec highlights, gallery, comparison, and CTA to buy."},
    {"id": "tpl_fitness", "name": "Fitness Coach",
     "description": "Bold landing for a personal trainer.",
     "thumbnail": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600",
     "prompt": "A bold landing page for a personal fitness coach with hero, transformations, programs, pricing tiers, and booking form."},
]


@api_router.get("/templates")
async def list_templates():
    return list_template_presets()


# ============================================================
# Component snippets palette
# ============================================================
COMPONENTS = [
    {"id": "cmp_hero", "name": "Hero — Centered", "category": "Hero",
     "snippet": "<section class=\"py-24 text-center\"><h1 class=\"text-5xl font-bold tracking-tight\">Your headline here</h1><p class=\"mt-4 text-lg text-gray-600\">A compelling subheading that sells the dream.</p><a class=\"mt-8 inline-block bg-black text-white px-6 py-3 rounded-md\" href=\"#\">Get started</a></section>"},
    {"id": "cmp_features", "name": "Features — 3 columns", "category": "Features",
     "snippet": "<section class=\"py-20\"><div class=\"max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8\"><div><h3 class=\"text-lg font-semibold\">Feature one</h3><p class=\"mt-2 text-gray-600\">Short description.</p></div><div><h3 class=\"text-lg font-semibold\">Feature two</h3><p class=\"mt-2 text-gray-600\">Short description.</p></div><div><h3 class=\"text-lg font-semibold\">Feature three</h3><p class=\"mt-2 text-gray-600\">Short description.</p></div></div></section>"},
    {"id": "cmp_pricing", "name": "Pricing — 3 tiers", "category": "Pricing",
     "snippet": "<section class=\"py-20\"><div class=\"max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6\"><div class=\"border rounded-xl p-6\"><div class=\"text-sm\">Starter</div><div class=\"mt-2 text-3xl font-bold\">$0</div></div><div class=\"border rounded-xl p-6 ring-2 ring-black\"><div class=\"text-sm\">Pro</div><div class=\"mt-2 text-3xl font-bold\">$29</div></div><div class=\"border rounded-xl p-6\"><div class=\"text-sm\">Team</div><div class=\"mt-2 text-3xl font-bold\">$99</div></div></div></section>"},
    {"id": "cmp_cta", "name": "Call to action", "category": "CTA",
     "snippet": "<section class=\"py-24 bg-black text-white text-center\"><h2 class=\"text-4xl font-bold\">Ready when you are.</h2><a class=\"mt-6 inline-block bg-white text-black px-6 py-3 rounded-md\" href=\"#\">Start now</a></section>"},
    {"id": "cmp_testimonial", "name": "Testimonial", "category": "Social proof",
     "snippet": "<section class=\"py-20\"><div class=\"max-w-3xl mx-auto px-6 text-center\"><p class=\"text-2xl italic\">“This product completely changed how our team ships.”</p><div class=\"mt-4 text-sm text-gray-500\">— Jane Doe, CEO of Acme</div></div></section>"},
    {"id": "cmp_footer", "name": "Footer", "category": "Footer",
     "snippet": "<footer class=\"py-10 border-t text-sm text-gray-500\"><div class=\"max-w-6xl mx-auto px-6 flex justify-between\"><div>© 2026 Your Company</div><div>Privacy · Terms</div></div></footer>"},
    {"id": "cmp_gallery", "name": "Image gallery", "category": "Media",
     "snippet": "<section class=\"py-20\"><div class=\"max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-3\"><img class=\"rounded-lg\" src=\"https://source.unsplash.com/400x400/?abstract,1\" alt=\"\"><img class=\"rounded-lg\" src=\"https://source.unsplash.com/400x400/?abstract,2\" alt=\"\"><img class=\"rounded-lg\" src=\"https://source.unsplash.com/400x400/?abstract,3\" alt=\"\"><img class=\"rounded-lg\" src=\"https://source.unsplash.com/400x400/?abstract,4\" alt=\"\"></div></section>"},
    {"id": "cmp_contact", "name": "Contact form", "category": "Forms",
     "snippet": "<section class=\"py-20\"><div class=\"max-w-xl mx-auto px-6\"><h2 class=\"text-3xl font-bold\">Get in touch</h2><form class=\"mt-6 grid gap-3\"><input class=\"border rounded-md px-3 py-2\" placeholder=\"Your name\"><input class=\"border rounded-md px-3 py-2\" placeholder=\"Email\"><textarea class=\"border rounded-md px-3 py-2 h-28\" placeholder=\"Message\"></textarea><button class=\"bg-black text-white py-2 rounded-md\">Send</button></form></div></section>"},
]


@api_router.get("/components")
async def list_components():
    return COMPONENTS


# ============================================================
# Mocked integrations
# ============================================================
@api_router.post("/integrations/github/push")
async def mock_github_push(payload: Dict[str, Any], user: User = Depends(get_current_user)):
    return {
        "ok": True, "mocked": True,
        "repo": f"github.com/{user.email.split('@')[0]}/{payload.get('repo_name', 'galio-site')}",
        "commit_sha": uuid.uuid4().hex[:7],
        "message": "MOCKED push to GitHub. Connect a real token to enable.",
    }


@api_router.post("/integrations/vercel/deploy")
async def mock_vercel_deploy(payload: Dict[str, Any], user: User = Depends(get_current_user)):
    slug = uuid.uuid4().hex[:6]
    return {
        "ok": True, "mocked": True,
        "url": f"https://galio-{slug}.vercel.app",
        "deployment_id": f"dpl_{uuid.uuid4().hex[:10]}",
        "message": "MOCKED deployment to Vercel. Connect a real token to enable.",
    }


@api_router.post("/projects/{project_id}/domain")
async def mock_connect_domain(project_id: str, payload: DomainConnectRequest, user: User = Depends(get_current_user)):
    await get_project_for_user(project_id, user, "owner")
    domain = payload.domain.strip().lower().replace("https://", "").replace("http://", "").rstrip("/")
    if not domain or " " in domain or "." not in domain:
        raise HTTPException(status_code=400, detail="Invalid domain")
    await db.projects.update_one(
        {"project_id": project_id},
        {"$set": {"custom_domain": domain, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    return {
        "ok": True, "mocked": True, "domain": domain,
        "dns_records": [
            {"type": "A", "host": "@", "value": "76.76.21.21"},
            {"type": "CNAME", "host": "www", "value": "cname.galio.app"},
        ],
        "message": "MOCKED. Add the DNS records at your registrar to activate.",
    }


@api_router.delete("/projects/{project_id}/domain")
async def mock_disconnect_domain(project_id: str, user: User = Depends(get_current_user)):
    await get_project_for_user(project_id, user, "owner")
    await db.projects.update_one(
        {"project_id": project_id},
        {"$set": {"custom_domain": None}},
    )
    return {"ok": True}


# ============================================================
# Health
# ============================================================
@api_router.get("/")
async def root():
    return {"service": "Galio AI Studio", "status": "ok", "version": "2.0"}


@api_router.get("/health")
async def health():
    return {"ok": True, "time": datetime.now(timezone.utc).isoformat()}


# Mount
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
