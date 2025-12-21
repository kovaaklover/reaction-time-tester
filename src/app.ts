import { renderFreeplayVisual } from './views/freeplayVisual.js';
import { renderTrainerVisual } from './views/trainerVisual.js';
import { renderTesterVisual } from './views/testerVisual.js';
import { renderFreeplaySound } from './views/freeplaySound.js';
import { renderStats } from './views/stats.js';
import type { HistoryEntry } from './types.js';

const viewContainer = document.getElementById('viewContainer')!;

let sessionHistory: HistoryEntry[] = [];

function loadView(view: string) {
  viewContainer.innerHTML = '';
  sessionHistory = [];

  switch (view) {
    case 'freeplay-visual':
      renderFreeplayVisual(viewContainer, sessionHistory);
      break;
    case 'trainer-visual':
      renderTrainerVisual(viewContainer);
      break;
    case 'tester-visual':
      renderTesterVisual(viewContainer);
      break;
    case 'freeplay-sound':
      renderFreeplaySound(viewContainer);
      break;
    case 'stats':
      renderStats(viewContainer, sessionHistory);
      break;
    default:
      viewContainer.innerHTML = '<p>View not found</p>';
  }
}

// Top bar navigation
document.querySelectorAll('#topBar button').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('#topBar button').forEach(b => b.classList.remove('active'));
    (e.currentTarget as HTMLElement).classList.add('active');
    const view = (e.currentTarget as HTMLElement).getAttribute('data-view')!;
    loadView(view);
  });
});

// Initial load
loadView('freeplay-visual');