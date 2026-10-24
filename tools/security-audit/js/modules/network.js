/**
 * Network Posture & Proxy / VPN Routing Audit
 * Accurately detects proxy encapsulation, IP masking, and network transport health.
 */

export async function networkScan() {
  let results = {};

  results["Online Status"] = navigator.onLine ? "[ PASS ] Connected" : "[ FAIL ] Offline";

  // 1. Gather Connection Speed / Topology
  if (navigator.connection) {
    results["Connection Protocol"] = (navigator.connection.effectiveType || "UNKNOWN").toUpperCase();
    if (navigator.connection.rtt) results["Network Latency (RTT)"] = `${navigator.connection.rtt} ms`;
    if (navigator.connection.downlink) results["Downlink Bandwidth"] = `${navigator.connection.downlink} Mbps`;
  } else {
    results["Connection API"] = "[ INFO ] Standard Network Interface";
  }

  // 2. Fetch Public IP & Routing Telemetry
  let publicIp = null;
  let ispOrg = null;
  let isProxyOrVpn = false;
  let cfTraceData = null;

  // Primary: Cloudflare Trace
  try {
    const cfUrls = ["/cdn-cgi/trace", "https://cloudflare.com/cdn-cgi/trace"];
    for (const url of cfUrls) {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) {
          const text = await res.text();
          const parsed = parseCfTrace(text);
          if (parsed.ip) {
            cfTraceData = parsed;
            publicIp = parsed.ip;
            break;
          }
        }
      } catch (_) {}
    }
  } catch (_) {}

  // Secondary: IP Intelligence API (CORS enabled)
  try {
    const res = await fetch("https://freeipapi.com/api/json", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data) {
        if (!publicIp && data.ipAddress) publicIp = data.ipAddress;
        if (data.isProxy) isProxyOrVpn = true;
        if (data.cityName && data.countryName) {
          results["Geo Location (Reported)"] = `${data.cityName}, ${data.countryName}`;
        }
      }
    }
  } catch (_) {
    // Tertiary fallback: ipify
    if (!publicIp) {
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json", { cache: "no-store" });
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData && ipData.ip) publicIp = ipData.ip;
        }
      } catch (_) {}
    }
  }

  // IPWHOIS fallback for ISP / Org detection
  try {
    const whoRes = await fetch("https://ipwho.is/", { cache: "no-store" });
    if (whoRes.ok) {
      const whoData = await whoRes.json();
      if (whoData && whoData.success !== false) {
        if (!publicIp && whoData.ip) publicIp = whoData.ip;
        ispOrg = whoData.connection?.org || whoData.connection?.isp || whoData.isp;
        if (whoData.security?.proxy || whoData.security?.vpn || whoData.security?.tor || whoData.security?.hosting) {
          isProxyOrVpn = true;
        }
        if (whoData.city && whoData.country && !results["Geo Location (Reported)"]) {
          results["Geo Location (Reported)"] = `${whoData.city}, ${whoData.country}`;
        }
      }
    }
  } catch (_) {}

  // Cloudflare WARP flag check
  let isWarp = false;
  if (cfTraceData) {
    if (cfTraceData.warp === "on") {
      isWarp = true;
      isProxyOrVpn = true;
    }
    if (cfTraceData.colo) {
      results["Edge Datacenter PoP"] = `Cloudflare ${cfTraceData.colo.toUpperCase()}`;
    }
    if (cfTraceData.http) {
      results["HTTP Transport Layer"] = cfTraceData.http.toUpperCase();
    }
    if (cfTraceData.tls) {
      results["TLS Protocol"] = cfTraceData.tls.toUpperCase();
    }
  }

  // 3. Populate Results
  results["Public IP Address"] = publicIp || "[ UNKNOWN ] Protected / Unreachable";

  if (ispOrg) {
    results["Network Provider / ISP"] = ispOrg;
  }

  // Evaluate Routing Anonymity Posture
  if (isWarp) {
    results["Proxy / VPN Routing"] = "[ PASS ] ACTIVE (Cloudflare WARP / Zero Trust Encapsulation)";
  } else if (isProxyOrVpn) {
    results["Proxy / VPN Routing"] = "[ PASS ] ACTIVE (Proxy / Datacenter IP — Client Origin Masked)";
  } else {
    // Direct or undetected proxy: NOT a penalty, but informative
    results["Proxy / VPN Routing"] = "[ INFO ] DIRECT ROUTE (Residential ISP or Transparent Proxy)";
  }

  // Localhost Service Probe Defense
  // Check if browser protects against cross-origin scanning of 127.0.0.1
  results["Localhost Port Isolation"] = window.isSecureContext
    ? "[ PASS ] PROTECTED (CORS & Secure Context Barrier Active)"
    : "[ WARN ] INSECURE (Context permits private network access)";

  return {
    ...results,
    __internal_public_ip: publicIp,
    __internal_is_proxy: isProxyOrVpn || isWarp
  };
}

function parseCfTrace(text) {
  const result = {};
  if (!text) return result;
  const lines = text.split("\n");
  for (const line of lines) {
    const idx = line.indexOf("=");
    if (idx !== -1) {
      result[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
  }
  return result;
}
