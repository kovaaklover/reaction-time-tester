// src/views/stats.ts


// Declare Chart.js global for TypeScript
declare global {
  interface Window {
    Chart: any;
  }
}

interface HistoryEntry {
  timestamp: string;
  type: string;
  frequency?: number | null;
  initialColor?: string | null;
  stimulusColor?: string | null;
  trials?: number;
  minDelay?: number;
  maxDelay?: number;
  results: number[];  // reaction times in ms
  notes?: string | null;
}

let reactionChart: any = null; // Global to hold Chart.js instance
let colorAvgChart: any = null;
let hourAvgChart: any = null;

// This function builds the “Statistics” screen and sets up the stats view
export function renderStats(container: HTMLElement, sessionHistory: HistoryEntry[]) {
  container.innerHTML = `
    <div id="freeplayLayout">

      <!-- ===== LEFT COLUMN: Two vertical panels ===== -->
      <div id="leftColumnContainer">
        <!-- Top Panel: Filters (takes most of the space) -->
        <div id="filtersPanel">
          <h3>Filters</h3>

          <!-- No inner .stats-section-box — everything direct and plain -->
          <label class="stats-label">Test Type</label>
          <select id="filterType">
            <option value="all">All Tests</option>
            <option value="Freeplay Visual">Freeplay Visual</option>
            <option value="Freeplay Audio">Freeplay Audio</option>
            <option value="Session Visual">Session Visual</option>
          </select>

          <label class="stats-label">Graph View</label>
          <select id="graphView">
            <option value="all">All Trials</option>
            <option value="session">By Session (avg)</option>
            <option value="day">By Day (avg)</option>
            <option value="week">By Week (avg)</option>
          </select>

          <label class="stats-label">Show Last X Sessions</label>
          <select id="showLast">
            <option value="all">All</option>
            <option value="5">Last 5</option>
            <option value="10">Last 10</option>
            <option value="25">Last 25</option>
            <option value="50">Last 50</option>
            <option value="100">Last 100</option>
          </select>

          <label class="stats-label">Date Range</label>
          <div class="date-grid">
            <input type="date" id="filterFrom">
            <input type="date" id="filterTo">
          </div>

          <div style="margin: 16px 0;">
            <input type="checkbox" id="removeOutliers">
            <label for="removeOutliers" class="stats-label" style="display: inline; margin-left: 8px;">
              Remove Outliers (>0.5 STD)
            </label>
          </div>

          <button id="resetFiltersBtn">Reset Filters</button>
        </div>

        <!-- Bottom Panel: Data Management (smaller, at bottom, no inner box) -->
        <div id="dataManagementPanel">
          <h3>Data Management</h3>

          <button id="exportCsvBtn">Export to CSV</button>
          <button id="clearHistoryBtn">Clear All History</button>
        </div>
      </div>

      <!-- Middle and Right panels -->
      <div id="mainPanel">
        <h3>Stats Overview</h3>
        <canvas id="reactionChart"></canvas>
        <div id="statsSummary"></div>

        <!-- NEW charts row -->
        <div class="secondary-charts">
          <canvas id="colorAvgChart"></canvas>
          <canvas id="hourAvgChart"></canvas>
        </div>
      </div>

      <div id="historyPanel">
        <h3>Session History</h3>
        <div id="historyContent"></div>
      </div>
    </div>
  `;

  // Load Chart.js CDN (only once)
  if (!window.Chart) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => setupStats(sessionHistory);
    document.head.appendChild(script);
  } else {
    setupStats(sessionHistory);
  }

  // Load stats-specific CSS (prevent duplicates)
  if (!document.querySelector('link[href="styles/stats.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'styles/stats.css';
    document.head.appendChild(link);
  }

  const mainPanel = document.getElementById('mainPanel')!;
  mainPanel.classList.add('mainPanel');
  mainPanel.style.flex = '1';
  mainPanel.style.alignItems = 'center';
  mainPanel.style.justifyContent = 'flex-start';
  mainPanel.style.gap = '0px';
}

function setupStats(originalHistory: HistoryEntry[]) {
  const statsSummary = document.getElementById('statsSummary')!;
  const historyContent = document.getElementById('historyContent')!;
  const chartCanvas = document.getElementById('reactionChart') as HTMLCanvasElement;
  const exportBtn = document.getElementById('exportCsvBtn')!;
  const clearBtn = document.getElementById('clearHistoryBtn')!;
  const filterType = document.getElementById('filterType') as HTMLSelectElement;
  const graphView = document.getElementById('graphView') as HTMLSelectElement;
  const showLast = document.getElementById('showLast') as HTMLSelectElement;
  const filterFrom = document.getElementById('filterFrom') as HTMLInputElement;
  const filterTo = document.getElementById('filterTo') as HTMLInputElement;
  const removeOutliers = document.getElementById('removeOutliers') as HTMLInputElement;
  const resetBtn = document.getElementById('resetFiltersBtn')!;

  const updateDisplay = () => {
    let filtered = [...originalHistory];

    // Filter by type
    if (filterType.value !== 'all') {
      filtered = filtered.filter(e => e.type === filterType.value);
    }

    // Filter by date range
    if (filterFrom.value) {
      const fromDate = new Date(filterFrom.value);
      filtered = filtered.filter(e => new Date(e.timestamp) >= fromDate);
    }
    if (filterTo.value) {
      const toDate = new Date(filterTo.value);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(e => new Date(e.timestamp) <= toDate);
    }

    // Sort chronologically (oldest first for plotting)
    let sortedChronological = [...filtered].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());


    // === NEW: Outlier filtering per test type ===
    let dataForGraphAndStats = sortedChronological;

    if (removeOutliers.checked) {
      const typeStats: { [type: string]: { median: number, std: number } } = {};
      const typeGroups: { [type: string]: number[] } = {};

      // Group results by type
      sortedChronological.forEach(entry => {
        if (!typeGroups[entry.type]) typeGroups[entry.type] = [];
        typeGroups[entry.type].push(...entry.results);
      });

      // Helper to compute median
      const median = (arr: number[]) => {
        const s = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(s.length / 2);
        return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
      };

      for (const type in typeGroups) {
        const times = typeGroups[type];
        const med = median(times);
        const mean = times.reduce((a,b)=>a+b,0)/times.length;
        const variance = times.reduce((a,b)=>a+Math.pow(b - mean,2),0)/times.length;
        const std = Math.sqrt(variance);

        typeStats[type] = { median: med, std };
      };

      // Filter entries: remove outlier trials per type
      dataForGraphAndStats = sortedChronological.map(entry => {
        const { median, std } = typeStats[entry.type] || { median: 0, std: 0 };
        const threshold = 0.5 * std;

        const filteredTrials = entry.results.filter(rt =>
          rt >= median - threshold && rt <= median + threshold
        );
        return { ...entry, results: filteredTrials };
      }).filter(entry => entry.results.length > 0);
    }


    // === NOW apply "Show Last N" after outliers ===
    if (showLast.value !== 'all') {
      const N = parseInt(showLast.value);
      dataForGraphAndStats = dataForGraphAndStats.slice(-N);
    }

    // Empty state
    if (dataForGraphAndStats.length === 0) {
      statsSummary.innerHTML = '<p style="text-align: center; opacity: 0.7;">No sessions match the current filters.</p>';
      historyContent.innerHTML = '<p style="text-align: center; opacity: 0.7;">No history to display</p>';
      if (reactionChart) reactionChart.destroy();
      return;
    }

    // === Use dataForGraphAndStats for everything ===
    // Build stats box under chart
    const allResults = dataForGraphAndStats.flatMap(e => e.results);
    const totalTrials = allResults.length;
    const overallAvg = totalTrials > 0
      ? (allResults.reduce((a,b) => a + b, 0)/totalTrials).toFixed(1)
      : '0.0';
    const overallMedian = totalTrials > 0
      ? (() => {
          const s = [...allResults].sort((a,b)=>a-b);
          const mid = Math.floor(s.length/2);
          return s.length % 2 ? s[mid].toFixed(1) : ((s[mid-1]+s[mid])/2).toFixed(1);
        })()
      : '0.0';
    const overallStd = totalTrials > 0
      ? (() => {
          const mean = allResults.reduce((a,b)=>a+b,0)/totalTrials;
          const variance = allResults.reduce((a,b)=>a+Math.pow(b-mean,2),0)/totalTrials;
          return Math.sqrt(variance).toFixed(1);
        })()
      : '0.0';
    const overallMin = totalTrials > 0 ? Math.min(...allResults).toFixed(1) : 'N/A';
    const overallMax = totalTrials > 0 ? Math.max(...allResults).toFixed(1) : 'N/A';

    // Set statsSummary HTML
    statsSummary.innerHTML = `
      <div class="stats-box">
        <div class="stats-item">
          <div class="stats-label">Trials</div>
          <div class="stats-value">${totalTrials}</div>
        </div>
        <div class="stats-item">
          <div class="stats-label">Average</div>
          <div class="stats-value">${overallAvg} ms</div>
        </div>
        <div class="stats-item">
          <div class="stats-label">Median</div>
          <div class="stats-value">${overallMedian} ms</div>
        </div>
        <div class="stats-item">
          <div class="stats-label">Std</div>
          <div class="stats-value">${overallStd} ms</div>
        </div>
        <div class="stats-item">
          <div class="stats-label">Min</div>
          <div class="stats-value">${overallMin} ms</div>
        </div>
        <div class="stats-item">
          <div class="stats-label">Max</div>
          <div class="stats-value">${overallMax} ms</div>
        </div>
      </div>
    `;

    // === Render history list (newest first) ===
    const sortedReverse = [...dataForGraphAndStats].reverse();
    historyContent.innerHTML = sortedReverse.map(entry => renderHistoryEntry(entry)).join('');
    // Graph uses filteredResults → change to dataForGraphAndStats

    let filteredResults = dataForGraphAndStats;  // ← rename or just use dataForGraphAndStats below

    // === Plot the graph ===
    if (reactionChart) reactionChart.destroy();
    if (colorAvgChart) colorAvgChart.destroy();
    if (hourAvgChart) hourAvgChart.destroy();

    let datasets: any[] = [];
    let labels: string[] = [];

    const view = graphView.value;

    const grouped: { [type: string]: { x: number; y: number }[] } = {};

    if (view === 'all') {
      let trialIndex = 1;
      dataForGraphAndStats.forEach(entry => {
        if (!grouped[entry.type]) grouped[entry.type] = [];
        entry.results.forEach(rt => {
          grouped[entry.type].push({ x: trialIndex++, y: rt });
        });
      });
    } else {
      const groups: { [key: string]: { times: number[]; type: string; date: Date } } = {};

      dataForGraphAndStats.forEach(entry => {
        const entryDate = new Date(entry.timestamp);
        let key = '';

        if (view === 'session') key = entry.timestamp;
        if (view === 'day') key = entryDate.toISOString().slice(0, 10);
        if (view === 'week') {
          const weekStart = new Date(entryDate);
          weekStart.setDate(entryDate.getDate() - entryDate.getDay());
          key = weekStart.toISOString().slice(0, 10);
        }

        if (!groups[key]) {
          groups[key] = { times: [], type: entry.type, date: entryDate };
        }
        groups[key].times.push(...entry.results);
      });

      Object.values(groups).forEach(group => {
        if (!grouped[group.type]) grouped[group.type] = [];
        const avg = group.times.reduce((a, b) => a + b, 0) / group.times.length;
        grouped[group.type].push({ x: grouped[group.type].length, y: avg });
      });
    }

    reactionChart = new (window as any).Chart(chartCanvas, {
      type: 'scatter',
      data: {
        datasets: Object.keys(grouped).map(type => ({
          label: type,
          data: grouped[type],
          backgroundColor: getColorForType(type),
          borderColor: getColorForType(type), // line color
          showLine: true,                     // ← CONNECT POINTS
          spanGaps: false,   // 👈 prevents jumping gaps
          pointRadius: view === 'all' ? 4 : 7,
          tension: 0.25                       // optional smoothing
              }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: true, 
        aspectRatio: 3,
        plugins: {
          legend: {
            display: true,
            labels: { color: 'white', font: { size: 14 } }
            
          },
          title: {
            display: true,
            text: '  Reaction Times',
            color: 'white',
            align: 'start',
            fullWidth: true,
            font: { size: 22, weight: 'normal' },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: view === 'all' ? 'Trial Number' : 
                    view === 'session' ? 'Session' : 
                    view === 'day' ? 'Day' : 
                    view === 'week' ? 'Week' : 'Time Period',
              color: 'white',
              font: {
                size: 14,
                weight: 'normal'
              },
              padding: { top: 10 }
            },
            ticks: {
              color: 'white',
              font: {
                size: 14
              },
              stepSize: 1,                    // ← Minimum step = 1 (forces integers)
              autoSkip: true,                 // ← Allows larger steps when crowded
              maxRotation: 0,     // ← No rotation allowed
              minRotation: 0      // ← Forces horizontal labels
            },
            grid: { color: '#36373C' }
          },
          y: {
            title: {
              display: true,
              text: 'Reaction Time (ms)',
              color: 'white',
              font: {
                size: 14,
                weight: 'normal'
              },
              padding: { right: 10 }
            },
            ticks: {
              color: 'white',
              font: {
                size: 14
              }
            },
            grid: { color: '#36373C' },
            beginAtZero: false
          }
        }
      }
    });

    // AVERAGE BY STIMULUS COLOR CHART
    const stimulusMap: Record<string, number[]> = {};
    dataForGraphAndStats.forEach(entry => {
      if (!entry.stimulusColor) return;
      if (!stimulusMap[entry.stimulusColor]) stimulusMap[entry.stimulusColor] = [];
      stimulusMap[entry.stimulusColor].push(...entry.results);
    });
    const stimulusLabels = Object.keys(stimulusMap);
    const stimulusAverages = stimulusLabels.map(color => {
      const vals = stimulusMap[color];
      return vals.reduce((a,b)=>a+b,0)/vals.length;
    });

    // AVERAGE BY HOUR OF THE DAY
    // AVERAGE, MEDIAN, LOWER & UPPER QUARTILES BY HOUR
    const hourMap: Record<number, number[]> = {};
    dataForGraphAndStats.forEach(entry => {
      const hour = new Date(entry.timestamp).getHours();
      if (!hourMap[hour]) hourMap[hour] = [];
      hourMap[hour].push(...entry.results);
    });

    const hourLabels = Object.keys(hourMap).sort((a,b)=>+a-+b);

    // Helper to calculate median / percentile
    function percentile(arr: number[], q: number) {
      const sorted = [...arr].sort((a,b)=>a-b);
      const pos = (sorted.length - 1) * q;
      const base = Math.floor(pos);
      const rest = pos - base;
      if (sorted[base+1] !== undefined) {
        return sorted[base] + rest * (sorted[base+1] - sorted[base]);
      } else {
        return sorted[base];
      }
    }

    // Compute all three stats
    const hourLower25 = hourLabels.map(h => percentile(hourMap[+h], 0.25));
    const hourMedian   = hourLabels.map(h => percentile(hourMap[+h], 0.5));
    const hourUpper75  = hourLabels.map(h => percentile(hourMap[+h], 0.75));

    // Render Stimulus Color Chart
    colorAvgChart = new (window as any).Chart(
      document.getElementById('colorAvgChart') as HTMLCanvasElement,
      {
        type: 'bar',
        data: {
          labels: stimulusLabels,
          datasets: [{
            data: stimulusAverages,
            backgroundColor: stimulusLabels.map(c => c),
            borderColor: 'black',       // <-- black borders
            borderWidth: 1              // <-- thickness of borders
          }]
        },
        options: {
          plugins: {
            title: {
              display: true,
              text: '  Average Reaction Time by Stimulus Color',
              color: 'white',
              align: 'start',
              fullWidth: true,
              font: { size: 17, weight: 'normal' },
              padding: { top: 10, bottom: 40 }
            },
            legend: {
              display: false
            },
          },
          scales: {
            y: { 
              ticks: { color: 'white', font: { size: 14 } }, 
              grid: { color: '#36373C' }, 
              beginAtZero: false  // disables forcing y-axis to start at 0
            },
            x: { 
              ticks: { color: 'white', font: { size: 14 } }, 
              grid: { display: false } 
            }
          }
        }
      }
    );

    // TIME OF DAY CHART
    hourAvgChart = new (window as any).Chart(
      document.getElementById('hourAvgChart') as HTMLCanvasElement,
      {
        type: 'line',
        data: {
          labels: hourLabels,
          datasets: [
            {
              label: '25% Quartile',
              data: hourUpper75,
              borderColor: '#f87171',  // red-ish
              backgroundColor: '#f87171',
              tension: 0.25,
              fill: false
            },
            {
              label: 'Median',
              data: hourMedian,
              borderColor: '#4ade80',  // green-ish
              backgroundColor: '#4ade80',
              tension: 0.25,
              fill: false
            },
            {
              label: '75% Quartile',
              data: hourLower25,
              borderColor: '#60a5fa',  // blue
              backgroundColor: '#60a5fa',
              tension: 0.25,
              fill: false
            }
          ]
        },
        options: {
          devicePixelRatio: window.devicePixelRatio || 1, // ensures sharpness on retina
          plugins: {
            title: {
              display: true,
              text: '  Average Reaction Time by Hour of Day',
              color: 'white',
              align: 'start',
              fullWidth: true,
              font: { size: 17, weight: 'normal' },
              padding: { top: 10, bottom: 10 }
            },
            legend: {labels: { color: 'white', font: { size: 14 } }
            }
          },
          scales: {
            x: { ticks: { color: 'white' }, grid: { color: '#36373C' }, font: { size: 14 }   },
            y: { ticks: { color: 'white' } , grid: { color: '#36373C' }, font: { size: 14 }, maxRotation: 0, minRotation: 0 }
          }
        }
      }
    );

  };

  // Helper to assign colors by test type
  function getColorForType(type: string): string {
    const colors: { [key: string]: string } = {
      'Freeplay Visual': '#4ade80',
      'Freeplay Audio': '#60a5fa',
      'Session Visual': '#f87171'
    };
    return colors[type] || '#a78bfa';
  }

  // Initial render
  updateDisplay();

  // Live updates on any filter change
  filterType.onchange = updateDisplay;
  graphView.onchange = updateDisplay;
  filterFrom.onchange = updateDisplay;
  filterTo.onchange = updateDisplay;
  removeOutliers.onchange = updateDisplay;
  showLast.onchange = updateDisplay;   // ← ADD THIS LINE
  resetBtn.onclick = () => {
    filterType.value = 'all';
    graphView.value = 'all';
    filterFrom.value = '';
    filterTo.value = '';
    showLast.value = 'all';        // ← ADD THIS LINE
    removeOutliers.checked = false;
    updateDisplay();
  };

  // Export (exports ALL data, not just filtered — change if you want filtered only)
  exportBtn.onclick = () => {
    let csv = "Type,Date & Time,Frequency (Hz),Initial Color,Stimulus Color,Trials,Min Delay (s),Max Delay (s),Results (ms),Average (ms),Notes\n";

    originalHistory.forEach(entry => {
      const resultsStr = entry.results.map(r => r.toFixed(1)).join("|");
      const avg = entry.results.length > 0
        ? (entry.results.reduce((a, b) => a + b, 0) / entry.results.length).toFixed(1)
        : '0';

      csv += [
        `"${entry.type}"`,
        `"${entry.timestamp}"`,
        entry.frequency ?? '',
        entry.initialColor ?? '',
        entry.stimulusColor ?? '',
        entry.trials ?? '',
        entry.minDelay ?? '',
        entry.maxDelay ?? '',
        `"${resultsStr}"`,
        avg,
        entry.notes ?? ''
      ].join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reaction-test-stats_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Clear all history
  clearBtn.onclick = () => {
    if (confirm('This will permanently delete ALL your reaction time history.\n\nAre you sure?')) {
      localStorage.removeItem('reactionTestHistory');
      location.reload(); // Simple full refresh
    }
  };
}

// Function to add each history entry to the stats view
function renderHistoryEntry(entry: HistoryEntry): string {
  const avg = entry.results.length > 0
    ? (entry.results.reduce((a, b) => a + b, 0) / entry.results.length).toFixed(1)
    : '0.0';

  const resultsList = entry.results.map(r => r.toFixed(1)).join(', ');

  // Build each line separately — only add if data exists
  let details = '';

  if (entry.initialColor !== undefined || entry.stimulusColor !== undefined) {
    const init = entry.initialColor ?? '';
    const stim = entry.stimulusColor ?? '';
    details += `Initial: ${init}, Stimulus: ${stim}<br>`;
  }

  if (entry.frequency !== undefined && entry.frequency !== null) {
    details += `Frequency: ${entry.frequency} Hz<br>`;
  }

  if (entry.trials !== undefined) {
    const delayLine = (entry.minDelay !== undefined && entry.maxDelay !== undefined)
      ? ` | Delays: ${entry.minDelay}s – ${entry.maxDelay}s`
      : '';
    details += `Trials: ${entry.trials}${delayLine}<br>`;
  }

  // ADD NOTES HERE — only if they exist
  if (entry.notes) {
    details += `Notes: ${entry.notes}<br>`;
  }

  // If none of the above, add a blank line for spacing
  if (!details) {
    details = '<br>';
  }

  return `
    <div style="margin-bottom:16px;padding:12px;background:rgba(255,255,255,0.05);border-radius:8px;">
      <strong>${entry.type}</strong><br>
      ${entry.timestamp}<br>
      ${details}
      Results (ms): ${resultsList}<br>
      <strong>Average: ${avg} ms</strong>
    </div>
    <hr style="border:none;border-top:1px solid #444;margin:8px 0;">
  `.trim();
}