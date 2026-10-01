export async function fingerprintScan() {
  let results = {};

  // Canvas fingerprint

  try {
    const canvas = document.createElement("canvas");

    const ctx = canvas.getContext("2d");

    ctx.textBaseline = "top";

    ctx.font = "16px Arial";

    ctx.fillStyle = "#00ff88";

    ctx.fillText("Security Audit", 10, 10);

    const hash = canvas.toDataURL();

    results["Canvas Fingerprint"] = hash.length;

    results["Canvas Exposure"] = "DETECTED";
  } catch {
    results["Canvas"] = "BLOCKED";
  }

  // WebGL

  try {
    const canvas = document.createElement("canvas");

    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    if (gl) {
      const debug = gl.getExtension("WEBGL_debug_renderer_info");

      results["WebGL Vendor"] = debug
        ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL)
        : "PROTECTED";

      results["WebGL Renderer"] = debug
        ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
        : "PROTECTED";
    } else {
      results["WebGL"] = "UNAVAILABLE";
    }
  } catch {
    results["WebGL"] = "BLOCKED";
  }

  // Audio fingerprint check

  try {
    results["Audio Context"] =
      window.OfflineAudioContext || window.webkitOfflineAudioContext
        ? "AVAILABLE"
        : "UNKNOWN";
  } catch {
    results["Audio Context"] = "BLOCKED";
  }

  // General risk

  let exposure = 0;

  if (results["Canvas Exposure"]) exposure++;

  if (results["WebGL Renderer"] && results["WebGL Renderer"] !== "PROTECTED")
    exposure++;

  if (exposure >= 3) {

    results["Fingerprint Risk"] = "HIGH";

  }
  else if (exposure >= 1) {

    results["Fingerprint Risk"] = "MEDIUM";

  }
  else {

    results["Fingerprint Risk"] = "LOW";

  }

  return results;
}
