import { scoreRecords } from "./scoring.js";
import { sampleRecords } from "./sample-data.js";

let scoredRows = scoreRecords(sampleRecords);

const tableBody = document.querySelector("#bondRows");
const searchInput = document.querySelector("#searchInput");
const regionFilter = document.querySelector("#regionFilter");
const sortMode = document.querySelector("#sortMode");
const visibleCount = document.querySelector("#visibleCount");
const updateRanking = document.querySelector("#updateRanking");

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
    .map(
      (row, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${row.country}</td>
          <td>${row.region}</td>
          <td>${row.currency}</td>
          <td>${row.yieldToMaturity.toFixed(2)}%</td>
          <td><span class="rating">${row.creditRating}</span></td>
          <td class="score">${row.totalScore.toFixed(1)}</td>
          <td>${row.dataConfidence.toFixed(1)}%</td>
        </tr>
      `
    )
    .join("");
}

searchInput.addEventListener("input", renderTable);
regionFilter.addEventListener("change", renderTable);
sortMode.addEventListener("change", renderTable);
updateRanking.addEventListener("click", () => {
  scoredRows = scoreRecords(sampleRecords);
  updateRanking.textContent = "Ranking Updated";
  renderTable();
  window.setTimeout(() => {
    updateRanking.textContent = "Update Ranking";
  }, 1200);
});

renderTable();

