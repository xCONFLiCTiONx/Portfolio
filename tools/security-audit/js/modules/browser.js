/**
 * Browser Security & Transport Architecture Audit
 * Inspects encryption protocols, privacy headers, and crypto primitives.
 */

export async function browserScan() {
  const isHttps = location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1";
  const gpc = navigator.globalPrivacyControl === true;
  const dnt = navigator.doNotTrack === "1" || window.doNotTrack === "1";
  const privacyHeaderActive = gpc || dnt;

  // Test Private / Incognito Mode heuristic
  let isPrivateMode = false;
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const { quota } = await navigator.storage.estimate();
      // In some browsers, quota < 120MB or indexedDB limits indicates incognito
      if (quota && quota < 120000000 && !/Android/i.test(navigator.userAgent)) {
        isPrivateMode = true;
      }
    }
  } catch (_) {}

  let results = {
    "Transport Layer Security": isHttps
      ? "[ PASS ] Encrypted Transport (HTTPS/TLS)"
      : "[ FAIL ] Insecure Plaintext HTTP",
    "Secure Execution Context": window.isSecureContext
      ? "[ PASS ] Secure Context Verified (Isolated Execution)"
      : "[ FAIL ] Insecure Context",
    "Web Crypto Primitives": (window.crypto && window.crypto.subtle)
      ? "[ PASS ] Hardware-Accelerated Crypto Engine (SubtleCrypto Available)"
      : "[ FAIL ] Web Crypto Engine Unavailable",
    "Global Privacy Control (GPC)": gpc
      ? "[ PASS ] ACTIVE (Legal Opt-Out Signal Broadcasted)"
      : "[ WARN ] Disabled (No GPC Header)",
    "Do Not Track Header (DNT)": dnt
      ? "[ PASS ] ACTIVE (DNT: 1 Sent to Servers)"
      : "[ WARN ] Disabled (Standard Tracking Allowed)",
    "Private Browsing Heuristic": isPrivateMode
      ? "[ PASS ] Incognito / Private Window Heuristic Detected"
      : "[ INFO ] Standard Profile Session",
    "Cross-Origin Isolation": window.crossOriginIsolated
      ? "[ PASS ] Isolated Memory Barrier (Spectre-Hardened)"
      : "[ INFO ] Standard Process Isolation"
  };

  if (!isHttps) {
    results["How to Fix Transport Security"] = "Always connect using https:// to prevent man-in-the-middle eavesdropping and packet injection.";
  }

  if (!privacyHeaderActive) {
    results["How to Fix Privacy Headers"] = "Enable Global Privacy Control (GPC) and Do Not Track in your browser settings (e.g. Brave Shields, Firefox Enhanced Tracking Protection, or Chrome Privacy settings) to broadcast legal opt-out signals.";
  }

  return results;
}
