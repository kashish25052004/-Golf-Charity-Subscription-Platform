import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function HomePage() {
  const [content, setContent] = useState({
    stats: { activeSubscribers: 0, totalRaised: 0, latestPrizePool: 0 },
    featuredCharities: [],
    latestDraw: null
  });

  useEffect(() => {
    api.get("/home").then(({ data }) => setContent(data)).catch(() => {});
  }, []);

  return (
    <div className="page-stack">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Golf, charity-driven</p>
          <h1>Designed to feel Emotionally Engaging and Modern </h1>
          <p className="hero-text">
            The platform is a subscription-driven web application combining golf performance tracking, charity fundraising, and
a monthly draw-based reward engine.Deliberately
avoiding the aesthetics of a traditional golf website.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="primary-btn">
              Start Your Subscription
            </Link>
            <a href="#charities" className="primary-btn">
              Explore charities
            </a>
          </div>
          <div className="stats-grid">
            <article>
              <strong>{content.stats.activeSubscribers}+</strong>
              <span>Active subscribers</span>
            </article>
            <article>
              <strong>${content.stats.totalRaised.toLocaleString()}</strong>
              <span>Raised for charities</span>
            </article>
            <article>
              <strong>${content.stats.latestPrizePool.toLocaleString()}</strong>
              <span>Latest prize pool</span>
            </article>
          </div>
        </div>
        <div className="hero-card">
          <span className="card-tag">Latest draw</span>
          <h3>{content.latestDraw ? content.latestDraw.monthKey : "Coming soon"}</h3>
          <p>
            Winning numbers:{" "}
            {content.latestDraw ? content.latestDraw.numbers.join(" • ") : "Awaiting publish"}
          </p>
          <p>
            Prize pool:{" "}
            {content.latestDraw ? `$${content.latestDraw.prizePool.toLocaleString()}` : "Building"}
          </p>
          <div className="pill-row">
            <span>Monthly</span>
            <span>Yearly</span>
            <span>Admin-verified</span>
          </div>
        </div>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <p className="eyebrow">How it works</p>
          <h2>Designed to feel modern, generous, and a little electric.</h2>
          <ul className="clean-list">
            <li>Subscribe to the platform (monthly or yearly)</li>
            <li>Enter their latest golf scores in Stableford format</li>
            <li>Participate in monthly draw-based prize pools</li>
            <li>Support a charity of their choice with a portion of their subscription</li>
          </ul>
        </article>
        <article className="panel accent-panel">
          <p className="eyebrow">Why this stands out</p>
          <h2>Gamified Experience,Play with Purpose, Real Rewards System, Simple Yet Smart Score Tracking, Intelligent Draw Engine</h2>
          <ul className="clean-list">
            <li>Turn everyday golf score tracking into an exciting, reward-driven experience with monthly draws.</li>
            <li>A portion of every subscription supports charities, allowing users to contribute while they play.</li>
            <li>Users get a chance to win real prizes through a structured draw system (3, 4, and 5 matches).</li>
          </ul>
        </article>
      </section>

      <section id="charities" className="charity-section">
        <div className="section-head">
          <p className="eyebrow">Featured charities</p>
          <h2>Every subscription supports a visible, trackable cause.</h2>
        </div>
        <div className="card-grid">
          {content.featuredCharities.map((charity) => (
            <article key={charity._id} className="charity-card">
              <div
                className="card-image"
                style={{
                  backgroundImage: `linear-gradient(135deg, rgba(8,20,24,0.2), rgba(8,20,24,0.65)), url(${charity.image})`
                }}
              />
              <div className="card-content">
                <h3>{charity.name}</h3>
                <p>{charity.summary}</p>
                <small>{charity.impactMetric}</small>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

