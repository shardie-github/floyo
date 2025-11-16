"""
Automation Generator

Generates automation workflows based on workflow models and patterns.
"""

import json
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class AutomationGenerator:
    """
    Generates automation workflows from workflow models.
    """
    
    def __init__(self):
        self.generated_workflows: List[Dict[str, Any]] = []
    
    def generate_workflow(
        self,
        workflow_model: Dict[str, Any],
        user_id: str,
        integration_preferences: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Generate an automation workflow from a workflow model.
        
        Args:
            workflow_model: Workflow model from WorkflowModelBuilder
            user_id: User ID
            integration_preferences: Preferred integrations
            
        Returns:
            Generated workflow definition
        """
        
        candidates = workflow_model.get('workflow_candidates', [])
        recommendations = workflow_model.get('recommendations', [])
        
        if not candidates:
            return {
                'error': 'No workflow candidates found',
                'workflow': None,
            }
        
        # Select best candidate
        best_candidate = max(
            candidates,
            key=lambda c: c.get('automation_potential', 0) * c.get('confidence', 0)
        )
        
        # Find matching recommendation
        matching_recommendation = next(
            (r for r in recommendations if r.get('workflow', {}).get('sequence_key') == best_candidate['sequence_key']),
            None
        )
        
        # Generate workflow definition
        workflow_definition = self._create_workflow_definition(
            best_candidate,
            matching_recommendation,
            workflow_model,
            integration_preferences
        )
        
        workflow = {
            'id': f"workflow_{datetime.utcnow().timestamp()}",
            'userId': user_id,
            'name': self._generate_workflow_name(best_candidate),
            'description': self._generate_workflow_description(best_candidate, matching_recommendation),
            'definition': workflow_definition,
            'status': 'draft',
            'confidence': best_candidate.get('confidence', 0),
            'automation_potential': best_candidate.get('automation_potential', 0),
            'estimated_time_saved': matching_recommendation.get('estimated_time_saved', 0) if matching_recommendation else 0,
            'createdAt': datetime.utcnow().isoformat(),
            'updatedAt': datetime.utcnow().isoformat(),
        }
        
        self.generated_workflows.append(workflow)
        
        return {
            'workflow': workflow,
            'suggestions': matching_recommendation.get('integration_suggestions', []) if matching_recommendation else [],
        }
    
    def _create_workflow_definition(
        self,
        candidate: Dict[str, Any],
        recommendation: Optional[Dict[str, Any]],
        workflow_model: Dict[str, Any],
        integration_preferences: Optional[List[str]]
    ) -> Dict[str, Any]:
        """Create workflow definition from candidate."""
        
        sequence_key = candidate.get('sequence_key', '')
        steps = self._parse_sequence_key(sequence_key)
        
        # Determine integration
        integration = self._determine_integration(
            recommendation,
            integration_preferences,
            workflow_model
        )
        
        definition = {
            'version': '1.0',
            'integration': integration,
            'triggers': self._generate_triggers(steps, workflow_model),
            'steps': self._generate_steps(steps, integration),
            'conditions': self._generate_conditions(steps),
            'error_handling': self._generate_error_handling(),
        }
        
        return definition
    
    def _parse_sequence_key(self, sequence_key: str) -> List[Dict[str, str]]:
        """Parse sequence key into steps."""
        steps = []
        parts = sequence_key.split(' -> ')
        
        for part in parts:
            if part.startswith('i:'):
                # Interaction step
                _, interaction_type, overlay_type = part.split(':', 2)
                steps.append({
                    'type': 'interaction',
                    'interaction_type': interaction_type,
                    'overlay_type': overlay_type,
                })
            elif part.startswith('t:'):
                # Telemetry step
                _, event_type, app_id = part.split(':', 2)
                steps.append({
                    'type': 'telemetry',
                    'event_type': event_type,
                    'app_id': app_id,
                })
        
        return steps
    
    def _determine_integration(
        self,
        recommendation: Optional[Dict[str, Any]],
        integration_preferences: Optional[List[str]],
        workflow_model: Dict[str, Any]
    ) -> str:
        """Determine best integration for workflow."""
        
        # Use recommendation suggestions if available
        if recommendation:
            suggestions = recommendation.get('integration_suggestions', [])
            if suggestions:
                # Prefer user's preferred integrations
                if integration_preferences:
                    for pref in integration_preferences:
                        if pref in suggestions:
                            return pref
                return suggestions[0]
        
        # Default to Zapier for general automation
        return 'zapier'
    
    def _generate_triggers(
        self,
        steps: List[Dict[str, str]],
        workflow_model: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate workflow triggers."""
        
        triggers = []
        
        # First step determines trigger
        if steps:
            first_step = steps[0]
            
            if first_step['type'] == 'interaction':
                triggers.append({
                    'type': 'user_action',
                    'action': first_step['interaction_type'],
                    'target': {
                        'overlay_type': first_step['overlay_type'],
                    },
                })
            elif first_step['type'] == 'telemetry':
                triggers.append({
                    'type': 'event',
                    'event_type': first_step['event_type'],
                    'app_id': first_step['app_id'],
                })
        
        # Add time-based trigger if pattern shows temporal consistency
        temporal_patterns = workflow_model.get('patterns', {}).get('interactions', {}).get('temporal_patterns', {})
        if temporal_patterns:
            # Find most common hour
            hour_counts = {h: len(events) for h, events in temporal_patterns.items()}
            if hour_counts:
                most_common_hour = max(hour_counts.items(), key=lambda x: x[1])[0]
                triggers.append({
                    'type': 'schedule',
                    'schedule': f"0 {most_common_hour} * * *",  # Daily at most common hour
                })
        
        return triggers
    
    def _generate_steps(
        self,
        steps: List[Dict[str, str]],
        integration: str
    ) -> List[Dict[str, Any]]:
        """Generate workflow steps."""
        
        workflow_steps = []
        
        for i, step in enumerate(steps[1:], start=1):  # Skip first (trigger)
            if step['type'] == 'interaction':
                workflow_steps.append({
                    'step_number': i,
                    'type': 'action',
                    'action': self._map_interaction_to_action(step['interaction_type']),
                    'target': {
                        'overlay_type': step['overlay_type'],
                    },
                    'integration': integration,
                })
            elif step['type'] == 'telemetry':
                workflow_steps.append({
                    'step_number': i,
                    'type': 'event',
                    'event_type': step['event_type'],
                    'app_id': step['app_id'],
                    'integration': integration,
                })
        
        return workflow_steps
    
    def _map_interaction_to_action(self, interaction_type: str) -> str:
        """Map interaction type to automation action."""
        mapping = {
            'click': 'click',
            'hover': 'hover',
            'focus': 'focus',
            'keydown': 'type',
            'keyup': 'type',
        }
        return mapping.get(interaction_type, 'click')
    
    def _generate_conditions(
        self,
        steps: List[Dict[str, str]]
    ) -> List[Dict[str, Any]]:
        """Generate workflow conditions."""
        
        conditions = []
        
        # Add conditions based on step patterns
        for step in steps:
            if step['type'] == 'interaction' and step['overlay_type'] != 'none':
                conditions.append({
                    'type': 'overlay_visible',
                    'overlay_type': step['overlay_type'],
                })
        
        return conditions
    
    def _generate_error_handling(self) -> Dict[str, Any]:
        """Generate error handling configuration."""
        
        return {
            'retry_count': 3,
            'retry_delay': 1000,  # milliseconds
            'on_failure': 'notify_user',
            'fallback_action': 'skip_step',
        }
    
    def _generate_workflow_name(self, candidate: Dict[str, Any]) -> str:
        """Generate workflow name from candidate."""
        steps = candidate.get('steps', 0)
        frequency = candidate.get('frequency', 0)
        return f"Automated {steps}-Step Workflow (Occurs {frequency}x)"
    
    def _generate_workflow_description(
        self,
        candidate: Dict[str, Any],
        recommendation: Optional[Dict[str, Any]]
    ) -> str:
        """Generate workflow description."""
        
        description = f"This workflow automates a {candidate.get('steps', 0)}-step sequence "
        description += f"that occurs {candidate.get('frequency', 0)} times. "
        
        if recommendation:
            time_saved = recommendation.get('estimated_time_saved', 0)
            if time_saved > 0:
                description += f"Estimated time saved: {time_saved:.1f} minutes per occurrence. "
        
        description += "Generated automatically from your usage patterns."
        
        return description


# Singleton instance
_automation_generator: Optional[AutomationGenerator] = None


def get_automation_generator() -> AutomationGenerator:
    """Get singleton automation generator instance."""
    global _automation_generator
    if _automation_generator is None:
        _automation_generator = AutomationGenerator()
    return _automation_generator
