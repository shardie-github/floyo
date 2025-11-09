/**
 * Mobile TTI (Time to Interactive) Telemetry Endpoint
 * For Expo/mobile apps to report TTI metrics
 * Guarded by EXPO_PUBLIC_TELEMETRY=true
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

interface TTIPayload {
  tti: number; // Time to Interactive in milliseconds
  platform: 'ios' | 'android' | 'web';
  appVersion?: string;
  deviceInfo?: {
    model?: string;
    osVersion?: string;
  };
  bundleSize?: number; // Bundle size in MB
  timestamp: number;
}

export async function POST(req: NextRequest) {
  // Check if telemetry is enabled
  const telemetryEnabled = process.env.EXPO_PUBLIC_TELEMETRY === 'true';
  
  if (!telemetryEnabled) {
    return NextResponse.json(
      { error: "Telemetry not enabled" },
      { status: 403 }
    );
  }

  try {
    const payload: TTIPayload = await req.json();

    // Validate payload
    if (!payload.tti || typeof payload.tti !== 'number') {
      return NextResponse.json(
        { error: "Invalid TTI value" },
        { status: 400 }
      );
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

    // Store TTI metric
    await supabase.from("metrics_log").insert({
      source: "expo",
      metric: {
        type: "tti",
        tti: payload.tti,
        platform: payload.platform,
        appVersion: payload.appVersion,
        deviceInfo: payload.deviceInfo,
        bundleSize: payload.bundleSize,
        timestamp: new Date(payload.timestamp || Date.now()).toISOString(),
      },
      ts: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      message: "TTI metric recorded",
    });
  } catch (error: any) {
    console.error("Error recording TTI:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
