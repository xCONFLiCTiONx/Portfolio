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

  return {
    time: new Date().toISOString(),

    score: calculateScore(sections),

    sections,
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
