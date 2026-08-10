const companies = require("../data/companies.json");
const executives = require("../data/executives.json");
const stockCache = require("../data/stock_cache.json");

function getCompanies() {
  return companies;
}

function getCompany(ticker) {
  return companies.find((c) => c.ticker === ticker) || null;
}

function getAllExecutives() {
  return executives;
}

function getExecutivesForCompany(ticker) {
  return executives.filter((e) => e.company_ticker === ticker);
}

function getExecutive(id) {
  return executives.find((e) => e.id === id) || null;
}

function getImpact(executiveId) {
  return stockCache[executiveId] || { status: "unavailable", message: "No data cached." };
}

function tenureLabel(dateJoinedStr) {
  const joined = new Date(dateJoinedStr);
  const now = new Date();
  if (joined > now) return "Not yet joined";
  const days = Math.round((now - joined) / 86400000);
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  if (years === 0 && months === 0) return "< 1 month";
  const parts = [];
  if (years > 0) parts.push(`${years} yr${years > 1 ? "s" : ""}`);
  if (months > 0) parts.push(`${months} mo${months > 1 ? "s" : ""}`);
  return parts.join(" ");
}

// Builds the "leadership tracker" rows: every executive move, enriched with
// company/industry/previous-employer info for filtering.
function getTrackerRows() {
  return executives.map((e) => {
    const company = getCompany(e.company_ticker);
    const priorEntries = e.career_history.filter((h) => !h.current);
    const previous = priorEntries[priorEntries.length - 1] || null;
    return {
      id: e.id,
      name: e.name,
      role: e.role,
      company_ticker: e.company_ticker,
      company_name: company?.name || e.company_ticker,
      industry: company?.industry || "Unknown",
      cap_segment: company?.cap_segment || "large",
      date_joined: e.date_joined,
      previous_company: previous?.company || "—",
      years_experience: e.years_experience,
    };
  });
}

module.exports = {
  getCompanies,
  getCompany,
  getAllExecutives,
  getExecutivesForCompany,
  getExecutive,
  getImpact,
  tenureLabel,
  getTrackerRows,
};
