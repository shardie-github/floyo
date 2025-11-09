import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

/**
 * Cron endpoint for automated metrics collection
 * Called by Vercel cron jobs to trigger metric collection
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret (if configured)
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Supabase configuration missing" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Trigger analysis function
    const analysisResponse = await fetch(
      `${supabaseUrl}/functions/v1/analyze-performance`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const analysis = analysisResponse.ok
      ? await analysisResponse.json()
      : null;

    // Store collection event
    await supabase.from("metrics_log").insert({
      source: "system",
      metric: {
        type: "collection",
        analysis: analysis,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      ok: true,
      analysis: analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error in metrics collection:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
