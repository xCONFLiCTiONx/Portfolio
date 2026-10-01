export async function deviceScan() {
  return {
    Platform: navigator.platform || "UNKNOWN",

    "User Agent": navigator.userAgent,

    "Mobile Device": /Android/i.test(navigator.userAgent)
      ? "ANDROID"
      : "DESKTOP",

    "CPU Cores": navigator.hardwareConcurrency
      ? navigator.hardwareConcurrency
      : "UNKNOWN",

    "Memory Estimate": navigator.deviceMemory
      ? navigator.deviceMemory + " GB"
      : "UNKNOWN",

    "Screen Resolution": `${screen.width}x${screen.height}`,

    "Pixel Ratio": window.devicePixelRatio
      ? window.devicePixelRatio
      : "UNKNOWN",

    "Touch Support": "ontouchstart" in window ? "SUPPORTED" : "UNKNOWN",

    Language: navigator.language || "UNKNOWN",

    Timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UNKNOWN",

    Online: navigator.onLine ? "PASS" : "FAIL",
  };
}
