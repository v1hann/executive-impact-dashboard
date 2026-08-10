import Link from "next/link";
import {
  getAllExecutives,
  getExecutive,
  getCompany,
  getImpact,
  tenureLabel,
} from "../../lib/data";

export async function getStaticPaths() {
  const paths = getAllExecutives().map((e) => ({ params: { id: e.id } }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const exec = getExecutive(params.id);
  const company = getCompany(exec.company_ticker);
  const impact = getImpact(exec.id);
  const tenure = tenureLabel(exec.date_joined);
  return { props: { exec, company, impact, tenure } };
}

function ImpactSection({ impact, company, exec }) {
  if (impact.status === "upcoming") {
    return (
      <div className="card">
        <p className="muted">{impact.message}</p>
      </div>
    );
  }
  if (impact.status === "unavailable") {
    return (
      <div className="card">
        <p className="muted">Stock performance data unavailable ({impact.message}).</p>
      </div>
    );
  }

  const stockUp = impact.stock_pct_change >= 0;
  const outUp = impact.outperformance_pct >= 0;

  return (
    <div>
      <p className="small">
        From {impact.start_date} to {impact.end_date} ({impact.tenure_days} days), tracking{" "}
        <strong>{company.name}</strong> ({impact.ticker}) share price against the NIFTY 50 index.
      </p>
      <div className="impact-box">
        <div className="metric">
          <div className={`value ${stockUp ? "" : ""}`} style={{ color: stockUp ? "#58d68d" : "#ff8686" }}>
            {stockUp ? "+" : ""}{impact.stock_pct_change}%
          </div>
          <div className="label">{company.name} stock price change since joining</div>
        </div>
        <div className="metric">
          <div className="value">
            {impact.index_pct_change >= 0 ? "+" : ""}{impact.index_pct_change}%
          </div>
          <div className="label">NIFTY 50 index change, same period</div>
        </div>
        <div className="metric">
          <div className="value" style={{ color: outUp ? "#58d68d" : "#ff8686" }}>
            {outUp ? "+" : ""}{impact.outperformance_pct} pts
          </div>
          <div className="label">Outperformance vs. NIFTY 50</div>
        </div>
        <div className="metric">
          <div className="value">₹{impact.start_price} → ₹{impact.end_price}</div>
          <div className="label">Share price then vs. now</div>
        </div>
      </div>
      <p className="muted small" style={{ marginTop: 10 }}>
        {outUp
          ? `${company.name}'s stock has outperformed the broader market by ${Math.abs(impact.outperformance_pct)} points since ${exec.name} joined — a positive signal, though many factors beyond one executive drive share performance.`
          : `${company.name}'s stock has trailed the broader market by ${Math.abs(impact.outperformance_pct)} points since ${exec.name} joined. This alone doesn't reflect on the executive — read it alongside company-specific context.`}
      </p>
      <p className="muted small">Live data fetched from Yahoo Finance. Generated {impact.generated_at.slice(0, 10)}.</p>
    </div>
  );
}

export default function ExecutivePage({ exec, company, impact, tenure }) {
  return (
    <div>
      <Link href={`/company/${company.ticker}`} className="back-link">← Back to {company.name}</Link>
      <h1>{exec.name}</h1>
      <p className="muted">
        {exec.role} at <strong>{company.name}</strong> · joined {exec.date_joined} · tenure so far: {tenure}
      </p>
      {exec.years_experience && <span className="badge">{exec.years_experience} yrs experience</span>}
      <span className="badge industry">{company.industry}</span>

      <h2>What's happened at {company.name} since {exec.name.split(" ")[0]} joined?</h2>
      <ImpactSection impact={impact} company={company} exec={exec} />

      <h2>Career History</h2>
      <div className="timeline">
        {exec.career_history.map((h, i) => (
          <div key={i} className={`timeline-item ${h.current ? "current" : ""}`}>
            <strong>{h.company}</strong>
            <div className="small">{h.role}</div>
            <div className="muted small">{h.period}{h.listed === false ? " · not publicly listed" : ""}</div>
          </div>
        ))}
      </div>

      <h2>Background</h2>
      <p className="small">{exec.career_note}</p>

      <h2>Sources</h2>
      <ul className="small">
        {exec.sources.map((s) => (
          <li key={s}>
            <a href={s} target="_blank" rel="noopener noreferrer" style={{ color: "#4f7cff" }}>{s}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
