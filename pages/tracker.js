import { useMemo, useState } from "react";
import Link from "next/link";
import { getTrackerRows } from "../lib/data";

export async function getStaticProps() {
  const rows = getTrackerRows();
  return { props: { rows } };
}

function uniqueSorted(values) {
  return Array.from(new Set(values)).sort();
}

export default function Tracker({ rows }) {
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [role, setRole] = useState("");
  const [previousCompany, setPreviousCompany] = useState("");
  const [since, setSince] = useState("");
  const [capSegment, setCapSegment] = useState("");

  const companies = useMemo(() => uniqueSorted(rows.map((r) => r.company_name)), [rows]);
  const industries = useMemo(() => uniqueSorted(rows.map((r) => r.industry)), [rows]);
  const roles = useMemo(() => uniqueSorted(rows.map((r) => r.role)), [rows]);
  const prevCompanies = useMemo(
    () => uniqueSorted(rows.map((r) => r.previous_company).filter((c) => c !== "—")),
    [rows]
  );

  const filtered = rows.filter((r) => {
    if (company && r.company_name !== company) return false;
    if (industry && r.industry !== industry) return false;
    if (role && r.role !== role) return false;
    if (previousCompany && r.previous_company !== previousCompany) return false;
    if (since && r.date_joined < since) return false;
    if (capSegment && r.cap_segment !== capSegment) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => (a.date_joined < b.date_joined ? 1 : -1));

  return (
    <div>
      <h1>Leadership Tracker</h1>
      <p className="muted">
        All tracked senior executive movements across listed companies. Filter to spot trends —
        e.g. companies repeatedly hiring from the same firm or industry.
      </p>

      <div className="filters">
        <select value={company} onChange={(e) => setCompany(e.target.value)}>
          <option value="">All companies</option>
          {companies.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={capSegment} onChange={(e) => setCapSegment(e.target.value)}>
          <option value="">Large, Mid & Small Cap</option>
          <option value="large">Large Cap only</option>
          <option value="mid">Mid Cap only</option>
          <option value="small">Small Cap only</option>
        </select>
        <select value={industry} onChange={(e) => setIndustry(e.target.value)}>
          <option value="">All industries</option>
          {industries.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          {roles.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={previousCompany} onChange={(e) => setPreviousCompany(e.target.value)}>
          <option value="">Any previous employer</option>
          {prevCompanies.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          type="date"
          value={since}
          onChange={(e) => setSince(e.target.value)}
          title="Joined on or after"
        />
      </div>

      <table>
        <thead>
          <tr>
            <th>Executive</th>
            <th>Role</th>
            <th>Company</th>
            <th>Cap</th>
            <th>Industry</th>
            <th>Joined</th>
            <th>Previous Company</th>
            <th>Experience</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.id}>
              <td><Link href={`/executive/${r.id}`} style={{ color: "#4f7cff" }}>{r.name}</Link></td>
              <td>{r.role}</td>
              <td><Link href={`/company/${r.company_ticker}`} style={{ color: "#9fb0cc" }}>{r.company_name}</Link></td>
              <td>{r.cap_segment === "large" ? "Large" : r.cap_segment === "mid" ? "Mid" : "Small"}</td>
              <td>{r.industry}</td>
              <td>{r.date_joined}</td>
              <td>{r.previous_company}</td>
              <td>{r.years_experience ? `${r.years_experience} yrs` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && <div className="empty">No moves match these filters.</div>}
    </div>
  );
}
