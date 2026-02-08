import api from "./axios";

export const getSummary = () => api.get("/stats/summary");

export const getOverview = () => api.get("/stats/overview");

export const getConsistency = () => api.get("/stats/consistency");

export const getTopicStrength = () => api.get("/stats/topic-strength");

export const getHeatmap = () => api.get("/stats/heatmap-dates");