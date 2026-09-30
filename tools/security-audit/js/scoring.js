export function calculateScore(sections) {
  let score = 50;

  const browser = sections["BROWSER SECURITY"];

  if (browser) {
    if (browser.HTTPS === "PASS") score += 15;

    if (browser["Secure Context"] === "PASS") score += 10;

    if (browser["Web Crypto"] === "PASS") score += 10;

    if (browser.WebAuthn === "AVAILABLE") score += 5;
  }

  const privacy = sections.PRIVACY;

  if (privacy) {
    if (privacy["Fingerprint Risk"] === "HIGH") {
      score -= 15;
    }

    if (privacy["Fingerprint Risk"] === "MEDIUM") {
      score -= 5;
    }
  }

  const permissions = sections.PERMISSIONS;

  if (permissions) {
    for (const key in permissions) {
      if (permissions[key] === "granted") {
        score -= 3;
      }
    }
  }

  return Math.max(0, Math.min(100, score));
}
