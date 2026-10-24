/**
 * WebRTC IP Leak & Privacy Probe
 * Detects local LAN IP exposure, mDNS obfuscation, and STUN public IP proxy bypass leaks.
 */

export async function webrtcScan(httpPublicIp = null) {
  let results = {};

  if (!window.RTCPeerConnection) {
    return {
      "WebRTC Engine": "[ PASS ] BLOCKED / DISABLED",
      "WebRTC Leak Status": "[ PASS ] SECURE — WebRTC API disabled or blocked by privacy extension",
      "Public STUN Reflection": "[ PASS ] None (Zero IP Exposure)",
      "Local LAN Exposure": "[ PASS ] None (API unavailable)"
    };
  }

  results["WebRTC Engine"] = "[ PASS ] Supported by Browser";

  try {
    const probe = await harvestCandidates(2500);

    const publicIps = probe.publicIps;
    const localIps = probe.localIps;
    const mdnsHosts = probe.mdnsHosts;

    // 1. Evaluate Public STUN IP vs HTTP Proxy IP
    if (publicIps.length === 0) {
      results["WebRTC Public STUN IP"] = "[ PASS ] SHIELDED (No STUN Candidates Emitted)";
      results["WebRTC Leak Status"] = "[ PASS ] SECURE — WebRTC cannot be used to unmask client IP";
    } else {
      const webrtcIp = publicIps[0];
      results["WebRTC Public STUN IP"] = webrtcIp;

      if (httpPublicIp && webrtcIp !== httpPublicIp) {
        // Critical proxy bypass: The HTTP traffic went through proxy, but WebRTC leaked the direct IP!
        results["WebRTC Leak Status"] = `[ CRITICAL LEAK ] PROXY BYPASS DETECTED! WebRTC exposed direct IP (${webrtcIp}) which differs from proxy IP (${httpPublicIp}).`;
        results["How to Fix WebRTC Leak"] = "Your proxy or VPN does not encapsulate WebRTC UDP traffic. Install an extension like 'WebRTC Control', 'uBlock Origin' (enable 'Prevent WebRTC from leaking local IP'), or disable WebRTC in browser settings (about:config -> media.peerconnection.enabled = false in Firefox).";
      } else if (httpPublicIp && webrtcIp === httpPublicIp) {
        results["WebRTC Leak Status"] = "[ PASS ] SECURE — WebRTC routes through proxy / matches connection IP (No leak)";
      } else {
        results["WebRTC Leak Status"] = "[ PASS ] STUN IP matches active route (No dual-homed leak)";
      }
    }

    // 2. Evaluate Local LAN RFC1918 Exposure vs mDNS
    if (localIps.length > 0) {
      results["Local LAN IP Exposure"] = `[ WARN ] EXPOSED: Local private IP(s) detected: ${localIps.join(", ")}`;
      results["How to Fix Local IP Leak"] = "Your browser exposes your internal LAN subnet. Enable mDNS hostname obfuscation or install WebRTC leak protection.";
    } else if (mdnsHosts.length > 0) {
      results["Local LAN IP Exposure"] = `[ PASS ] PROTECTED (mDNS Hostname Active: ${mdnsHosts[0]})`;
    } else {
      results["Local LAN IP Exposure"] = "[ PASS ] PROTECTED (No local network candidates exposed)";
    }

    // 3. Overall WebRTC Assessment
    const isLeaking = (httpPublicIp && publicIps.length > 0 && publicIps[0] !== httpPublicIp) || localIps.length > 0;
    results["WebRTC Anonymity Rating"] = isLeaking
      ? "[ FAIL ] VULNERABLE TO UNMASKING"
      : "[ PASS ] PROTECTED / LEAK-FREE";

  } catch (error) {
    results["WebRTC Status"] = "[ PASS ] BLOCKED OR RESTRICTED";
    results["WebRTC Leak Status"] = `[ PASS ] Zero leak detected (${error.message})`;
  }

  return results;
}

function harvestCandidates(timeoutMs = 2500) {
  return new Promise((resolve) => {
    const publicIps = [];
    const localIps = [];
    const mdnsHosts = [];

    let pc;
    let timer;

    function finish() {
      clearTimeout(timer);
      if (pc) {
        try { pc.close(); } catch (_) {}
      }
      resolve({ publicIps, localIps, mdnsHosts });
    }

    timer = setTimeout(finish, timeoutMs);

    try {
      pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.cloudflare.com:3478" },
          { urls: "stun:stun.l.google.com:19302" }
        ]
      });

      pc.createDataChannel("leak-audit-channel");

      pc.onicecandidate = (event) => {
        if (!event.candidate) {
          finish();
          return;
        }

        const candidateStr = event.candidate.candidate;
        // Format: candidate:foundation component protocol priority ip port typ type ...
        const parts = candidateStr.split(" ");
        if (parts.length >= 8) {
          const ip = parts[4];
          const type = parts[7]; // host, srflx, prflx, relay

          if (type === "host") {
            if (ip.endsWith(".local")) {
              if (!mdnsHosts.includes(ip)) mdnsHosts.push(ip);
            } else if (isPrivateIp(ip)) {
              if (!localIps.includes(ip)) localIps.push(ip);
            } else if (isPublicIp(ip)) {
              if (!publicIps.includes(ip)) publicIps.push(ip);
            }
          } else if (type === "srflx") {
            if (isPublicIp(ip) && !publicIps.includes(ip)) {
              publicIps.push(ip);
            }
          }
        }
      };

      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .catch(() => finish());

    } catch (_) {
      finish();
    }
  });
}

function isPrivateIp(ip) {
  return (
    /^10\./.test(ip) ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip) ||
    /^192\.168\./.test(ip) ||
    /^127\./.test(ip) ||
    /^169\.254\./.test(ip) ||
    /^fc00:/.test(ip) ||
    /^fe80:/.test(ip)
  );
}

function isPublicIp(ip) {
  if (!ip) return false;
  if (ip.includes(":") && !ip.includes(".")) return true; // IPv6 public
  return /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/.test(ip) && !isPrivateIp(ip);
}
