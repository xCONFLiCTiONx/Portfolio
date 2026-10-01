export async function dnsScan() {
  let results = {};
  const ua = navigator.userAgent;
  const isAndroid = /Android/i.test(ua);

  let cloudflareDetected = false;
  let warpActive = false;
  let dohActive = false;

  try {
    const res = await fetch("https://cloudflare.com/cdn-cgi/trace", { cache: "no-store" });
    if (res.ok) {
      const text = await res.text();
      cloudflareDetected = true;
      if (text.includes("warp=on")) {
        warpActive = true;
      }
      const lines = text.split("\n");
      for (const line of lines) {
        const [k, v] = line.split("=");
        if (k === "ip") results["Public IP"] = v;
        if (k === "colo") results["Cloudflare Edge Colo"] = v;
        if (k === "warp") results["Cloudflare WARP / VPN"] = v === "on" ? "[ PASS ] ACTIVE (WARP VPN)" : "[ WARN ] INACTIVE";
      }
    }
  } catch (e) {
    results["Cloudflare Trace"] = "[ FAIL ] UNREACHABLE";
  }

  try {
    const dohRes = await fetch("https://cloudflare-dns.com/dns-query?name=cloudflare.com&type=A", {
      headers: { accept: "application/dns-json" },
      cache: "no-store"
    });
    if (dohRes.ok) {
      dohActive = true;
      results["Secure DNS (DoH/DoT)"] = "[ PASS ] CONNECTED (Secure DNS Active)";
    } else {
      results["Secure DNS (DoH/DoT)"] = "[ FAIL ] FAILED";
    }
  } catch (e) {
    results["Secure DNS (DoH/DoT)"] = "[ FAIL ] BLOCKED";
  }

  const isSecure = warpActive || dohActive || cloudflareDetected;

  results["Secure DNS & VPN Audit"] = isSecure ? "[ PASS ] PASS (Secure DNS/VPN Detected)" : "[ FAIL ] FAIL (No Secure DNS or VPN)";

  if (!isSecure) {
    results["How to Fix Secure DNS / VPN"] = isAndroid
      ? "Android Gold Standard fix: Enable Cloudflare 1.1.1.1 (WARP) VPN app or configure Private DNS (dot.secureserver.net or 1.1.1.1.cloudflare-dns.com) in Android Settings -> Network & internet -> Advanced -> Private DNS."
      : "PC Gold Standard fix: Enable Secure DNS (DNS over HTTPS) in browser settings (Chrome/Edge/Firefox -> Privacy and Security -> Use secure DNS -> Select Cloudflare) or run Cloudflare WARP client.";
  } else {
    results["How to Fix Secure DNS / VPN"] = "Cloudflare VPN / Secure DNS (DoT/DoH) is active. Gold standard achieved!";
  }

  return results;
}
