"""Galio AI Studio v2 - tests for pages, RBAC, invites, domain, components, export."""
import io
import os
import zipfile

import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")

OWNER_TOKEN = "owner_tok_1779774098664"
OWNER_ID = "test-owner-1779774098664"
INVITEE_TOKEN = "invitee_tok_1779774098664"
INVITEE_ID = "test-invitee-1779774098664"
INVITEE_EMAIL = "galio.invitee.1779774098664@example.com"

OWNER_H = {"Authorization": f"Bearer {OWNER_TOKEN}", "Content-Type": "application/json"}
INV_H = {"Authorization": f"Bearer {INVITEE_TOKEN}", "Content-Type": "application/json"}


# ---------- Components (public-ish, requires auth? endpoint has no Depends — public) ----------
class TestComponents:
    def test_list_components_no_auth(self):
        r = requests.get(f"{BASE_URL}/api/components", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, list) and len(data) >= 6
        first = data[0]
        for k in ("id", "name", "category", "snippet"):
            assert k in first


# ---------- Project creation: pages + members default ----------
@pytest.fixture(scope="module")
def project_id():
    r = requests.post(f"{BASE_URL}/api/projects",
                      json={"name": "TEST_v2_Project", "prompt": "v2 test"},
                      headers=OWNER_H, timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    pid = data["project_id"]
    # default page + member
    assert data["pages"] and data["pages"][0]["path"] == "/"
    assert data["pages"][0]["name"] == "Home"
    assert data["members"] and data["members"][0]["role"] == "owner"
    yield pid
    requests.delete(f"{BASE_URL}/api/projects/{pid}", headers=OWNER_H, timeout=20)


class TestProjectsListing:
    def test_owner_sees_project(self, project_id):
        r = requests.get(f"{BASE_URL}/api/projects", headers=OWNER_H, timeout=15)
        assert r.status_code == 200
        ids = [p["project_id"] for p in r.json()]
        assert project_id in ids
        # role attribute attached
        for p in r.json():
            if p["project_id"] == project_id:
                assert p.get("role") == "owner"


# ---------- Pages CRUD ----------
class TestPages:
    def test_create_page_normalises_path(self, project_id):
        r = requests.post(f"{BASE_URL}/api/projects/{project_id}/pages",
                          json={"path": "about", "name": "About"},
                          headers=OWNER_H, timeout=15)
        assert r.status_code == 200, r.text
        assert r.json()["path"] == "/about"

    def test_create_duplicate_page_400(self, project_id):
        # /about already exists from previous test
        r = requests.post(f"{BASE_URL}/api/projects/{project_id}/pages",
                          json={"path": "/about", "name": "About"},
                          headers=OWNER_H, timeout=15)
        assert r.status_code == 400

    def test_patch_about_page(self, project_id):
        r = requests.patch(f"{BASE_URL}/api/projects/{project_id}/pages?path=/about",
                           json={"html": "<html><body>About v2</body></html>",
                                 "css": "body{}", "js": "//a"},
                           headers=OWNER_H, timeout=15)
        assert r.status_code == 200, r.text
        assert "About v2" in r.json()["html"]

    def test_patch_home_mirrors_top_level(self, project_id):
        r = requests.patch(f"{BASE_URL}/api/projects/{project_id}/pages?path=/",
                           json={"html": "<html><body>HOME_HTML_V2</body></html>"},
                           headers=OWNER_H, timeout=15)
        assert r.status_code == 200
        # Verify top-level mirror
        rg = requests.get(f"{BASE_URL}/api/projects/{project_id}", headers=OWNER_H, timeout=15)
        assert "HOME_HTML_V2" in rg.json()["html"]

    def test_delete_home_blocked(self, project_id):
        r = requests.delete(f"{BASE_URL}/api/projects/{project_id}/pages?path=/",
                            headers=OWNER_H, timeout=15)
        assert r.status_code == 400


# ---------- Collaboration / RBAC ----------
class TestCollaboration:
    def test_invite_invalid_role_400(self, project_id):
        r = requests.post(f"{BASE_URL}/api/projects/{project_id}/invite",
                          json={"email": "x@example.com", "role": "owner"},
                          headers=OWNER_H, timeout=15)
        assert r.status_code == 400

    def test_invite_member(self, project_id):
        r = requests.post(f"{BASE_URL}/api/projects/{project_id}/invite",
                          json={"email": INVITEE_EMAIL, "role": "editor"},
                          headers=OWNER_H, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["role"] == "editor"
        assert d["email"] == INVITEE_EMAIL.lower()
        # invited user_id should match existing user since they're seeded
        assert d["user_id"] == INVITEE_ID

    def test_invite_duplicate_400(self, project_id):
        r = requests.post(f"{BASE_URL}/api/projects/{project_id}/invite",
                          json={"email": INVITEE_EMAIL, "role": "viewer"},
                          headers=OWNER_H, timeout=15)
        assert r.status_code == 400

    def test_invitee_sees_project(self, project_id):
        r = requests.get(f"{BASE_URL}/api/projects", headers=INV_H, timeout=15)
        assert r.status_code == 200
        found = next((p for p in r.json() if p["project_id"] == project_id), None)
        assert found is not None, "invitee should see shared project"
        assert found.get("role") == "editor"

    def test_editor_can_patch(self, project_id):
        r = requests.patch(f"{BASE_URL}/api/projects/{project_id}",
                           json={"description": "edited by invitee"},
                           headers=INV_H, timeout=15)
        assert r.status_code == 200

    def test_editor_cannot_invite(self, project_id):
        r = requests.post(f"{BASE_URL}/api/projects/{project_id}/invite",
                          json={"email": "other@example.com", "role": "viewer"},
                          headers=INV_H, timeout=15)
        assert r.status_code == 403

    def test_editor_cannot_connect_domain(self, project_id):
        r = requests.post(f"{BASE_URL}/api/projects/{project_id}/domain",
                          json={"domain": "noinvitee.com"},
                          headers=INV_H, timeout=15)
        assert r.status_code == 403

    def test_demote_invitee_to_viewer(self, project_id):
        r = requests.patch(f"{BASE_URL}/api/projects/{project_id}/members/{INVITEE_ID}",
                           json={"role": "viewer"}, headers=OWNER_H, timeout=15)
        assert r.status_code == 200
        assert r.json()["role"] == "viewer"

    def test_viewer_cannot_patch(self, project_id):
        r = requests.patch(f"{BASE_URL}/api/projects/{project_id}",
                           json={"description": "viewer attempt"},
                           headers=INV_H, timeout=15)
        assert r.status_code == 403

    def test_viewer_cannot_create_page(self, project_id):
        r = requests.post(f"{BASE_URL}/api/projects/{project_id}/pages",
                          json={"path": "/blocked", "name": "Blocked"},
                          headers=INV_H, timeout=15)
        assert r.status_code == 403

    def test_change_owner_role_blocked(self, project_id):
        r = requests.patch(f"{BASE_URL}/api/projects/{project_id}/members/{OWNER_ID}",
                           json={"role": "viewer"}, headers=OWNER_H, timeout=15)
        assert r.status_code == 400

    def test_remove_owner_blocked(self, project_id):
        r = requests.delete(f"{BASE_URL}/api/projects/{project_id}/members/{OWNER_ID}",
                            headers=OWNER_H, timeout=15)
        assert r.status_code == 400

    def test_remove_member(self, project_id):
        r = requests.delete(f"{BASE_URL}/api/projects/{project_id}/members/{INVITEE_ID}",
                            headers=OWNER_H, timeout=15)
        assert r.status_code == 200
        # Invitee no longer sees the project
        rl = requests.get(f"{BASE_URL}/api/projects", headers=INV_H, timeout=15)
        assert rl.status_code == 200
        assert not any(p["project_id"] == project_id for p in rl.json())


# ---------- Domain (mocked) ----------
class TestDomain:
    def test_connect_domain_owner(self, project_id):
        r = requests.post(f"{BASE_URL}/api/projects/{project_id}/domain",
                          json={"domain": "Mysite.com"}, headers=OWNER_H, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["mocked"] is True
        assert d["domain"] == "mysite.com"
        assert isinstance(d["dns_records"], list) and len(d["dns_records"]) >= 2

        rg = requests.get(f"{BASE_URL}/api/projects/{project_id}", headers=OWNER_H, timeout=15)
        assert rg.json().get("custom_domain") == "mysite.com"

    def test_invalid_domain_400(self, project_id):
        r = requests.post(f"{BASE_URL}/api/projects/{project_id}/domain",
                          json={"domain": "not a domain"}, headers=OWNER_H, timeout=15)
        assert r.status_code == 400

    def test_disconnect_domain(self, project_id):
        r = requests.delete(f"{BASE_URL}/api/projects/{project_id}/domain",
                            headers=OWNER_H, timeout=15)
        assert r.status_code == 200
        rg = requests.get(f"{BASE_URL}/api/projects/{project_id}", headers=OWNER_H, timeout=15)
        assert rg.json().get("custom_domain") in (None, "")


# ---------- Page deletion + export multi-page ----------
class TestPageDeletionAndExport:
    def test_export_includes_about_html(self, project_id):
        r = requests.get(f"{BASE_URL}/api/projects/{project_id}/export",
                         headers=OWNER_H, timeout=30)
        assert r.status_code == 200
        zf = zipfile.ZipFile(io.BytesIO(r.content))
        names = zf.namelist()
        assert "index.html" in names
        assert "about.html" in names
        assert "styles.css" in names
        assert "script.js" in names
        assert "README.md" in names

    def test_delete_about_page(self, project_id):
        r = requests.delete(f"{BASE_URL}/api/projects/{project_id}/pages?path=/about",
                            headers=OWNER_H, timeout=15)
        assert r.status_code == 200
        rg = requests.get(f"{BASE_URL}/api/projects/{project_id}/pages",
                          headers=OWNER_H, timeout=15)
        assert not any(p["path"] == "/about" for p in rg.json())


# ---------- Backwards compat: legacy project missing pages array ----------
class TestLegacyBackfill:
    def test_legacy_project_synthesizes_pages(self):
        # Look for the legacy project from iteration 1 fixture (prj_2b5e42c7d67b) — owned by previous user
        # so we can't fetch it. Instead, simulate by creating one via direct insert.
        import pymongo, os as _os
        cli = pymongo.MongoClient(_os.environ["MONGO_URL"])
        db = cli[_os.environ["DB_NAME"]]
        legacy_id = "prj_legacy_test_v2"
        db.projects.delete_one({"project_id": legacy_id})
        db.projects.insert_one({
            "project_id": legacy_id, "user_id": OWNER_ID,
            "name": "TEST_Legacy", "html": "<html>old</html>", "css": "x{}", "js": "//y",
            "members": [{"user_id": OWNER_ID, "email": "x", "role": "owner"}],
            "created_at": "2025-01-01T00:00:00+00:00",
            "updated_at": "2025-01-01T00:00:00+00:00",
        })
        try:
            r = requests.get(f"{BASE_URL}/api/projects/{legacy_id}", headers=OWNER_H, timeout=15)
            assert r.status_code == 200, r.text
            data = r.json()
            assert data["pages"] and data["pages"][0]["path"] == "/"
            assert "old" in data["pages"][0]["html"]
        finally:
            db.projects.delete_one({"project_id": legacy_id})
            cli.close()
