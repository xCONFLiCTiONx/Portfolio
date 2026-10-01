export async function permissionScan() {
  const permissionsToCheck = [
    { name: "camera", label: "Camera Permission" },
    { name: "microphone", label: "Microphone Permission" },
    { name: "geolocation", label: "Location Permission" },
    { name: "notifications", label: "Notifications Permission" }
  ];

  let results = {};

  if (!navigator.permissions) {
    return { "Permissions API": "UNSUPPORTED" };
  }

  for (const p of permissionsToCheck) {
    try {
      const status = await navigator.permissions.query({ name: p.name });
      const state = status.state; // 'granted', 'prompt', 'denied'

      if (state === "granted") {
        results[p.label] = "GRANTED (FAIL)";
        results[`How to Fix ${p.label}`] = `Permission is GRANTED. Click the lock/site settings icon in your browser address bar, revoke '${p.label}', and refresh the page to improve your score.`;
      } else {
        results[p.label] = `${state.toUpperCase()} (PASS)`;
      }
    } catch (e) {
      results[p.label] = "UNSUPPORTED (PASS)";
    }
  }

  return results;
}
