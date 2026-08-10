// Fetches real historical stock prices from Yahoo Finance (no auth needed) for each
// executive's current company since their join date, and compares against the NIFTY 50
// index (^NSEI) over the same window. Writes results to data/stock_cache.json.
//
// Run with: node scripts/fetch_stock_data.js

const fs = require("fs");
const path = require("path");

const executives = require("../data/executives.json");
const companies = require("../data/companies.json");

const NIFTY_SYMBOL = "%5ENSEI"; // ^NSEI
const HEADERS = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" };

function companyByTicker(ticker) {
  return companies.find((c) => c.ticker === ticker);
}

async function fetchChart(symbol, period1, period2) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=1d`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${symbol}`);
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error(`No chart data for ${symbol}`);
  const closes = result.indicators?.quote?.[0]?.close || [];
  const timestamps = result.timestamp || [];
  // Find first and last non-null close prices in range.
  let first = null;
  let last = null;
  for (let i = 0; i < closes.length; i++) {
    if (closes[i] != null) {
      if (first === null) first = { price: closes[i], t: timestamps[i] };
      last = { price: closes[i], t: timestamps[i] };
    }
  }
  if (!first || !last) throw new Error(`No usable price points for ${symbol}`);
  return { first, last };
}

function pctChange(start, end) {
  return ((end - start) / start) * 100;
}

async function main() {
  const now = Math.floor(Date.now() / 1000);
  const cache = {};

  for (const exec of executives) {
    const company = companyByTicker(exec.company_ticker);
    const joinDate = new Date(exec.date_joined);
    const joinEpoch = Math.floor(joinDate.getTime() / 1000);

    if (joinEpoch > now) {
      cache[exec.id] = {
        status: "upcoming",
        message: "Appointment has not yet taken effect — no post-hire performance data yet.",
      };
      console.log(`${exec.id}: upcoming, skipped`);
      continue;
    }

    try {
      const symbol = `${exec.company_ticker}.NS`;
      const [companyData, indexData] = await Promise.all([
        fetchChart(symbol, joinEpoch, now),
        fetchChart(NIFTY_SYMBOL, joinEpoch, now),
      ]);

      const companyPct = pctChange(companyData.first.price, companyData.last.price);
      const indexPct = pctChange(indexData.first.price, indexData.last.price);
      const tenureDays = Math.round((companyData.last.t - companyData.first.t) / 86400);

      cache[exec.id] = {
        status: "ok",
        ticker: exec.company_ticker,
        company_name: company?.name || exec.company_ticker,
        start_date: new Date(companyData.first.t * 1000).toISOString().slice(0, 10),
        end_date: new Date(companyData.last.t * 1000).toISOString().slice(0, 10),
        start_price: Number(companyData.first.price.toFixed(2)),
        end_price: Number(companyData.last.price.toFixed(2)),
        stock_pct_change: Number(companyPct.toFixed(2)),
        index_start: Number(indexData.first.price.toFixed(2)),
        index_end: Number(indexData.last.price.toFixed(2)),
        index_pct_change: Number(indexPct.toFixed(2)),
        outperformance_pct: Number((companyPct - indexPct).toFixed(2)),
        tenure_days: tenureDays,
        generated_at: new Date().toISOString(),
      };
      console.log(`${exec.id}: OK (stock ${companyPct.toFixed(1)}% vs index ${indexPct.toFixed(1)}%)`);
    } catch (err) {
      cache[exec.id] = { status: "unavailable", message: String(err.message || err) };
      console.log(`${exec.id}: FAILED - ${err.message}`);
    }

    // Be polite to the free endpoint.
    await new Promise((r) => setTimeout(r, 300));
  }

  const outPath = path.join(__dirname, "..", "data", "stock_cache.json");
  fs.writeFileSync(outPath, JSON.stringify(cache, null, 2));
  console.log(`\nWrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
