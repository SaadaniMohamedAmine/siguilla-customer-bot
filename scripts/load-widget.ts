// npx tsx scripts/load-widget.ts <APP_URL> <pk>
async function main() {
  const [, , base, pk] = process.argv;
  const visitorId = "loadtest-" + Date.now();
  const results = await Promise.all(
    Array.from({ length: 30 }, (_, i) =>
      fetch(`${base}/api/public/v1/chat`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: base },
        body: JSON.stringify({ pk, question: `Test ${i}: shipping to Switzerland?`, visitorId }),
      }).then(async (r) => ({ status: r.status, body: (await r.text()).slice(0, 120) })),
    ),
  );
  const limited = results.filter((r) => r.status === 429 || r.body.includes("rate_limited")).length;
  console.log({ total: results.length, limited });
  if (limited < 10) process.exit(1); // la limite est de 20/min : au moins 10 doivent être refusées
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
