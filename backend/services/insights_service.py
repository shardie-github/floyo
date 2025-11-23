"""Insights generation service for creating recommendations from patterns."""

import sys
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.logging_config import setup_logging, get_logger
from backend.monitoring.performance import measure_query
from database.models import Event, Pattern, User, AuditLog
from backend.ml.pattern_detector import AdvancedPatternDetector
from backend.ml.recommendation_engine import RecommendationEngine

setup_logging()
logger = get_logger(__name__)


class InsightsService:
    """Service for generating insights and recommendations from user patterns."""
    
    def __init__(self):
        self.pattern_detector = AdvancedPatternDetector()
        self.recommendation_engine = RecommendationEngine()
    
    def generate_insights_for_user(
        self,
        db: Session,
        user_id: str,
        days_back: int = 30
    ) -> List[Dict[str, Any]]:
        """
        Generate insights and recommendations for a user based on their patterns.
        
        Args:
            db: Database session
            user_id: User ID
            days_back: Number of days to analyze
            
        Returns:
            List of insights with recommendations
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_back)
            
            # Get user events (optimized query with index and performance monitoring)
            with measure_query("get_user_events_for_insights"):
                events = db.query(Event).filter(
                    and_(
                        Event.user_id == user_id,
                        Event.timestamp >= cutoff_date  # Use timestamp index instead of created_at
                    )
                ).order_by(Event.timestamp.desc()).limit(1000).all()  # Limit to prevent memory issues
            
            # Get user patterns (optimized query with index and performance monitoring)
            with measure_query("get_user_patterns_for_insights"):
                patterns = db.query(Pattern).filter(
                    Pattern.user_id == user_id
                ).order_by(Pattern.count.desc()).all()  # Order by count for faster max() operation
            
            if not events and not patterns:
                return []
            
            insights = []
            
            # Insight 1: Most used file types
            if patterns:
                top_pattern = max(patterns, key=lambda p: p.count)
                insights.append({
                    'type': 'pattern',
                    'title': f'Most Used File Type: {top_pattern.file_extension}',
                    'description': f"You've used {top_pattern.file_extension} files {top_pattern.count} times.",
                    'recommendation': f'Consider creating templates or snippets for {top_pattern.file_extension} files.',
                    'priority': 'high',
                    'metadata': {
                        'file_extension': top_pattern.file_extension,
                        'count': top_pattern.count,
                    }
                })
            
            # Insight 2: Tool diversity
            tools_used = set()
            for event in events:
                if event.tool:
                    tools_used.add(event.tool)
            
            if len(tools_used) > 5:
                insights.append({
                    'type': 'tool_diversity',
                    'title': 'High Tool Diversity',
                    'description': f"You're using {len(tools_used)} different tools.",
                    'recommendation': 'Consider consolidating tools to reduce context switching.',
                    'priority': 'medium',
                    'metadata': {
                        'tool_count': len(tools_used),
                        'tools': list(tools_used),
                    }
                })
            
            # Insight 3: Peak usage hours
            if events:
                hourly_counts = {}
                for event in events:
                    hour = event.created_at.hour
                    hourly_counts[hour] = hourly_counts.get(hour, 0) + 1
                
                if hourly_counts:
                    peak_hour = max(hourly_counts.items(), key=lambda x: x[1])[0]
                    insights.append({
                        'type': 'temporal',
                        'title': f'Peak Usage Hour: {peak_hour}:00',
                        'description': f'You\'re most active at {peak_hour}:00.',
                        'recommendation': 'Schedule important tasks during your peak hours.',
                        'priority': 'low',
                        'metadata': {
                            'peak_hour': peak_hour,
                            'hourly_distribution': hourly_counts,
                        }
                    })
            
            # Insight 4: File relationship patterns
            if len(events) > 10:
                file_pairs = {}
                prev_file = None
                for event in sorted(events, key=lambda e: e.created_at):
                    if prev_file and event.file_path:
                        pair_key = tuple(sorted([prev_file, event.file_path]))
                        file_pairs[pair_key] = file_pairs.get(pair_key, 0) + 1
                    prev_file = event.file_path
                
                if file_pairs:
                    top_pair = max(file_pairs.items(), key=lambda x: x[1])
                    insights.append({
                        'type': 'relationship',
                        'title': 'File Pair Pattern Detected',
                        'description': f'You frequently use {top_pair[0][0]} and {top_pair[0][1]} together.',
                        'recommendation': 'Consider creating a workflow that opens both files together.',
                        'priority': 'medium',
                        'metadata': {
                            'file_pair': list(top_pair[0]),
                            'frequency': top_pair[1],
                        }
                    })
            
            logger.info(f"Generated {len(insights)} insights for user {user_id}")
            return insights
            
        except Exception as e:
            logger.error(f"Error generating insights for user {user_id}: {e}", exc_info=True)
            return []
    
    def generate_recommendations_from_insights(
        self,
        insights: List[Dict[str, Any]],
        user_preferences: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate actionable recommendations from insights.
        
        Args:
            insights: List of insights
            user_preferences: User preferences and history
            
        Returns:
            List of recommendations
        """
        recommendations = []
        
        for insight in insights:
            if insight.get('recommendation'):
                recommendations.append({
                    'insight_id': insight.get('type', 'unknown'),
                    'title': insight.get('title', 'Recommendation'),
                    'description': insight.get('recommendation'),
                    'priority': insight.get('priority', 'medium'),
                    'action_type': self._determine_action_type(insight),
                    'metadata': insight.get('metadata', {}),
                })
        
        return recommendations
    
    def _determine_action_type(self, insight: Dict[str, Any]) -> str:
        """Determine the type of action for a recommendation."""
        insight_type = insight.get('type', '')
        
        if insight_type == 'pattern':
            return 'create_template'
        elif insight_type == 'tool_diversity':
            return 'consolidate_tools'
        elif insight_type == 'temporal':
            return 'schedule_task'
        elif insight_type == 'relationship':
            return 'create_workflow'
        else:
            return 'general'


def generate_insights_for_user(
    db: Session,
    user_id: str,
    days_back: int = 30
) -> List[Dict[str, Any]]:
    """Convenience function for generating insights."""
    service = InsightsService()
    return service.generate_insights_for_user(db, user_id, days_back)
