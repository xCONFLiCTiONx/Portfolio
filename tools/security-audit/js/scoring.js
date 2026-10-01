export function calculateScore(sections) {
  let score = 100;
  let deductions = [];

  // 1. Device / Platform check (25 pts)
  const device = sections["DEVICE"];
  if (device) {
    if (device["Target Platform Check"] && device["Target Platform Check"].includes("FAIL")) {
      score -= 25;
      deductions.push({ category: "Platform", points: -25, reason: "Unsupported operating system.", fix: "Open this audit on an Android device or PC (Windows/Mac/Linux)." });
    }
  }

  // 2. Browser Security & HTTPS (25 pts)
  const browser = sections["BROWSER SECURITY"];
  if (browser) {
    if (browser["HTTPS Protocol"] && browser["HTTPS Protocol"].includes("FAIL")) {
      score -= 20;
      deductions.push({ category: "HTTPS", points: -20, reason: "Connection is not encrypted via HTTPS.", fix: "Access this tool using HTTPS." });
    }
    if (browser["Do Not Track / GPC"] && browser["Do Not Track / GPC"].includes("WARN")) {
      score -= 5;
      deductions.push({ category: "Privacy Header", points: -5, reason: "Do Not Track / Global Privacy Control is disabled.", fix: "Enable 'Do Not Track' in browser privacy settings." });
    }
  }

  // 3. DNS & Cloudflare VPN / Secure DNS (25 pts)
  const dns = sections["DNS / CLOUDFLARE"];
  if (dns) {
    if (dns["Secure DNS & VPN Audit"] && dns["Secure DNS & VPN Audit"].includes("FAIL")) {
      score -= 25;
      deductions.push({ category: "Secure DNS / VPN", points: -25, reason: "Cloudflare VPN (WARP) or Secure DNS (DoH/DoT) not detected.", fix: "Android: Enable Cloudflare 1.1.1.1 WARP app or Private DNS. PC: Enable Secure DNS (Cloudflare) in browser settings." });
    }
  }

  // 4. Permissions (25 pts max)
  const permissions = sections["PERMISSIONS"];
  if (permissions) {
    for (const key in permissions) {
      if (key.includes("Permission") && permissions[key].includes("GRANTED")) {
        score -= 10;
        deductions.push({ category: "Permissions", points: -10, reason: `${key} is currently GRANTED.`, fix: `Click the lock icon in the address bar, revoke '${key}', and refresh the page.` });
      }
    }
  }

  // Note: Browser fingerprinting is kept as an informational advisory (WARN) in PRIVACY
  // but does not deduct from your Cloudflare VPN / Secure DNS gold standard security score.

  return {
    score: Math.max(0, Math.min(100, score)),
    deductions: deductions
  };
}
