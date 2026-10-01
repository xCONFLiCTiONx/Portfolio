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
  else if (isIOS) platformName = "iOS (Apple Mobile - Unsupported)";

  let results = {
    "Target Platform Check": isSupported ? "[ PASS ] Supported OS (Android / PC)" : "[ FAIL ] Unsupported OS",
    "Detected Platform": platformName,
    "Secure Context (HTTPS/Localhost)": window.isSecureContext ? "[ PASS ] Secure Context Enabled" : "[ FAIL ] Insecure Context",
    "Online Status": navigator.onLine ? "[ PASS ] Online" : "[ FAIL ] Offline"
  };

  if (!isSupported) {
    results["How to Fix Platform"] = "Please open this tool on an Android device or PC (Windows/macOS/Linux).";
  }

  return results;
}
