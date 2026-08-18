import metadata from "@/src/data/catalog-meta.json";

export function GET() {
  return new Response(JSON.stringify(metadata), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
