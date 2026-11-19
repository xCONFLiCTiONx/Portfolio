/**
 * Standalone Security Audit Report Generator
 * Builds an exportable, self-contained HTML audit report.
 */

export function generateReport(data) {
  const dateStr = new Date(data.timestamp || Date.now()).toLocaleString();
  const score = data.score ?? 0;
  const grade = data.grade || (score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B" : score >= 60 ? "C" : "F");
  const posture = data.posture || "SECURITY AUDIT COMPLETED";

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Security & Privacy Audit Report — ${dateStr}</title>
  <style>
    :root {
      --bg: #0b0d10;
      --card: #161b22;
      --border: #30363d;
      --text: #f0f6fc;
      --muted: #8b949e;
      --accent: #58a6ff;
      --pass: #3fb950;
      --warn: #d29922;
      --fail: #f85149;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      padding: 30px;
      max-width: 1000px;
      margin: auto;
    }
    header {
      border-bottom: 2px solid var(--border);
      padding-bottom: 20px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 15px;
    }
    h1 { color: #fff; font-size: 26px; }
    .meta { color: var(--muted); font-size: 13px; margin-top: 4px; }
    .hero {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 25px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
    }
    .score-badge {
      display: flex;
      align-items: center;
      gap: 18px;
    }
    .grade-box {
      width: 72px;
      height: 72px;
      border-radius: 12px;
      background: rgba(88, 166, 255, 0.15);
      border: 2px solid var(--accent);
      color: var(--accent);
      font-size: 36px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .score-num { font-size: 32px; font-weight: 800; color: #fff; }
    .score-posture { font-size: 13px; font-weight: 600; color: var(--pass); letter-spacing: 1px; }
    .pillars-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      width: 100%;
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid var(--border);
    }
    .pillar-box {
      background: rgba(11, 13, 16, 0.6);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 12px;
    }
    .pillar-title { color: var(--muted); margin-bottom: 4px; }
    .pillar-val { font-size: 16px; font-weight: 700; color: #fff; }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }
    h2 {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 1px;
      color: var(--accent);
      border-bottom: 1px solid var(--border);
      padding-bottom: 10px;
      margin-bottom: 14px;
      text-transform: uppercase;
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 13px;
      gap: 15px;
    }
    .row:last-child { border-bottom: 0; }
    .key { color: var(--muted); font-weight: 500; }
    .val { text-align: right; font-weight: 600; word-break: break-word; }
    .pass { color: var(--pass); }
    .warn { color: var(--warn); }
    .fail { color: var(--fail); }
    .fix-box {
      background: rgba(210, 153, 34, 0.1);
      border-left: 3px solid var(--warn);
      padding: 10px 14px;
      margin-top: 6px;
      border-radius: 4px;
      font-size: 12px;
      color: #e6edf3;
    }
    footer {
      text-align: center;
      color: var(--muted);
      font-size: 12px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Security &amp; Privacy Audit Report</h1>
      <p class="meta">Client Posture Diagnostic &bull; Generated: ${dateStr}</p>
    </div>
    <button onclick="window.print()" style="padding: 8px 16px; background: #21262d; border: 1px solid var(--border); color: #fff; border-radius: 6px; cursor: pointer; font-weight: 600;">Print to PDF</button>
  </header>

  <section class="hero">
    <div class="score-badge">
      <div class="grade-box">${grade}</div>
      <div>
        <div class="score-num">${score} / 100</div>
        <div class="score-posture">${posture}</div>
      </div>
    </div>
`;

  if (data.pillars) {
    html += `
    <div class="pillars-grid">
      <div class="pillar-box">
        <div class="pillar-title">Network &amp; Proxy</div>
        <div class="pillar-val">${data.pillars.network.earned} / ${data.pillars.network.max} pts</div>
      </div>
      <div class="pillar-box">
        <div class="pillar-title">Fingerprint Defense</div>
        <div class="pillar-val">${data.pillars.fingerprint.earned} / ${data.pillars.fingerprint.max} pts</div>
      </div>
      <div class="pillar-box">
        <div class="pillar-title">Permissions &amp; APIs</div>
        <div class="pillar-val">${data.pillars.permissions.earned} / ${data.pillars.permissions.max} pts</div>
      </div>
      <div class="pillar-box">
        <div class="pillar-title">Browser Hardening</div>
        <div class="pillar-val">${data.pillars.browser.earned} / ${data.pillars.browser.max} pts</div>
      </div>
    </div>
`;
  }

  html += `  </section>`;

  for (const section in data.sections) {
    html += `
  <div class="card">
    <h2>${section}</h2>
`;

    for (const item in data.sections[section]) {
      const value = String(data.sections[section][item]);
      const isFix = item.startsWith("How to Fix") || item.startsWith("Issue #") || item.startsWith("Deductions");

      if (isFix) {
        html += `
    <div class="fix-box">
      <strong>${item}:</strong> ${value}
    </div>
`;
      } else {
        let cls = "";
        if (value.includes("[ PASS ]") || value.includes("PASS")) cls = "pass";
        else if (value.includes("[ WARN ]") || value.includes("WARN")) cls = "warn";
        else if (value.includes("[ FAIL ]") || value.includes("FAIL") || value.includes("CRITICAL")) cls = "fail";

        html += `
    <div class="row">
      <span class="key">${item}</span>
      <span class="val ${cls}">${value}</span>
    </div>
`;
      }
    }

    html += `  </div>`;
  }

  html += `
  <footer>
    <p>Audited locally by Portfolio Security Audit Suite &bull; Zero telemetry collected &bull; xCONFLiCTiONx</p>
  </footer>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `security-audit-report-${Date.now()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
