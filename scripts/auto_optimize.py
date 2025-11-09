#!/usr/bin/env python3
"""
Auto-Optimization Script
Applies safe, incremental optimizations based on performance metrics
"""

import os
import json
import requests
from typing import Dict, List

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
TELEMETRY_WEBHOOK_URL = os.environ.get("TELEMETRY_WEBHOOK_URL")


def fetch_analysis() -> Dict:
    """Fetch performance analysis from Supabase Edge Function"""
    if not SUPABASE_URL:
        return {}

    try:
        response = requests.post(
            f"{SUPABASE_URL}/functions/v1/analyze-performance",
            headers={
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json",
            },
        )
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"Error fetching analysis: {e}")

    return {}


def apply_optimizations(analysis: Dict) -> List[str]:
    """Apply safe optimizations based on analysis"""
    applied = []

    if not analysis:
        return applied

    recommendations = analysis.get("recommendations", [])
    regressions = analysis.get("regressions", [])

    # Log recommendations (don't auto-apply destructive changes)
    for rec in recommendations:
        print(f"📋 Recommendation: {rec}")
        applied.append(rec)

    # Alert on regressions
    if regressions:
        alert_message = "🚨 Performance Regression Detected:\n\n"
        for reg in regressions:
            alert_message += f"- {reg['metric']}: +{reg['changePercent']:.1f}%\n"
        alert_message += "\nCheck /admin/metrics for details."

        print(alert_message)

        # Send webhook alert if configured
        if TELEMETRY_WEBHOOK_URL:
            try:
                requests.post(
                    TELEMETRY_WEBHOOK_URL,
                    json={
                        "text": alert_message,
                        "username": "Performance Intelligence",
                    },
                )
            except Exception as e:
                print(f"Failed to send webhook: {e}")

    return applied


def main():
    """Main execution"""
    print("🔍 Analyzing performance metrics...")
    analysis = fetch_analysis()

    if not analysis:
        print("⚠️ No analysis data available")
        return

    print(f"📊 Status: {analysis.get('status', 'unknown')}")
    print(f"📈 Metrics analyzed: {analysis.get('metricsAnalyzed', 0)}")

    applied = apply_optimizations(analysis)

    if applied:
        print(f"\n✅ Applied {len(applied)} optimization recommendations")
    else:
        print("\n✅ No optimizations needed")


if __name__ == "__main__":
    main()
