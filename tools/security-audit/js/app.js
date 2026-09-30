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

    status.textContent = "Scan completed";
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

      if (value === "PASS" || value === "AVAILABLE" || value === "SUPPORTED") {
        cls = "pass";
      } else if (value === "WARN" || value === "UNKNOWN") {
        cls = "warn";
      } else if (value === "FAIL") {
        cls = "fail";
      }

      html += `
<div class="row">

<span>
${item}
</span>

<span class="${cls}">
${value}
</span>

</div>
`;
    }

    html += "</div>";

    container.innerHTML += html;
  }
}
