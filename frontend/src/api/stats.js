// src/api/stats.js
import axios from "axios";

const API = "http://localhost:5000/api/stats";

export const getSummary = (token) =>
  axios.get(`${API}/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getOverview = (token) =>
  axios.get(`${API}/overview`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getConsistency = (token) =>
  axios.get(`${API}/consistency`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getTopicStrength = (token) =>
  axios.get(`${API}/topic-strength`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getHeatmap = (token) =>
  axios.get(`${API}/heatmap-dates`, {
    headers: { Authorization: `Bearer ${token}` },
  });
