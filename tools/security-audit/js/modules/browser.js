export async function browserScan() {
  const isHttps = location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1";
  const dntActive = navigator.doNotTrack === "1" || navigator.globalPrivacyControl;

  let results = {
    "HTTPS Protocol": isHttps ? "[ PASS ] Encrypted (HTTPS)" : "[ FAIL ] Unencrypted (HTTP)",
    "Secure Context": window.isSecureContext ? "[ PASS ] Secure Context Active" : "[ FAIL ] Insecure Context",
    "Web Crypto API": window.crypto && window.crypto.subtle ? "[ PASS ] Supported" : "[ FAIL ] Unsupported",
    "Do Not Track / GPC": dntActive ? "[ PASS ] Enabled" : "[ WARN ] Disabled (Reduces Privacy Score)",
  };

  if (!isHttps) {
    results["How to Fix HTTPS"] = "Access this tool via https:// to ensure encrypted transport.";
  }
  if (!dntActive) {
    results["How to Fix Do Not Track"] = "Enable 'Do Not Track' or 'Global Privacy Control' in your browser privacy settings.";
  }

  return results;
}
