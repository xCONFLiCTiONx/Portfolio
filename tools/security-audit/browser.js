export async function browserScan() {
  return {
    HTTPS: location.protocol === "https:" ? "PASS" : "FAIL",

    "Secure Context": window.isSecureContext ? "PASS" : "FAIL",

    "Web Crypto": window.crypto && window.crypto.subtle ? "PASS" : "FAIL",

    WebAuthn: window.PublicKeyCredential ? "AVAILABLE" : "UNKNOWN",

    "Service Worker": navigator.serviceWorker ? "AVAILABLE" : "UNKNOWN",

    Cookies: navigator.cookieEnabled ? "AVAILABLE" : "FAIL",

    JavaScript: "AVAILABLE",

    "Do Not Track": navigator.doNotTrack || "UNKNOWN",
  };
}
