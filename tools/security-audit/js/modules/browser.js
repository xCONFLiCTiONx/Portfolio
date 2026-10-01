export async function browserScan() {
  const isHttps = location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1";

  let results = {
    "HTTPS Protocol": isHttps ? "PASS" : "FAIL",
    "Secure Context": window.isSecureContext ? "PASS" : "FAIL",
    "Web Crypto API": window.crypto && window.crypto.subtle ? "PASS" : "FAIL",
    "Do Not Track / GPC": (navigator.doNotTrack === "1" || navigator.globalPrivacyControl) ? "PASS" : "WARN",
  };

  if (!isHttps) {
    results["How to Fix HTTPS"] = "Access this audit tool via HTTPS to ensure encrypted transport.";
  }
  if (results["Do Not Track / GPC"] === "WARN") {
    results["How to Fix Do Not Track"] = "Enable 'Do Not Track' or 'Global Privacy Control' in browser privacy settings to improve privacy score.";
  }

  return results;
}
