import axios from "axios";

const API = "http://localhost:5000/api/auth";

export const registerUser = async (data) => {
  const res = await axios.post(`${API}/register`, data);
  return res.data;
};





export const loginUser = async (data) => {
  try {
    console.log("Sending to backend:", data);   // 👈 add
    const res = await axios.post(`${API}/login`, data);
    console.log("Backend response:", res.data); // 👈 add
    return res.data;
  } catch (err) {
    console.log("Full error:", err.response?.data); // 👈 add
    throw err;
  }
};

