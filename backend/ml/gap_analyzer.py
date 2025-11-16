"""
Gap Analyzer for Workflow Engine

Identifies gaps and missing logic in the workflow automation system.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class GapAnalyzer:
    """
    Analyzes the workflow engine for gaps and missing logic.
    """
    
    def __init__(self):
        self.gaps_found: List[Dict[str, Any]] = []
    
    def analyze_workflow_model(self, workflow_model: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Analyze workflow model for gaps."""
        
        gaps = []
        
        # Check for missing patterns
        patterns = workflow_model.get('patterns', {})
        if not patterns:
            gaps.append({
                'type': 'missing_patterns',
                'severity': 'high',
                'description': 'No patterns detected in workflow model',
                'recommendation': 'Ensure data sources are providing valid data',
            })
        
        # Check for missing sequences
        sequences = workflow_model.get('sequences', [])
        if not sequences:
            gaps.append({
                'type': 'missing_sequences',
                'severity': 'medium',
                'description': 'No sequences detected',
                'recommendation': 'Check sequence building logic and time windows',
            })
        
        # Check for missing candidates
        candidates = workflow_model.get('workflow_candidates', [])
        if not candidates:
            gaps.append({
                'type': 'missing_candidates',
                'severity': 'low',
                'description': 'No workflow candidates identified',
                'recommendation': 'May be normal if no repetitive patterns found',
            })
        
        # Check for missing recommendations
        recommendations = workflow_model.get('recommendations', [])
        if not recommendations and candidates:
            gaps.append({
                'type': 'missing_recommendations',
                'severity': 'medium',
                'description': 'Candidates exist but no recommendations generated',
                'recommendation': 'Check recommendation generation logic and thresholds',
            })
        
        # Check pattern completeness
        if patterns:
            if 'interactions' not in patterns:
                gaps.append({
                    'type': 'incomplete_patterns',
                    'severity': 'high',
                    'description': 'Missing interaction patterns',
                    'recommendation': 'Ensure interaction pattern extraction is working',
                })
            
            if 'telemetry' not in patterns:
                gaps.append({
                    'type': 'incomplete_patterns',
                    'severity': 'high',
                    'description': 'Missing telemetry patterns',
                    'recommendation': 'Ensure telemetry pattern extraction is working',
                })
            
            if 'merged_insights' not in patterns:
                gaps.append({
                    'type': 'incomplete_patterns',
                    'severity': 'medium',
                    'description': 'Missing merged insights',
                    'recommendation': 'Implement merged insights generation',
                })
            
            if 'cross_references' not in patterns:
                gaps.append({
                    'type': 'incomplete_patterns',
                    'severity': 'low',
                    'description': 'Missing cross-references',
                    'recommendation': 'Implement cross-reference logic',
                })
        
        # Check advanced patterns
        advanced_patterns = workflow_model.get('advanced_patterns', {})
        if not advanced_patterns:
            gaps.append({
                'type': 'missing_advanced_patterns',
                'severity': 'medium',
                'description': 'Missing advanced pattern detection',
                'recommendation': 'Implement advanced pattern detection',
            })
        else:
            if 'repetitive' not in advanced_patterns:
                gaps.append({
                    'type': 'missing_advanced_patterns',
                    'severity': 'low',
                    'description': 'Missing repetitive pattern detection',
                    'recommendation': 'Implement repetitive pattern detection',
                })
            
            if 'temporal' not in advanced_patterns:
                gaps.append({
                    'type': 'missing_advanced_patterns',
                    'severity': 'low',
                    'description': 'Missing temporal pattern detection',
                    'recommendation': 'Implement temporal pattern detection',
                })
        
        # Check candidate quality
        for i, candidate in enumerate(candidates):
            if 'automation_potential' not in candidate:
                gaps.append({
                    'type': 'incomplete_candidate',
                    'severity': 'high',
                    'description': f'Candidate {i} missing automation_potential',
                    'recommendation': 'Ensure automation potential calculation',
                })
            
            if 'confidence' not in candidate:
                gaps.append({
                    'type': 'incomplete_candidate',
                    'severity': 'high',
                    'description': f'Candidate {i} missing confidence score',
                    'recommendation': 'Ensure confidence calculation',
                })
        
        # Check recommendation quality
        for i, recommendation in enumerate(recommendations):
            if 'integration_suggestions' not in recommendation:
                gaps.append({
                    'type': 'incomplete_recommendation',
                    'severity': 'medium',
                    'description': f'Recommendation {i} missing integration suggestions',
                    'recommendation': 'Ensure integration suggestion logic',
                })
            
            if 'estimated_time_saved' not in recommendation:
                gaps.append({
                    'type': 'incomplete_recommendation',
                    'severity': 'low',
                    'description': f'Recommendation {i} missing time savings estimate',
                    'recommendation': 'Calculate time savings estimate',
                })
        
        return gaps
    
    def analyze_data_merging(self, patterns: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Analyze data merging logic for gaps."""
        
        gaps = []
        
        # Check if all data sources are merged
        if 'interactions' not in patterns:
            gaps.append({
                'type': 'data_merging',
                'severity': 'high',
                'description': 'Interaction patterns not merged',
                'recommendation': 'Ensure interaction patterns are included in merge',
            })
        
        if 'telemetry' not in patterns:
            gaps.append({
                'type': 'data_merging',
                'severity': 'high',
                'description': 'Telemetry patterns not merged',
                'recommendation': 'Ensure telemetry patterns are included in merge',
            })
        
        if 'cookies' not in patterns:
            gaps.append({
                'type': 'data_merging',
                'severity': 'medium',
                'description': 'Cookie patterns not merged',
                'recommendation': 'Ensure cookie patterns are included in merge',
            })
        
        # Check for cross-references
        if 'cross_references' not in patterns:
            gaps.append({
                'type': 'data_merging',
                'severity': 'low',
                'description': 'Cross-references not created',
                'recommendation': 'Implement cross-reference creation',
            })
        
        # Check for correlations
        if 'correlations' not in patterns:
            gaps.append({
                'type': 'data_merging',
                'severity': 'low',
                'description': 'Correlations not calculated',
                'recommendation': 'Implement correlation calculation',
            })
        
        return gaps
    
    def analyze_pattern_detection(self, patterns: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Analyze pattern detection for gaps."""
        
        gaps = []
        
        # Check interaction pattern detection
        interaction_patterns = patterns.get('interactions', {})
        if interaction_patterns:
            required_keys = ['overlay_usage', 'interaction_types', 'target_patterns']
            for key in required_keys:
                if key not in interaction_patterns:
                    gaps.append({
                        'type': 'pattern_detection',
                        'severity': 'medium',
                        'description': f'Missing interaction pattern key: {key}',
                        'recommendation': f'Implement {key} detection',
                    })
        
        # Check telemetry pattern detection
        telemetry_patterns = patterns.get('telemetry', {})
        if telemetry_patterns:
            required_keys = ['event_types', 'app_usage', 'file_patterns']
            for key in required_keys:
                if key not in telemetry_patterns:
                    gaps.append({
                        'type': 'pattern_detection',
                        'severity': 'medium',
                        'description': f'Missing telemetry pattern key: {key}',
                        'recommendation': f'Implement {key} detection',
                    })
        
        # Check cookie pattern detection
        cookie_patterns = patterns.get('cookies', {})
        if cookie_patterns:
            required_keys = ['cookie_domains', 'referrer_patterns', 'utm_patterns']
            for key in required_keys:
                if key not in cookie_patterns:
                    gaps.append({
                        'type': 'pattern_detection',
                        'severity': 'low',
                        'description': f'Missing cookie pattern key: {key}',
                        'recommendation': f'Implement {key} detection',
                    })
        
        return gaps
    
    def analyze_automation_generation(
        self,
        workflow: Optional[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Analyze automation generation for gaps."""
        
        gaps = []
        
        if not workflow:
            gaps.append({
                'type': 'automation_generation',
                'severity': 'high',
                'description': 'No workflow generated',
                'recommendation': 'Check workflow generation logic',
            })
            return gaps
        
        definition = workflow.get('definition', {})
        if not definition:
            gaps.append({
                'type': 'automation_generation',
                'severity': 'high',
                'description': 'Workflow missing definition',
                'recommendation': 'Ensure workflow definition is generated',
            })
            return gaps
        
        # Check required definition fields
        required_fields = ['version', 'integration', 'triggers', 'steps', 'conditions', 'error_handling']
        for field in required_fields:
            if field not in definition:
                gaps.append({
                    'type': 'automation_generation',
                    'severity': 'high',
                    'description': f'Workflow definition missing field: {field}',
                    'recommendation': f'Implement {field} generation',
                })
        
        # Check triggers
        triggers = definition.get('triggers', [])
        if not triggers:
            gaps.append({
                'type': 'automation_generation',
                'severity': 'medium',
                'description': 'Workflow has no triggers',
                'recommendation': 'Generate at least one trigger',
            })
        
        # Check steps
        steps = definition.get('steps', [])
        if not steps:
            gaps.append({
                'type': 'automation_generation',
                'severity': 'high',
                'description': 'Workflow has no steps',
                'recommendation': 'Generate workflow steps',
            })
        
        return gaps
    
    def generate_gap_report(self, workflow_model: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive gap report."""
        
        gaps = []
        
        # Analyze workflow model
        gaps.extend(self.analyze_workflow_model(workflow_model))
        
        # Analyze data merging
        patterns = workflow_model.get('patterns', {})
        gaps.extend(self.analyze_data_merging(patterns))
        
        # Analyze pattern detection
        gaps.extend(self.analyze_pattern_detection(patterns))
        
        # Analyze automation generation (if workflow exists)
        # This would be done separately when generating workflows
        
        # Categorize gaps
        high_severity = [g for g in gaps if g['severity'] == 'high']
        medium_severity = [g for g in gaps if g['severity'] == 'medium']
        low_severity = [g for g in gaps if g['severity'] == 'low']
        
        return {
            'total_gaps': len(gaps),
            'high_severity': len(high_severity),
            'medium_severity': len(medium_severity),
            'low_severity': len(low_severity),
            'gaps': gaps,
            'categorized': {
                'high': high_severity,
                'medium': medium_severity,
                'low': low_severity,
            },
            'generated_at': datetime.utcnow().isoformat(),
        }


# Singleton instance
_gap_analyzer: Optional[GapAnalyzer] = None


def get_gap_analyzer() -> GapAnalyzer:
    """Get singleton gap analyzer instance."""
    global _gap_analyzer
    if _gap_analyzer is None:
        _gap_analyzer = GapAnalyzer()
    return _gap_analyzer
