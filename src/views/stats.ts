// src/views/stats.ts

interface HistoryEntry {
  timestamp: string;
  type: 'visual' | 'sound';
  initialColor?: string | null;
  stimulusColor?: string | null;
  trials: number;
  minDelay: number;
  maxDelay: number;
  results: number[];
}

export function renderStats(container: HTMLElement, sessionHistory: HistoryEntry[]) {
  container.innerHTML = `
    <div id="statsContainer">
      <h2>Reaction Time Stats & History</h2>

      <div id="statsContentWrapper">
        <div id="statsSummary">
          <span class="summary-text" id="summaryText"></span>
          <div class="overall-average" id="overallAvg"></div>
        </div>

        <div id="buttonContainer">
          <button id="exportCsvBtn">Export to CSV</button>
          <button id="clearHistoryBtn">Clear All History</button>
        </div>

        <div id="statsContent"></div>
      </div>

      <div id="statsEmpty" style="display:none;">
        <p>
          No tests completed yet.<br><br>
          Go to <strong>Freeplay Visual</strong> or <strong>Freeplay Sound</strong> to start testing!
        </p>
      </div>
    </div>
  `;

  // Load CSS (just like your other files!)
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'styles/stats.css';
  document.head.appendChild(link);

  // Call setup function for all logic
  setupStats(container, sessionHistory);
}

function setupStats(container: HTMLElement, sessionHistory: HistoryEntry[]) {
  const summaryText = document.getElementById('summaryText')!;
  const overallAvgEl = document.getElementById('overallAvg')!;
  const statsContent = document.getElementById('statsContent')!;
  const statsEmpty = document.getElementById('statsEmpty')!;
  const exportBtn = document.getElementById('exportCsvBtn')!;
  const clearBtn = document.getElementById('clearHistoryBtn')!;

  // === EMPTY STATE ===
  if (sessionHistory.length === 0) {
    statsEmpty.style.display = 'block';
    statsContent.innerHTML = '';
    summaryText.textContent = '';
    overallAvgEl.textContent = '';
    return;
  }

  // Hide empty message
  statsEmpty.style.display = 'none';

  // === CALCULATE AND DISPLAY SUMMARY ===
  const sortedHistory = [...sessionHistory].reverse();
  const allResults = sortedHistory.flatMap(e => e.results);
  const overallAvg = allResults.length > 0
    ? (allResults.reduce((a, b) => a + b, 0) / allResults.length).toFixed(1)
    : '0.0';

  summaryText.textContent = `${sortedHistory.length} test${sortedHistory.length === 1 ? '' : 's'} completed • ${allResults.length} total trials`;
  overallAvgEl.innerHTML = `Overall average: <strong>${overallAvg} ms</strong>`;

  // === BUILD HISTORY ENTRIES ===
  const historyHTML = sortedHistory.map(entry => {
    const avg = entry.results.length > 0
      ? (entry.results.reduce((a, b) => a + b, 0) / entry.results.length).toFixed(1)
      : '0.0';
    const resultsList = entry.results.map(r => r.toFixed(1)).join(', ');

    const testType = entry.type === 'visual' ? 'Visual' : 'Sound';
    const visualDetails = entry.initialColor && entry.stimulusColor
      ? `<br>Initial: <span style="color:${entry.initialColor};">■ ${entry.initialColor}</span> → 
         Stimulus: <span style="color:${entry.stimulusColor};">■ ${entry.stimulusColor}</span>`
      : '';

    return `
      <div class="stats-entry">
        <div class="entry-header">
          <strong class="test-type">${testType} Test</strong>
          <span class="timestamp">${entry.timestamp}</span>
        </div>
        <div class="entry-info">
          Trials: <strong>${entry.trials}</strong> | Delays: ${entry.minDelay}s–${entry.maxDelay}s${visualDetails}
        </div>
        <div class="results-section">
          <strong>Reaction times (ms):</strong>
          <div class="results-list">${resultsList}</div>
        </div>
        <div class="average">Average: <strong>${avg} ms</strong></div>
      </div>
    `;
  }).join('');

  statsContent.innerHTML = historyHTML;

  // === EXPORT TO CSV ===
  exportBtn.onclick = () => {
    let csv = "type,timestamp,initial_color,stimulus_color,trials,min_delay,max_delay,results_ms,average_ms\n";

    sessionHistory.forEach(entry => {
      const resultsStr = entry.results.map(r => r.toFixed(1)).join("|");
      const avg = entry.results.length > 0
        ? (entry.results.reduce((a, b) => a + b, 0) / entry.results.length).toFixed(1)
        : '0.0';
      const initColor = entry.initialColor || "";
      const stimColor = entry.stimulusColor || "";

      csv += `${entry.type},${entry.timestamp},"${initColor}","${stimColor}",${entry.trials},${entry.minDelay},${entry.maxDelay},${resultsStr},${avg}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reaction_time_stats_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // === CLEAR HISTORY ===
  clearBtn.onclick = () => {
    if (confirm('⚠️ Delete ALL saved reaction time history?\n\nThis cannot be undone.')) {
      localStorage.removeItem('reactionTestHistory');
      sessionHistory.length = 0;
      renderStats(container, sessionHistory); // Re-render clean
    }
  };
}