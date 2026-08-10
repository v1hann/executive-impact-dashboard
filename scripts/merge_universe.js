// Merges the broad Nifty 100 / Midcap 150 research (data/nifty_universe_raw.json) into
// data/companies.json, skipping tickers already present, and backfills a cap_segment
// field ("large" | "mid") on every company for filtering.

const fs = require("fs");
const path = require("path");

const companiesPath = path.join(__dirname, "..", "data", "companies.json");
const universePath = path.join(__dirname, "..", "data", "nifty_universe_raw.json");

const companies = JSON.parse(fs.readFileSync(companiesPath, "utf8"));
const universe = JSON.parse(fs.readFileSync(universePath, "utf8"));

// Manual cap_segment classification for companies already curated by the executive-hire
// research agents (not present in the raw universe fetch, or present under a different name).
const manualCapSegment = {
  KOTAKBANK: "large", WIPRO: "large", TECHM: "large", LTIM: "large",
  BANDHANBNK: "mid", INDUSINDBK: "large", HDFCBANK: "large", BHARTIARTL: "large",
  BRITANNIA: "large", HEROMOTOCO: "large", DRREDDY: "large", CIPLA: "large",
  ADANIENSOL: "mid", LT: "large", INDIGO: "large", FEDERALBNK: "mid",
  SBIN: "large", SBILIFE: "large", ICICIPRULI: "mid", BAJAJFINSV: "large",
  CHOLAFIN: "mid", BAJFINANCE: "large", "M&M": "large", MARUTI: "large",
  ASHOKLEY: "mid", BHARATFORG: "mid", TVSMOTOR: "large", HINDALCO: "large",
  JSWSTEEL: "large", JINDALSTEL: "mid", VEDL: "large", NMDC: "mid",
  TORNTPOWER: "mid", ONGC: "large", POWERGRID: "large", RELIANCE: "large",
  INDIACEM: "mid", ULTRACEMCO: "large", MPHASIS: "mid", HCLTECH: "large",
  COFORGE: "mid", INFY: "large", PERSISTENT: "mid", HINDUNILVR: "large",
  NESTLEIND: "large", MARICO: "mid", DABUR: "mid", TRENT: "large",
  PAGEIND: "mid", PVRINOX: "mid", NAUKRI: "mid", NYKAA: "mid",
  DELHIVERY: "mid", DLF: "large", GODREJPROP: "mid", PHOENIXLTD: "mid",
  PIDILITIND: "large", SRF: "mid", BIOCON: "mid", SUNPHARMA: "large",
  ZYDUSLIFE: "large", TORNTPHARM: "large",
};

let updatedExisting = 0;
for (const c of companies) {
  if (!c.cap_segment) {
    const fromUniverse = universe.find((u) => u.ticker === c.ticker);
    c.cap_segment = fromUniverse?.cap_segment || manualCapSegment[c.ticker] || "large";
    updatedExisting++;
  }
}

const existingTickers = new Set(companies.map((c) => c.ticker));
let added = 0;
for (const u of universe) {
  if (existingTickers.has(u.ticker)) continue;
  companies.push({ ticker: u.ticker, name: u.name, industry: u.industry, cap_segment: u.cap_segment });
  existingTickers.add(u.ticker);
  added++;
}

companies.sort((a, b) => a.name.localeCompare(b.name));

fs.writeFileSync(companiesPath, JSON.stringify(companies, null, 2) + "\n");
console.log(`Backfilled cap_segment on ${updatedExisting} existing companies.`);
console.log(`Added ${added} new companies from the broader universe.`);
console.log(`Total companies now: ${companies.length}`);
