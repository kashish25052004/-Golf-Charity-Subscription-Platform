import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../state/AuthContext.jsx";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [charities, setCharities] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    plan: "monthly",
    charityId: "",
    charityPercentage: 10
  });
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/charities").then(({ data }) => {
      setCharities(data);
      if (data[0]) {
        setForm((current) => ({ ...current, charityId: data[0]._id }));
      }
    });
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to register.");
    }
  }

  return (
    <section className="auth-wrap">
      <form className="auth-card wide-card" onSubmit={handleSubmit}>
        <p className="eyebrow">Join the platform</p>
        <h1>Start with a plan</h1>
        <div className="field-grid">
          <label>
            Full name
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </label>
        </div>
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
        </label>
        <div className="field-grid">
          <label>
            Plan
            <select value={form.plan} onChange={(event) => setForm({ ...form, plan: event.target.value })}>
              <option value="monthly">Monthly - $29</option>
              <option value="yearly">Yearly - $299</option>
            </select>
          </label>
          <label>
            Preferred charity
            <select
              value={form.charityId}
              onChange={(event) => setForm({ ...form, charityId: event.target.value })}
            >
              {charities.map((charity) => (
                <option key={charity._id} value={charity._id}>
                  {charity.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Charity contribution percentage
          <input
            type="number"
            min="10"
            max="100"
            value={form.charityPercentage}
            onChange={(event) => setForm({ ...form, charityPercentage: event.target.value })}
            required
          />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button className="primary-btn" type="submit">
          Create Account
        </button>
      </form>
    </section>
  );
}
