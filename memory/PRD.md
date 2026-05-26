# Galio AI Studio — Product Requirements Document

## Original Problem Statement
Build a production-ready AI Website Builder called Galio AI Studio with a Hercules-style workflow (Plan / Build / Debug / Refine / Publish). AI chat panel, live preview canvas, code panel, device preview, undo/redo, templates, version history, export, GitHub push, Vercel deploy.

## Architecture
- **Stack**: React (CRA) + FastAPI + MongoDB (Emergent platform)
- **LLM**: Claude Sonnet 4.5 via Emergent Universal Key (`emergentintegrations`)
- **Auth**: Emergent-managed Google OAuth (cookie-based session_token)
- **Mocked integrations**: GitHub push, Vercel deploy

## User Personas
- **Solo founder** — wants a marketing site in minutes
- **Designer** — needs quick prototypes for client pitches
- **Indie developer** — wants a starting point they can edit

## Core Requirements (static)
- Sign in with Google
- Dashboard of projects with templates
- 3-panel Studio: AI chat (left) + Preview canvas (center) + Code panel (right)
- 5 modes: Plan / Build / Debug / Refine / Publish
- Device toggle (Desktop/Tablet/Mobile)
- Undo/Redo, Version history & restore
- Export ZIP, mocked GitHub push, mocked Vercel deploy
- Universal AI architecture (any topic)

## What's Been Implemented (Feb 2026 — initial release)
- Backend (`/app/backend/server.py`)
  - Emergent Google auth (`/api/auth/session`, `/api/auth/me`, `/api/auth/logout`)
  - Projects CRUD (`/api/projects`, GET/POST/PATCH/DELETE)
  - AI generation with Claude Sonnet 4.5 (`/api/ai/generate`) with plan/build/refine/debug modes
  - Chat messages history (`/api/projects/{id}/messages`)
  - Version snapshots + restore (`/api/projects/{id}/versions`, `/restore/{vid}`)
  - Export project as ZIP (`/api/projects/{id}/export`)
  - Mocked GitHub push (`/api/integrations/github/push`)
  - Mocked Vercel deploy (`/api/integrations/vercel/deploy`)
  - Built-in templates catalog (`/api/templates`)
- Frontend
  - Landing page (`/`) with hero + features + workflow + CTA
  - AuthCallback for Emergent OAuth
  - Dashboard with projects grid, templates dialog, new-project flow
  - Studio workspace: 3-panel grid with Chat / Preview / Code
  - Device toggle, undo/redo, versions dialog, code editor with copy/save
  - Sonner toasts (incl. MOCKED labels for GitHub & Vercel)

## Prioritized Backlog
- **P0** — Real GitHub OAuth push (currently mocked)
- **P0** — Real Vercel token-based deploy (currently mocked)
- **P1** — Drag-and-drop visual editor with element inspector
- **P1** — Component library palette (hero, pricing, footer presets)
- **P1** — Streaming AI responses (server-sent events)
- **P2** — Multi-page sites (currently single-page)
- **P2** — Custom domain + share link
- **P2** — Collaboration / team workspaces
