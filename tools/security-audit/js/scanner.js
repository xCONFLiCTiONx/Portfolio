import { deviceScan } from "./modules/device.js";
import { browserScan } from "./modules/browser.js";
import { permissionScan } from "./modules/permissions.js";
import { storageScan } from "./modules/storage.js";
import { fingerprintScan } from "./modules/fingerprint.js";
import { networkScan } from "./modules/network.js";
import { dnsScan } from "./modules/dns.js";
import { webrtcScan } from "./modules/webrtc.js";

import { calculateScore } from "./scoring.js";

export async function runScanner() {
  let sections = {};

  sections["DEVICE"] = await safe(deviceScan);
  sections["BROWSER SECURITY"] = await safe(browserScan);
  sections["PERMISSIONS"] = await safe(permissionScan);
  sections["STORAGE"] = await safe(storageScan);
  sections["PRIVACY"] = await safe(fingerprintScan);
  sections["NETWORK"] = await safe(networkScan);
  sections["DNS / CLOUDFLARE"] = await safe(dnsScan);
  sections["WEBRTC"] = await safe(webrtcScan);

  const scoreResult = calculateScore(sections);

  let breakdownSection = {};
  breakdownSection["Current Security Score"] = `${scoreResult.score} / 100`;
  if (scoreResult.score === 100) {
    breakdownSection["Status"] = "[ PASS ] Gold Standard Achieved! 100% Secure.";
  } else {
    breakdownSection["Why Score Is Not 100%"] = `${scoreResult.deductions.length} deduction(s) found. See details and fixes below.`;
    scoreResult.deductions.forEach((d, index) => {
      breakdownSection[`Deduction ${index + 1} (${d.category}: ${d.points} pts)`] = d.reason;
      breakdownSection[`How to Fix #${index + 1}`] = d.fix;
    });
  }

  let finalSections = {
    "SCORE BREAKDOWN & WHY NOT 100%": breakdownSection,
    ...sections
  };

  return {
    time: new Date().toISOString(),
    score: scoreResult.score,
    sections: finalSections,
  };
}

async function safe(fn) {
  try {
    return await fn();
  } catch (error) {
    return {
      ERROR: error.message,
    };
  }
}
