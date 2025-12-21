const canvas = document.getElementById("stimulus") as HTMLCanvasElement;
const ctx = canvas.getContext("2d", { desynchronized: true, alpha: false })!;
const startBtn = document.getElementById("startBtn") as HTMLButtonElement;
const csvBtn = document.getElementById("csvBtn") as HTMLButtonElement;
const resultText = document.getElementById("result") as HTMLParagraphElement;

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
  if (currentTrial >= totalTrials) {
    resultText.textContent = `Test complete! Results: ${results.map(r => r.toFixed(1)).join(", ")} ms`;
    return;
  }

  // Show "ready" color
  setColor("red");
  readyToClick = false;

  const delay = 1000 + Math.random() * 2000; // 1–3s random

  // Use setTimeout instead of requestAnimationFrame to reduce jitter
  setTimeout(() => {
    setColor("blue");
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
  readyToClick = false;
  currentTrial++;

  resultText.textContent = `Trial ${currentTrial}: ${rt.toFixed(1)} ms`;

  // Short pause before next trial
  setTimeout(runNextTrial, 300); // 0.1s for snappy pacing
});

// --- Start button ---
startBtn.onclick = () => {
  results = [];
  currentTrial = 0;
  resultText.textContent = "Get ready...";
  runNextTrial();
};

// --- CSV download ---
csvBtn.onclick = () => {
  let csv = "trial,reaction_time_ms\n";
  results.forEach((r, i) => (csv += `${i + 1},${r.toFixed(2)}\n`));

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "reaction_times.csv";
  a.click();
};
