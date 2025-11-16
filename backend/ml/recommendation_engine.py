"""
Advanced Recommendation Engine

Enhanced automation recommendation engine with scoring and prioritization.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class RecommendationEngine:
    """
    Advanced recommendation engine for workflow automation.
    """
    
    def __init__(self):
        self.recommendation_history: List[Dict[str, Any]] = []
    
    def generate_recommendations(
        self,
        workflow_candidates: List[Dict[str, Any]],
        patterns: Dict[str, Any],
        user_preferences: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate prioritized automation recommendations.
        
        Args:
            workflow_candidates: List of workflow candidates
            patterns: Combined patterns from all data sources
            user_preferences: User preferences and history
            
        Returns:
            Prioritized list of recommendations
        """
        
        recommendations = []
        
        for candidate in workflow_candidates:
            # Calculate recommendation score
            score = self._calculate_recommendation_score(
                candidate,
                patterns,
                user_preferences
            )
            
            # Only recommend if score is above threshold
            if score >= 0.5:
                recommendation = self._create_recommendation(
                    candidate,
                    patterns,
                    score,
                    user_preferences
                )
                recommendations.append(recommendation)
        
        # Sort by score (highest first)
        recommendations.sort(key=lambda r: r.get('score', 0), reverse=True)
        
        # Limit to top 10
        return recommendations[:10]
    
    def _calculate_recommendation_score(
        self,
        candidate: Dict[str, Any],
        patterns: Dict[str, Any],
        user_preferences: Optional[Dict[str, Any]]
    ) -> float:
        """Calculate recommendation score (0.0-1.0)."""
        
        score = 0.0
        factors = []
        
        # Factor 1: Automation potential (40% weight)
        automation_potential = candidate.get('automation_potential', 0)
        factors.append(('automation_potential', automation_potential * 0.4))
        
        # Factor 2: Confidence (30% weight)
        confidence = candidate.get('confidence', 0)
        factors.append(('confidence', confidence * 0.3))
        
        # Factor 3: Frequency (15% weight)
        frequency = candidate.get('frequency', 0)
        frequency_score = min(frequency / 10.0, 1.0)  # Normalize to 0-1
        factors.append(('frequency', frequency_score * 0.15))
        
        # Factor 4: Consistency (10% weight)
        consistency_score = candidate.get('consistency_score', 0.5)
        factors.append(('consistency', consistency_score * 0.1))
        
        # Factor 5: User preferences (5% weight)
        preference_score = 0.5  # Default
        if user_preferences:
            # Check if user has accepted similar recommendations
            accepted_integrations = user_preferences.get('accepted_integrations', [])
            suggested_integrations = candidate.get('suggested_integrations', [])
            
            if any(integration in accepted_integrations for integration in suggested_integrations):
                preference_score = 1.0
        
        factors.append(('preferences', preference_score * 0.05))
        
        # Sum all factors
        score = sum(factor[1] for factor in factors)
        
        # Boost for high-frequency patterns
        if frequency >= 20:
            score = min(1.0, score * 1.1)
        
        return min(1.0, max(0.0, score))
    
    def _create_recommendation(
        self,
        candidate: Dict[str, Any],
        patterns: Dict[str, Any],
        score: float,
        user_preferences: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Create a recommendation from a candidate."""
        
        # Calculate time savings
        avg_duration = candidate.get('average_duration', 0)
        frequency = candidate.get('frequency', 0)
        estimated_time_saved = (avg_duration * frequency) / 1000 / 60  # Convert to minutes
        
        # Get integration suggestions
        integration_suggestions = self._get_integration_suggestions(candidate, patterns)
        
        # Determine priority
        if score >= 0.8:
            priority = 'high'
        elif score >= 0.6:
            priority = 'medium'
        else:
            priority = 'low'
        
        recommendation = {
            'id': f"rec_{datetime.utcnow().timestamp()}",
            'type': 'workflow_automation',
            'title': self._generate_recommendation_title(candidate),
            'description': self._generate_recommendation_description(candidate, estimated_time_saved),
            'score': score,
            'priority': priority,
            'confidence': candidate.get('confidence', 0),
            'automation_potential': candidate.get('automation_potential', 0),
            'estimated_time_saved': estimated_time_saved,
            'frequency': frequency,
            'workflow': {
                'sequence_key': candidate.get('sequence_key', ''),
                'steps': candidate.get('steps', 0),
                'average_duration': avg_duration,
            },
            'integration_suggestions': integration_suggestions,
            'temporal_info': candidate.get('temporal_info', {}),
            'context': candidate.get('overlay_context', {}),
            'created_at': datetime.utcnow().isoformat(),
        }
        
        return recommendation
    
    def _get_integration_suggestions(
        self,
        candidate: Dict[str, Any],
        patterns: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Get integration suggestions with scores."""
        
        suggestions = []
        
        # Check overlay patterns
        interaction_patterns = patterns.get('interactions', {})
        overlay_usage = interaction_patterns.get('overlay_usage', {})
        
        # Zapier
        zapier_score = 0
        if overlay_usage.get('modal', 0) > 0:
            zapier_score += 0.4
        if overlay_usage.get('dropdown', 0) > 0:
            zapier_score += 0.3
        if overlay_usage.get('tooltip', 0) > 0:
            zapier_score += 0.1
        
        if zapier_score > 0.3:
            suggestions.append({
                'integration': 'zapier',
                'score': zapier_score,
                'reason': 'Best for modal and dropdown automation',
            })
        
        # MindStudio
        mindstudio_score = 0
        if overlay_usage.get('dropdown', 0) > 0:
            mindstudio_score += 0.5
        if candidate.get('steps', 0) > 5:
            mindstudio_score += 0.3
        if overlay_usage.get('modal', 0) > 0:
            mindstudio_score += 0.2
        
        if mindstudio_score > 0.3:
            suggestions.append({
                'integration': 'mindstudio',
                'score': mindstudio_score,
                'reason': 'Best for complex multi-step workflows',
            })
        
        # Check telemetry patterns
        telemetry_patterns = patterns.get('telemetry', {})
        app_usage = telemetry_patterns.get('app_usage', {})
        app_usage_str = str(app_usage).lower()
        
        # TikTok Ads
        if 'tiktok' in app_usage_str:
            suggestions.append({
                'integration': 'tiktok-ads',
                'score': 0.8,
                'reason': 'TikTok usage detected',
            })
        
        # Meta Ads
        if 'meta' in app_usage_str or 'facebook' in app_usage_str:
            suggestions.append({
                'integration': 'meta-ads',
                'score': 0.8,
                'reason': 'Meta/Facebook usage detected',
            })
        
        # Sort by score
        suggestions.sort(key=lambda s: s.get('score', 0), reverse=True)
        
        return suggestions
    
    def _generate_recommendation_title(self, candidate: Dict[str, Any]) -> str:
        """Generate recommendation title."""
        steps = candidate.get('steps', 0)
        frequency = candidate.get('frequency', 0)
        
        if frequency >= 20:
            return f"Automate {steps}-Step Workflow (High Frequency: {frequency}x)"
        elif frequency >= 10:
            return f"Automate {steps}-Step Workflow (Occurs {frequency} times)"
        else:
            return f"Consider Automating {steps}-Step Workflow"
    
    def _generate_recommendation_description(
        self,
        candidate: Dict[str, Any],
        estimated_time_saved: float
    ) -> str:
        """Generate recommendation description."""
        
        description = f"This workflow automates a {candidate.get('steps', 0)}-step sequence "
        description += f"that occurs {candidate.get('frequency', 0)} times. "
        
        if estimated_time_saved > 0:
            description += f"Estimated time saved: {estimated_time_saved:.1f} minutes per occurrence. "
        
        # Add temporal info if available
        temporal_info = candidate.get('temporal_info', {})
        peak_hour = temporal_info.get('peak_hour')
        if peak_hour is not None:
            description += f"Peak activity at hour {peak_hour}. "
        
        description += "Generated automatically from your usage patterns."
        
        return description


# Singleton instance
_recommendation_engine: Optional[RecommendationEngine] = None


def get_recommendation_engine() -> RecommendationEngine:
    """Get singleton recommendation engine instance."""
    global _recommendation_engine
    if _recommendation_engine is None:
        _recommendation_engine = RecommendationEngine()
    return _recommendation_engine
