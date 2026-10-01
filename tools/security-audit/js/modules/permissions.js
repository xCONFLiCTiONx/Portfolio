export async function permissionScan() {
  const permissionsToCheck = [
    { name: "camera", label: "Camera Permission" },
    { name: "microphone", label: "Microphone Permission" },
    { name: "geolocation", label: "Location Permission" },
    { name: "notifications", label: "Notifications Permission" }
  ];

  let results = {};

  if (!navigator.permissions) {
    return { "Permissions API": "[ UNKNOWN ] Unsupported" };
  }

  for (const p of permissionsToCheck) {
    try {
      const status = await navigator.permissions.query({ name: p.name });
      const state = status.state; // 'granted', 'prompt', 'denied'

      if (state === "granted") {
        results[p.label] = "[ FAIL ] GRANTED (Lowers Security Score)";
        results[`How to Fix ${p.label}`] = `Permission is GRANTED. Click the lock/site settings icon in your browser address bar, revoke '${p.label}', and refresh the page to regain full points.`;
      } else if (state === "denied") {
        results[p.label] = "[ PASS ] DENIED (Secure)";
      } else {
        results[p.label] = "[ PASS ] PROMPT (Secure)";
      }
    } catch (e) {
      results[p.label] = "[ PASS ] UNSUPPORTED";
    }
  }

  return results;
}
