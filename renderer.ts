let startTime: number = 0;
let results: number[] = [];
let readyToClick: boolean = false;

const startBtn = document.getElementById("startBtn") as HTMLButtonElement;
const stimulus = document.getElementById("stimulus") as HTMLDivElement;
const resultText = document.getElementById("result") as HTMLParagraphElement;
const csvBtn = document.getElementById("csvBtn") as HTMLButtonElement;

const totalTrials = 5;   // number of trials
let currentTrial = 0;

// Start the test
startBtn.onclick = () => {
  results = [];
  currentTrial = 0;
  resultText.textContent = "Get ready...";
  runNextTrial();
};

// Function to run a single trial
function runNextTrial() {
  if (currentTrial >= totalTrials) {
    resultText.textContent = `Test complete! Results: ${results.map(r => r.toFixed(1)).join(", ")} ms`;
    return;
  }

  readyToClick = false;
  stimulus.style.backgroundColor = "red"; // reset to red

  const delay = Math.random() * 2000 + 1000; // 1–3s random delay

  setTimeout(() => {
    stimulus.style.backgroundColor = "blue"; // go signal
    startTime = performance.now();
    readyToClick = true;
  }, delay);
}

// Handle click
stimulus.onclick = () => {
  if (!readyToClick) {
    resultText.textContent = "Too early! Wait for blue.";
    return;
  }

  const rt = performance.now() - startTime;
  results.push(rt);
  readyToClick = false;
  currentTrial++;

  resultText.textContent = `Trial ${currentTrial}: ${rt.toFixed(1)} ms`;

  // After a short pause, run next trial
  setTimeout(runNextTrial, 500); // 0.5s pause between trials
};

// CSV export
csvBtn.onclick = () => {
  let csv = "trial,reaction_time_ms\n";
  results.forEach((rt, i) => {
    csv += `${i + 1},${rt.toFixed(2)}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "reaction_times.csv";
  a.click();
};
