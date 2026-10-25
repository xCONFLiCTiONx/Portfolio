export async function onRequestGet({ request }) {
  const gpcHeader = request.headers.get("Sec-GPC");
  const enabled = gpcHeader === "1";

  return new Response(
    JSON.stringify({
      enabled,
      headerPresent: gpcHeader !== null,
      value: gpcHeader,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "Vary": "Sec-GPC",
      },
    },
  );
}
