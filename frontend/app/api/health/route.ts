export const config = { runtime: "edge" };

export async function GET() {
  return new Response(
    JSON.stringify({ 
      ok: true, 
      ts: Date.now(),
      service: "floyo-api",
      version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0"
    }),
    {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    }
  );
}
