import api from "./axios";

export const getStudyPlan = () => api.get("/study/plan");

export const getStudyTopics = (planId) => api.get(`/study/topics/${planId}`);

export const getTodayTasks = () => api.get("/study/tasks/today");

export const toggleTask = (id) => api.patch(`/study/tasks/${id}/toggle`);