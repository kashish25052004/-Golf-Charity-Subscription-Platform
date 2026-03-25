import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../state/AuthContext.jsx";

export default function DashboardPage() {
  const { setUser } = useAuth();
  const [data, setData] = useState({
    user: null,
    charities: [],
    latestDraw: null,
    participation: { enteredDraws: 0, upcomingDrawMonth: "", isEligible: false, winnerHistory: [] }
  });
  const [scoreForm, setScoreForm] = useState({ value: "", playedAt: "" });
  const [charityForm, setCharityForm] = useState({ charityId: "", charityPercentage: 10 });
  const [donationAmount, setDonationAmount] = useState("");

  async function load() {
    const { data } = await api.get("/subscriber/me");
    setData(data);
    setUser(data.user);
    setCharityForm({
      charityId: data.user.charity?._id || "",
      charityPercentage: data.user.charityPercentage || 10
    });
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  if (!data.user) {
    return <section className="dashboard-shell">Loading dashboard...</section>;
  }

  async function addScore(event) {
    event.preventDefault();
    await api.post("/subscriber/scores", {
      value: Number(scoreForm.value),
      playedAt: scoreForm.playedAt
    });
    setScoreForm({ value: "", playedAt: "" });
    await load();
  }

  async function saveCharityPreferences(event) {
    event.preventDefault();
    const response = await api.patch("/subscriber/charity", {
      charityId: charityForm.charityId,
      charityPercentage: Number(charityForm.charityPercentage)
    });
    setData((current) => ({ ...current, user: response.data.user }));
    setUser(response.data.user);
    await load();
  }

  async function updatePlan(plan) {
    const response = await api.patch("/subscriber/subscription", {
      plan,
      subscriptionStatus: "active",
      charityPercentage: Number(charityForm.charityPercentage)
    });
    setData((current) => ({ ...current, user: response.data.user }));
    setUser(response.data.user);
    await load();
  }

  async function submitProof(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await api.post("/subscriber/winner-proof", {
      drawId: formData.get("drawId"),
      proofUrl: formData.get("proofUrl")
    });
    event.currentTarget.reset();
    await load();
  }

  async function makeDonation(event) {
    event.preventDefault();
    await api.post("/subscriber/donations", { amount: Number(donationAmount) });
    setDonationAmount("");
    await load();
  }

  const currentWinner =
    data.latestDraw?.winners?.find((winner) => winner.user === data.user.id || winner.user?._id === data.user.id) ||
    null;

  return (
    <div className="dashboard-shell">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">Subscriber dashboard</p>
          <h1>{data.user.name}, your play is creating impact.</h1>
          <p>
            Subscription: {data.user.plan} | Status: {data.user.subscriptionStatus} | Total winnings: $
            {data.user.winningsTotal}
          </p>
        </div>
        <div className="dashboard-badge">
          <span>Renews</span>
          <strong>{new Date(data.user.subscriptionRenewsAt).toLocaleDateString()}</strong>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <h2>Last five scores</h2>
          <ul className="score-list">
            {data.user.scores.map((score) => (
              <li key={score._id}>
                <strong>{score.value}</strong>
                <span>{new Date(score.playedAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
          <form className="inline-form" onSubmit={addScore}>
            <input
              type="number"
              min="1"
              max="45"
              placeholder="Stableford"
              value={scoreForm.value}
              onChange={(event) => setScoreForm({ ...scoreForm, value: event.target.value })}
              required
            />
            <input
              type="date"
              value={scoreForm.playedAt}
              onChange={(event) => setScoreForm({ ...scoreForm, playedAt: event.target.value })}
              required
            />
            <button className="primary-btn" type="submit">
              Add score
            </button>
          </form>
        </article>

        <article className="panel">
          <h2>Preferred charity</h2>
          <form className="stack-form" onSubmit={saveCharityPreferences}>
            <select
              value={charityForm.charityId}
              onChange={(event) => setCharityForm({ ...charityForm, charityId: event.target.value })}
            >
              {data.charities.map((charity) => (
                <option key={charity._id} value={charity._id}>
                  {charity.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="10"
              max="100"
              value={charityForm.charityPercentage}
              onChange={(event) =>
                setCharityForm({ ...charityForm, charityPercentage: event.target.value })
              }
            />
            <button className="primary-btn" type="submit">
              Save charity settings
            </button>
          </form>
          <p>{data.user.charity?.summary}</p>
          <small>{data.user.charity?.impactMetric}</small>
          <p>
            Charity percentage: <strong>{data.user.charityPercentage}%</strong>
          </p>
          <p>
            Current cycle contribution: <strong>${data.user.currentCycleCharityContribution}</strong>
          </p>
          <form className="inline-form inline-form-tight" onSubmit={makeDonation}>
            <input
              type="number"
              min="1"
              step="0.01"
              placeholder="Independent donation"
              value={donationAmount}
              onChange={(event) => setDonationAmount(event.target.value)}
              required
            />
            <button className="primary-btn" type="submit">
              Donate
            </button>
          </form>
          <small>Independent donated total: ${data.user.independentDonationTotal}</small>
        </article>

        <article className="panel">
          <h2>Subscription</h2>
          <div className="pill-row">
            <button className="pill-btn" type="button" onClick={() => updatePlan("monthly")}>
              Monthly
            </button>
            <button className="pill-btn" type="button" onClick={() => updatePlan("yearly")}>
              Yearly
            </button>
          </div>
          <p>
            Current subscription amount: <strong>${data.user.subscriptionAmount}</strong>
          </p>
          <p>
            Status + renewal: <strong>{data.user.subscriptionStatus}</strong> until{" "}
            <strong>{new Date(data.user.subscriptionRenewsAt).toLocaleDateString()}</strong>
          </p>
        </article>

        <article className="panel">
          <h2>Latest published draw</h2>
          {data.latestDraw ? (
            <>
              <p>{data.latestDraw.monthKey}</p>
              <p>{data.latestDraw.numbers.join(" • ")}</p>
              <p>Prize pool: ${data.latestDraw.prizePool}</p>
              {currentWinner ? (
                <>
                  <p>
                    Your result: {currentWinner.matchCount}-match | Payment status:{" "}
                    <strong>{currentWinner.status}</strong>
                  </p>
                  <form className="stack-form" onSubmit={submitProof}>
                    <input type="hidden" name="drawId" value={data.latestDraw._id} />
                    <input name="proofUrl" placeholder="Winner proof URL" required />
                    <button className="primary-btn" type="submit">
                      Submit proof
                    </button>
                  </form>
                </>
              ) : (
                <p>You were not a winner in this published draw.</p>
              )}
            </>
          ) : (
            <p>No draw has been published yet.</p>
          )}
        </article>

        <article className="panel">
          <h2>Participation summary</h2>
          <p>Draws entered: {data.participation.enteredDraws}</p>
          <p>Upcoming draw month: {data.participation.upcomingDrawMonth || "Not available"}</p>
          <p>Eligibility: {data.participation.isEligible ? "Eligible" : "Add scores to become eligible"}</p>
        </article>

        <article className="panel">
          <h2>Winnings overview</h2>
          {data.participation.winnerHistory.length ? (
            <div className="stack-list">
              {data.participation.winnerHistory.map((item) => (
                <div key={item.drawId} className="list-card compact-card">
                  <strong>{item.monthKey}</strong>
                  <span>
                    {item.matchCount}-match | ${item.amount}
                  </span>
                  <span>Payment status: {item.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p>No winnings yet.</p>
          )}
        </article>
      </section>
    </div>
  );
}
