export async function dnsScan() {
  let results = {};

  try {
    let response = await fetch("/cdn-cgi/trace", {
      cache: "no-store",
    });

    if (response.ok) {
      let text = await response.text();

      let lines = text.split("\n");

      for (let line of lines) {
        let parts = line.split("=");

        if (parts.length === 2) {
          if (parts[0] === "ip") results["Public IP"] = parts[1];

          if (parts[0] === "colo") results["Cloudflare Location"] = parts[1];

          if (parts[0] === "http") results["HTTP"] = parts[1];
        }
      }

      results["Cloudflare Trace"] = "AVAILABLE";
    } else {
      results["Cloudflare Trace"] = "NOT AVAILABLE";
    }
  } catch {
    results["Cloudflare Trace"] = "UNAVAILABLE";
  }

  return results;
}
