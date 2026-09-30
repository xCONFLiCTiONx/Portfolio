export async function permissionScan() {
  const permissions = [
    "camera",

    "microphone",

    "geolocation",

    "notifications",

    "clipboard-read",

    "bluetooth",
  ];

  let results = {};

  if (!navigator.permissions) {
    return {
      "Permissions API": "UNKNOWN",
    };
  }

  for (const permission of permissions) {
    try {
      let result = await navigator.permissions.query({
        name: permission,
      });

      results[permission] = result.state.toUpperCase();
    } catch {
      results[permission] = "UNSUPPORTED";
    }
  }

  return results;
}
