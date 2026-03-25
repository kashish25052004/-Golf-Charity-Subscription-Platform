import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      const result = await login(form);
      navigate(result.user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to login.");
    }
  }

  return (
    <section className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="eyebrow">Welcome back</p>
        <h1>Log in to your account</h1>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button className="primary-btn" type="submit">
          Login
        </button>
        <p className="helper-text">
          New here?{" "}
          <Link to="/register" className="inline-link">
            Create your account
          </Link>
        </p>
        <p className="helper-text">for admin panel(only shown here for the purpose of project, on real development it is not shared to anyone): admin@golfcharity.local / Admin@123</p>
      </form>
    </section>
  );
}
