"""Galio AI Studio - Backend integration tests"""
import os
import io
import zipfile
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://ai-builder-hub-88.preview.emergentagent.com").rstrip("/")
SESSION_TOKEN = os.environ.get("TEST_SESSION_TOKEN", "")

HEADERS = {"Authorization": f"Bearer {SESSION_TOKEN}", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def project_id():
    """Create a project and yield its id; clean up after."""
    r = requests.post(f"{BASE_URL}/api/projects",
                      json={"name": "TEST_Project", "prompt": "A small portfolio site"},
                      headers=HEADERS, timeout=30)
    assert r.status_code == 200, r.text
    pid = r.json()["project_id"]
    assert pid.startswith("prj_")
    yield pid
    requests.delete(f"{BASE_URL}/api/projects/{pid}", headers=HEADERS, timeout=30)


# ---------- Health & public ----------
class TestPublic:
    def test_health(self):
        r = requests.get(f"{BASE_URL}/api/", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["service"] == "Galio AI Studio"
        assert d["status"] == "ok"

    def test_templates(self):
        r = requests.get(f"{BASE_URL}/api/templates", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) == 6
        ids = {t["id"] for t in data}
        assert {"tpl_portfolio", "tpl_saas", "tpl_restaurant", "tpl_law", "tpl_camera", "tpl_fitness"} <= ids

    def test_me_unauth(self):
        r = requests.get(f"{BASE_URL}/api/auth/me", timeout=15)
        assert r.status_code == 401


# ---------- Auth ----------
class TestAuth:
    def test_me_with_token(self):
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=HEADERS, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "email" in d and "user_id" in d


# ---------- Projects ----------
class TestProjects:
    def test_create_list_get(self, project_id):
        # list
        r = requests.get(f"{BASE_URL}/api/projects", headers=HEADERS, timeout=20)
        assert r.status_code == 200
        ids = [p["project_id"] for p in r.json()]
        assert project_id in ids
        # get
        r2 = requests.get(f"{BASE_URL}/api/projects/{project_id}", headers=HEADERS, timeout=20)
        assert r2.status_code == 200
        assert r2.json()["name"] == "TEST_Project"

    def test_get_unknown_404(self):
        r = requests.get(f"{BASE_URL}/api/projects/prj_doesnotexist", headers=HEADERS, timeout=15)
        assert r.status_code == 404

    def test_patch(self, project_id):
        r = requests.patch(f"{BASE_URL}/api/projects/{project_id}",
                           json={"name": "TEST_Renamed", "html": "<!DOCTYPE html><html><body>hi</body></html>",
                                 "css": "body{}", "js": "//x"}, headers=HEADERS, timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert d["name"] == "TEST_Renamed"
        assert "<!DOCTYPE html>" in d["html"]


# ---------- AI Generation (slow) ----------
class TestAI:
    def test_build_then_refine(self, project_id):
        # Build
        r = requests.post(f"{BASE_URL}/api/ai/generate",
                          json={"project_id": project_id,
                                "prompt": "A simple landing page for a coffee shop named Brewly",
                                "mode": "build"},
                          headers=HEADERS, timeout=180)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["mode"] == "build"
        assert "summary" in data
        html = data.get("html", "")
        assert html and (("<!DOCTYPE html>" in html) or len(html) > 50)

        # Project should be updated
        r2 = requests.get(f"{BASE_URL}/api/projects/{project_id}", headers=HEADERS, timeout=15)
        assert r2.status_code == 200
        assert r2.json().get("html")

        # Refine
        r3 = requests.post(f"{BASE_URL}/api/ai/generate",
                           json={"project_id": project_id,
                                 "prompt": "Change hero headline to 'Best Coffee in Town'",
                                 "mode": "refine",
                                 "current_html": r2.json().get("html", "")},
                           headers=HEADERS, timeout=180)
        assert r3.status_code == 200, r3.text

        # Messages
        rm = requests.get(f"{BASE_URL}/api/projects/{project_id}/messages", headers=HEADERS, timeout=15)
        assert rm.status_code == 200
        msgs = rm.json()
        roles = {m["role"] for m in msgs}
        assert "user" in roles and "assistant" in roles

        # Versions (after refine, at least one snapshot)
        rv = requests.get(f"{BASE_URL}/api/projects/{project_id}/versions", headers=HEADERS, timeout=15)
        assert rv.status_code == 200
        versions = rv.json()
        assert len(versions) >= 1

        # Restore the first version
        vid = versions[0]["version_id"]
        rr = requests.post(f"{BASE_URL}/api/projects/{project_id}/restore/{vid}", headers=HEADERS, timeout=20)
        assert rr.status_code == 200


# ---------- Export ZIP ----------
class TestExport:
    def test_export_zip(self, project_id):
        r = requests.get(f"{BASE_URL}/api/projects/{project_id}/export", headers=HEADERS, timeout=30)
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("application/zip")
        zf = zipfile.ZipFile(io.BytesIO(r.content))
        names = zf.namelist()
        for f in ("index.html", "styles.css", "script.js", "README.md"):
            assert f in names


# ---------- Mocked integrations ----------
class TestMocks:
    def test_github_push(self):
        r = requests.post(f"{BASE_URL}/api/integrations/github/push",
                          json={"repo_name": "test-repo"}, headers=HEADERS, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["ok"] is True and d["mocked"] is True
        assert "repo" in d and "commit_sha" in d

    def test_vercel_deploy(self):
        r = requests.post(f"{BASE_URL}/api/integrations/vercel/deploy",
                          json={}, headers=HEADERS, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["ok"] is True and d["mocked"] is True
        assert "url" in d and "deployment_id" in d


# ---------- Delete / Logout ----------
class TestCleanup:
    def test_delete_and_logout(self):
        # Create a throwaway project
        r = requests.post(f"{BASE_URL}/api/projects",
                          json={"name": "TEST_ToDelete", "prompt": ""}, headers=HEADERS, timeout=15)
        pid = r.json()["project_id"]
        rd = requests.delete(f"{BASE_URL}/api/projects/{pid}", headers=HEADERS, timeout=15)
        assert rd.status_code == 200
        rg = requests.get(f"{BASE_URL}/api/projects/{pid}", headers=HEADERS, timeout=15)
        assert rg.status_code == 404
        # logout is destructive to the session, run last; skip if would break other tests
