/**
 * Device, Operating System & Hardware Surface Audit
 * Evaluates hardware entropy, client hints, and device vector exposure.
 */

export async function deviceScan() {
  const ua = navigator.userAgent;
  const isAndroid = /Android/i.test(ua);
  const isWindows = /Windows/i.test(ua);
  const isMac = /Macintosh|MacIntel/i.test(ua);
  const isLinux = /Linux/i.test(ua) && !isAndroid;
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isChromeOS = /CrOS/i.test(ua);

  let platformName = "Desktop / Generic Client";
  if (isAndroid) platformName = "Android OS";
  else if (isWindows) platformName = "Microsoft Windows";
  else if (isMac) platformName = "Apple macOS";
  else if (isIOS) platformName = "Apple iOS / iPadOS";
  else if (isLinux) platformName = "GNU/Linux";
  else if (isChromeOS) platformName = "Google ChromeOS";

  let results = {
    "Operating System": `[ PASS ] ${platformName}`,
    "Client Architecture": navigator.userAgentData?.platform || (navigator.platform || "Standard x86/ARM"),
    "CPU Concurrency (Cores)": navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} Logical Cores` : "Protected / Hidden",
    "Device Memory Profile": navigator.deviceMemory ? `~${navigator.deviceMemory} GB RAM` : "Protected / Hidden",
    "Screen Geometry": `${window.screen.width} × ${window.screen.height} (${window.screen.colorDepth}-bit color)`,
    "Multi-Monitor Exposure": (window.screen.isExtended === true)
      ? "[ WARN ] Multi-Monitor Setup Detected (Fingerprint vector)"
      : "[ PASS ] Single Screen / Protected",
    "Touch Interface": (navigator.maxTouchPoints > 0)
      ? `Touch Capable (${navigator.maxTouchPoints} contact points)`
      : "Standard Pointer / Desktop",
    "Client Hints API": (navigator.userAgentData)
      ? "[ PASS ] Modern User-Agent Client Hints Active"
      : "[ INFO ] Standard User-Agent String"
  };

  return results;
}
