import axios from "axios";

const RAW_BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const BACKEND_URL = RAW_BACKEND_URL.replace(/\/+$/, "").replace(/\/api$/, "");
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

// Auth
export const fetchMe = () => api.get("/auth/me").then((r) => r.data);
export const exchangeSession = (session_id) =>
  api.post("/auth/session", { session_id }).then((r) => r.data);
export const logout = () => api.post("/auth/logout").then((r) => r.data);

// Projects
export const listProjects = () => api.get("/projects").then((r) => r.data);
export const createProject = (payload) =>
  api.post("/projects", payload).then((r) => r.data);
export const getProject = (id) => api.get(`/projects/${id}`).then((r) => r.data);
export const updateProject = (id, payload) =>
  api.patch(`/projects/${id}`, payload).then((r) => r.data);
export const deleteProject = (id) =>
  api.delete(`/projects/${id}`).then((r) => r.data);

// AI
export const aiGenerate = (payload) =>
  api.post("/ai/generate", payload, { timeout: 180000 }).then((r) => r.data);

// Messages & versions
export const getMessages = (projectId) =>
  api.get(`/projects/${projectId}/messages`).then((r) => r.data);
export const getVersions = (projectId) =>
  api.get(`/projects/${projectId}/versions`).then((r) => r.data);
export const restoreVersion = (projectId, versionId) =>
  api.post(`/projects/${projectId}/restore/${versionId}`).then((r) => r.data);

// Pages
export const listPages = (projectId) =>
  api.get(`/projects/${projectId}/pages`).then((r) => r.data);
export const createPage = (projectId, payload) =>
  api.post(`/projects/${projectId}/pages`, payload).then((r) => r.data);
export const updatePage = (projectId, path, payload) =>
  api
    .patch(`/projects/${projectId}/pages`, payload, { params: { path } })
    .then((r) => r.data);
export const deletePage = (projectId, path) =>
  api
    .delete(`/projects/${projectId}/pages`, { params: { path } })
    .then((r) => r.data);

// Members
export const listMembers = (projectId) =>
  api.get(`/projects/${projectId}/members`).then((r) => r.data);
export const inviteMember = (projectId, payload) =>
  api.post(`/projects/${projectId}/invite`, payload).then((r) => r.data);
export const updateMemberRole = (projectId, memberUserId, role) =>
  api
    .patch(`/projects/${projectId}/members/${memberUserId}`, { role })
    .then((r) => r.data);
export const removeMember = (projectId, memberUserId) =>
  api.delete(`/projects/${projectId}/members/${memberUserId}`).then((r) => r.data);

// Templates & components
export const listTemplates = () => api.get("/templates").then((r) => r.data);
export const listComponents = () => api.get("/components").then((r) => r.data);

// Mocked integrations
export const pushToGithub = (payload) =>
  api.post("/integrations/github/push", payload).then((r) => r.data);
export const deployToVercel = (payload) =>
  api.post("/integrations/vercel/deploy", payload).then((r) => r.data);

// Mocked custom domain
export const connectDomain = (projectId, domain) =>
  api.post(`/projects/${projectId}/domain`, { domain }).then((r) => r.data);
export const disconnectDomain = (projectId) =>
  api.delete(`/projects/${projectId}/domain`).then((r) => r.data);

export const exportProjectUrl = (projectId) =>
  `${API}/projects/${projectId}/export`;
