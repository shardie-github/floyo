"""Workflow Recommendation System using Collaborative Filtering."""

from typing import Dict, Any, Optional, List, Tuple
import pandas as pd
import numpy as np
from sklearn.decomposition import NMF
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session
from datetime import datetime

from backend.ml.base import BaseMLModel, FloyoDataProcessor
from database.models import Workflow, WorkflowExecution, User, Event
from backend.logging_config import get_logger

logger = get_logger(__name__)


class WorkflowRecommender(BaseMLModel):
    """Collaborative filtering recommender for workflows."""
    
    def __init__(self, model_version: int = 1, n_components: int = 10):
        super().__init__("workflow_recommender", model_version)
        self.n_components = n_components
        self.model = None
        self.user_features = None
        self.workflow_features = None
        self.user_ids = []
        self.workflow_ids = []
        
    def train(self, db: Session, user_id: Optional[str] = None, **kwargs) -> Dict[str, float]:
        """Train the collaborative filtering model.
        
        Args:
            db: Database session
            user_id: Optional user ID (ignored for collaborative filtering)
            **kwargs: Additional training parameters
            
        Returns:
            Dictionary of training metrics
        """
        try:
            logger.info("Training WorkflowRecommender (collaborative filtering)")
            
            # Build user-workflow interaction matrix
            matrix, user_ids, workflow_ids = self._build_interaction_matrix(db)
            
            if matrix is None or matrix.shape[0] < 5 or matrix.shape[1] < 5:
                logger.warning("Insufficient data for collaborative filtering")
                return {"error": "Insufficient data (need at least 5 users and 5 workflows)"}
            
            self.user_ids = user_ids
            self.workflow_ids = workflow_ids
            
            # Train NMF model
            self.model = NMF(
                n_components=min(self.n_components, min(matrix.shape)),
                random_state=42,
                max_iter=1000
            )
            
            # Factorize
            self.user_features = self.model.fit_transform(matrix)
            self.workflow_features = self.model.components_
            
            # Calculate reconstruction error
            reconstructed = np.dot(self.user_features, self.workflow_features)
            error = np.mean((matrix - reconstructed) ** 2)
            
            # Calculate sparsity
            sparsity = 1.0 - (np.count_nonzero(matrix) / matrix.size)
            
            self.training_metrics = {
                "reconstruction_error": float(error),
                "sparsity": float(sparsity),
                "n_users": len(user_ids),
                "n_workflows": len(workflow_ids),
                "n_components": self.n_components,
            }
            
            self.is_trained = True
            self.last_trained_at = datetime.utcnow()
            
            logger.info(f"WorkflowRecommender trained. Error: {error:.4f}")
            
            return self.training_metrics
            
        except Exception as e:
            logger.error(f"Error training WorkflowRecommender: {e}", exc_info=True)
            return {"error": str(e)}
    
    def _build_interaction_matrix(self, db: Session) -> Tuple[Optional[np.ndarray], List[str], List[str]]:
        """Build user-workflow interaction matrix."""
        try:
            # Get all users with workflows
            users = db.query(User).join(Workflow).distinct().all()
            workflows = db.query(Workflow).distinct().all()
            
            if len(users) < 2 or len(workflows) < 2:
                return None, [], []
            
            user_ids = [str(u.id) for u in users]
            workflow_ids = [str(w.id) for w in workflows]
            
            # Create matrix
            matrix = np.zeros((len(user_ids), len(workflow_ids)))
            
            # Fill matrix with interaction scores
            for user_idx, user_id in enumerate(user_ids):
                user_workflows = db.query(Workflow).filter(Workflow.user_id == user_id).all()
                
                for workflow in user_workflows:
                    if str(workflow.id) in workflow_ids:
                        workflow_idx = workflow_ids.index(str(workflow.id))
                        
                        # Score based on:
                        # 1. Workflow created (1.0)
                        # 2. Workflow executions (0.1 per execution)
                        # 3. Workflow success rate (0.5 if high success)
                        
                        score = 1.0  # Created workflow
                        
                        executions = db.query(WorkflowExecution).filter(
                            WorkflowExecution.workflow_id == workflow.id
                        ).all()
                        
                        score += len(executions) * 0.1
                        
                        if executions:
                            successful = sum(1 for e in executions if e.status == "completed")
                            success_rate = successful / len(executions)
                            if success_rate > 0.8:
                                score += 0.5
                        
                        matrix[user_idx, workflow_idx] = min(score, 5.0)  # Cap at 5.0
            
            return matrix, user_ids, workflow_ids
            
        except Exception as e:
            logger.error(f"Error building interaction matrix: {e}")
            return None, [], []
    
    def recommend(self, user_id: str, db: Session, n_recommendations: int = 5) -> Dict[str, Any]:
        """Recommend workflows for a user.
        
        Args:
            user_id: User ID
            db: Database session
            n_recommendations: Number of recommendations to return
            
        Returns:
            Dictionary with recommended workflows and scores
        """
        if not self.is_trained:
            logger.warning("WorkflowRecommender not trained")
            return {"recommendations": [], "error": "Model not trained"}
        
        try:
            # Find user index
            if user_id not in self.user_ids:
                # New user - use content-based fallback
                return self._content_based_recommend(user_id, db, n_recommendations)
            
            user_idx = self.user_ids.index(user_id)
            user_vector = self.user_features[user_idx]
            
            # Calculate scores for all workflows
            scores = np.dot(user_vector, self.workflow_features)
            
            # Get user's existing workflows
            user_workflows = db.query(Workflow).filter(Workflow.user_id == user_id).all()
            existing_workflow_ids = {str(w.id) for w in user_workflows}
            
            # Filter out existing workflows and get top N
            recommendations = []
            for workflow_idx, score in enumerate(scores):
                workflow_id = self.workflow_ids[workflow_idx]
                
                if workflow_id not in existing_workflow_ids:
                    recommendations.append((workflow_id, float(score)))
            
            # Sort by score
            recommendations.sort(key=lambda x: x[1], reverse=True)
            recommendations = recommendations[:n_recommendations]
            
            # Get workflow details
            result = []
            for workflow_id, score in recommendations:
                workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
                if workflow:
                    result.append({
                        "workflow_id": workflow_id,
                        "workflow_name": workflow.name,
                        "workflow_description": workflow.description,
                        "score": score,
                        "confidence": min(score / 5.0, 1.0),  # Normalize to [0, 1]
                    })
            
            return {
                "recommendations": result,
                "algorithm": "collaborative_filtering"
            }
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return {"recommendations": [], "error": str(e)}
    
    def _content_based_recommend(self, user_id: str, db: Session, n_recommendations: int) -> Dict[str, Any]:
        """Content-based recommendation for new users."""
        try:
            # Get user's patterns
            from database.models import Pattern
            
            user_patterns = db.query(Pattern).filter(Pattern.user_id == user_id).all()
            
            if not user_patterns:
                # Return popular workflows
                popular_workflows = db.query(Workflow).join(WorkflowExecution).group_by(
                    Workflow.id
                ).order_by(
                    db.func.count(WorkflowExecution.id).desc()
                ).limit(n_recommendations).all()
                
                return {
                    "recommendations": [
                        {
                            "workflow_id": str(w.id),
                            "workflow_name": w.name,
                            "workflow_description": w.description,
                            "score": 0.5,
                            "confidence": 0.3,
                        }
                        for w in popular_workflows
                    ],
                    "algorithm": "popular_workflows"
                }
            
            # Find workflows matching user's patterns
            user_extensions = {p.file_extension for p in user_patterns if p.file_extension}
            
            # Find workflows with similar patterns
            all_workflows = db.query(Workflow).all()
            scored_workflows = []
            
            for workflow in all_workflows:
                # Simple scoring based on workflow steps matching user patterns
                score = 0.0
                if workflow.steps:
                    for step in workflow.steps:
                        if isinstance(step, dict):
                            file_ext = step.get("file_extension") or step.get("file_type")
                            if file_ext in user_extensions:
                                score += 1.0
                
                scored_workflows.append((workflow, score))
            
            # Sort and return top N
            scored_workflows.sort(key=lambda x: x[1], reverse=True)
            recommendations = scored_workflows[:n_recommendations]
            
            return {
                "recommendations": [
                    {
                        "workflow_id": str(w.id),
                        "workflow_name": w.name,
                        "workflow_description": w.description,
                        "score": score,
                        "confidence": min(score / 5.0, 1.0),
                    }
                    for w, score in recommendations
                ],
                "algorithm": "content_based"
            }
            
        except Exception as e:
            logger.error(f"Error in content-based recommendation: {e}")
            return {"recommendations": [], "error": str(e)}
    
    def predict(self, user_id: str, workflow_id: str) -> Dict[str, Any]:
        """Predict user's preference for a workflow.
        
        Args:
            user_id: User ID
            workflow_id: Workflow ID
            
        Returns:
            Dictionary with preference score
        """
        if not self.is_trained:
            return {"score": 0.5, "error": "Model not trained"}
        
        try:
            if user_id not in self.user_ids or workflow_id not in self.workflow_ids:
                return {"score": 0.5, "note": "User or workflow not in training data"}
            
            user_idx = self.user_ids.index(user_id)
            workflow_idx = self.workflow_ids.index(workflow_id)
            
            user_vector = self.user_features[user_idx]
            workflow_vector = self.workflow_features[:, workflow_idx]
            
            score = float(np.dot(user_vector, workflow_vector))
            normalized_score = min(max(score / 5.0, 0.0), 1.0)
            
            return {
                "score": normalized_score,
                "raw_score": score,
                "confidence": "high" if normalized_score > 0.7 else "medium" if normalized_score > 0.4 else "low"
            }
            
        except Exception as e:
            logger.error(f"Error predicting preference: {e}")
            return {"score": 0.5, "error": str(e)}
