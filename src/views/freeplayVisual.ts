import type { HistoryEntry } from '../types.js';

export function renderFreeplayVisual(container: HTMLElement, sessionHistory: HistoryEntry[]) {
  container.innerHTML = `
    <div id="freeplayLayout">
      <div id="settingsPanel">
        <h3>Settings</h3>
        <label>Initial Color</label>
        <select id="colorSelect1">
          <option value="blue">Blue</option>
          <option value="green">Green</option>
          <option value="red">Red</option>
          <option value="yellow">Yellow</option>
          <option value="white">White</option>
        </select>

        <label>Stimulus Color</label>
        <select id="colorSelect2">
          <option value="blue">Blue</option>
          <option value="green">Green</option>
          <option value="red">Red</option>
          <option value="yellow">Yellow</option>
          <option value="white">White</option>
        </select>

        <label>Number of Trials</label>
        <select id="trialsSelect">
          <option value="3">3</option>
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="15">15</option>
        </select>

        <label>Min Delay (seconds)</label>
        <select id="minDelaySelect">
          <option value="0.5">0.5</option>
          <option value="1">1</option>
          <option value="1.5">1.5</option>
          <option value="2">2</option>
        </select>

        <label>Max Delay (seconds)</label>
        <select id="maxDelaySelect">
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
        </select>
      </div>

      <div id="mainPanel">
        <h3 id="mainTitle">
          Main: Click the box as fast as possible when it turns
          <span id="targetColorText">red</span>
        </h3>

        <div id="buttonContainer">
          <button id="startBtn">Start Test</button>
          <button id="stopBtn">Stop Test</button>
          <button id="csvBtn">Download CSV</button>
        </div>

        <canvas id="stimulus"></canvas>
        <p id="result"></p>
      </div>

      <div id="historyPanel">
        <h3>History</h3>
        <div id="historyContent"></div>
      </div>
    </div>
  `;

  // Load view-specific CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'styles/freeplayVisual.css';
  document.head.appendChild(link);

  // Set default values
  (document.getElementById('colorSelect1') as HTMLSelectElement).value = 'blue';
  (document.getElementById('colorSelect2') as HTMLSelectElement).value = 'red';
  (document.getElementById('trialsSelect') as HTMLSelectElement).value = '5';
  (document.getElementById('minDelaySelect') as HTMLSelectElement).value = '1';
  (document.getElementById('maxDelaySelect') as HTMLSelectElement).value = '3';

  setupReactionTest(sessionHistory);
}

function setupReactionTest(sessionHistory: HistoryEntry[]) {
  const canvas = document.getElementById('stimulus') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d', { alpha: false })!;
  const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
  const stopBtn = document.getElementById('stopBtn') as HTMLButtonElement;
  const csvBtn = document.getElementById('csvBtn') as HTMLButtonElement;
  const resultText = document.getElementById('result') as HTMLParagraphElement;
  const initialColorSelect = document.getElementById('colorSelect1') as HTMLSelectElement;
  const stimulusColorSelect = document.getElementById('colorSelect2') as HTMLSelectElement;
  const trialsSelect = document.getElementById('trialsSelect') as HTMLSelectElement;
  const minDelaySelect = document.getElementById('minDelaySelect') as HTMLSelectElement;
  const maxDelaySelect = document.getElementById('maxDelaySelect') as HTMLSelectElement;
  const targetColorText = document.getElementById('targetColorText') as HTMLSpanElement;

  // Update canvas on initial color change
  initialColorSelect.addEventListener('change', () => setColor(initialColorSelect.value));

  // Update instructions
  function updateInstructions() {
    const colorName = stimulusColorSelect.options[stimulusColorSelect.selectedIndex].text;
    targetColorText.textContent = colorName.toLowerCase();
    targetColorText.style.color = stimulusColorSelect.value;
  }
  updateInstructions();
  stimulusColorSelect.addEventListener('change', updateInstructions);

  // Responsive canvas
// Responsive canvas
  function resizeCanvas() {
    const parent = canvas.parentElement!;
    const maxWidth = Math.min(parent.clientWidth * 0.9, 700);
    const maxHeight = Math.min(parent.clientHeight * 0.7, 500);
    canvas.width = maxWidth;
    canvas.height = maxHeight;
    setColor(initialColorSelect.value);
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  canvas.style.userSelect = 'none';
  canvas.style.touchAction = 'none';

  let currentTrial = 0;
  let results: number[] = [];
  let readyToClick = false;
  let startTime = 0;

  function setColor(color: string) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function runNextTrial() {
    const totalTrials = parseInt(trialsSelect.value);
    if (currentTrial >= totalTrials) {
      const entry: HistoryEntry = {
        timestamp: new Date().toLocaleTimeString(),
        initialColor: initialColorSelect.value,
        stimulusColor: stimulusColorSelect.value,
        trials: totalTrials,
        minDelay: parseFloat(minDelaySelect.value),
        maxDelay: parseFloat(maxDelaySelect.value),
        results: [...results]
      };
      sessionHistory.push(entry);
      addHistoryEntry(entry);
      resultText.textContent = 'Test complete!';
      startBtn.classList.remove('active');
      return;
    }

    setColor(initialColorSelect.value);
    readyToClick = false;
    resultText.textContent = `Trial ${currentTrial + 1}/${totalTrials}`;

    const minDelay = parseFloat(minDelaySelect.value) * 1000;
    const maxDelay = parseFloat(maxDelaySelect.value) * 1000;
    const delay = minDelay + Math.random() * (maxDelay - minDelay);

    setTimeout(() => {
      setColor(stimulusColorSelect.value);
      startTime = performance.now();
      readyToClick = true;
    }, delay);
  }

  canvas.addEventListener('pointerdown', () => {
    if (!readyToClick) {
      resultText.textContent = `Too early! Wait for ${stimulusColorSelect.options[stimulusColorSelect.selectedIndex].text.toLowerCase()}.`;
      return;
    }

    const rt = performance.now() - startTime;
    results.push(rt);
    readyToClick = false;
    currentTrial++;
    resultText.textContent = `Trial ${currentTrial}: ${rt.toFixed(1)} ms`;

    setTimeout(runNextTrial, 300);
  });

  startBtn.onclick = () => {
    startBtn.classList.add('active');
    stopBtn.classList.remove('active');
    results = [];
    currentTrial = 0;
    resultText.textContent = 'Get ready...';
    runNextTrial();
  };

  stopBtn.onclick = () => {
    stopBtn.classList.add('active');
    startBtn.classList.remove('active');
    readyToClick = false;
    currentTrial = 0;
    results = [];
    resultText.textContent = 'Test stopped.';
    setColor(initialColorSelect.value);
  };

  csvBtn.onclick = () => {
    if (sessionHistory.length === 0) return;

    let csv = "timestamp,initial_color,stimulus_color,trials,min_delay,max_delay,results_ms,average_ms\n";
    sessionHistory.forEach(entry => {
      const resultsStr = entry.results.map(r => r.toFixed(1)).join("|");
      const avg = entry.results.reduce((a, b) => a + b, 0) / entry.results.length;
      csv += `${entry.timestamp},${entry.initialColor},${entry.stimulusColor},${entry.trials},${entry.minDelay},${entry.maxDelay},${resultsStr},${avg.toFixed(1)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reaction_times_history.csv';
    a.click();
  };

  function addHistoryEntry(entry: HistoryEntry) {
    const historyContent = document.getElementById('historyContent')!;
    const div = document.createElement('div');
    div.style.marginBottom = '10px';
    const avg = entry.results.reduce((a, b) => a + b, 0) / entry.results.length;

    div.innerHTML = `
      <strong>Test at ${entry.timestamp}</strong><br>
      Initial: ${entry.initialColor}, Stimulus: ${entry.stimulusColor}<br>
      Trials: ${entry.trials}, Delays: ${entry.minDelay}s–${entry.maxDelay}s<br>
      Results (ms): ${entry.results.map(r => r.toFixed(1)).join(', ')}<br>
      Average: ${avg.toFixed(1)} ms
    `;

    const hr = document.createElement('hr');
    hr.style.border = '1px solid #555';
    hr.style.margin = '8px 0';

    historyContent.insertBefore(hr, historyContent.firstChild);
    historyContent.insertBefore(div, hr);
  }
}