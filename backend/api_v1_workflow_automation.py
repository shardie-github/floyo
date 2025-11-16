"""
Workflow Automation API Endpoints

Endpoints for workflow model building, automation generation, and recommendations.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

from backend.ml.workflow_model_builder import get_workflow_model_builder
from backend.ml.automation_generator import get_automation_generator
from backend.database import get_db
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/v1/workflows", tags=["workflows"])


class WorkflowModelRequest(BaseModel):
    """Request model for building workflow models."""
    userId: str
    timeRange: Optional[str] = "30d"  # 7d, 30d, 90d
    includeCookies: bool = True
    includeIndirectInputs: bool = True


class WorkflowGenerationRequest(BaseModel):
    """Request model for generating workflows."""
    workflowModelId: str
    userId: str
    integrationPreferences: Optional[List[str]] = None


class WorkflowRecommendationResponse(BaseModel):
    """Response model for workflow recommendations."""
    workflows: List[Dict[str, Any]]
    recommendations: List[Dict[str, Any]]
    confidence: float
    estimatedTimeSaved: float


@router.post("/build-model", response_model=Dict[str, Any])
async def build_workflow_model(
    request: WorkflowModelRequest,
    db: Session = Depends(get_db)
):
    """
    Build workflow model from user interactions, telemetry, and behaviors.
    """
    try:
        # Fetch interactions from database
        # This would query telemetry_events table for overlay diagnostics
        interactions_query = db.execute(
            """
            SELECT metadata_redacted_json
            FROM telemetry_events
            WHERE app_id = 'overlay-diagnostics'
            AND user_id = :user_id
            AND timestamp >= NOW() - INTERVAL :time_range
            """,
            {
                "user_id": request.userId,
                "time_range": request.timeRange,
            }
        )
        
        interactions = []
        for row in interactions_query:
            metadata = row[0] if row[0] else {}
            interactions.append({
                "type": metadata.get("target", {}).get("type", "unknown"),
                "overlay": metadata.get("overlay", {}),
                "target": metadata.get("target", {}),
                "timestamp": metadata.get("session", {}).get("timestamp", 0),
            })
        
        # Fetch telemetry events
        telemetry_query = db.execute(
            """
            SELECT event_type, app_id, timestamp, metadata_redacted_json
            FROM telemetry_events
            WHERE user_id = :user_id
            AND timestamp >= NOW() - INTERVAL :time_range
            """,
            {
                "user_id": request.userId,
                "time_range": request.timeRange,
            }
        )
        
        telemetry_events = []
        for row in telemetry_query:
            telemetry_events.append({
                "eventType": row[0],
                "appId": row[1],
                "timestamp": row[2].isoformat() if row[2] else None,
                "metadataRedactedJson": row[3] if row[3] else {},
            })
        
        # Fetch cookie/indirect input data if requested
        cookie_data = None
        if request.includeCookies or request.includeIndirectInputs:
            cookie_query = db.execute(
                """
                SELECT metadata_redacted_json
                FROM telemetry_events
                WHERE app_id = 'indirect-inputs'
                AND user_id = :user_id
                AND timestamp >= NOW() - INTERVAL :time_range
                """,
                {
                    "user_id": request.userId,
                    "time_range": request.timeRange,
                }
            )
            
            cookie_data = {
                "cookies": [],
                "referrers": [],
                "utm_params": {},
            }
            
            for row in cookie_query:
                metadata = row[0] if row[0] else {}
                if metadata.get("cookies"):
                    cookie_data["cookies"].extend(metadata["cookies"])
                if metadata.get("referrers"):
                    cookie_data["referrers"].extend(metadata["referrers"])
                if metadata.get("utm_params"):
                    cookie_data["utm_params"].update(metadata["utm_params"])
        
        # Build workflow model
        model_builder = get_workflow_model_builder()
        workflow_model = model_builder.analyze_interactions(
            interactions,
            telemetry_events,
            cookie_data
        )
        
        return {
            "ok": True,
            "workflowModel": workflow_model,
            "modelId": f"model_{datetime.utcnow().timestamp()}",
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to build workflow model: {str(e)}"
        )


@router.post("/generate", response_model=Dict[str, Any])
async def generate_workflow(
    request: WorkflowGenerationRequest,
    db: Session = Depends(get_db)
):
    """
    Generate automation workflow from workflow model.
    """
    try:
        # In a real implementation, fetch workflow model from database
        # For now, we'll build it on the fly
        
        model_builder = get_workflow_model_builder()
        automation_generator = get_automation_generator()
        
        # Build model first (simplified - in production, fetch from DB)
        # This would typically fetch a stored model
        
        # Generate workflow
        result = automation_generator.generate_workflow(
            workflow_model={},  # Would be fetched from DB
            user_id=request.userId,
            integration_preferences=request.integrationPreferences
        )
        
        return {
            "ok": True,
            "workflow": result.get("workflow"),
            "suggestions": result.get("suggestions", []),
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate workflow: {str(e)}"
        )


@router.get("/recommendations/{userId}", response_model=WorkflowRecommendationResponse)
async def get_workflow_recommendations(
    userId: str,
    db: Session = Depends(get_db)
):
    """
    Get workflow automation recommendations for a user.
    """
    try:
        # Build workflow model
        model_builder = get_workflow_model_builder()
        
        # Fetch data and build model (simplified)
        workflow_model = model_builder.analyze_interactions([], [], {})
        
        recommendations = workflow_model.get("recommendations", [])
        workflow_candidates = workflow_model.get("workflow_candidates", [])
        
        return {
            "workflows": workflow_candidates,
            "recommendations": recommendations,
            "confidence": sum(c.get("confidence", 0) for c in workflow_candidates) / len(workflow_candidates) if workflow_candidates else 0,
            "estimatedTimeSaved": sum(r.get("estimated_time_saved", 0) for r in recommendations),
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get recommendations: {str(e)}"
        )
