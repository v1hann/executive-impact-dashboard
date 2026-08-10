import { useMemo, useState } from "react";
import Link from "next/link";
import { getCompanies, getExecutivesForCompany } from "../lib/data";

export async function getStaticProps() {
  const companies = getCompanies().map((c) => ({
    ...c,
    recentHires: getExecutivesForCompany(c.ticker).length,
  }));
  return { props: { companies } };
}

export default function Home({ companies }) {
  const [query, setQuery] = useState("");
  const [capSegment, setCapSegment] = useState("");
  const [trackedOnly, setTrackedOnly] = useState(false);

  const industries = useMemo(
    () => Array.from(new Set(companies.map((c) => c.industry))).sort(),
    [companies]
  );

  const filtered = companies
    .filter((c) => {
      const q = query.trim().toLowerCase();
      if (q && !(
        c.name.toLowerCase().includes(q) ||
        c.ticker.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q)
      )) return false;
      if (capSegment && c.cap_segment !== capSegment) return false;
      if (trackedOnly && c.recentHires === 0) return false;
      return true;
    })
    .sort((a, b) => b.recentHires - a.recentHires || a.name.localeCompare(b.name));

  const trackedCount = companies.filter((c) => c.recentHires > 0).length;

  return (
    <div>
      <h1>Search a Company</h1>
      <p className="muted">
        {companies.length} NSE/BSE-listed companies (large & mid cap) — {trackedCount} with
        recent senior leadership hires tracked. Look one up to see who joined recently and
        how the business has performed since.
      </p>
      <input
        className="search-box"
        placeholder="Search by company name, ticker, or industry…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />

      <div className="filters" style={{ marginTop: 12 }}>
        <select value={capSegment} onChange={(e) => setCapSegment(e.target.value)}>
          <option value="">Large, Mid & Small Cap</option>
          <option value="large">Large Cap only</option>
          <option value="mid">Mid Cap only</option>
          <option value="small">Small Cap only</option>
        </select>
        <label className="small" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="checkbox"
            checked={trackedOnly}
            onChange={(e) => setTrackedOnly(e.target.checked)}
          />
          Only companies with tracked hires
        </label>
      </div>

      <h2>Companies ({filtered.length})</h2>
      <div className="grid">
        {filtered.map((c) => (
          <Link key={c.ticker} href={`/company/${c.ticker}`} className="card">
            <h3>{c.name}</h3>
            <div className="muted small">{c.ticker}</div>
            <div style={{ marginTop: 8 }}>
              <span className="badge industry">{c.industry}</span>
              <span className="badge">{c.cap_segment === "large" ? "Large Cap" : c.cap_segment === "mid" ? "Mid Cap" : "Small Cap"}</span>
            </div>
            <div className="muted small" style={{ marginTop: 8 }}>
              {c.recentHires > 0
                ? `${c.recentHires} recent senior hire${c.recentHires === 1 ? "" : "s"} tracked`
                : "No recent hires tracked yet"}
            </div>
          </Link>
        ))}
        {filtered.length === 0 && <div className="empty">No companies match "{query}".</div>}
      </div>
    </div>
  );
}
