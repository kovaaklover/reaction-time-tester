// src/views/stats.ts

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
}

// This function builds the “Statistics” screen and sets up the stats view
export function renderStats(container: HTMLElement, sessionHistory: HistoryEntry[]) {
  container.innerHTML = `
    <div id="freeplayLayout">

      <!-- ===== LEFT COLUMN: Two vertical panels ===== -->
      <div id="leftColumnContainer">
        <!-- Top Panel: Filters (takes most of the space) -->
        <div id="filtersPanel">
          <h3>Filters (In Work)</h3>

          <div class="stats-section-box">
            <label class="stats-label">Test Type</label>
            <select id="filterType">
              <option value="all">All Tests</option>
              <option value="Freeplay Visual">Freeplay Visual</option>
              <option value="Freeplay Audio">Freeplay Audio</option>
              <option value="Practice Visual">Practice Visual</option>
            </select>

            <label class="stats-label">Date Range</label>
            <div class="date-grid">
              <input type="date" id="filterFrom">
              <input type="date" id="filterTo">
            </div>

            <button id="applyFiltersBtn">Apply Filters</button>
            <button id="resetFiltersBtn">Reset Filters</button>
          </div>
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
        <h3>Overall Statistics (In Work)</h3>
        <div id="statsSummary"></div>
      </div>

      <div id="historyPanel">
        <h3>Session History</h3>
        <div id="historyContent"></div>
      </div>
    </div>
  `;

  // Load stats-specific CSS (prevent duplicates)
  if (!document.querySelector('link[href="styles/stats.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'styles/stats.css';
    document.head.appendChild(link);
  }

  setupStats(sessionHistory);
}


function setupStats(originalHistory: HistoryEntry[]) {
  const statsSummary = document.getElementById('statsSummary')!;
  const historyContent = document.getElementById('historyContent')!;
  const exportBtn = document.getElementById('exportCsvBtn')!;
  const clearBtn = document.getElementById('clearHistoryBtn')!;
  const filterType = document.getElementById('filterType') as HTMLSelectElement;
  const filterFrom = document.getElementById('filterFrom') as HTMLInputElement;
  const filterTo = document.getElementById('filterTo') as HTMLInputElement;
  const applyBtn = document.getElementById('applyFiltersBtn')!;
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

    // Sort newest first
    const sorted = [...filtered].reverse();

    // Empty state
    if (sorted.length === 0) {
      statsSummary.innerHTML = '<p style="text-align: center; opacity: 0.7;">No sessions match the current filters.</p>';
      historyContent.innerHTML = '<p style="text-align: center; opacity: 0.7;">No history to display</p>';
      return;
    }

    // Overall stats for filtered data
    const allResults = sorted.flatMap(e => e.results);
    const totalTrials = allResults.length;
    const overallAvg = totalTrials > 0
      ? (allResults.reduce((a, b) => a + b, 0) / totalTrials).toFixed(1)
      : '0.0';
    const best = totalTrials > 0 ? Math.min(...allResults).toFixed(1) : 'N/A';
    const worst = totalTrials > 0 ? Math.max(...allResults).toFixed(1) : 'N/A';

    statsSummary.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <p style="font-size: 1.1em; margin-bottom: 20px;">
          <strong>${sorted.length}</strong> session${sorted.length === 1 ? '' : 's'} • 
          <strong>${totalTrials}</strong> trial${totalTrials === 1 ? '' : 's'}
        </p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px;">
          <div>
            <div style="font-size: 0.9em; opacity: 0.8;">Average</div>
            <div style="font-size: 2.2em; font-weight: bold; color: #4ade80;">${overallAvg} ms</div>
          </div>
          <div>
            <div style="font-size: 0.9em; opacity: 0.8;">Best</div>
            <div style="font-size: 1.8em; font-weight: bold; color: #22c55e;">${best} ms</div>
          </div>
          <div>
            <div style="font-size: 0.9em; opacity: 0.8;">Worst</div>
            <div style="font-size: 1.8em; font-weight: bold; color: #ef4444;">${worst} ms</div>
          </div>
        </div>
      </div>
    `;

    // Render filtered history (newest first)
    historyContent.innerHTML = sorted.map(entry => renderHistoryEntry(entry)).join('');
  };

  // Initial render
  updateDisplay();

  // Filter controls
  applyBtn.onclick = updateDisplay;
  resetBtn.onclick = () => {
    filterType.value = 'all';
    filterFrom.value = '';
    filterTo.value = '';
    updateDisplay();
  };

  // Export (exports ALL data, not just filtered — change if you want filtered only)
  exportBtn.onclick = () => {
    let csv = "Type,Date & Time,Frequency (Hz),Initial Color,Stimulus Color,Trials,Min Delay (s),Max Delay (s),Results (ms),Average (ms)\n";

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
        avg
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