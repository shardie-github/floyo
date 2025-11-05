import { NextRequest, NextResponse } from "next/server";
import { recoForFloyo } from "@/lib/reco/floyo/engine";
export const runtime="edge";
export async function POST(req: NextRequest){
  const { userId } = await req.json();
  if(!userId) return NextResponse.json({ error:"missing userId"},{status:400});
  const recs=await recoForFloyo(userId);
  return NextResponse.json({ recs });
}
