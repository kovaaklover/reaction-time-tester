const viewContainer = document.getElementById("viewContainer")!;

// --- ADD THESE LINES ---
interface HistoryEntry {
  timestamp: string;
  initialColor: string;
  stimulusColor: string;
  trials: number;
  minDelay: number;
  maxDelay: number;
  results: number[];
}

// Correctly type the history array
let sessionHistoryA: HistoryEntry[] = [];

// ---------- VIEW RENDERERS ----------

function renderFreeplayVisual() {
  viewContainer.innerHTML = `
    <div id="freeplayLayout">
      <!-- Left Settings Panel -->
      <div id="settingsPanel">
        <h3>Settings</h3>

        <label>Initial Color</label>
        <select id="colorSelect1">
          <option value="blue">Blue</option>
          <option value="green">Green</option>
          <option value="red" selected>Red</option>
          <option value="yellow">Yellow</option>
           <option value="white">White</option>
        </select>

        <label>Stimulus Color</label>
        <select id="colorSelect2">
          <option value="blue">Blue</option>
          <option value="green">Green</option>
          <option value="red" selected>Red</option>
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

      <!-- Center Main Game Area -->
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

      <!-- Right History Panel -->
      <div id="historyPanel">
        <h3>History</h3>
        <div id="historyContent">
          <!-- Rows of previous trials will go here -->
        </div>
      </div>
    </div>
  `;
    // ===== Set default values here, AFTER innerHTML is applied =====
  (document.getElementById("colorSelect1") as HTMLSelectElement).value = "blue";
  (document.getElementById("colorSelect2") as HTMLSelectElement).value = "red";
  (document.getElementById("trialsSelect") as HTMLSelectElement).value = "5";
  (document.getElementById("minDelaySelect") as HTMLSelectElement).value = "1";
  (document.getElementById("maxDelaySelect") as HTMLSelectElement).value = "3";
}


function renderTrainerVisual() {
  viewContainer.innerHTML = `
    <h2>Trainer – Visual</h2>
    <p>Coming soon...</p>
  `;
}

function renderTesterVisual() {
  viewContainer.innerHTML = `
    <h2>Tester – Visual</h2>
    <p>Coming soon...</p>
  `;
}

function renderFreeplaySound() {
  viewContainer.innerHTML = `
    <h2>Freeplay – Sound</h2>
    <p>Coming soon... (audio reaction test)</p>
  `;
}

function renderStats() {
  viewContainer.innerHTML = `
    <h2>Stats</h2>
    <p>No data yet. Complete some tests first!</p>
  `;
}

// ---------- ROUTER ----------

function loadView(view: string) {
  viewContainer.innerHTML = "";

  switch (view) {
    case "freeplay-visual":
      renderFreeplayVisual();
      setupReactionTest();
      break;
    case "trainer-visual":
      renderTrainerVisual();
      break;
    case "tester-visual":
      renderTesterVisual();
      break;
    case "freeplay-sound":
      renderFreeplaySound();
      break;
    case "stats":
      renderStats();
      break;
    default:
      viewContainer.innerHTML = "<p>View not found</p>";
  }

  // Clear session history AFTER the new view is rendered
  sessionHistoryA = [];
  clearHistoryPanel?.(); // now the history panel exists in the DOM if it should
}

// ---------- TOP BAR HANDLER (attach early) ----------

document.querySelectorAll("#topBar button").forEach(btn => {
  btn.addEventListener("click", (e) => {
    // Update active state
    document.querySelectorAll("#topBar button").forEach(b => b.classList.remove("active"));
    (e.currentTarget as HTMLElement).classList.add("active");

    const view = (e.currentTarget as HTMLElement).getAttribute("data-view")!;
    loadView(view);
  });
});

// ---------- REACTION TEST SETUP ----------
function setupReactionTest() {
  const canvas = document.getElementById("stimulus") as HTMLCanvasElement;
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: false })!;
  const startBtn = document.getElementById("startBtn") as HTMLButtonElement;
  const stopBtn = document.getElementById("stopBtn") as HTMLButtonElement;
  const csvBtn = document.getElementById("csvBtn") as HTMLButtonElement;
  const resultText = document.getElementById("result") as HTMLParagraphElement;
  const initialColorSelect = document.getElementById("colorSelect1") as HTMLSelectElement;
  const stimulusColorSelect = document.getElementById("colorSelect2") as HTMLSelectElement;
  const trialsSelect = document.getElementById("trialsSelect") as HTMLSelectElement;
  const minDelaySelect = document.getElementById("minDelaySelect") as HTMLSelectElement;
  const maxDelaySelect = document.getElementById("maxDelaySelect") as HTMLSelectElement;
  const targetColorText = document.getElementById("targetColorText") as HTMLSpanElement;

  // Immediately update canvas when Initial Color dropdown changes
  initialColorSelect.addEventListener("change", () => {
    setColor(initialColorSelect.value);
  });

  // Update instructions text dynamically
  function updateInstructions() {
    const colorName = stimulusColorSelect.options[stimulusColorSelect.selectedIndex].text;
    targetColorText.textContent = colorName.toLowerCase();
    targetColorText.style.color = stimulusColorSelect.value;
  }
  updateInstructions();
  stimulusColorSelect.addEventListener("change", updateInstructions);

  // Responsive canvas sizing
  function resizeCanvas() {
    const maxWidth = Math.min(viewContainer.clientWidth * 0.8, 700);
    const maxHeight = Math.min(viewContainer.clientHeight * 0.5, 500);
    canvas.width = maxWidth;
    canvas.height = maxHeight;
    setColor(initialColorSelect.value);
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  canvas.style.userSelect = "none";
  canvas.style.touchAction = "none";

  const totalTrials = 5;
  let currentTrial = 0;
  let results: number[] = [];
  let readyToClick = false;
  let startTime = 0;

  // --- Set canvas properties for minimal overhead ---
  canvas.style.userSelect = "none";
  canvas.style.touchAction = "none";

  // --- Fill canvas immediately ---
  function setColor(color: string) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // --- Start a new trial ---
  function runNextTrial() {
    const totalTrials = parseInt(trialsSelect.value);
    if (currentTrial >= totalTrials) {


      // --- SAVE RESULTS TO HISTORY ---
      sessionHistoryA.push({
        timestamp: new Date().toLocaleTimeString(),
        initialColor: initialColorSelect.value,
        stimulusColor: stimulusColorSelect.value,
        trials: parseInt(trialsSelect.value),
        minDelay: parseFloat(minDelaySelect.value),
        maxDelay: parseFloat(maxDelaySelect.value),
        results: [...results],
      });

      addHistoryEntry(
        results,
        initialColorSelect.value,
        stimulusColorSelect.value,
        parseInt(trialsSelect.value),
        parseFloat(minDelaySelect.value),
        parseFloat(maxDelaySelect.value)
      );

      resultText.textContent = `Test complete!`;

          // Remove active styling from start button
      startBtn.classList.remove("active");
      return;
    }

// Show INITIAL color (ready/wait state)
    setColor(initialColorSelect.value);
    readyToClick = false;
    resultText.textContent = `Trial ${currentTrial + 1}/${trialsSelect.value}`;

    const minDelay = parseFloat(minDelaySelect.value) * 1000;
    const maxDelay = parseFloat(maxDelaySelect.value) * 1000;
    const delay = minDelay + Math.random() * (maxDelay - minDelay);
    //const delay = 1000 + Math.random() * 2000; // 1–3s random

    // Use setTimeout instead of requestAnimationFrame to reduce jitter
    setTimeout(() => {
      setColor(stimulusColorSelect.value);
      // setColor("blue");
      startTime = performance.now();
      readyToClick = true;
    }, delay);
  }

  // --- Handle clicks ---
  canvas.addEventListener("pointerdown", () => {
    if (!readyToClick) {
      resultText.textContent = "Too early! Wait for blue.";
      return;
    }

    const rt = performance.now() - startTime;
    results.push(rt);

    // Save to session history and update panel
    //sessionHistoryA.push({ trial: currentTrial, reaction: rt });
    //updateHistoryPanel();

    readyToClick = false;
    currentTrial++;

    resultText.textContent = `Trial ${currentTrial}: ${rt.toFixed(1)} ms`;

    // Short pause before next trial
    setTimeout(runNextTrial, 300); // 0.1s for snappy pacing
  });

  // --- Start button ---
  startBtn.onclick = () => {
    startBtn.classList.add("active");   // highlight start
    stopBtn.classList.remove("active"); // remove highlight from stop

    results = [];
    currentTrial = 0;
    resultText.textContent = "Get ready...";
    runNextTrial();
  };

  // --- Stop button ---
  stopBtn.onclick = () => {
    stopBtn.classList.add("active");    // highlight stop
    startBtn.classList.remove("active"); // remove highlight from start

    readyToClick = false;
    currentTrial = 0;
    results = [];
    resultText.textContent = "Test stopped.";

    // Reset canvas
    setColor(initialColorSelect.value);
  };

    // --- CSV download ---
  csvBtn.onclick = () => {
    if (sessionHistoryA.length === 0) return;

    let csv = "timestamp,initial_color,stimulus_color,trials,min_delay,max_delay,results_ms,average_ms\n";

    sessionHistoryA.forEach((entry, i) => {
      const resultsStr = entry.results.map(r => r.toFixed(1)).join("|"); // separate trials with pipe
      const avg = entry.results.reduce((a, b) => a + b, 0) / entry.results.length;
      csv += `${entry.timestamp},${entry.initialColor},${entry.stimulusColor},${entry.trials},${entry.minDelay},${entry.maxDelay},${resultsStr},${avg.toFixed(1)}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "reaction_times_history.csv";
    a.click();
  };
  
}

function addHistoryEntry(results: number[], initialColor: string, stimulusColor: string, trials: number, minDelay: number, maxDelay: number) {
  const historyContent = document.getElementById("historyContent")!;
  
  // Create container for this entry
  const div = document.createElement("div");
  div.style.marginBottom = "10px"; // spacing
  
  // Timestamp
  const timestamp = new Date().toLocaleTimeString();
  
  // Average calculation
  const avg = results.reduce((a,b)=>a+b,0)/results.length;
  
  // Create entry text
  div.innerHTML = `
    <strong>Test at ${timestamp}</strong><br>
    Initial color: ${initialColor}, Stimulus color: ${stimulusColor}<br>
    Trials: ${trials}, Min delay: ${minDelay}s, Max delay: ${maxDelay}s<br>
    Results (ms): ${results.map(r => r.toFixed(1)).join(", ")}<br>
    Average: ${avg.toFixed(1)} ms
  `;
  
  // Add horizontal separator
  const hr = document.createElement("hr");
  hr.style.border = "1px solid #555";
  hr.style.margin = "8px 0";
  
  // Insert at top instead of bottom
  if (historyContent.firstChild) {
    historyContent.insertBefore(hr, historyContent.firstChild);
    historyContent.insertBefore(div, hr);
  } else {
    historyContent.appendChild(div);
    historyContent.appendChild(hr);
  }
}

function clearHistoryPanel() {
  const historyContent = document.getElementById("historyContent");
  if (historyContent) {
    historyContent.innerHTML = ""; // remove all child elements
  }
}

// ---------- INITIAL LOAD ----------

loadView("freeplay-visual");
document.querySelector('#topBar button[data-view="freeplay-visual"]')?.classList.add("active");