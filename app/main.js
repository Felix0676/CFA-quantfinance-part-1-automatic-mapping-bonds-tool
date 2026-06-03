const sampleRows = [
  {
    country: "United States",
    region: "Americas",
    currency: "USD",
    ytm: 4.3,
    rating: "AA+",
    score: 82.4,
    confidence: 91
  },
  {
    country: "Germany",
    region: "Europe",
    currency: "EUR",
    ytm: 2.6,
    rating: "AAA",
    score: 80.1,
    confidence: 88
  },
  {
    country: "Japan",
    region: "Asia",
    currency: "JPY",
    ytm: 1.1,
    rating: "A+",
    score: 71.8,
    confidence: 84
  },
  {
    country: "United Kingdom",
    region: "Europe",
    currency: "GBP",
    ytm: 4.5,
    rating: "AA",
    score: 76.6,
    confidence: 86
  },
  {
    country: "Singapore",
    region: "Asia",
    currency: "SGD",
    ytm: 3.0,
    rating: "AAA",
    score: 83.7,
    confidence: 79
  }
];

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

  return sampleRows
    .filter((row) => {
      const matchesRegion = region === "all" || row.region === region;
      const searchText = `${row.country} ${row.region} ${row.currency} ${row.rating}`.toLowerCase();
      return matchesRegion && searchText.includes(query);
    })
    .sort((a, b) => {
      if (sort === "score-asc") return a.score - b.score;
      if (sort === "az") return a.country.localeCompare(b.country);
      return b.score - a.score;
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
          <td>${row.ytm.toFixed(2)}%</td>
          <td><span class="rating">${row.rating}</span></td>
          <td class="score">${row.score.toFixed(1)}</td>
          <td>${row.confidence}%</td>
        </tr>
      `
    )
    .join("");
}

searchInput.addEventListener("input", renderTable);
regionFilter.addEventListener("change", renderTable);
sortMode.addEventListener("change", renderTable);
updateRanking.addEventListener("click", () => {
  updateRanking.textContent = "Ranking Updated";
  renderTable();
  window.setTimeout(() => {
    updateRanking.textContent = "Update Ranking";
  }, 1200);
});

renderTable();

