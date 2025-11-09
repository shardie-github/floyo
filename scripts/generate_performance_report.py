#!/usr/bin/env python3
"""
Performance Report Generator
Generates PERFORMANCE_REPORT.md with insights and recommendations
"""

import os
import json
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")


def fetch_metrics(days: int = 7) -> List[Dict]:
    """Fetch metrics from Supabase"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Supabase credentials not configured")
        return []

    cutoff = (datetime.now() - timedelta(days=days)).isoformat()

    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/metrics_log",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
            },
            params={
                "ts": f"gte.{cutoff}",
                "order": "ts.desc",
                "limit": "1000",
            },
        )
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"Error fetching metrics: {e}")

    return []


def aggregate_metrics(metrics: List[Dict]) -> Dict:
    """Aggregate metrics by source"""
    aggregated = {
        "vercel": {"LCP": [], "CLS": [], "TTFB": [], "errors": []},
        "supabase": {"latencyMs": [], "queryCount": [], "errorRate": []},
        "expo": {"bundleMB": [], "buildDurationMin": [], "successRate": []},
        "ci": {"buildDurationMin": [], "failureRate": [], "queueLength": []},
        "client": {"ttfb": [], "lcp": [], "errors": []},
        "telemetry": {"ttfb": [], "lcp": [], "cls": []},
    }

    for metric in metrics:
        source = metric.get("source", "")
        metric_data = metric.get("metric", {})

        if source == "vercel":
            for key in ["LCP", "CLS", "TTFB", "errors"]:
                if key in metric_data and metric_data[key] is not None:
                    aggregated["vercel"][key].append(metric_data[key])

        elif source == "supabase":
            for key in ["latencyMs", "queryCount", "errorRate"]:
                if key in metric_data and metric_data[key] is not None:
                    aggregated["supabase"][key].append(metric_data[key])

        elif source == "expo":
            for key in ["bundleMB", "buildDurationMin", "successRate"]:
                if key in metric_data and metric_data[key] is not None:
                    aggregated["expo"][key].append(metric_data[key])

        elif source == "ci":
            for key in ["buildDurationMin", "failureRate", "queueLength"]:
                if key in metric_data and metric_data[key] is not None:
                    aggregated["ci"][key].append(metric_data[key])

        elif source in ["client", "telemetry"]:
            for key in ["ttfb", "lcp", "cls"]:
                if key in metric_data and metric_data[key] is not None:
                    aggregated[source][key].append(metric_data[key])

    # Calculate averages
    result = {}
    for source, metrics_dict in aggregated.items():
        result[source] = {}
        for key, values in metrics_dict.items():
            if values:
                result[source][key] = {
                    "avg": sum(values) / len(values),
                    "min": min(values),
                    "max": max(values),
                    "count": len(values),
                }

    return result


def calculate_trends(metrics: List[Dict]) -> Dict[str, float]:
    """Calculate trends comparing recent vs previous period"""
    if len(metrics) < 20:
        return {}

    # Split into recent (first half) and previous (second half)
    midpoint = len(metrics) // 2
    recent = metrics[:midpoint]
    previous = metrics[midpoint:]

    trends = {}

    # Compare LCP
    recent_lcp = [
        m["metric"].get("LCP") or m["metric"].get("lcp")
        for m in recent
        if m["metric"].get("LCP") or m["metric"].get("lcp")
    ]
    previous_lcp = [
        m["metric"].get("LCP") or m["metric"].get("lcp")
        for m in previous
        if m["metric"].get("LCP") or m["metric"].get("lcp")
    ]

    if recent_lcp and previous_lcp:
        recent_avg = sum(recent_lcp) / len(recent_lcp)
        previous_avg = sum(previous_lcp) / len(previous_lcp)
        if previous_avg > 0:
            trends["LCP"] = ((recent_avg - previous_avg) / previous_avg) * 100

    return trends


def generate_recommendations(aggregated: Dict, trends: Dict) -> List[str]:
    """Generate optimization recommendations"""
    recommendations = []

    # Web Vitals recommendations
    lcp = (
        aggregated.get("vercel", {}).get("LCP", {}).get("avg")
        or aggregated.get("client", {}).get("lcp", {}).get("avg")
    )
    if lcp and lcp > 2500:
        recommendations.append(
            f"⚠️ LCP is {lcp:.0f}ms (target: <2500ms). Enable image compression and next-image optimization."
        )

    cls = aggregated.get("vercel", {}).get("CLS", {}).get("avg")
    if cls and cls > 0.1:
        recommendations.append(
            f"⚠️ CLS is {cls:.3f} (target: <0.1). Review layout shifts and ensure dimensions are set on images."
        )

    # Supabase recommendations
    supabase_latency = aggregated.get("supabase", {}).get("latencyMs", {}).get("avg")
    if supabase_latency and supabase_latency > 200:
        recommendations.append(
            f"⚠️ Supabase avg latency is {supabase_latency:.0f}ms (target: <200ms). Consider adding indexes for slow queries."
        )

    # Expo recommendations
    bundle_size = aggregated.get("expo", {}).get("bundleMB", {}).get("avg")
    if bundle_size and bundle_size > 30:
        recommendations.append(
            f"⚠️ Expo bundle size is {bundle_size:.1f}MB (target: <30MB). Trigger expo optimize."
        )

    # CI recommendations
    ci_queue = aggregated.get("ci", {}).get("queueLength", {}).get("avg")
    if ci_queue and ci_queue > 3:
        recommendations.append(
            f"⚠️ CI queue length is {ci_queue:.1f} (target: <3). Throttle GitHub workflow concurrency."
        )

    # Regression alerts
    if trends.get("LCP", 0) > 10:
        recommendations.append(
            f"🚨 REGRESSION: LCP increased by {trends['LCP']:.1f}%. Review recent deployments."
        )

    if not recommendations:
        recommendations.append("✅ All metrics are within acceptable ranges.")

    return recommendations


def generate_report() -> str:
    """Generate the performance report markdown"""
    metrics = fetch_metrics(days=7)
    if not metrics:
        return "# Performance Report\n\nNo metrics available.\n"

    aggregated = aggregate_metrics(metrics)
    trends = calculate_trends(metrics)
    recommendations = generate_recommendations(aggregated, trends)

    report = f"""# Performance Report

**Generated:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")}
**Period:** Last 7 days
**Total Metrics:** {len(metrics)}

---

## 📊 Performance Summary

### Web Vitals

"""
    # Web Vitals section
    lcp = (
        aggregated.get("vercel", {}).get("LCP", {}).get("avg")
        or aggregated.get("client", {}).get("lcp", {}).get("avg")
    )
    cls = aggregated.get("vercel", {}).get("CLS", {}).get("avg")
    ttfb = (
        aggregated.get("vercel", {}).get("TTFB", {}).get("avg")
        or aggregated.get("client", {}).get("ttfb", {}).get("avg")
    )

    if lcp:
        report += f"- **LCP:** {lcp:.0f}ms (target: <2500ms) {'✅' if lcp < 2500 else '⚠️'}\n"
    if cls:
        report += f"- **CLS:** {cls:.3f} (target: <0.1) {'✅' if cls < 0.1 else '⚠️'}\n"
    if ttfb:
        report += f"- **TTFB:** {ttfb:.0f}ms (target: <800ms) {'✅' if ttfb < 800 else '⚠️'}\n"

    report += "\n### System Metrics\n\n"

    # Supabase
    if aggregated.get("supabase"):
        report += "**Supabase:**\n"
        for key, stats in aggregated["supabase"].items():
            report += f"- {key}: {stats['avg']:.2f} (min: {stats['min']:.2f}, max: {stats['max']:.2f})\n"
        report += "\n"

    # Expo
    if aggregated.get("expo"):
        report += "**Expo:**\n"
        for key, stats in aggregated["expo"].items():
            report += f"- {key}: {stats['avg']:.2f} (min: {stats['min']:.2f}, max: {stats['max']:.2f})\n"
        report += "\n"

    # CI
    if aggregated.get("ci"):
        report += "**CI:**\n"
        for key, stats in aggregated["ci"].items():
            report += f"- {key}: {stats['avg']:.2f} (min: {stats['min']:.2f}, max: {stats['max']:.2f})\n"
        report += "\n"

    # Trends
    if trends:
        report += "## 📈 Trends (Recent vs Previous Period)\n\n"
        for metric, change in trends.items():
            emoji = "📉" if change < 0 else "📈"
            report += f"- {emoji} **{metric}:** {change:+.1f}%\n"
        report += "\n"

    # Recommendations
    report += "## 🎯 Recommendations\n\n"
    for rec in recommendations:
        report += f"{rec}\n"
    report += "\n"

    # Cost estimate (placeholder)
    report += """## 💰 Cost Estimate

Based on current usage patterns:
- **Vercel:** ~$20-50/month (estimated)
- **Supabase:** ~$25/month (estimated)
- **GitHub Actions:** ~$0-10/month (estimated)

*Note: Actual costs may vary based on usage.*

---

## 📊 Dashboard

View live metrics at `/admin/metrics` or `/api/metrics` (JSON).

---

*This report is auto-generated by the Performance Intelligence Layer.*
"""

    return report


if __name__ == "__main__":
    report = generate_report()
    output_path = os.path.join(os.path.dirname(__file__), "..", "PERFORMANCE_REPORT.md")
    with open(output_path, "w") as f:
        f.write(report)
    print(f"✓ Performance report generated: {output_path}")
