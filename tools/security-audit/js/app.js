import { runScanner } from "./scanner.js";
import { generateReport } from "./report.js";

let latestReport = null;

const scanButton = document.getElementById("scanButton");
const reportButton = document.getElementById("reportButton");
const status = document.getElementById("status");
const score = document.getElementById("score");

scanButton.addEventListener("click", async () => {
  scanButton.disabled = true;
  status.textContent = "Running security scan...";

  try {
    latestReport = await runScanner();
    score.textContent = latestReport.score;
    renderResults(latestReport.sections);
    reportButton.disabled = false;
    status.textContent = "Scan completed. Refresh page after making security adjustments to see updated score.";
  } catch (error) {
    console.error(error);
    status.textContent = "Scan failed: " + error.message;
  }

  scanButton.disabled = false;
});

reportButton.addEventListener("click", () => {
  if (latestReport) {
    generateReport(latestReport);
  }
});

function renderResults(sections) {
  const container = document.getElementById("results");
  container.innerHTML = "";

  for (const section in sections) {
    let html = `
      <div class="card">
        <h2>${section}</h2>
    `;

    for (const item in sections[section]) {
      const value = sections[section][item];
      let cls = "";
      let isFix = String(item).startsWith("How to Fix") || String(item).startsWith("Fix for");

      if (isFix) {
        cls = "fix-instruction";
      } else if (String(value).includes("PASS") || String(value).includes("ACTIVE") || String(value).includes("CONNECTED") || String(value).includes("SUPPORTED") || String(value).includes("AVAILABLE")) {
        cls = "pass";
      } else if (String(value).includes("WARN") || String(value).includes("UNKNOWN") || String(value).includes("INACTIVE")) {
        cls = "warn";
      } else if (String(value).includes("FAIL") || String(value).includes("GRANTED") || String(value).includes("BLOCKED") || String(value).includes("UNREACHABLE")) {
        cls = "fail";
      }

      html += `
        <div class="row ${isFix ? "fix-row" : ""}">
          <span>${item}</span>
          <span class="${cls}">${value}</span>
        </div>
      `;
    }

    html += `</div>`;
    container.innerHTML += html;
  }
}
