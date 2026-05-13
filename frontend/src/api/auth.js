import api from "./axios";

export const registerUser = async (data) => {
  try {
    const res = await api.post("/auth/register", data);

    if (res.data?.token) {
      localStorage.setItem("token", res.data.token);
    }

    if (res.data?.user) {
      localStorage.setItem("user", JSON.stringify(res.data.user));
    }

    return res.data;
  } catch (err) {
    console.error("Register error:", err.response?.data || err.message);
    throw err;
  }
};

export const loginUser = async (data) => {
  try {
    const res = await api.post("/auth/login", data);

    if (res.data?.token) {
      localStorage.setItem("token", res.data.token);
    }

    if (res.data?.user) {
      localStorage.setItem("user", JSON.stringify(res.data.user));
    }

    return res.data;
  } catch (err) {
    console.error("Login error:", err.response?.data || err.message);
    throw err;
  }
};

export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};