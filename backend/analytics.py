"""Analytics endpoint for Web Vitals tracking."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from backend.database import get_db
from backend.logging_config import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/api/analytics", tags=["analytics"])


class WebVitalsMetric(BaseModel):
    name: str
    value: float
    rating: str  # 'good' | 'needs-improvement' | 'poor'
    delta: float
    id: str


@router.post("/web-vitals")
async def track_web_vitals(
    metric: WebVitalsMetric,
    db: Session = Depends(get_db)
):
    """Track Web Vitals metrics from frontend."""
    try:
        # Log the metric
        logger.info(
            f"Web Vitals: {metric.name}={metric.value:.2f} "
            f"({metric.rating}, delta={metric.delta:.2f})"
        )

        # In production, you might want to store these in a database
        # For now, we'll just log them
        
        # Example: Store in database if you have a WebVitalsMetric model
        # db_metric = WebVitalsMetric(
        #     name=metric.name,
        #     value=metric.value,
        #     rating=metric.rating,
        #     delta=metric.delta,
        #     metric_id=metric.id,
        #     created_at=datetime.utcnow()
        # )
        # db.add(db_metric)
        # db.commit()

        return {"status": "ok", "message": "Metric tracked"}
    except Exception as e:
        logger.error(f"Error tracking Web Vitals: {e}")
        return {"status": "error", "message": str(e)}
