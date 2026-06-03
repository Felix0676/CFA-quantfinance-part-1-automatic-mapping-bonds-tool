import { scoreRecords } from "./scoring.js";
import { sampleRecords } from "./sample-data.js";

const RECORDS_STORAGE_KEY = "sovereign-bond-records-v1";
const PINNED_STORAGE_KEY = "sovereign-bond-pinned-v1";
const editableNumberFields = [
  "yieldToMaturity",
  "bondPrice",
  "couponRate",
  "debtToGdp",
  "fiscalDeficitToGdp",
  "inflationRate",
  "policyInterestRate",
  "exchangeRateVolatility",
  "foreignExchangeReserves",
  "goldReserves",
  "cdsSpread",
  "liquidityBidAskSpread"
];

let records = loadRecords();
let scoredRows = scoreRecords(records);
let expandedCountry = null;
const pinnedCountries = new Set(loadPinnedCountries());

const tableBody = document.querySelector("#bondRows");
const searchInput = document.querySelector("#searchInput");
const regionFilter = document.querySelector("#regionFilter");
const sortMode = document.querySelector("#sortMode");
const visibleCount = document.querySelector("#visibleCount");
const onlineCount = document.querySelector("#onlineCount");
const updateRanking = document.querySelector("#updateRanking");
const saveState = document.querySelector("#saveState");
const saveStatus = document.querySelector("#saveStatus");
const editModal = document.querySelector("#editModal");
const editForm = document.querySelector("#editForm");
const editTitle = document.querySelector("#editTitle");
const closeEdit = document.querySelector("#closeEdit");
const cancelEdit = document.querySelector("#cancelEdit");

onlineCount.textContent = "1";
updateSaveStatus();

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

  const filteredRows = scoredRows
    .filter((row) => {
      const matchesRegion = region === "all" || row.region === region;
      const searchText = `${row.country} ${row.region} ${row.currency} ${row.creditRating}`.toLowerCase();
      return matchesRegion && searchText.includes(query);
    });

  return sortRows(filteredRows, sort);
}

function sortRows(rows, sort) {
  return [...rows].sort((a, b) => {
    const pinnedDelta = Number(pinnedCountries.has(b.country)) - Number(pinnedCountries.has(a.country));
    if (pinnedDelta !== 0) return pinnedDelta;

    if (sort === "score-asc") return a.totalScore - b.totalScore;
    if (sort === "az") return a.country.localeCompare(b.country);
    return b.totalScore - a.totalScore;
  });
}

function renderTable() {
  const rows = getVisibleRows();
  visibleCount.textContent = String(rows.length);
  tableBody.innerHTML = renderRows(rows);
}

function renderRows(rows) {
  let rank = 0;

  return rows
    .map((row) => {
      const isExpanded = expandedCountry === row.country;
      const isPinned = pinnedCountries.has(row.country);

      rank += 1;

      return `
        <tr class="data-row ${isExpanded ? "is-expanded" : ""}" data-country="${row.country}">
          <td>${rank}</td>
          <td>
            <button class="row-toggle" type="button" aria-expanded="${isExpanded}" data-country="${row.country}">
              <span>${isExpanded ? "Hide" : "View"}</span>
            </button>
            <button class="edit-toggle" type="button" data-country="${row.country}">Edit</button>
            ${row.country}
          </td>
          <td>
            <button class="pin-toggle ${isPinned ? "is-pinned" : ""}" type="button" aria-pressed="${isPinned}" data-country="${row.country}">
              ${isPinned ? "Pinned" : "Pin"}
            </button>
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
      <td colspan="9">
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
  const hundredLabel = benchmark.direction === "lower" ? "P5" : "P95";
  const zeroLabel = benchmark.direction === "lower" ? "P95" : "P5";
  return `Benchmark: ${hundredLabel} ${hundredValue} = 100, ${zeroLabel} ${zeroValue} = 0`;
}

searchInput.addEventListener("input", renderTable);
regionFilter.addEventListener("change", renderTable);
sortMode.addEventListener("change", renderTable);
tableBody.addEventListener("click", (event) => {
  const editToggle = event.target.closest(".edit-toggle");
  if (editToggle) {
    openEditForm(editToggle.dataset.country);
    return;
  }

  const pinToggle = event.target.closest(".pin-toggle");
  if (pinToggle) {
    const country = pinToggle.dataset.country;
    if (pinnedCountries.has(country)) {
      pinnedCountries.delete(country);
    } else {
      pinnedCountries.add(country);
    }
    savePinnedCountries();
    renderTable();
    return;
  }

  const toggle = event.target.closest(".row-toggle");
  if (!toggle) return;

  const country = toggle.dataset.country;
  expandedCountry = expandedCountry === country ? null : country;
  renderTable();
});
updateRanking.addEventListener("click", () => {
  scoredRows = scoreRecords(records);
  updateRanking.textContent = "Ranking Updated";
  renderTable();
  window.setTimeout(() => {
    updateRanking.textContent = "Update Ranking";
  }, 1200);
});
closeEdit.addEventListener("click", closeEditForm);
cancelEdit.addEventListener("click", closeEditForm);
editModal.addEventListener("click", (event) => {
  if (event.target === editModal) closeEditForm();
});
editForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveEditForm();
});

renderTable();

function loadRecords() {
  try {
    const stored = window.localStorage.getItem(RECORDS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : cloneRecords(sampleRecords);
  } catch {
    return cloneRecords(sampleRecords);
  }
}

function cloneRecords(sourceRecords) {
  return sourceRecords.map((record) => ({ ...record }));
}

function saveRecords() {
  window.localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
  updateSaveStatus();
}

function loadPinnedCountries() {
  try {
    const stored = window.localStorage.getItem(PINNED_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function savePinnedCountries() {
  window.localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify([...pinnedCountries]));
  updateSaveStatus("Pinned state saved locally");
}

function updateSaveStatus(message = "Manual edits save in this browser") {
  saveState.textContent = "Local";
  saveStatus.textContent = message;
}

function openEditForm(country) {
  const record = records.find((item) => item.country === country);
  if (!record) return;

  editTitle.textContent = `Edit ${record.country}`;
  editForm.elements.country.value = record.country;
  editForm.elements.creditRating.value = record.creditRating;
  editForm.elements.sourceNote.value = record.sourceNote || "";

  for (const field of editableNumberFields) {
    editForm.elements[field].value = record[field] ?? "";
  }

  editModal.hidden = false;
}

function closeEditForm() {
  editModal.hidden = true;
  editForm.reset();
}

function saveEditForm() {
  const country = editForm.elements.country.value;
  const recordIndex = records.findIndex((item) => item.country === country);
  if (recordIndex === -1) return;

  const updatedRecord = {
    ...records[recordIndex],
    creditRating: editForm.elements.creditRating.value,
    sourceNote: editForm.elements.sourceNote.value.trim(),
    lastUpdated: new Date().toISOString()
  };

  for (const field of editableNumberFields) {
    updatedRecord[field] = parseNullableNumber(editForm.elements[field].value);
  }

  records = records.map((record, index) => (index === recordIndex ? updatedRecord : record));
  scoredRows = scoreRecords(records);
  expandedCountry = country;
  saveRecords();
  updateSaveStatus(`${country} saved locally`);
  closeEditForm();
  renderTable();
}

function parseNullableNumber(value) {
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
