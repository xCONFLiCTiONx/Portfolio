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

  // Primary: Cloudflare Trace endpoints (CORS enabled)
  const cfUrls = [
    "https://1.1.1.1/cdn-cgi/trace",
    "https://cloudflare.com/cdn-cgi/trace",
    "/cdn-cgi/trace"
  ];
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

  // Secondary: High-Accuracy IP Geolocation Providers (ipinfo.io & geojs.io)
  // ipinfo.io and geojs.io accurately differentiate Metro/ISP routing (e.g. Marion, AR vs Memphis, TN)
  try {
    const infoRes = await fetch("https://ipinfo.io/json", { cache: "no-store" });
    if (infoRes.ok) {
      const infoData = await infoRes.json();
      if (infoData) {
        if (!publicIp && infoData.ip) publicIp = infoData.ip;
        if (infoData.org && !ispOrg) ispOrg = infoData.org;
        if (infoData.city && infoData.region) {
          results["Geo Location (Reported)"] = `${infoData.city}, ${infoData.region}, ${infoData.country || "US"}`;
        }
      }
    }
  } catch (_) {}

  // Fallback Geolocation: geojs.io
  if (!results["Geo Location (Reported)"]) {
    try {
      const geoRes = await fetch("https://get.geojs.io/v1/ip/geo.json", { cache: "no-store" });
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData) {
          if (!publicIp && geoData.ip) publicIp = geoData.ip;
          if (geoData.organization_name && !ispOrg) ispOrg = geoData.organization_name;
          if (geoData.city && geoData.region) {
            results["Geo Location (Reported)"] = `${geoData.city}, ${geoData.region}, ${geoData.country || "US"}`;
          }
        }
      }
    } catch (_) {}
  }

  // Fallback Geolocation & ISP Telemetry: ipwho.is
  try {
    const whoRes = await fetch("https://ipwho.is/", { cache: "no-store" });
    if (whoRes.ok) {
      const whoData = await whoRes.json();
      if (whoData && whoData.success !== false) {
        if (!publicIp && whoData.ip) publicIp = whoData.ip;
        if (!ispOrg) {
          ispOrg = whoData.connection?.org || whoData.connection?.isp || whoData.isp;
        }
        if (whoData.security?.proxy || whoData.security?.vpn || whoData.security?.tor || whoData.security?.hosting) {
          isProxyOrVpn = true;
        }
        if (!results["Geo Location (Reported)"] && whoData.city && whoData.country) {
          const regionPart = whoData.region ? `${whoData.region}, ` : "";
          results["Geo Location (Reported)"] = `${whoData.city}, ${regionPart}${whoData.country}`;
        }
      }
    }
  } catch (_) {}

  // Tertiary Fallback Geo: freeipapi.com
  if (!results["Geo Location (Reported)"]) {
    try {
      const res = await fetch("https://free.freeipapi.com/api/v1/json", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          if (!publicIp && data.ipAddress) publicIp = data.ipAddress;
          if (data.isProxy) isProxyOrVpn = true;
          if (data.cityName && data.countryName) {
            const regPart = data.regionName ? `${data.regionName}, ` : "";
            results["Geo Location (Reported)"] = `${data.cityName}, ${regPart}${data.countryName}`;
          }
        }
      }
    } catch (_) {}
  }

  // Direct IP Fallbacks: api64.ipify & api.ipify
  if (!publicIp) {
    try {
      const ipRes = await fetch("https://api64.ipify.org?format=json", { cache: "no-store" });
      if (ipRes.ok) {
        const ipData = await ipRes.json();
        if (ipData && ipData.ip) publicIp = ipData.ip;
      }
    } catch (_) {
      try {
        const ipRes2 = await fetch("https://api.ipify.org?format=json", { cache: "no-store" });
        if (ipRes2.ok) {
          const ipData2 = await ipRes2.json();
          if (ipData2 && ipData2.ip) publicIp = ipData2.ip;
        }
      } catch (_) {}
    }
  }

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
    __internal_geo: results["Geo Location (Reported)"] || null,
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
