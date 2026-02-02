import { useState } from "react";
import { registerUser } from "../api/auth";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const submit = async (e) => {
    e.preventDefault(); // ✅ prevent refresh
    await registerUser(form);
    alert("Registered successfully. Now login.");
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="bg-red-100 p-8 rounded shadow w-96">
        <h2 className="text-2xl font-bold mb-4">Register</h2>

        <form onSubmit={submit}>
          <input
            type="text"
            name="name"
            placeholder="Name"
            className="input"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            className="input mt-3"
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
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
