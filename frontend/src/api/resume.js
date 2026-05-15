import api from "./axios";

export const uploadResumeDocument = async (formData) => {
  const res = await api.post("/resume/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: 120000,
  });

  return res.data;
};

export const uploadAndAnalyzeResume = async (formData) => {
  const res = await api.post("/resume/analyze", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: 180000,
  });

  return res.data;
};

export const getResumeDocuments = async () => {
  const res = await api.get("/resume/documents");
  return res.data;
};

export const getResumeDocumentById = async (resumeId) => {
  const res = await api.get(`/resume/documents/${resumeId}`);
  return res.data;
};

export const deleteResumeDocument = async (resumeId) => {
  const res = await api.delete(`/resume/documents/${resumeId}`);
  return res.data;
};

export const analyzeExistingResume = async (resumeId, payload = {}) => {
  const res = await api.post(`/resume/${resumeId}/analyze`, payload, {
    timeout: 180000,
  });

  return res.data;
};

export const getResumeAnalysisByResumeId = async (resumeId) => {
  const res = await api.get(`/resume/${resumeId}/analysis`);
  return res.data;
};

export const getLatestResumeAnalysis = async () => {
  const res = await api.get("/resume/latest-analysis");
  return res.data;
};