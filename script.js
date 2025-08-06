// ECB Lens - Interactive Rate Charts with Real ECB Data
console.log("ECB Lens loaded");

// Initialize ECB Data Fetcher
let ecbDataFetcher;
let monthlyData = ecbData;



let charts = {};

// Chart colors
const chartColors = {
  refi: { border: '#002147', background: 'rgba(0, 33, 71, 0.1)' },
  deposit: { border: '#28a745', background: 'rgba(40, 167, 69, 0.1)' },
  lending: { border: '#dc3545', background: 'rgba(220, 53, 69, 0.1)' }
};

// Initialize data fetcher and load data
async function initializeECBData() {
  try {
    // Create ECB Data Fetcher instance
    ecbDataFetcher = new ECBDataFetcher();
    
    // Fetch real ECB data
    console.log("Fetching real ECB data...");
    monthlyData = await ecbDataFetcher.fetchAllRates();
    
    console.log("ECB data loaded successfully:", monthlyData);
    
    // Update rate trends with real data
    updateRateTrends();
    
  } catch (error) {
    console.error("Failed to initialize ECB data:", error);
    // Fallback to static data
    monthlyData = {
      refi: {
        label: 'Main Refinancing Rate',
        data: [
          { 
            year: 2023, 
            values: [3.0, 3.25, 3.5, 3.75, 4.0, 4.0, 4.25, 4.25, 4.25, 4.25, 4.25, 4.25],
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          },
          { 
            year: 2024, 
            values: [4.25, 4.25, 4.25, 4.25, 4.25, 4.25, 4.25, 4.25, 4.25, 4.25, 4.25, 4.25],
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          }
        ]
      },
      deposit: {
        label: 'Deposit Facility Rate',
        data: [
          { 
            year: 2023, 
            values: [2.5, 2.5, 3.0, 3.25, 3.75, 3.75, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0],
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          },
          { 
            year: 2024, 
            values: [4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0],
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          }
        ]
      },
      lending: {
        label: 'Marginal Lending Rate',
        data: [
          { 
            year: 2023, 
            values: [3.25, 3.25, 3.5, 4.0, 4.25, 4.25, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5],
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          },
          { 
            year: 2024, 
            values: [4.5, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5],
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          }
        ]
      }
    };
  }
}

function updateHistoricalChart(chartId, type, year) {
  const canvas = document.getElementById(chartId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (charts[type]) charts[type].destroy();

  // If no year specified, show the latest year available
  const years = Object.keys(ecbData[type]).sort((a, b) => b - a);
  year = year || years[0];
  const yearData = ecbData[type][year];

  const labels = yearData.map(entry => entry.date);
  const values = yearData.map(entry => entry.value);

  charts[type] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: `${type.toUpperCase()} - ${year}`,
        data: values,
        borderColor: chartColors[type].border,
        backgroundColor: chartColors[type].background,
        borderWidth: 2,
        fill: true,
        tension: 0.2,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: function(value) {
              return value + '%';
            }
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    }
  });

  // Update year display in the modal
  document.getElementById(`year-${type}`).textContent = year;
  document.getElementById(`${type}-chart-title`).textContent = `${capitalizeType(type)} - ${year}`;
}
function capitalizeType(s) {
  return s.charAt(0).toUpperCase() + s.slice(1) + " Rate";
}
function changeYear(type, direction) {
  const years = Object.keys(ecbData[type]).sort((a, b) => b - a);
  let currentYear = document.getElementById(`year-${type}`).textContent;
  let idx = years.indexOf(currentYear);
  if (direction === 'prev' && idx < years.length - 1) idx++;
  if (direction === 'next' && idx > 0) idx--;
  updateHistoricalChart(`chart${capitalize(type)}`, type, years[idx]);
}

  
  // Destroy existing chart if it exists
  if (charts[type]) {
    charts[type].destroy();
  }
  
  const rateData = monthlyData[type];
  if (!rateData) return;
  
  // Combine all years' data into a single dataset
  const allLabels = [];
  const allValues = [];
  
  rateData.data.forEach(yearData => {
    yearData.values.forEach((value, index) => {
      allValues.push(value);
      allLabels.push(`${yearData.labels[index]} ${yearData.year}`);
    });
  });
  
  // Create chart with historical data spanning 1999-2025
  charts[type] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: allLabels,
      datasets: [{
        label: `${rateData.label} - 1999 to 2025`,
        data: allValues,
        borderColor: chartColors[type].border,
        backgroundColor: chartColors[type].background,
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        pointRadius: 2,
        pointHoverRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: chartColors[type].border,
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y}%`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          },
          ticks: {
            font: {
              family: 'Inter'
            },
            callback: function(value) {
              return value + '%';
            }
          }
        },
        x: {
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          },
          ticks: {
            font: {
              family: 'Inter'
            },
            maxTicksLimit: 20, // Limit number of x-axis labels for readability
            callback: function(value, index) {
              // Show only some labels to avoid overcrowding
              if (index % 12 === 0) {
                return allLabels[index];
              }
              return '';
            }
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    }
  });
}



// Open modal with historical chart
function openModal(type) {
  const modal = document.getElementById(`modal-${type}`);
  if (modal) {
    modal.style.display = 'block';
    
    // Initialize with historical chart spanning 1999-2025
    updateHistoricalChart(`chart${capitalize(type)}`, type);
  }
}

// Close modal
function closeModal(type) {
  const modal = document.getElementById(`modal-${type}`);
  if (modal) {
    modal.style.display = 'none';
  }
}

// Capitalize first letter
function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Update rate trends with real data
async function updateRateTrends() {
  try {
    const currentRates = await ecbDataFetcher.getCurrentRates();
    
    // Update rate values and trends on home page
    Object.keys(currentRates).forEach(type => {
      const rate = currentRates[type];
      
      // Find rate boxes on home page
      const rateBoxes = document.querySelectorAll('.rate-box');
      rateBoxes.forEach(box => {
        const title = box.querySelector('h3');
        if (title) {
          const rateType = getRateTypeFromTitle(title.textContent);
          if (rateType === type) {
            // Update rate value
            const rateValue = box.querySelector('.rate-value');
            if (rateValue) {
              rateValue.textContent = `${rate.value}%`;
            }
            
            // Update trend with proper styling
            const rateTrend = box.querySelector('.rate-trend');
            if (rateTrend) {
              rateTrend.textContent = rate.trend;
              
              // Remove existing trend classes
              rateTrend.classList.remove('up', 'down', 'neutral');
              
              // Add appropriate class based on trend
              if (rate.trend.includes('Increasing')) {
                rateTrend.classList.add('up');
                rateTrend.style.color = '#28a745'; // Green for increasing
              } else if (rate.trend.includes('Decreasing')) {
                rateTrend.classList.add('down');
                rateTrend.style.color = '#dc3545'; // Red for decreasing
              } else {
                rateTrend.classList.add('neutral');
                rateTrend.style.color = '#6c757d'; // Gray for no change
              }
            }
          }
        }
      });
      
      // Find rate cards on rates page
      const rateCards = document.querySelectorAll('.rate-card');
      rateCards.forEach(card => {
        const title = card.querySelector('h3');
        if (title) {
          const rateType = getRateTypeFromTitle(title.textContent);
          if (rateType === type) {
            // Update rate value
            const rateValue = card.querySelector('.rate-value-large');
            if (rateValue) {
              rateValue.textContent = `${rate.value}%`;
            }
            
            // Update trend with proper styling
            const rateTrend = card.querySelector('.rate-trend-large');
            if (rateTrend) {
              rateTrend.textContent = rate.trend;
              
              // Remove existing trend classes
              rateTrend.classList.remove('up', 'down', 'neutral');
              
              // Add appropriate class based on trend
              if (rate.trend.includes('Increasing')) {
                rateTrend.classList.add('up');
                rateTrend.style.color = '#28a745'; // Green for increasing
              } else if (rate.trend.includes('Decreasing')) {
                rateTrend.classList.add('down');
                rateTrend.style.color = '#dc3545'; // Red for decreasing
              } else {
                rateTrend.classList.add('neutral');
                rateTrend.style.color = '#6c757d'; // Gray for no change
              }
            }
          }
        }
      });
    });
    
    console.log('Rate trends updated with real ECB data:', currentRates);
  } catch (error) {
    console.error('Failed to update rate trends:', error);
  }
}

// Helper function to determine rate type from title
function getRateTypeFromTitle(title) {
  if (title.includes('Main Refinancing')) return 'refi';
  if (title.includes('Deposit Facility')) return 'deposit';
  if (title.includes('Marginal Lending')) return 'lending';
  return null;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
  // Initialize ECB data first
  await initializeECBData();
  
  // Update rate trends with real data
  await updateRateTrends();
  
  // Close modals when clicking outside
  window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
  };
});







const ecbData = {
  refi: {
    2025: [
      { date: "11 Jun.", value: 2.15 },
      { date: "23 Apr.", value: 2.40 },
      { date: "12 Mar.", value: 2.65 },
      { date: "5 Feb.",  value: 2.90 },
    ],
    2024: [
      { date: "18 Dec.", value: 3.15 },
      { date: "23 Oct.", value: 3.40 },
      { date: "18 Sep.", value: 3.65 },
      { date: "12 Jun.", value: 4.25 },
    ],
    2023: [
      { date: "20 Sep.", value: 4.50 },
      { date: "2 Aug.", value: 4.25 },
      { date: "21 Jun.", value: 4.00 },
      { date: "10 May", value: 3.75 },
      { date: "22 Mar.", value: 3.50 },
      { date: "8 Feb.", value: 3.00 }
    ],
    2022: [
      { date: "21 Dec.", value: 2.50 },
      { date: "2 Nov.", value: 2.00 },
      { date: "14 Sep.", value: 1.25 },
      { date: "27 Jul.", value: 0.50 }
    ],
    2019: [
      { date: "18 Sep.", value: 0.00 }
    ],
    2016: [
      { date: "16 Mar.", value: 0.00 }
    ],
    2015: [
      { date: "9 Dec.", value: 0.05 }
    ],
    2014: [
      { date: "10 Sep.", value: 0.05 },
      { date: "11 Jun.", value: 0.15 }
    ],
    2013: [
      { date: "13 Nov.", value: 0.25 },
      { date: "8 May.", value: 0.50 }
    ],
    2012: [
      { date: "11 Jul.", value: 0.75 }
    ],
    2011: [
      { date: "14 Dec.", value: 1.00 },
      { date: "9 Nov.", value: 1.25 },
      { date: "13 Jul.", value: 1.50 },
      { date: "13 Apr.", value: 1.25 }
    ],
    2009: [
      { date: "13 May", value: 1.00 },
      { date: "8 Apr.", value: 1.25 },
      { date: "11 Mar.", value: 1.50 },
      { date: "21 Jan.", value: 2.00 }
    ],
    2008: [
      { date: "10 Dec.", value: 2.50 },
      { date: "12 Nov.", value: 3.25 },
      { date: "15 Oct.", value: 3.75 },
      { date: "9 Oct.", value: null }, // Not available in your data
      { date: "8 Oct.", value: null },
      { date: "9 Jul.", value: null }
    ],
    // ...continue for each year and each date, using your data...
    1999: [
      { date: "5 Nov.", value: 3.00 },
      { date: "9 Apr.", value: 2.50 },
      { date: "22 Jan.", value: 3.00 },
      { date: "4 Jan.", value: 3.00 },
      { date: "1 Jan.", value: 3.00 }
    ]
  },
  deposit: {
    // Add all dates/values for deposit rate in the same way...
    2025: [
      { date: "11 Jun.", value: 2.00 },
      { date: "23 Apr.", value: 2.25 },
      { date: "12 Mar.", value: 2.50 },
      { date: "5 Feb.", value: 2.75 }
    ],
    2024: [
      { date: "18 Dec.", value: 3.00 },
      { date: "23 Oct.", value: 3.25 },
      { date: "18 Sep.", value: 3.50 },
      { date: "12 Jun.", value: 3.75 }
    ],
    2023: [
      { date: "20 Sep.", value: 4.00 },
      { date: "2 Aug.", value: 3.75 },
      { date: "21 Jun.", value: 3.50 },
      { date: "10 May", value: 3.25 },
      { date: "22 Mar.", value: 3.00 },
      { date: "8 Feb.", value: 2.50 }
    ],
    // ...complete with all years using your data...
    1999: [
      { date: "5 Nov.", value: 2.00 },
      { date: "9 Apr.", value: 1.50 },
      { date: "22 Jan.", value: 2.00 },
      { date: "4 Jan.", value: 2.75 },
      { date: "1 Jan.", value: 2.00 }
    ]
  },
  lending: {
    // Add all dates/values for lending rate in the same way...
    2025: [
      { date: "11 Jun.", value: 2.40 },
      { date: "23 Apr.", value: 2.65 },
      { date: "12 Mar.", value: 2.90 },
      { date: "5 Feb.", value: 3.15 }
    ],
    2024: [
      { date: "18 Dec.", value: 3.40 },
      { date: "23 Oct.", value: 3.65 },
      { date: "18 Sep.", value: 3.90 },
      { date: "12 Jun.", value: 4.50 }
    ],
    2023: [
      { date: "20 Sep.", value: 4.75 },
      { date: "2 Aug.", value: 4.50 },
      { date: "21 Jun.", value: 4.25 },
      { date: "10 May", value: 4.00 },
      { date: "22 Mar.", value: 3.75 },
      { date: "8 Feb.", value: 3.25 }
    ],
    // ...complete with all years using your data...
    1999: [
      { date: "5 Nov.", value: 4.00 },
      { date: "9 Apr.", value: 3.50 },
      { date: "22 Jan.", value: 4.50 },
      { date: "4 Jan.", value: 3.25 },
      { date: "1 Jan.", value: 4.50 }
    ]
  }
};

