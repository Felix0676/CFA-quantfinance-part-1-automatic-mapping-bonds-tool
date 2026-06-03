import { scoreRecords } from "./scoring.js";
import { sampleRecords } from "./sample-data.js";

let scoredRows = scoreRecords(sampleRecords);
let expandedCountry = null;

const tableBody = document.querySelector("#bondRows");
const searchInput = document.querySelector("#searchInput");
const regionFilter = document.querySelector("#regionFilter");
const sortMode = document.querySelector("#sortMode");
const visibleCount = document.querySelector("#visibleCount");
const updateRanking = document.querySelector("#updateRanking");

const indicatorLabels = {
  yieldToMaturity: "Yield to Maturity",
  realYield: "Real Yield",
  liquidityBidAskSpread: "Liquidity / Bid-Ask Spread",
  bondPriceDiscount: "Bond Price / Discount",
  creditRating: "Credit Rating Score",
  cdsSpread: "CDS Spread",
  debtToGdp: "Debt-to-GDP",
  fiscalDeficitToGdp: "Fiscal Deficit-to-GDP",
  inflationRate: "Inflation Rate",
  exchangeRateVolatility: "Exchange Rate Volatility",
  foreignExchangeReserves: "Foreign Exchange Reserves",
  policyInterestRate: "Policy Interest Rate",
  goldReserves: "Gold Reserves"
};

const indicatorUnits = {
  yieldToMaturity: "%",
  realYield: "%",
  liquidityBidAskSpread: "%",
  bondPriceDiscount: "pts",
  creditRating: "",
  cdsSpread: "bps",
  debtToGdp: "%",
  fiscalDeficitToGdp: "%",
  inflationRate: "%",
  exchangeRateVolatility: "%",
  foreignExchangeReserves: "USD bn",
  policyInterestRate: "%",
  goldReserves: "tonnes"
};

function getVisibleRows() {
  const query = searchInput.value.trim().toLowerCase();
  const region = regionFilter.value;
  const sort = sortMode.value;

  return scoredRows
    .filter((row) => {
      const matchesRegion = region === "all" || row.region === region;
      const searchText = `${row.country} ${row.region} ${row.currency} ${row.creditRating}`.toLowerCase();
      return matchesRegion && searchText.includes(query);
    })
    .sort((a, b) => {
      if (sort === "score-asc") return a.totalScore - b.totalScore;
      if (sort === "az") return a.country.localeCompare(b.country);
      return b.totalScore - a.totalScore;
    });
}

function renderTable() {
  const rows = getVisibleRows();
  visibleCount.textContent = String(rows.length);
  tableBody.innerHTML = rows
    .map((row, index) => {
      const isExpanded = expandedCountry === row.country;

      return `
        <tr class="data-row ${isExpanded ? "is-expanded" : ""}" data-country="${row.country}">
          <td>${index + 1}</td>
          <td>
            <button class="row-toggle" type="button" aria-expanded="${isExpanded}" data-country="${row.country}">
              <span>${isExpanded ? "Hide" : "View"}</span>
            </button>
            ${row.country}
          </td>
          <td>${row.region}</td>
          <td>${row.currency}</td>
          <td>${row.yieldToMaturity.toFixed(2)}%</td>
          <td><span class="rating">${row.creditRating}</span></td>
          <td class="score">${row.totalScore.toFixed(1)}</td>
          <td>${row.dataConfidence.toFixed(1)}%</td>
        </tr>
        ${isExpanded ? renderDetailRow(row) : ""}
      `;
    })
    .join("");
}

function renderDetailRow(row) {
  const bondScore = row.scoreBreakdown.bondReturnLiquidity.score;
  const riskScore = row.scoreBreakdown.sovereignRisk.score;
  const creditRating = row.scoreBreakdown.sovereignRisk.components.creditRating;
  const bondComponents = renderComponentList(row.scoreBreakdown.bondReturnLiquidity.components);
  const riskComponents = renderComponentList(row.scoreBreakdown.sovereignRisk.components);

  return `
    <tr class="detail-row">
      <td colspan="8">
        <section class="detail-panel" aria-label="${row.country} score details">
          <div class="detail-summary">
            <article>
              <span>Credit Rating</span>
              <strong>${row.creditRating}</strong>
              <small>Mapped score: ${formatScore(creditRating.normalized)} / 100</small>
            </article>
            <article>
              <span>Bond Return & Liquidity</span>
              <strong>${formatScore(bondScore)} / 100</strong>
              <small>Category weight: 35%</small>
            </article>
            <article>
              <span>Sovereign Risk</span>
              <strong>${formatScore(riskScore)} / 100</strong>
              <small>Category weight: 65%</small>
            </article>
            <article>
              <span>Total Score</span>
              <strong>${row.totalScore.toFixed(1)} / 100</strong>
              <small>Data confidence: ${row.dataConfidence.toFixed(1)}%</small>
            </article>
          </div>
          <div class="component-grid">
            <div>
              <h2>Bond Components</h2>
              ${bondComponents}
            </div>
            <div>
              <h2>Sovereign Risk Components</h2>
              ${riskComponents}
            </div>
          </div>
        </section>
      </td>
    </tr>
  `;
}

function renderComponentList(components) {
  return `
    <dl class="component-list">
      ${Object.entries(components)
        .map(
          ([indicator, component]) => `
            <div>
              <dt>${indicatorLabels[indicator]}</dt>
              <dd>
                <small class="raw-value">Raw: ${formatRawValue(indicator, component.rawValue)}</small>
                <small class="benchmark-value">${formatBenchmark(indicator, component.benchmark)}</small>
                <span>${formatScore(component.normalized)} / 100</span>
                <small>Weight ${(component.weight * 100).toFixed(0)}%</small>
              </dd>
            </div>
          `
        )
        .join("")}
    </dl>
  `;
}

function formatScore(value) {
  return value === null ? "Missing" : value.toFixed(1);
}

function formatRawValue(indicator, value) {
  if (value === null) return "Missing";
  const unit = indicatorUnits[indicator];
  if (indicator === "creditRating") return `${value.toFixed(0)} mapped points`;
  if (indicator === "bondPriceDiscount") return `${value.toFixed(1)} ${unit}`;
  if (unit === "USD bn") return `${value.toLocaleString()} ${unit}`;
  if (unit === "tonnes") return `${value.toLocaleString()} ${unit}`;
  return `${value.toFixed(2)}${unit}`;
}

function formatBenchmark(indicator, benchmark) {
  if (!benchmark || benchmark.hundredScoreValue === null) return "Benchmark: Missing";

  if (indicator === "creditRating") {
    return "Benchmark: AAA = 100, D = 0";
  }

  const zeroValue = formatRawValue(indicator, benchmark.zeroScoreValue);
  const hundredValue = formatRawValue(indicator, benchmark.hundredScoreValue);
  return `Benchmark: ${hundredValue} = 100, ${zeroValue} = 0`;
}

searchInput.addEventListener("input", renderTable);
regionFilter.addEventListener("change", renderTable);
sortMode.addEventListener("change", renderTable);
tableBody.addEventListener("click", (event) => {
  const toggle = event.target.closest(".row-toggle");
  if (!toggle) return;

  const country = toggle.dataset.country;
  expandedCountry = expandedCountry === country ? null : country;
  renderTable();
});
updateRanking.addEventListener("click", () => {
  scoredRows = scoreRecords(sampleRecords);
  updateRanking.textContent = "Ranking Updated";
  renderTable();
  window.setTimeout(() => {
    updateRanking.textContent = "Update Ranking";
  }, 1200);
});

renderTable();
