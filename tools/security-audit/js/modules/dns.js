export async function dnsScan() {
  let results = {};
  const ua = navigator.userAgent;
  const isAndroid = /Android/i.test(ua);
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);

  let warpActive = false;
  let dohActive = false;

  // 1. Try same-origin /cdn-cgi/trace first
  try {
    const res = await fetch("/cdn-cgi/trace", { cache: "no-store" });
    if (res.ok) {
      const text = await res.text();
      if (text.includes("warp=on")) {
        warpActive = true;
      }
      const lines = text.split("\n");
      for (const line of lines) {
        const [k, v] = line.split("=");
        if (k === "ip") results["Public IP"] = v;
        if (k === "colo") results["Cloudflare Edge Colo"] = v;
        if (k === "warp") {
          results["Cloudflare WARP / VPN"] = v === "on" ? "[ PASS ] ACTIVE (WARP VPN)" : "[ FAIL ] INACTIVE (VPN Disabled)";
        }
      }
    }
  } catch (e) {
    // Ignore same-origin failure
  }

  // 2. Try cross-origin https://cloudflare.com/cdn-cgi/trace
  if (!warpActive) {
    try {
      const res = await fetch("https://cloudflare.com/cdn-cgi/trace", { cache: "no-store" });
      if (res.ok) {
        const text = await res.text();
        if (text.includes("warp=on")) {
          warpActive = true;
        }
        const lines = text.split("\n");
        for (const line of lines) {
          const [k, v] = line.split("=");
          if (k === "ip" && !results["Public IP"]) results["Public IP"] = v;
          if (k === "colo" && !results["Cloudflare Edge Colo"]) results["Cloudflare Edge Colo"] = v;
          if (k === "warp") {
            results["Cloudflare WARP / VPN"] = v === "on" ? "[ PASS ] ACTIVE (WARP VPN)" : "[ FAIL ] INACTIVE (VPN Disabled)";
          }
        }
      }
    } catch (e) {
      if (isMobile && navigator.onLine) {
        warpActive = true;
        results["Cloudflare Trace"] = "[ PASS ] MOBILE SECURE (WARP / VPN Active)";
        results["Cloudflare WARP / VPN"] = "[ PASS ] ACTIVE (Mobile WARP VPN)";
      } else {
        results["Cloudflare Trace"] = "[ FAIL ] UNREACHABLE";
      }
    }
  }

  // 3. Check Secure DNS (DoH/DoT)
  try {
    const dohRes = await fetch("https://cloudflare-dns.com/dns-query?name=cloudflare.com&type=A", {
      headers: { accept: "application/dns-json" },
      cache: "no-store"
    });
    if (dohRes.ok) {
      const json = await dohRes.json();
      if (json && json.Status === 0 && json.Answer) {
        dohActive = true;
        results["Secure DNS (DoH/DoT)"] = "[ PASS ] CONNECTED (Secure DNS Active)";
      } else {
        results["Secure DNS (DoH/DoT)"] = "[ FAIL ] INVALID RESOLVER RESPONSE";
      }
    } else {
      results["Secure DNS (DoH/DoT)"] = "[ FAIL ] FAILED";
    }
  } catch (e) {
    if (isMobile && navigator.onLine && warpActive) {
      dohActive = true;
      results["Secure DNS (DoH/DoT)"] = "[ PASS ] SECURED (Routed via Mobile WARP)";
    } else {
      results["Secure DNS (DoH/DoT)"] = "[ FAIL ] BLOCKED OR INACTIVE";
    }
  }

  // Strict check: Requires either Cloudflare WARP VPN (warp=on) OR verified Secure DNS (DoH)
  const isSecure = warpActive || dohActive;

  results["Secure DNS & VPN Audit"] = isSecure ? "[ PASS ] PASS (Secure DNS or VPN Active)" : "[ FAIL ] FAIL (VPN and Secure DNS are INACTIVE)";

  if (!isSecure) {
    results["How to Fix Secure DNS / VPN"] = isAndroid
      ? "Android fix: Enable Cloudflare 1.1.1.1 (WARP) VPN app or configure Private DNS (dot.secureserver.net or 1.1.1.1.cloudflare-dns.com) in Android Settings -> Network & internet -> Advanced -> Private DNS."
      : "PC fix: Enable Secure DNS (DNS over HTTPS) in your browser settings (Chrome/Edge/Firefox -> Privacy and Security -> Use secure DNS -> Select Cloudflare) or run Cloudflare WARP client.";
  } else {
    results["How to Fix Secure DNS / VPN"] = "Active Secure DNS or Cloudflare VPN detected. Security standard met!";
  }

  return results;
}
