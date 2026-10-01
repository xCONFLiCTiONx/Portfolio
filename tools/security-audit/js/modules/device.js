export async function deviceScan() {
  const ua = navigator.userAgent;
  const isAndroid = /Android/i.test(ua);
  const isWindows = /Windows/i.test(ua);
  const isMac = /Macintosh|MacIntel/i.test(ua);
  const isLinux = /Linux/i.test(ua) && !isAndroid;
  const isIOS = /iPhone|iPad|iPod/i.test(ua);

  const isPC = isWindows || isMac || isLinux;
  const isSupported = isAndroid || isPC;

  let platformName = "Unknown";
  if (isAndroid) platformName = "Android (Mobile Gold Standard)";
  else if (isWindows) platformName = "PC (Windows)";
  else if (isMac) platformName = "PC (macOS)";
  else if (isLinux) platformName = "PC (Linux)";
  else if (isIOS) platformName = "iOS (Apple Mobile)";

  let results = {
    "Target Platform": isSupported ? "PASS" : "FAIL",
    "Detected OS": platformName,
    "Secure Context": window.isSecureContext ? "PASS" : "FAIL",
    "Online Status": navigator.onLine ? "PASS" : "FAIL"
  };

  if (!isSupported) {
    results["How to Fix Platform"] = "This security audit tool is designed exclusively for Android devices and PC (Windows/macOS/Linux). Please open on a supported device.";
  }

  return results;
}
