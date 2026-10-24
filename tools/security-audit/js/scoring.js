/**
 * Comprehensive Security & Privacy Scoring Engine
 * Evaluates network anonymity, WebRTC leak resistance, fingerprint defense,
 * permission isolation, and protocol hardening.
 */

export function calculateScore(sections) {
  let score = 100;
  let deductions = [];

  const networkPillar = { max: 30, earned: 30 };
  const browserPillar = { max: 25, earned: 25 };
  const fingerprintPillar = { max: 25, earned: 25 };
  const permissionsPillar = { max: 20, earned: 20 };

  // =========================================================================
  // 1. Network, Proxy & WebRTC Leak Audit (30 pts)
  // =========================================================================
  const webrtc = sections["WEBRTC LEAK AUDIT"];
  const dns = sections["SECURE DNS & ENCRYPTION"];
  const network = sections["NETWORK & PROXY ROUTING"];

  // WebRTC Public IP Proxy Bypass Leak (Critical -15 pts)
  if (webrtc && webrtc["WebRTC Leak Status"]) {
    const leakStr = webrtc["WebRTC Leak Status"];
    if (leakStr.includes("CRITICAL LEAK") || leakStr.includes("PROXY BYPASS")) {
      networkPillar.earned -= 15;
      score -= 15;
      deductions.push({
        category: "WebRTC Proxy Bypass",
        points: -15,
        severity: "critical",
        reason: "WebRTC bypassed your proxy/VPN and leaked your real public IP address.",
        fix: "Install WebRTC leak protection (e.g. uBlock Origin with 'Prevent WebRTC from leaking local IP', or disable WebRTC in about:config -> media.peerconnection.enabled = false)."
      });
    }
  }

  // WebRTC Local Private IP Exposure (-5 pts)
  if (webrtc && webrtc["Local LAN IP Exposure"] && webrtc["Local LAN IP Exposure"].includes("EXPOSED")) {
    networkPillar.earned -= 5;
    score -= 5;
    deductions.push({
      category: "Local IP Exposure",
      points: -5,
      severity: "warning",
      reason: "Internal LAN IP address is exposed to websites via WebRTC host candidates.",
      fix: "Enable mDNS hostname obfuscation or install WebRTC privacy extensions to hide local subnets."
    });
  }

  // Encrypted DNS / DoH Support (-5 pts if completely blocked / plaintext)
  if (dns && dns["Encrypted DNS (DoH/DoT)"] && dns["Encrypted DNS (DoH/DoT)"].includes("BLOCKED")) {
    networkPillar.earned -= 5;
    score -= 5;
    deductions.push({
      category: "Encrypted DNS",
      points: -5,
      severity: "warning",
      reason: "DNS over HTTPS is unverified or blocked. Upstream ISP may observe DNS lookups.",
      fix: "Enable Secure DNS (DoH) in browser settings (Privacy & Security -> Use secure DNS -> Cloudflare / NextDNS)."
    });
  }

  // Network Offline / Down (-5 pts)
  if (network && network["Online Status"] && network["Online Status"].includes("FAIL")) {
    networkPillar.earned -= 5;
    score -= 5;
    deductions.push({
      category: "Connectivity",
      points: -5,
      severity: "critical",
      reason: "Client network interface reports offline.",
      fix: "Verify your internet and proxy connectivity."
    });
  }

  // =========================================================================
  // 2. Browser Transport & Protocol Security (25 pts)
  // =========================================================================
  const browser = sections["BROWSER & PROTOCOL SECURITY"];

  if (browser) {
    // HTTPS / Transport (-15 pts)
    if (browser["Transport Layer Security"] && browser["Transport Layer Security"].includes("FAIL")) {
      browserPillar.earned -= 15;
      score -= 15;
      deductions.push({
        category: "Transport Security",
        points: -15,
        severity: "critical",
        reason: "Connection is unencrypted HTTP, vulnerable to traffic sniffing and tampering.",
        fix: "Access websites exclusively over encrypted HTTPS/TLS."
      });
    }

    // Insecure Context (-5 pts)
    if (browser["Secure Execution Context"] && browser["Secure Execution Context"].includes("FAIL")) {
      browserPillar.earned -= 5;
      score -= 5;
      deductions.push({
        category: "Execution Context",
        points: -5,
        severity: "warning",
        reason: "Origin is not running inside a verified Secure Context.",
        fix: "Serve web assets over HTTPS with valid certificates."
      });
    }

    // Privacy Headers: GPC / DNT (-5 pts if neither is enabled)
    const gpcDisabled = browser["Global Privacy Control (GPC)"] && browser["Global Privacy Control (GPC)"].includes("Disabled");
    const dntDisabled = browser["Do Not Track Header (DNT)"] && browser["Do Not Track Header (DNT)"].includes("Disabled");

    if (gpcDisabled && dntDisabled) {
      browserPillar.earned -= 5;
      score -= 5;
      deductions.push({
        category: "Privacy Headers",
        points: -5,
        severity: "advisory",
        reason: "Neither Global Privacy Control (GPC) nor Do Not Track is enabled.",
        fix: "Turn on 'Send Do Not Track request' or 'Global Privacy Control' in your browser privacy settings."
      });
    }
  }

  // =========================================================================
  // 3. Tracking & Fingerprint Defense (25 pts)
  // =========================================================================
  const privacy = sections["FINGERPRINTING & TRACKING DEFENSE"];

  if (privacy) {
    // Canvas Fingerprint Determinism (-5 pts)
    if (privacy["Canvas Fingerprint Protection"] && privacy["Canvas Fingerprint Protection"].includes("STABLE HASH")) {
      fingerprintPillar.earned -= 5;
      score -= 5;
      deductions.push({
        category: "Canvas Fingerprinting",
        points: -5,
        severity: "advisory",
        reason: "Canvas 2D API is deterministic and can be used to generate a persistent device fingerprint.",
        fix: "Use privacy-focused browsers with canvas poisoning (Brave Shields, Firefox Strict mode with privacy.resistFingerprinting, or CanvasBlocker)."
      });
    }

    // WebGL Hardware Telemetry Exposure (-5 pts)
    if (privacy["WebGL Hardware Masking"] && privacy["WebGL Hardware Masking"].includes("EXPOSED")) {
      fingerprintPillar.earned -= 5;
      score -= 5;
      deductions.push({
        category: "WebGL Hardware Leak",
        points: -5,
        severity: "advisory",
        reason: "Your exact GPU chip and driver strings are accessible via WebGL debug extensions.",
        fix: "Enable WebGL fingerprint spoofing or strict tracker shielding."
      });
    }

    // Battery API historic tracker (-3 pts)
    if (privacy["Battery Status API"] && privacy["Battery Status API"].includes("EXPOSED")) {
      fingerprintPillar.earned -= 3;
      score -= 3;
      deductions.push({
        category: "Battery Status API",
        points: -3,
        severity: "advisory",
        reason: "Battery status API is accessible to JavaScript, which can be correlated for cross-origin tracking.",
        fix: "Update browser to a modern release that restricts Battery Status access."
      });
    }
  }

  // =========================================================================
  // 4. Permissions & Sensitive API Isolation (20 pts)
  // =========================================================================
  const permissions = sections["DEVICE PERMISSIONS & APIS"];

  if (permissions) {
    for (const key in permissions) {
      if (typeof permissions[key] === "string" && permissions[key].includes("GRANTED")) {
        const pts = (key.includes("Camera") || key.includes("Microphone") || key.includes("Location")) ? 10 : 5;
        permissionsPillar.earned -= pts;
        score -= pts;
        deductions.push({
          category: "Permission Granted",
          points: -pts,
          severity: "warning",
          reason: `'${key}' is currently GRANTED on this origin.`,
          fix: `Click the lock / tune icon in your address bar and reset '${key}' to 'Block' or 'Ask'.`
        });
      }
    }
  }

  // Clamp values
  score = Math.max(0, Math.min(100, score));
  networkPillar.earned = Math.max(0, networkPillar.earned);
  browserPillar.earned = Math.max(0, browserPillar.earned);
  fingerprintPillar.earned = Math.max(0, fingerprintPillar.earned);
  permissionsPillar.earned = Math.max(0, permissionsPillar.earned);

  // Determine Letter Grade & Posture
  let grade = "A+";
  let posture = "SHIELDED";
  let postureClass = "grade-excellent";

  if (score >= 95) {
    grade = "A+";
    posture = "MAXIMUM PROTECTION";
    postureClass = "grade-a-plus";
  } else if (score >= 88) {
    grade = "A";
    posture = "STRONG PRIVACY";
    postureClass = "grade-a";
  } else if (score >= 78) {
    grade = "B";
    posture = "MODERATE POSTURE";
    postureClass = "grade-b";
  } else if (score >= 65) {
    grade = "C";
    posture = "ELEVATED RISK";
    postureClass = "grade-c";
  } else {
    grade = "F";
    posture = "VULNERABLE / UNHARDENED";
    postureClass = "grade-f";
  }

  return {
    score,
    grade,
    posture,
    postureClass,
    deductions,
    pillars: {
      network: networkPillar,
      browser: browserPillar,
      fingerprint: fingerprintPillar,
      permissions: permissionsPillar
    }
  };
}
