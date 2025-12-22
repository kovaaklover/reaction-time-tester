// No import needed anymore!

interface HistoryEntry {
  timestamp: string;
  type: 'Freeplay Visual';
  initialColor: string;
  stimulusColor: string;
  trials: number;
  minDelay: number;
  maxDelay: number;
  results: number[];
}

// This function builds the “Freeplay – Visual” screen and sets up the test
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
          <option value="5" selected>5</option>
          <option value="10">10</option>
          <option value="15">15</option>
        </select>

        <label>Min Delay (seconds)</label>
        <select id="minDelaySelect">
          <option value="0.5">0.5</option>
          <option value="1" selected>1</option>
          <option value="1.5">1.5</option>
          <option value="2">2</option>
        </select>

        <label>Max Delay (seconds)</label>
        <select id="maxDelaySelect">
          <option value="2">2</option>
          <option value="3" selected>3</option>
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
        </div>

        <canvas id="stimulus"></canvas>
        <p id="result"></p>
      </div>

      <div id="historyPanel">
        <h3>Recent History</h3>
        <div id="historyContent"></div>
      </div>
    </div>
  `;

  // Load CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'styles/freeplayVisual.css';
  document.head.appendChild(link);

  // Set defaults (I also added 'selected' in HTML for clarity)
  const initialColorSelect = document.getElementById('colorSelect1') as HTMLSelectElement;
  initialColorSelect.value = 'blue';

  const stimulusColorSelect = document.getElementById('colorSelect2') as HTMLSelectElement;
  stimulusColorSelect.value = 'red';

  setupReactionTest(sessionHistory);
}

// All the reaction test logic — now in the same file, no imports needed
function setupReactionTest(sessionHistory: HistoryEntry[]) {
  const canvas = document.getElementById('stimulus') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d', { alpha: false })!;
  const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
  const stopBtn = document.getElementById('stopBtn') as HTMLButtonElement;
  const resultText = document.getElementById('result') as HTMLParagraphElement;
  const initialColorSelect = document.getElementById('colorSelect1') as HTMLSelectElement;
  const stimulusColorSelect = document.getElementById('colorSelect2') as HTMLSelectElement;
  const trialsSelect = document.getElementById('trialsSelect') as HTMLSelectElement;
  const minDelaySelect = document.getElementById('minDelaySelect') as HTMLSelectElement;
  const maxDelaySelect = document.getElementById('maxDelaySelect') as HTMLSelectElement;
  const targetColorText = document.getElementById('targetColorText') as HTMLSpanElement;

  let currentTrial = 0;
  let results: number[] = [];
  let readyToClick = false;
  let startTime = 0;

  // Canvas color handling
  function setColor(color: string) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  setColor(initialColorSelect.value);
  initialColorSelect.addEventListener('change', () => setColor(initialColorSelect.value));

  // Instructions update
  function updateInstructions() {
    const colorName = stimulusColorSelect.options[stimulusColorSelect.selectedIndex].text;
    targetColorText.textContent = colorName.toLowerCase();
    targetColorText.style.color = stimulusColorSelect.value;
  }
  updateInstructions();
  stimulusColorSelect.addEventListener('change', updateInstructions);

  // Start button
  startBtn.onclick = () => {
    startBtn.classList.add('active');
    stopBtn.classList.remove('active');
    results = [];
    currentTrial = 0;
    resultText.textContent = 'Get ready...';
    runNextTrial();
  };

  // Stop button
  stopBtn.onclick = () => {
    stopBtn.classList.add('active');
    startBtn.classList.remove('active');
    readyToClick = false;
    currentTrial = 0;
    results = [];
    resultText.textContent = 'Test stopped.';
    setColor(initialColorSelect.value);
  };

  // Core trial logic
  function runNextTrial() {
    const totalTrials = parseInt(trialsSelect.value);

    if (currentTrial >= totalTrials) {
      const entry: HistoryEntry = {
        timestamp: new Date().toLocaleString(),
        type: 'Freeplay Visual',
        initialColor: initialColorSelect.value,
        stimulusColor: stimulusColorSelect.value,
        trials: totalTrials,
        minDelay: parseFloat(minDelaySelect.value),
        maxDelay: parseFloat(maxDelaySelect.value),
        results: [...results]
      };
      sessionHistory.push(entry);
      localStorage.setItem('reactionTestHistory', JSON.stringify(sessionHistory));
      addHistoryEntry(entry);
      resultText.textContent = 'Test complete!';
      startBtn.classList.remove('active');
      return;
    }

    currentTrial++;
    setColor(initialColorSelect.value);
    readyToClick = false;
    resultText.textContent = `Trial ${currentTrial}/${totalTrials}`;

    const minDelay = parseFloat(minDelaySelect.value) * 1000;
    const maxDelay = parseFloat(maxDelaySelect.value) * 1000;
    const delay = Math.random() * (maxDelay - minDelay) + minDelay;

    setTimeout(() => {
      setColor(stimulusColorSelect.value);
      startTime = performance.now();
      readyToClick = true;
    }, delay);
  }

  // Click handler
  canvas.addEventListener('pointerdown', () => {
    if (!readyToClick) {
      resultText.textContent = `Too early! Wait for ${stimulusColorSelect.options[stimulusColorSelect.selectedIndex].text.toLowerCase()}.`;
      return;
    }

    const rt = performance.now() - startTime;
    results.push(rt);
    resultText.textContent = `Trial ${currentTrial}: ${rt.toFixed(1)} ms`;

    setTimeout(runNextTrial, 300);
  });

  // History display
  function addHistoryEntry(entry: HistoryEntry) {
    const historyContent = document.getElementById('historyContent')!;
    const div = document.createElement('div');
    div.style.marginBottom = '10px';
    const avg = entry.results.reduce((a, b) => a + b, 0) / entry.results.length || 0;

    div.innerHTML = `
      <strong>${entry.type.charAt(0).toUpperCase() + entry.type.slice(1)} Test at ${entry.timestamp}</strong><br>
      Initial: ${entry.initialColor}, Stimulus: ${entry.stimulusColor}<br>
      Trials: ${entry.trials}, Delays: ${entry.minDelay}s–${entry.maxDelay}s<br>
      Results (ms): ${entry.results.map(r => r.toFixed(1)).join(', ')}<br>
      Average: ${avg.toFixed(1)} ms
    `;

    const hr = document.createElement('hr');
    hr.style.border = '1px solid #555';
    hr.style.margin = '8px 0';

    historyContent.insertBefore(div, historyContent.firstChild);
    historyContent.insertBefore(hr, div);
  }
}