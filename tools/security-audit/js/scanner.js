import { networkScan } from "./modules/network.js";
import { webrtcScan } from "./modules/webrtc.js";
import { dnsScan } from "./modules/dns.js";
import { browserScan } from "./modules/browser.js";
import { deviceScan } from "./modules/device.js";
import { fingerprintScan } from "./modules/privacy-check.js";
import { permissionScan } from "./modules/permissions.js";
import { storageScan } from "./modules/storage.js";
import { calculateScore } from "./scoring.js";

export async function runScanner(onProgress = null) {
  let sections = {};

  const notify = (msg) => {
    if (typeof onProgress === "function") onProgress(msg);
  };

  // 1. Network & Public IP Scan
  notify("Auditing network routing and public IP telemetry...");
  const netResults = await safe(networkScan);
  const publicIp = netResults.__internal_public_ip || null;
  delete netResults.__internal_public_ip;
  delete netResults.__internal_is_proxy;
  sections["NETWORK & PROXY ROUTING"] = netResults;

  // 2. WebRTC Leak & STUN Probe
  notify("Probing WebRTC ICE candidates for proxy bypass leaks...");
  sections["WEBRTC LEAK AUDIT"] = await safe(() => webrtcScan(publicIp));

  // 3. Encrypted DNS & Resolvers
  notify("Testing Secure DNS (DoH/DoT) and cryptographic DNSSEC...");
  sections["SECURE DNS & ENCRYPTION"] = await safe(dnsScan);

  // 4. Browser Transport & Protocol Hardening
  notify("Auditing HTTPS/TLS encryption and privacy headers...");
  sections["BROWSER & PROTOCOL SECURITY"] = await safe(browserScan);

  // 5. Fingerprinting & Entropy Exposure
  notify("Measuring Canvas, WebGL, and AudioContext tracking entropy...");
  sections["FINGERPRINTING & TRACKING DEFENSE"] = await safe(fingerprintScan);

  // 6. Device Hardware & Platform Profile
  notify("Analyzing hardware profile and client hints...");
  sections["DEVICE & PLATFORM POSTURE"] = await safe(deviceScan);

  // 7. Device Permissions & Sensitive APIs
  notify("Querying sensitive device permissions (Camera, Mic, GPS)...");
  sections["DEVICE PERMISSIONS & APIS"] = await safe(permissionScan);

  // 8. Storage, Cookies & State Isolation
  notify("Inspecting storage sandboxes and cookie partition boundaries...");
  sections["STORAGE & STATE ISOLATION"] = await safe(storageScan);

  // Calculate Comprehensive Security Grade
  notify("Synthesizing security grade and risk assessment...");
  const scoreResult = calculateScore(sections);

  // Construct Actionable Score Breakdown Section
  let scoreSummary = {
    "Security Score": `${scoreResult.score} / 100`,
    "Security Grade": scoreResult.grade,
    "Posture Assessment": `[ PASS ] ${scoreResult.posture}`
  };

  if (scoreResult.deductions.length === 0) {
    scoreSummary["Status"] = "[ PASS ] Gold Standard! Zero security deductions detected.";
  } else {
    scoreSummary["Deductions Summary"] = `${scoreResult.deductions.length} item(s) need attention for maximum hardening.`;
    scoreResult.deductions.forEach((d, idx) => {
      scoreSummary[`Issue #${idx + 1} (${d.category} ${d.points} pts)`] = d.reason;
      scoreSummary[`How to Fix #${idx + 1}`] = d.fix;
    });
  }

  const finalSections = {
    "SCORE BREAKDOWN & REMEDIATION": scoreSummary,
    ...sections
  };

  return {
    timestamp: new Date().toISOString(),
    score: scoreResult.score,
    grade: scoreResult.grade,
    posture: scoreResult.posture,
    postureClass: scoreResult.postureClass,
    deductions: scoreResult.deductions,
    pillars: scoreResult.pillars,
    sections: finalSections
  };
}

async function safe(fn) {
  try {
    return await fn();
  } catch (error) {
    return {
      ERROR: error.message || "Diagnostic check failed unexpectedly"
    };
  }
}
