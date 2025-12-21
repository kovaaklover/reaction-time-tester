import type { HistoryEntry } from '../types.js';

export function renderStats(container: HTMLElement, sessionHistory: HistoryEntry[]) {
  container.innerHTML = `
    <h2 style="text-align:center; margin-top:100px;color:white;">Stats</h2>
    <p style="text-align:center;">${
      sessionHistory.length > 0 
        ? 'Data available from Freeplay' 
        : 'No data yet. Complete some tests first!'
    }</p>
  `;
}