/**
 * Security & Privacy Audit Workbench Controller
 * Manages live scanning, metric HUD rendering, category filtering, and report exports.
 */

import { runScanner } from "./scanner.js";
import { generateReport } from "./report.js";

let latestReport = null;
let currentFilter = "all";
let searchQuery = "";

// DOM Elements
const scanButton = document.getElementById("scanButton");
const retestNetButton = document.getElementById("retestNetButton");
const reportButton = document.getElementById("reportButton");
const copySummaryButton = document.getElementById("copySummaryButton");
const scanStatusText = document.getElementById("scanStatusText");
const scanProgressBar = document.getElementById("scanProgressBar");
const scoreValue = document.getElementById("scoreValue");
const gradeBadge = document.getElementById("gradeBadge");
const postureTag = document.getElementById("postureTag");
const resultsContainer = document.getElementById("results");
const filterTabs = document.querySelectorAll(".filter-tab");
const searchInput = document.getElementById("auditSearch");
const topDetectedIp = document.getElementById("topDetectedIp");
const topDetectedLocation = document.getElementById("topDetectedLocation");

// Pillar elements
const pillarNetwork = document.getElementById("pillarNetwork");
const pillarFingerprint = document.getElementById("pillarFingerprint");
const pillarPermissions = document.getElementById("pillarPermissions");
const pillarBrowser = document.getElementById("pillarBrowser");

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  setupFilterTabs();
  setupSearch();
  setupEventListeners();

  // Run initial scan automatically on load
  setTimeout(() => {
    executeFullScan();
  }, 300);
});

function setupEventListeners() {
  if (scanButton) {
    scanButton.addEventListener("click", () => executeFullScan());
  }

  if (retestNetButton) {
    retestNetButton.addEventListener("click", () => executeFullScan("Re-probing Network, Proxy & WebRTC routes..."));
  }

  if (reportButton) {
    reportButton.addEventListener("click", () => {
      if (latestReport) generateReport(latestReport);
    });
  }

  if (copySummaryButton) {
    copySummaryButton.addEventListener("click", () => copyAuditSummary());
  }
}

function setupFilterTabs() {
  filterTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      filterTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentFilter = tab.dataset.filter || "all";
      if (latestReport) renderResults(latestReport.sections);
    });
  });
}

function setupSearch() {
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = (e.target.value || "").trim().toLowerCase();
      if (latestReport) renderResults(latestReport.sections);
    });
  }
}

async function executeFullScan(customStatus = null) {
  if (scanButton) scanButton.disabled = true;
  if (retestNetButton) retestNetButton.disabled = true;
  if (scanProgressBar) scanProgressBar.style.width = "20%";
  if (scanStatusText) scanStatusText.textContent = customStatus || "Initializing security probe...";
  if (topDetectedIp) topDetectedIp.textContent = "Detecting...";
  if (topDetectedLocation) topDetectedLocation.textContent = "Detecting...";

  try {
    latestReport = await runScanner((stepMsg) => {
      if (scanStatusText) scanStatusText.textContent = stepMsg;
      if (scanProgressBar) {
        const cur = parseInt(scanProgressBar.style.width) || 20;
        scanProgressBar.style.width = Math.min(95, cur + 12) + "%";
      }
    });

    if (scanProgressBar) scanProgressBar.style.width = "100%";
    if (scanStatusText) scanStatusText.textContent = `Audit complete. Security score: ${latestReport.score} / 100 (${latestReport.grade}).`;

    updateHeroScore(latestReport);
    updateTopIdentity(latestReport);
    renderResults(latestReport.sections);

    if (reportButton) reportButton.disabled = false;
    if (copySummaryButton) copySummaryButton.disabled = false;

  } catch (err) {
    console.error("Scan error:", err);
    if (scanStatusText) scanStatusText.textContent = "Scan encountered an issue: " + err.message;
    if (scanProgressBar) scanProgressBar.style.width = "0%";
  } finally {
    if (scanButton) scanButton.disabled = false;
    if (retestNetButton) retestNetButton.disabled = false;
    setTimeout(() => {
      if (scanProgressBar) scanProgressBar.style.width = "0%";
    }, 1500);
  }
}

function updateHeroScore(report) {
  const score = report.score ?? 0;

  // Animate numerical score counter
  animateCounter(scoreValue, 0, score, 600);

  if (gradeBadge) {
    gradeBadge.textContent = report.grade || "A";
    gradeBadge.className = `grade-pill ${report.postureClass || "grade-a"}`;
  }

  if (postureTag) {
    postureTag.textContent = report.posture || "ANALYSIS COMPLETE";
    postureTag.className = `posture-badge ${report.postureClass || "grade-a"}`;
  }

  // Update SVG Gauge Ring if present
  const circle = document.getElementById("gaugeCircle");
  if (circle) {
    const circumference = 2 * Math.PI * 70; // r=70
    const offset = circumference - (score / 100) * circumference;
    circle.style.strokeDasharray = `${circumference}`;
    circle.style.strokeDashoffset = `${offset}`;

    if (score >= 90) circle.style.stroke = "#3fb950";
    else if (score >= 75) circle.style.stroke = "#58a6ff";
    else if (score >= 60) circle.style.stroke = "#d29922";
    else circle.style.stroke = "#f85149";
  }

  // Update Pillars
  if (report.pillars) {
    updatePillarUI(pillarNetwork, report.pillars.network);
    updatePillarUI(pillarFingerprint, report.pillars.fingerprint);
    updatePillarUI(pillarPermissions, report.pillars.permissions);
    updatePillarUI(pillarBrowser, report.pillars.browser);
  }
}

function updateTopIdentity(report) {
  if (topDetectedIp) {
    topDetectedIp.textContent = report.publicIp || "Unavailable / Hidden";
  }
  if (topDetectedLocation) {
    topDetectedLocation.textContent = report.detectedLocation || "Unknown Location";
  }
}

function updatePillarUI(el, pillar) {
  if (!el || !pillar) return;
  const pct = Math.round((pillar.earned / pillar.max) * 100);
  const valText = el.querySelector(".pillar-num");
  const fillBar = el.querySelector(".pillar-fill");
  if (valText) valText.textContent = `${pillar.earned}/${pillar.max}`;
  if (fillBar) {
    fillBar.style.width = `${pct}%`;
    if (pct >= 85) fillBar.style.background = "#3fb950";
    else if (pct >= 65) fillBar.style.background = "#58a6ff";
    else fillBar.style.background = "#d29922";
  }
}

function animateCounter(element, start, end, duration) {
  if (!element) return;
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    element.textContent = Math.floor(progress * (end - start) + start);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      element.textContent = end;
    }
  };
  window.requestAnimationFrame(step);
}

function renderResults(sections) {
  if (!resultsContainer) return;
  resultsContainer.innerHTML = "";

  const sectionIconMap = {
    "SCORE BREAKDOWN & REMEDIATION": "im im-award",
    "NETWORK & PROXY ROUTING": "im im-globe",
    "WEBRTC LEAK AUDIT": "im im-shield-check",
    "SECURE DNS & ENCRYPTION": "im im-lock",
    "BROWSER & PROTOCOL SECURITY": "im im-firefox",
    "FINGERPRINTING & TRACKING DEFENSE": "im im-fingerprint",
    "DEVICE & PLATFORM POSTURE": "im im-mobile-device",
    "DEVICE PERMISSIONS & APIS": "im im-key",
    "STORAGE & STATE ISOLATION": "im im-database"
  };

  const sectionCategoryMap = {
    "NETWORK & PROXY ROUTING": "network",
    "WEBRTC LEAK AUDIT": "network",
    "SECURE DNS & ENCRYPTION": "network",
    "BROWSER & PROTOCOL SECURITY": "browser",
    "FINGERPRINTING & TRACKING DEFENSE": "fingerprint",
    "DEVICE & PLATFORM POSTURE": "browser",
    "DEVICE PERMISSIONS & APIS": "permissions",
    "STORAGE & STATE ISOLATION": "storage",
    "SCORE BREAKDOWN & REMEDIATION": "fixes"
  };

  let visibleCount = 0;

  for (const sectionName in sections) {
    const category = sectionCategoryMap[sectionName] || "all";

    // Category filter check
    if (currentFilter !== "all") {
      if (currentFilter === "fixes" && category !== "fixes") continue;
      if (currentFilter !== "fixes" && category !== currentFilter) continue;
    }

    const items = sections[sectionName];
    let rowsHtml = "";
    let sectionMatchesSearch = sectionName.toLowerCase().includes(searchQuery);

    let passCount = 0;
    let warnCount = 0;
    let failCount = 0;

    for (const key in items) {
      const val = String(items[key]);
      const isFix = key.startsWith("How to Fix") || key.startsWith("Issue #") || key.startsWith("Deductions");

      if (val.includes("[ PASS ]") || val.includes("PASS")) passCount++;
      else if (val.includes("[ WARN ]") || val.includes("WARN")) warnCount++;
      else if (val.includes("[ FAIL ]") || val.includes("FAIL") || val.includes("CRITICAL")) failCount++;

      // Search match
      const keyMatches = key.toLowerCase().includes(searchQuery);
      const valMatches = val.toLowerCase().includes(searchQuery);

      if (searchQuery && !sectionMatchesSearch && !keyMatches && !valMatches) {
        continue;
      }

      if (isFix) {
        rowsHtml += `
          <div class="fix-callout">
            <div class="fix-title"><i class="im im-wrench"></i> ${escapeHtml(key)}</div>
            <div class="fix-body">${escapeHtml(val)}</div>
          </div>
        `;
      } else {
        let cls = "badge-neutral";
        if (val.includes("[ PASS ]") || val.includes("PASS")) cls = "badge-pass";
        else if (val.includes("[ WARN ]") || val.includes("WARN")) cls = "badge-warn";
        else if (val.includes("[ FAIL ]") || val.includes("FAIL") || val.includes("CRITICAL")) cls = "badge-fail";

        rowsHtml += `
          <div class="audit-row">
            <span class="audit-key">${escapeHtml(key)}</span>
            <span class="audit-val ${cls}">${escapeHtml(val)}</span>
          </div>
        `;
      }
    }

    if (rowsHtml === "" && searchQuery) continue;

    visibleCount++;
    const iconClass = sectionIconMap[sectionName] || "im im-shield";

    const card = document.createElement("div");
    card.className = "audit-card";
    card.innerHTML = `
      <div class="audit-card-header">
        <div class="header-left">
          <i class="${iconClass} card-icon"></i>
          <h3>${escapeHtml(sectionName)}</h3>
        </div>
        <div class="badge-stats">
          ${passCount > 0 ? `<span class="badge-mini pass">${passCount} Pass</span>` : ""}
          ${warnCount > 0 ? `<span class="badge-mini warn">${warnCount} Warn</span>` : ""}
          ${failCount > 0 ? `<span class="badge-mini fail">${failCount} Fail</span>` : ""}
        </div>
      </div>
      <div class="audit-card-body">
        ${rowsHtml}
      </div>
    `;

    resultsContainer.appendChild(card);
  }

  if (visibleCount === 0) {
    resultsContainer.innerHTML = `
      <div class="empty-state-card">
        <i class="im im-magnifier"></i>
        <p>No checks matched the current filter or search query ("${escapeHtml(searchQuery)}").</p>
      </div>
    `;
  }
}

async function copyAuditSummary() {
  if (!latestReport) return;
  const rep = latestReport;
  const text = [
    `# Security & Privacy Audit Report`,
    `Generated: ${new Date(rep.timestamp).toLocaleString()}`,
    `Score: ${rep.score}/100 | Grade: ${rep.grade} | Posture: ${rep.posture}`,
    ``,
    `## Pillar Breakdown:`,
    `- Network & Proxy: ${rep.pillars?.network.earned}/${rep.pillars?.network.max} pts`,
    `- Fingerprint Defense: ${rep.pillars?.fingerprint.earned}/${rep.pillars?.fingerprint.max} pts`,
    `- Permissions & APIs: ${rep.pillars?.permissions.earned}/${rep.pillars?.permissions.max} pts`,
    `- Browser Hardening: ${rep.pillars?.browser.earned}/${rep.pillars?.browser.max} pts`,
    ``,
    `## Summary of Issues (${rep.deductions?.length || 0}):`,
    ...(rep.deductions?.map(d => `- [${d.category}] ${d.reason}`) || ["- None! Clean audit."]),
    ``,
    `Audited locally with Portfolio Security Audit Workbench.`
  ].join("\n");

  try {
    await navigator.clipboard.writeText(text);
    const orig = copySummaryButton.innerHTML;
    copySummaryButton.innerHTML = `<i class="im im-check-mark"></i> Copied!`;
    setTimeout(() => { copySummaryButton.innerHTML = orig; }, 2000);
  } catch (_) {
    alert("Could not copy to clipboard automatically. Check permissions.");
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
