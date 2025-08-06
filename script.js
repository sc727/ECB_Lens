// ECB Lens - Unified Script for Index & Rates
console.log("ECB Lens loaded");

// ECB Data: Insert your ECBDataFetcher class definition & ecbData fallback here if not already imported

let ecbDataFetcher;
let charts = {};

// Chart colors
const chartColors = {
  refi: { border: '#002147', background: 'rgba(0, 33, 71, 0.1)' },
  deposit: { border: '#28a745', background: 'rgba(40, 167, 69, 0.1)' },
  lending: { border: '#dc3545', background: 'rgba(220, 53, 69, 0.1)' }
};

// ---- HELPERS ----
function capitalizeType(type) {
  return (
    (type === "refi" && "Main Refinancing Rate") ||
    (type === "deposit" && "Deposit Facility Rate") ||
    (type === "lending" && "Marginal Lending Rate") ||
    type
  );
}

// Get current rate (latest year, last value)
function getLatestRate(type, data) {
  let series = data[type].data;
  let lastYear = series[series.length - 1];
  let lastIndex = lastYear.values.length - 1;
  // In case last value is null, find previous valid value
  while (lastIndex >= 0 && (lastYear.values[lastIndex] == null || lastYear.values[lastIndex] === undefined)) {
    lastIndex--;
  }
  return lastYear.values[lastIndex];
}

// Calculate rate trend
function getRateTrend(type, data) {
  let series = data[type].data;
  let thisYear = series[series.length - 1];
  let prevValue = null;
  let lastIndex = thisYear.values.length - 1;
  // Find previous valid value
  for (let i = lastIndex - 1; i >= 0; i--) {
    if (thisYear.values[i] !== null && thisYear.values[i] !== undefined) {
      prevValue = thisYear.values[i];
      break;
    }
  }
  // If not found, look at previous year
  if (prevValue === null && series.length > 1) {
    let prevYear = series[series.length - 2];
    for (let i = prevYear.values.length - 1; i >= 0; i--) {
      if (prevYear.values[i] !== null && prevYear.values[i] !== undefined) {
        prevValue = prevYear.values[i];
        break;
      }
    }
  }
  let lastValue = thisYear.values[lastIndex];
  if (lastValue > prevValue) return "↗ Increasing";
  if (lastValue < prevValue) return "↘ Decreasing";
  return "↔ No change";
}

// Detect which page we're on
function getPageType() {
  if (document.querySelector('.rates-section') && document.querySelector('.rate-box')) return "index";
  if (document.querySelector('.rates-grid') && document.querySelector('.rate-card')) return "rates";
  return "unknown";
}

// ---- CHARTS ----

// (INDEX PAGE) Show *all years* continuous line
function showModalAllYearsChart(type) {
  const canvasId =
    type === "refi"
      ? "chartRefi"
      : type === "deposit"
      ? "chartDeposit"
      : "chartLending";
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (charts[type]) charts[type].destroy();

  // Build all-years data
  let labels = [];
  let values = [];
  let series = window.ecbData[type].data;
  for (let y of series) {
    for (let i = 0; i < y.values.length; i++) {
      labels.push(`${y.labels[i]} ${y.year}`);
      values.push(y.values[i]);
    }
  }

  charts[type] = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: capitalizeType(type) + " (1999–2025)",
          data: values,
          borderColor: chartColors[type].border,
          backgroundColor: chartColors[type].background,
          borderWidth: 2,
          fill: true,
          tension: 0.1,
          pointRadius: 2,
          pointHoverRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          mode: "index",
          intersect: false,
          callbacks: {
            label: (ctx) =>
              `${ctx.dataset.label}: ${ctx.parsed.y == null ? "N/A" : ctx.parsed.y + "%"}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: false,
          grid: { color: "rgba(0,0,0,0.08)" },
          ticks: { callback: (v) => v + "%" },
        },
        x: {
          grid: { color: "rgba(0,0,0,0.08)" },
          ticks: {
            maxTicksLimit: 20,
            callback: function (v, i, arr) {
              // Label only January for each year to reduce crowding
              if (labels[i] && labels[i].startsWith("Jan")) return labels[i];
              return "";
            },
          },
        },
      },
      interaction: { mode: "nearest", axis: "x", intersect: false },
    },
  });
}

// (RATES PAGE) Show *one year* with navigation
function showYearChart(type, year) {
  const canvasId =
    type === "refi"
      ? "chartRefi"
      : type === "deposit"
      ? "chartDeposit"
      : "chartLending";
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (charts[type]) charts[type].destroy();

  let series = window.ecbData[type].data;
  let years = series.map((y) => y.year);
  let idx = years.indexOf(parseInt(year));
  if (idx < 0) idx = years.length - 1; // default to latest year
  let yearObj = series[idx];

  charts[type] = new Chart(ctx, {
    type: "line",
    data: {
      labels: yearObj.labels,
      datasets: [
        {
          label: capitalizeType(type) + " (" + year + ")",
          data: yearObj.values,
          borderColor: chartColors[type].border,
          backgroundColor: chartColors[type].background,
          borderWidth: 2,
          fill: true,
          tension: 0.2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          mode: "index",
          intersect: false,
        },
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: function (v) {
              return v + "%";
            },
          },
        },
      },
      interaction: { mode: "nearest", axis: "x", intersect: false },
    },
  });

  // Update modal year display
  document.getElementById(`year-${type}`).textContent = year;
  document.getElementById(`${type}-chart-title`).textContent = capitalizeType(type) + " - " + year;

  // Set prev/next button enabled/disabled
  document.getElementById(`${type}-prev-btn`).disabled = idx >= years.length - 1;
  document.getElementById(`${type}-next-btn`).disabled = idx <= 0;
}

// ---- MODALS ----
function openModal(type) {
  document.getElementById(`modal-${type}`).style.display = "block";
  if (getPageType() === "index") {
    showModalAllYearsChart(type);
  } else {
    // Rates page: show latest year (default)
    let series = window.ecbData[type].data;
    let lastYear = series[series.length - 1].year;
    showYearChart(type, lastYear);
  }
}
function closeModal(type) {
  document.getElementById(`modal-${type}`).style.display = "none";
}

// Rates page: Year navigation
function changeYear(type, dir) {
  let current = parseInt(document.getElementById(`year-${type}`).textContent);
  let series = window.ecbData[type].data;
  let years = series.map((y) => y.year);
  let idx = years.indexOf(current);
  if (dir === "prev" && idx < years.length - 1) idx++;
  if (dir === "next" && idx > 0) idx--;
  showYearChart(type, years[idx]);
}

// ---- UPDATE RATE TRENDS ----
function updateCurrentRatesDisplay(data) {
  console.log('updateCurrentRatesDisplay called with data:', data);
  
  // For home page
  document.querySelectorAll('.rate-box').forEach((box) => {
    const title = box.querySelector('h3').textContent;
    let type = null;
    if (title.includes("Main Refinancing")) type = "refi";
    if (title.includes("Deposit Facility")) type = "deposit";
    if (title.includes("Marginal Lending")) type = "lending";
    if (!type) return;
    
    console.log('Processing rate box for type:', type);
    
    try {
      // Update
      const latestRate = getLatestRate(type, data);
      console.log('Latest rate for', type, ':', latestRate);
      box.querySelector('.rate-value').textContent = latestRate + "%";
      
      let trend = getRateTrend(type, data);
      let trendDiv = box.querySelector('.rate-trend');
      trendDiv.textContent = trend;
      trendDiv.classList.remove('up', 'down', 'neutral');
      if (trend.includes('Increasing')) trendDiv.classList.add('up');
      else if (trend.includes('Decreasing')) trendDiv.classList.add('down');
      else trendDiv.classList.add('neutral');
      
      console.log('Successfully updated', type, 'rate box');
    } catch (error) {
      console.error('Error updating rate box for', type, ':', error);
      box.querySelector('.rate-value').textContent = "Error";
      box.querySelector('.rate-trend').textContent = "Failed to load";
    }
  });
  // For rates page
  document.querySelectorAll('.rate-card').forEach((card) => {
    const title = card.querySelector('h3').textContent;
    let type = null;
    if (title.includes("Main Refinancing")) type = "refi";
    if (title.includes("Deposit Facility")) type = "deposit";
    if (title.includes("Marginal Lending")) type = "lending";
    if (!type) return;
    // Update
    card.querySelector('.rate-value-large').textContent = getLatestRate(type, data) + "%";
    let trend = getRateTrend(type, data);
    let trendDiv = card.querySelector('.rate-trend-large');
    trendDiv.textContent = trend;
    trendDiv.classList.remove('up', 'down', 'neutral');
    if (trend.includes('Increasing')) trendDiv.classList.add('up');
    else if (trend.includes('Decreasing')) trendDiv.classList.add('down');
    else trendDiv.classList.add('neutral');
  });
}

// ---- MAIN ----
document.addEventListener('DOMContentLoaded', async function() {
  // ECBDataFetcher is defined in ecb-data.js
  let data = null;
  
  // Try to get data from ECBDataFetcher (with fallback data)
  if (typeof ECBDataFetcher !== "undefined") {
    try {
      ecbDataFetcher = new ECBDataFetcher();
      data = await ecbDataFetcher.fetchAllRates();
    } catch (e) {
      console.error('Error fetching ECB data:', e);
      // Use fallback data from ECBDataFetcher
      ecbDataFetcher = new ECBDataFetcher();
      data = ecbDataFetcher.getFallbackData();
    }
  } else {
    console.error('ECBDataFetcher not found');
    // Create a basic fallback if ECBDataFetcher is not available
    data = {
      refi: { data: [{ year: 2024, values: [4.25, 4.25, 4.25, 4.25, 4.25, 4.25, 4.25, 4.25, 4.25, 4.25, 4.25, 4.25], labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] }] },
      deposit: { data: [{ year: 2024, values: [3.75, 3.75, 3.75, 3.75, 3.75, 3.75, 3.75, 3.75, 3.75, 3.75, 3.75, 3.75], labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] }] },
      lending: { data: [{ year: 2024, values: [4.75, 4.75, 4.75, 4.75, 4.75, 4.75, 4.75, 4.75, 4.75, 4.75, 4.75, 4.75], labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] }] }
    };
  }

  // Save to global
  window.ecbData = data;

  // Show rates
  updateCurrentRatesDisplay(data);

  // Close modals when clicking outside
  window.onclick = function(event) {
    document.querySelectorAll('.modal').forEach((modal) => {
      if (event.target === modal) modal.style.display = "none";
    });
  };
});

// For navigation buttons on rates page
window.changeYear = changeYear;
window.openModal = openModal;
window.closeModal = closeModal;
