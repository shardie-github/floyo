import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

/**
 * Telemetry endpoint for client-side performance beacons
 * Accepts performance metrics from browser/client and stores in metrics_log
 */
export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Supabase configuration missing" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      url,
      ttfb,
      lcp,
      cls,
      fid,
      errors,
      userAgent,
      connectionType,
      timestamp,
    } = body;

    // Anonymize IP (don't store full IP)
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";
    const anonymizedIp = ip ? ip.split(".").slice(0, 2).join(".") + ".x.x" : null;

    // Extract performance metrics from navigation timing
    const navigationEntry = body.navigationTiming || {};
    const resourceEntries = body.resourceTiming || [];

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Prepare metric payload
    const metric = {
      url: url || "/",
      ttfb: ttfb || navigationEntry.responseStart || null,
      lcp: lcp || null,
      cls: cls || null,
      fid: fid || null,
      errors: errors || 0,
      userAgent: userAgent ? userAgent.substring(0, 100) : null, // Truncate
      connectionType: connectionType || null,
      ip: anonymizedIp, // Anonymized
      resourceCount: resourceEntries.length || 0,
      timestamp: timestamp || Date.now(),
    };

    // Insert into metrics_log
    const { error } = await supabase.from("metrics_log").insert({
      source: "telemetry",
      metric,
    });

    if (error) {
      console.error("Error storing telemetry:", error);
      return NextResponse.json(
        { error: "Failed to store telemetry" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ok: true },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (error: any) {
    console.error("Error in /api/telemetry:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
