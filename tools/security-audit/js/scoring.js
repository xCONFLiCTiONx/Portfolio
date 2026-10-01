export function calculateScore(sections) {
  let score = 100;
  let deductions = [];

  // 1. Device / Platform check (20 pts)
  const device = sections["DEVICE"];
  if (device) {
    if (device["Target Platform Check"] && device["Target Platform Check"].includes("FAIL")) {
      score -= 20;
      deductions.push({ category: "Platform", points: -20, reason: "Unsupported operating system.", fix: "Open this audit on an Android device or PC (Windows/Mac/Linux)." });
    }
  }

  // 2. Browser Security & HTTPS (20 pts)
  const browser = sections["BROWSER SECURITY"];
  if (browser) {
    if (browser["HTTPS Protocol"] && browser["HTTPS Protocol"].includes("FAIL")) {
      score -= 15;
      deductions.push({ category: "HTTPS", points: -15, reason: "Connection is not encrypted via HTTPS.", fix: "Access this tool using HTTPS." });
    }
    if (browser["Do Not Track / GPC"] && browser["Do Not Track / GPC"].includes("WARN")) {
      score -= 5;
      deductions.push({ category: "Privacy Header", points: -5, reason: "Do Not Track / Global Privacy Control is disabled.", fix: "Enable 'Do Not Track' in browser privacy settings." });
    }
  }

  // 3. Cloudflare VPN / WARP & Secure DNS (25 pts)
  const dns = sections["DNS / CLOUDFLARE"];
  if (dns) {
    if (dns["Cloudflare WARP / VPN"] && dns["Cloudflare WARP / VPN"].includes("INACTIVE")) {
      score -= 25;
      deductions.push({ category: "Cloudflare VPN", points: -25, reason: "Cloudflare WARP VPN is inactive (disabled).", fix: "Enable Cloudflare WARP VPN / Cloudflare One on your device." });
    }
  }

  // 4. Permissions (20 pts max)
  const permissions = sections["PERMISSIONS"];
  if (permissions) {
    for (const key in permissions) {
      if (key.includes("Permission") && permissions[key].includes("GRANTED")) {
        score -= 10;
        deductions.push({ category: "Permissions", points: -10, reason: `${key} is currently GRANTED.`, fix: `Click the lock icon in the address bar, revoke '${key}', and refresh the page.` });
      }
    }
  }

  // 5. Fingerprinting & Tracking Risk (15 pts)
  const privacy = sections["PRIVACY"];
  if (privacy) {
    if (privacy["Fingerprint Risk"] && privacy["Fingerprint Risk"].includes("HIGH")) {
      score -= 15;
      deductions.push({ category: "Fingerprinting", points: -15, reason: "High browser fingerprinting exposure detected.", fix: "Enable strict tracking protection in your browser (e.g. Firefox Strict mode, Brave Shields, or privacy extensions)." });
    } else if (privacy && privacy["Fingerprint Risk"] && privacy["Fingerprint Risk"].includes("MEDIUM")) {
      score -= 5;
      deductions.push({ category: "Fingerprinting", points: -5, reason: "Standard browser fingerprinting APIs are accessible and deterministic.", fix: "Enable enhanced tracking protection if you require fingerprint randomization." });
    } else if (privacy && privacy["Fingerprint Risk"] && privacy["Fingerprint Risk"].includes("LOW-MEDIUM")) {
      score -= 2;
      deductions.push({ category: "Fingerprinting", points: -2, reason: "Slight fingerprint exposure detected.", fix: "Consider enabling enhanced tracking protection in your browser." });
    }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    deductions: deductions
  };
}
