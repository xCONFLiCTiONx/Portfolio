export async function storageScan() {
  let results = {};

  try {
    results["Local Storage"] = localStorage.length + " ITEMS";
  } catch {
    results["Local Storage"] = "BLOCKED";
  }

  try {
    results["Session Storage"] = sessionStorage.length + " ITEMS";
  } catch {
    results["Session Storage"] = "BLOCKED";
  }

  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();

      results["Storage Used"] =
        Math.round((estimate.usage || 0) / 1024 / 1024) + " MB";

      results["Storage Quota"] =
        Math.round((estimate.quota || 0) / 1024 / 1024) + " MB";
    } catch {
      results["Storage API"] = "UNKNOWN";
    }
  }

  results["Cookies"] = navigator.cookieEnabled ? "AVAILABLE" : "BLOCKED";

  return results;
}
