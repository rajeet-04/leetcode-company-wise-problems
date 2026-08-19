import catalog from "@/src/data/catalog-v2.json";

export function GET() {
  return new Response(JSON.stringify(catalog), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
