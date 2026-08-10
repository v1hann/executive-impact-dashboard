import Link from "next/link";
import {
  getCompanies,
  getCompany,
  getExecutivesForCompany,
  tenureLabel,
} from "../../lib/data";

export async function getStaticPaths() {
  const paths = getCompanies().map((c) => ({ params: { ticker: c.ticker } }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const company = getCompany(params.ticker);
  const executives = getExecutivesForCompany(params.ticker).map((e) => {
    const priorEntries = e.career_history.filter((h) => !h.current);
    const previous = priorEntries[priorEntries.length - 1] || null;
    return {
      id: e.id,
      name: e.name,
      role: e.role,
      date_joined: e.date_joined,
      previous_company: previous?.company || "—",
      previous_role: previous?.role || "—",
      years_experience: e.years_experience,
      tenure: tenureLabel(e.date_joined),
    };
  });
  return { props: { company, executives } };
}

export default function CompanyPage({ company, executives }) {
  return (
    <div>
      <Link href="/" className="back-link">← Back to search</Link>
      <h1>{company.name}</h1>
      <span className="badge industry">{company.industry}</span>
      <span className="badge">{company.ticker}</span>
      <span className="badge">{company.cap_segment === "large" ? "Large Cap" : company.cap_segment === "mid" ? "Mid Cap" : "Small Cap"}</span>

      <h2>Recent Leadership Hires</h2>
      <p className="muted">Senior executives who joined {company.name} recently.</p>

      <div className="grid" style={{ gridTemplateColumns: "1fr" }}>
        {executives.map((e) => (
          <Link key={e.id} href={`/executive/${e.id}`} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div>
                <h3>{e.name}</h3>
                <div className="muted small">{e.role}</div>
              </div>
              <div className="muted small" style={{ textAlign: "right" }}>
                Joined {e.date_joined}
                <br />
                Tenure so far: {e.tenure}
              </div>
            </div>
            <div style={{ marginTop: 10 }} className="small">
              Previously: <strong>{e.previous_role}</strong> at <strong>{e.previous_company}</strong>
              {e.years_experience ? ` · ${e.years_experience} yrs experience` : ""}
            </div>
          </Link>
        ))}
        {executives.length === 0 && (
          <div className="empty">No recent senior hires tracked for this company yet.</div>
        )}
      </div>
    </div>
  );
}
