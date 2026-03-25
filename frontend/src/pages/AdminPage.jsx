import { useEffect, useState } from "react";
import api from "../api";

export default function AdminPage() {
  const [dashboard, setDashboard] = useState({
    metrics: {},
    users: [],
    charities: [],
    draws: []
  });
  const [charityForm, setCharityForm] = useState({
    name: "",
    slug: "",
    summary: "",
    longDescription: "",
    image: "",
    impactMetric: ""
  });

  async function load() {
    const { data } = await api.get("/admin/dashboard");
    setDashboard(data);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function createCharity(event) {
    event.preventDefault();
    await api.post("/admin/charities", charityForm);
    setCharityForm({
      name: "",
      slug: "",
      summary: "",
      longDescription: "",
      image: "",
      impactMetric: ""
    });
    await load();
  }

  async function simulate(drawType) {
    await api.post("/admin/draws/simulate", { drawType });
    await load();
  }

  async function publish(monthKey) {
    await api.post(`/admin/draws/${monthKey}/publish`);
    await load();
  }

  async function updateWinnerStatus(drawId, winnerId, status) {
    await api.patch(`/admin/draws/${drawId}/winners/${winnerId}`, { status });
    await load();
  }

  return (
    <div className="dashboard-shell">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">Admin control center</p>
          <h1>Manage users, charities, draws, and payout verification.</h1>
        </div>
      </section>

      <section className="metrics-row">
        <article className="metric-card">
          <span>Total users</span>
          <strong>{dashboard.metrics.totalUsers || 0}</strong>
        </article>
        <article className="metric-card">
          <span>Active subscribers</span>
          <strong>{dashboard.metrics.activeSubscribers || 0}</strong>
        </article>
        <article className="metric-card">
          <span>Total prize pool</span>
          <strong>${dashboard.metrics.totalPrizePool || 0}</strong>
        </article>
        <article className="metric-card">
          <span>Raised for charity</span>
          <strong>${dashboard.metrics.totalRaised || 0}</strong>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <h2>Run draw</h2>
          <div className="pill-row">
            <button className="primary-btn" type="button" onClick={() => simulate("random")}>
              Simulate random
            </button>
            <button className="ghost-btn" type="button" onClick={() => simulate("algorithmic")}>
              Simulate algorithmic
            </button>
          </div>
          <div className="stack-list">
            {dashboard.draws.map((draw) => (
              <div key={draw._id} className="list-card">
                <strong>{draw.monthKey}</strong>
                <span>
                  {draw.drawType} | {draw.numbers.join(" • ")}
                </span>
                <span>Published: {draw.published ? "Yes" : "No"}</span>
                {!draw.published && (
                  <button className="primary-btn" type="button" onClick={() => publish(draw.monthKey)}>
                    Publish
                  </button>
                )}
                {draw.winners?.map((winner) => (
                  <div key={winner._id} className="winner-line">
                    <span>
                      {winner.user?.name || "User"} | {winner.matchCount} matches | ${winner.amount}
                    </span>
                    {winner.proofUrl && (
                      <a className="inline-link" href={winner.proofUrl} target="_blank" rel="noreferrer">
                        View proof
                      </a>
                    )}
                    <select
                      value={winner.status}
                      onChange={(event) => updateWinnerStatus(draw._id, winner._id, event.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="proof-submitted">Proof submitted</option>
                      <option value="verified">Verified</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <h2>Add charity</h2>
          <form className="stack-form" onSubmit={createCharity}>
            <input placeholder="Name" value={charityForm.name} onChange={(event) => setCharityForm({ ...charityForm, name: event.target.value })} required />
            <input placeholder="Slug" value={charityForm.slug} onChange={(event) => setCharityForm({ ...charityForm, slug: event.target.value })} required />
            <input placeholder="Summary" value={charityForm.summary} onChange={(event) => setCharityForm({ ...charityForm, summary: event.target.value })} required />
            <textarea placeholder="Long description" value={charityForm.longDescription} onChange={(event) => setCharityForm({ ...charityForm, longDescription: event.target.value })} required />
            <input placeholder="Image URL" value={charityForm.image} onChange={(event) => setCharityForm({ ...charityForm, image: event.target.value })} />
            <input placeholder="Impact metric" value={charityForm.impactMetric} onChange={(event) => setCharityForm({ ...charityForm, impactMetric: event.target.value })} />
            <button className="primary-btn" type="submit">
              Save charity
            </button>
          </form>
        </article>

        <article className="panel full-span">
          <h2>Users</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Charity %</th>
                  <th>Charity amount</th>
                  <th>Scores</th>
                  <th>Winnings</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{user.plan}</td>
                    <td>{user.subscriptionStatus}</td>
                    <td>{user.charityPercentage}%</td>
                    <td>${user.currentCycleCharityContribution}</td>
                    <td>{user.scores.map((score) => score.value).join(", ")}</td>
                    <td>${user.winningsTotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}
