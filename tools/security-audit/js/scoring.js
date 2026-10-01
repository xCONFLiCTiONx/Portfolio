export function calculateScore(sections) {
  let score = 0;

  // 1. Device / Platform (20 pts)
  const device = sections["DEVICE"];
  if (device) {
    if (device["Target Platform"] === "PASS") score += 15;
    if (device["Secure Context"] === "PASS") score += 5;
  }

  // 2. Browser Security (20 pts)
  const browser = sections["BROWSER SECURITY"];
  if (browser) {
    if (browser["HTTPS Protocol"] === "PASS") score += 10;
    if (browser["Web Crypto API"] === "PASS") score += 5;
    if (browser["Do Not Track / GPC"] === "PASS") score += 5;
    else score += 2;
  }

  // 3. DNS & Cloudflare VPN / Secure DNS (30 pts)
  const dns = sections["DNS / CLOUDFLARE"];
  if (dns) {
    if (dns["Secure DNS & VPN Audit"] === "PASS") {
      score += 30;
    }
  }

  // 4. Permissions (30 pts)
  const permissions = sections["PERMISSIONS"];
  if (permissions) {
    let grantedCount = 0;
    for (const key in permissions) {
      if (key.includes("Permission")) {
        if (permissions[key].includes("GRANTED")) {
          grantedCount++;
        }
      }
    }
    const permScore = Math.max(0, 30 - (grantedCount * 7.5));
    score += Math.round(permScore);
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}
