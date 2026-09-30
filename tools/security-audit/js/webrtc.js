export async function webrtcScan() {
  let results = {};

  if (!window.RTCPeerConnection) {
    return {
      WebRTC: "UNSUPPORTED",
    };
  }

  try {
    const pc = new RTCPeerConnection({
      iceServers: [],
    });

    pc.createDataChannel("xsecurity");

    const offer = await pc.createOffer();

    await pc.setLocalDescription(offer);

    results["WebRTC Status"] = "AVAILABLE";

    results["Local IP Exposure"] = "CHECKING";

    pc.close();
  } catch (error) {
    results["WebRTC Error"] = error.message;
  }

  return results;
}
