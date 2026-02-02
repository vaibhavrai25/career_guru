import { useState, useContext } from "react";
import { loginUser } from "../api/auth";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault(); // ✅ important
    const data = await loginUser(form);
    login(data);
    navigate("/");
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="bg-pink-100 p-8 rounded shadow w-96">
        <h2 className="text-2xl font-bold mb-4">Login</h2>

        <form onSubmit={submit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="input"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            className="input mt-3"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />

          <button type="submit" className="btn mt-4 w-full">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
