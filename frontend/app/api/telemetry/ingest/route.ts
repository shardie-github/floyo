import { NextRequest, NextResponse } from "next/server";
export const runtime="edge";
export async function POST(req: NextRequest){
  const body = await req.text();
  const r = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ingest-telemetry`, {
    method: "POST", headers: { "content-type":"application/json","authorization":`Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` }, body
  });
  return new NextResponse(await r.text(), { status: r.status, headers: { "content-type":"application/json" } });
}
