export async function networkScan() {
  let results = {};

  results["Online Status"] = navigator.onLine ? "PASS" : "FAIL";

  if (navigator.connection) {
    results["Connection Type"] =
      navigator.connection.effectiveType || "UNKNOWN";

    results["Downlink"] = navigator.connection.downlink
      ? navigator.connection.downlink + " Mbps"
      : "UNKNOWN";

    results["RTT"] = navigator.connection.rtt
      ? navigator.connection.rtt + " ms"
      : "UNKNOWN";
  } else {
    results["Connection API"] = "UNAVAILABLE";
  }

  // Check if WebRTC exists

  results["WebRTC"] = window.RTCPeerConnection ? "AVAILABLE" : "UNKNOWN";

  results["VPN Detection"] = "LIMITED IN BROWSER";

  return results;
}
