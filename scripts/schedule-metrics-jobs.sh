#!/bin/bash
# Schedule metrics aggregation jobs
# This script sets up cron jobs for daily and weekly metrics aggregation

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Daily metrics aggregation (runs at 00:00 UTC)
DAILY_CRON="0 0 * * * cd $PROJECT_ROOT && python -m backend.jobs.metrics_aggregation --daily >> /var/log/floyo-metrics-daily.log 2>&1"

# Weekly metrics aggregation (runs Monday at 00:00 UTC)
WEEKLY_CRON="0 0 * * 1 cd $PROJECT_ROOT && python -m backend.jobs.metrics_aggregation --weekly >> /var/log/floyo-metrics-weekly.log 2>&1"

# Add to crontab (if not already present)
(crontab -l 2>/dev/null | grep -v "metrics_aggregation"; echo "$DAILY_CRON"; echo "$WEEKLY_CRON") | crontab -

echo "✅ Metrics aggregation jobs scheduled"
echo "Daily: Runs at 00:00 UTC"
echo "Weekly: Runs Monday at 00:00 UTC"
