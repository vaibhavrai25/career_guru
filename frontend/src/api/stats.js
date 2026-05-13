import api from "./axios";

/**
 * 1. CORE ANALYTICS & DASHBOARD
 */
export const getDashboard = async () => {
  const res = await api.get("/stats/dashboard");
  return res.data;
};

export const getGitHubRepos = async () => {
  const res = await api.get("/stats/github-repos");
  return res.data;
};

/**
 * 2. PLATFORM SYNC OPERATIONS
 */
export const syncAllPlatforms = async () => {
  const res = await api.get("/stats/sync/all");
  return res.data;
};

export const syncLeetCode = async () => {
  const res = await api.get("/stats/sync/leetcode");
  return res.data;
};

export const syncCodeforces = async () => {
  const res = await api.get("/stats/sync/codeforces");
  return res.data;
};

export const syncCodechef = async () => {
  const res = await api.get("/stats/sync/codechef");
  return res.data;
};

export const syncGitHub = async () => {
  const res = await api.get("/stats/sync/github");
  return res.data;
};

export const buildHistory = async () => {
  const res = await api.get("/stats/build-history");
  return res.data;
};

/**
 * 3. DEEP CODING ANALYTICS READ ENDPOINTS
 */
export const getSubmissions = async (params = {}) => {
  const res = await api.get("/stats/submissions", { params });
  return res.data;
};

export const getContestHistory = async (params = {}) => {
  const res = await api.get("/stats/contests/history", { params });
  return res.data;
};

export const getUpcomingContests = async (params = {}) => {
  const res = await api.get("/stats/contests/upcoming", { params });
  return res.data;
};

export const getDeepGitHubRepos = async (params = {}) => {
  const res = await api.get("/stats/github/deep-repos", { params });
  return res.data;
};

export const getAnalyticsSnapshots = async (params = {}) => {
  const res = await api.get("/stats/analytics/snapshots", { params });
  return res.data;
};

/**
 * 4. STUDY PLAN & TASK MANAGEMENT
 */
export const getStudyPlan = async () => {
  const res = await api.get("/study/plan");
  return res.data;
};

export const getTasks = async () => {
  const res = await api.get("/study/tasks");
  return res.data;
};

export const getTodayTasks = async () => {
  const res = await api.get("/study/tasks/today");
  return res.data;
};

export const addTask = async (taskData) => {
  const res = await api.post("/study/tasks", taskData);
  return res.data;
};

export const toggleTask = async (taskId) => {
  const res = await api.patch(`/study/tasks/${taskId}/toggle`);
  return res.data;
};

export const deleteTask = async (taskId) => {
  const res = await api.delete(`/study/tasks/${taskId}`);
  return res.data;
};

/**
 * 5. AI STUDY INTELLIGENCE
 */
export const generateAIRecommendations = async (category) => {
  const res = await api.post("/study/generate-ai", { category });
  return res.data;
};

export const getTopicProgress = async () => {
  const res = await api.get("/study/progress");
  return res.data;
};

/**
 * 6. SMALL HELPERS FOR FRONTEND FILTERING
 */
export const getPlatformSubmissions = async (platform, params = {}) => {
  return getSubmissions({ platform, ...params });
};

export const getAcceptedSubmissions = async (params = {}) => {
  return getSubmissions({ isAccepted: true, ...params });
};

export const getPlatformContestHistory = async (platform, params = {}) => {
  return getContestHistory({ platform, ...params });
};

export const getPlatformUpcomingContests = async (platform, params = {}) => {
  return getUpcomingContests({ platform, ...params });
};