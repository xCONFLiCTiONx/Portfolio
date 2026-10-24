/**
 * Permissions & Sensitive Device API Audit
 * Inspects granted permissions to ensure high-privilege device APIs are locked down.
 */

export async function permissionScan() {
  const permissionsToCheck = [
    { name: "camera", label: "Camera Access" },
    { name: "microphone", label: "Microphone Access" },
    { name: "geolocation", label: "Physical Location" },
    { name: "notifications", label: "Push Notifications" },
    { name: "clipboard-read", label: "Clipboard Read" },
    { name: "persistent-storage", label: "Persistent Storage" },
    { name: "midi", label: "MIDI Hardware Interface" }
  ];

  let results = {};

  if (!navigator.permissions) {
    return {
      "Permissions Controller": "[ PASS ] RESTRICTED (Permissions API sandboxed / unavailable)"
    };
  }

  for (const p of permissionsToCheck) {
    try {
      const status = await navigator.permissions.query({ name: p.name });
      const state = status.state; // 'granted', 'prompt', 'denied'

      if (state === "granted") {
        results[p.label] = "[ FAIL ] GRANTED (Privilege Active)";
        results[`How to Fix ${p.label}`] = `Revoke '${p.label}' by clicking the site settings / lock icon in your browser address bar and changing it to 'Block' or 'Ask'.`;
      } else if (state === "denied") {
        results[p.label] = "[ PASS ] BLOCKED (Zero Access)";
      } else {
        results[p.label] = "[ PASS ] PROMPT (Locked until explicit user approval)";
      }
    } catch (_) {
      results[p.label] = "[ PASS ] BLOCKED / UNSUPPORTED";
    }
  }

  return results;
}
