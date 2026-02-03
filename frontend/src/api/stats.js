import axios from "axios";

const API = "http://localhost:5000/api";

export const getCodingStats = async (token) => {
  const res = await axios.get(`${API}/stats/sync`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
};
