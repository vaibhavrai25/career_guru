import axios from "axios";
const API = "http://localhost:5000/api/study";

export const getStudyPlan = (token) =>
  axios.get(`${API}/plan`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getStudyTopics = (planId, token) =>
  axios.get(`${API}/topics/${planId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getTodayTasks = (token) =>
  axios.get(`${API}/tasks/today`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const toggleTask = (id, token) =>
  axios.patch(`${API}/tasks/${id}/toggle`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
