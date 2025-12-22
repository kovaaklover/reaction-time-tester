// app.ts (or your main script file)

// Import all your view render functions
import { renderFreeplayVisual } from './views/freeplayVisual.js';
import { renderTesterVisual } from './views/testerVisual.js';
import { renderFreeplaySound } from './views/freeplaySound.js';
import { renderStats } from './views/stats.js';

// Main container where views are injected
const viewContainer = document.getElementById('viewContainer')!;

// Global session history – shared across views that need it
// We use any[] because the shape is defined inside each individual view file
//let sessionHistory: any[] = [];

// Load saved history from localStorage (or empty array if none)
let sessionHistory: any[] = JSON.parse(localStorage.getItem('reactionTestHistory') || '[]');

// Function to load a specific view
function loadView(view: string) {
  // Clear the previous view
  viewContainer.innerHTML = '';

  // NOTE: We do NOT reset sessionHistory here anymore
  // This allows history to persist when switching tabs (e.g., to Stats and back)

  switch (view) {
    case 'freeplay-visual':
      renderFreeplayVisual(viewContainer, sessionHistory);
      break;
    case 'freeplay-sound':
      renderFreeplaySound(viewContainer, sessionHistory);
      break;
    case 'tester-visual':
      renderTesterVisual(viewContainer, sessionHistory);
      break;
    case 'stats':
      renderStats(viewContainer, sessionHistory);
      break;
    default:
      viewContainer.innerHTML = '<p style="text-align:center; padding:2rem;">View not found</p>';
  }
}

// Top navigation bar handling
document.querySelectorAll('#topBar button').forEach(btn => {
  btn.addEventListener('click', (e) => {
    // Remove active class from all buttons
    document.querySelectorAll('#topBar button').forEach(b => b.classList.remove('active'));
    
    // Add active class to clicked button
    (e.currentTarget as HTMLElement).classList.add('active');
    
    // Get the view name from data-view attribute
    const view = (e.currentTarget as HTMLElement).getAttribute('data-view')!;
    
    // Load the selected view
    loadView(view);
  });
});

// Load the default view on page start
loadView('freeplay-visual');