"""
Enhanced ML Features
Predictive analytics, intelligent suggestions, and AI-powered features.
"""

from typing import List, Dict, Any, Optional
import numpy as np
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.logging_config import get_logger
from database.models import Event, Pattern, User

logger = get_logger(__name__)


class PredictiveAnalytics:
    """Predictive analytics engine."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def predict_next_file_usage(
        self,
        user_id: str,
        time_window_hours: int = 24,
    ) -> List[Dict[str, Any]]:
        """
        Predict next files user is likely to use.
        
        Args:
            user_id: User ID
            time_window_hours: Prediction window
        
        Returns:
            List of predicted files with confidence scores
        """
        # Get recent usage patterns
        cutoff = datetime.utcnow() - timedelta(days=7)
        recent_events = self.db.query(Event).filter(
            Event.user_id == user_id,
            Event.timestamp >= cutoff
        ).order_by(Event.timestamp.desc()).limit(100).all()
        
        # Analyze patterns
        file_usage = {}
        for event in recent_events:
            file_path = event.file_path
            if file_path not in file_usage:
                file_usage[file_path] = {
                    'count': 0,
                    'last_used': event.timestamp,
                    'times': [],
                }
            file_usage[file_path]['count'] += 1
            file_usage[file_path]['times'].append(event.timestamp)
        
        # Calculate predictions based on frequency and recency
        predictions = []
        for file_path, data in file_usage.items():
            # Frequency score
            frequency_score = data['count'] / len(recent_events)
            
            # Recency score (more recent = higher score)
            hours_since_last_use = (datetime.utcnow() - data['last_used']).total_seconds() / 3600
            recency_score = max(0, 1 - (hours_since_last_use / 168))  # Decay over 1 week
            
            # Combined confidence score
            confidence = (frequency_score * 0.6 + recency_score * 0.4)
            
            predictions.append({
                'file_path': file_path,
                'confidence': confidence,
                'predicted_usage_time': datetime.utcnow() + timedelta(hours=time_window_hours),
            })
        
        # Sort by confidence
        predictions.sort(key=lambda x: x['confidence'], reverse=True)
        
        return predictions[:10]  # Top 10 predictions
    
    def predict_workflow_triggers(
        self,
        user_id: str,
    ) -> List[Dict[str, Any]]:
        """
        Predict when workflows should be triggered.
        
        Args:
            user_id: User ID
        
        Returns:
            List of workflow trigger predictions
        """
        # Analyze event patterns to predict workflow triggers
        # This is a simplified version - in production, use ML models
        
        cutoff = datetime.utcnow() - timedelta(days=30)
        events = self.db.query(Event).filter(
            Event.user_id == user_id,
            Event.timestamp >= cutoff
        ).all()
        
        # Group events by time of day
        hourly_patterns = {}
        for event in events:
            hour = event.timestamp.hour
            if hour not in hourly_patterns:
                hourly_patterns[hour] = 0
            hourly_patterns[hour] += 1
        
        # Find peak hours
        peak_hours = sorted(hourly_patterns.items(), key=lambda x: x[1], reverse=True)[:3]
        
        predictions = []
        for hour, count in peak_hours:
            predictions.append({
                'trigger_time': hour,
                'confidence': count / len(events),
                'pattern': 'time_based',
            })
        
        return predictions


class IntelligentSuggestions:
    """Intelligent integration suggestions."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def generate_smart_suggestions(
        self,
        user_id: str,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        Generate intelligent integration suggestions.
        
        Args:
            user_id: User ID
            limit: Maximum number of suggestions
        
        Returns:
            List of suggestions with reasoning
        """
        # Analyze user patterns
        patterns = self.db.query(Pattern).filter(
            Pattern.user_id == user_id
        ).order_by(Pattern.count.desc()).limit(20).all()
        
        suggestions = []
        
        # Suggest integrations based on file patterns
        for pattern in patterns:
            file_ext = pattern.file_extension.lower()
            
            # Map file extensions to potential integrations
            integration_map = {
                'csv': ['zapier', 'airtable', 'google_sheets'],
                'json': ['zapier', 'webhook', 'api'],
                'pdf': ['zapier', 'dropbox', 'google_drive'],
                'png': ['cloudinary', 'imgur', 's3'],
                'jpg': ['cloudinary', 'imgur', 's3'],
                'js': ['github', 'vercel', 'netlify'],
                'ts': ['github', 'vercel', 'netlify'],
                'py': ['github', 'heroku', 'aws'],
            }
            
            potential_integrations = integration_map.get(file_ext, [])
            
            for integration in potential_integrations:
                suggestions.append({
                    'integration': integration,
                    'reason': f'You frequently use .{file_ext} files',
                    'confidence': pattern.count / 100,  # Normalized confidence
                    'pattern_id': str(pattern.id),
                })
        
        # Deduplicate and sort by confidence
        seen = set()
        unique_suggestions = []
        for suggestion in suggestions:
            key = suggestion['integration']
            if key not in seen:
                seen.add(key)
                unique_suggestions.append(suggestion)
        
        unique_suggestions.sort(key=lambda x: x['confidence'], reverse=True)
        
        return unique_suggestions[:limit]
