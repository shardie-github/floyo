"""
Workflow Model Builder

Analyzes telemetry, overlay diagnostics, user behaviors, and cookies
to build workflow models for automation generation.
"""

import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import logging

logger = logging.getLogger(__name__)


class WorkflowModelBuilder:
    """
    Builds workflow models from user interactions, telemetry, and behaviors.
    """
    
    def __init__(self):
        self.patterns: Dict[str, Any] = {}
        self.sequences: List[List[Dict[str, Any]]] = []
        self.frequencies: Dict[str, int] = defaultdict(int)
        
    def analyze_interactions(
        self,
        interactions: List[Dict[str, Any]],
        telemetry_events: List[Dict[str, Any]],
        cookie_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Analyze interactions, telemetry, and cookies to build workflow models.
        
        Args:
            interactions: List of overlay/interaction diagnostics
            telemetry_events: List of telemetry events
            cookie_data: Cookie and indirect input data
            
        Returns:
            Workflow model with patterns, sequences, and recommendations
        """
        
        # Extract patterns from interactions
        interaction_patterns = self._extract_interaction_patterns(interactions)
        
        # Extract patterns from telemetry
        telemetry_patterns = self._extract_telemetry_patterns(telemetry_events)
        
        # Extract patterns from cookies/indirect inputs
        cookie_patterns = self._extract_cookie_patterns(cookie_data) if cookie_data else {}
        
        # Combine patterns
        combined_patterns = self._combine_patterns(
            interaction_patterns,
            telemetry_patterns,
            cookie_patterns
        )
        
        # Build sequences
        sequences = self._build_sequences(interactions, telemetry_events)
        
        # Identify workflow candidates
        workflow_candidates = self._identify_workflow_candidates(combined_patterns, sequences)
        
        # Generate automation recommendations
        recommendations = self._generate_automation_recommendations(
            workflow_candidates,
            combined_patterns
        )
        
        return {
            'patterns': combined_patterns,
            'sequences': sequences,
            'workflow_candidates': workflow_candidates,
            'recommendations': recommendations,
            'metadata': {
                'analyzed_at': datetime.utcnow().isoformat(),
                'interaction_count': len(interactions),
                'telemetry_count': len(telemetry_events),
                'pattern_count': len(combined_patterns),
            }
        }
    
    def _extract_interaction_patterns(
        self,
        interactions: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Extract patterns from overlay/interaction diagnostics."""
        
        patterns = {
            'overlay_usage': defaultdict(int),
            'interaction_types': defaultdict(int),
            'target_patterns': defaultdict(int),
            'sequence_patterns': [],
            'temporal_patterns': defaultdict(list),
        }
        
        for interaction in interactions:
            # Overlay usage
            overlay_type = interaction.get('overlay', {}).get('type', 'none')
            patterns['overlay_usage'][overlay_type] += 1
            
            # Interaction types
            interaction_type = interaction.get('type', 'unknown')
            patterns['interaction_types'][interaction_type] += 1
            
            # Target patterns
            target = interaction.get('target', {})
            target_key = f"{target.get('tagName', 'unknown')}:{target.get('role', 'none')}"
            patterns['target_patterns'][target_key] += 1
            
            # Temporal patterns (group by hour)
            timestamp = interaction.get('timestamp', 0)
            hour = datetime.fromtimestamp(timestamp / 1000).hour
            patterns['temporal_patterns'][hour].append(interaction)
        
        # Extract sequence patterns (consecutive interactions)
        for i in range(len(interactions) - 1):
            seq = interactions[i:i+3]  # 3-step sequences
            if len(seq) == 3:
                seq_key = ' -> '.join([
                    f"{s.get('type', 'unknown')}:{s.get('overlay', {}).get('type', 'none')}"
                    for s in seq
                ])
                patterns['sequence_patterns'].append(seq_key)
        
        return patterns
    
    def _extract_telemetry_patterns(
        self,
        telemetry_events: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Extract patterns from telemetry events."""
        
        patterns = {
            'event_types': defaultdict(int),
            'app_usage': defaultdict(int),
            'file_patterns': defaultdict(int),
            'tool_usage': defaultdict(int),
            'performance_patterns': defaultdict(list),
        }
        
        for event in telemetry_events:
            # Event types
            event_type = event.get('eventType', 'unknown')
            patterns['event_types'][event_type] += 1
            
            # App usage
            app_id = event.get('appId', 'unknown')
            patterns['app_usage'][app_id] += 1
            
            # File patterns (from metadata)
            metadata = event.get('metadataRedactedJson', {})
            if isinstance(metadata, dict):
                file_path = metadata.get('target', {}).get('textContent', '')
                if file_path:
                    # Extract file extension
                    if '.' in file_path:
                        ext = file_path.split('.')[-1]
                        patterns['file_patterns'][ext] += 1
            
            # Performance patterns
            duration = event.get('durationMs')
            if duration:
                patterns['performance_patterns'][event_type].append(duration)
        
        return patterns
    
    def _extract_cookie_patterns(
        self,
        cookie_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Extract patterns from cookies and indirect inputs."""
        
        patterns = {
            'cookie_domains': defaultdict(int),
            'cookie_frequency': defaultdict(int),
            'referrer_patterns': defaultdict(int),
            'utm_patterns': defaultdict(int),
        }
        
        cookies = cookie_data.get('cookies', [])
        for cookie in cookies:
            domain = cookie.get('domain', 'unknown')
            name = cookie.get('name', 'unknown')
            patterns['cookie_domains'][domain] += 1
            patterns['cookie_frequency'][name] += 1
        
        # Referrer patterns
        referrers = cookie_data.get('referrers', [])
        for referrer in referrers:
            domain = referrer.get('domain', 'unknown')
            patterns['referrer_patterns'][domain] += 1
        
        # UTM patterns
        utm_params = cookie_data.get('utm_params', {})
        for key, value in utm_params.items():
            patterns['utm_patterns'][f"{key}:{value}"] += 1
        
        return patterns
    
    def _combine_patterns(
        self,
        interaction_patterns: Dict[str, Any],
        telemetry_patterns: Dict[str, Any],
        cookie_patterns: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Combine patterns from all sources."""
        
        return {
            'interactions': interaction_patterns,
            'telemetry': telemetry_patterns,
            'cookies': cookie_patterns,
            'combined_frequencies': {
                **interaction_patterns.get('interaction_types', {}),
                **telemetry_patterns.get('event_types', {}),
            }
        }
    
    def _build_sequences(
        self,
        interactions: List[Dict[str, Any]],
        telemetry_events: List[Dict[str, Any]]
    ) -> List[List[Dict[str, Any]]]:
        """Build workflow sequences from interactions and events."""
        
        sequences = []
        
        # Combine and sort by timestamp
        all_events = []
        for interaction in interactions:
            all_events.append({
                'type': 'interaction',
                'data': interaction,
                'timestamp': interaction.get('timestamp', 0),
            })
        
        for event in telemetry_events:
            all_events.append({
                'type': 'telemetry',
                'data': event,
                'timestamp': self._parse_timestamp(event.get('timestamp')),
            })
        
        # Sort by timestamp
        all_events.sort(key=lambda x: x['timestamp'])
        
        # Extract sequences (grouped by time windows)
        current_sequence = []
        last_timestamp = None
        
        for event in all_events:
            timestamp = event['timestamp']
            
            # If gap > 5 minutes, start new sequence
            if last_timestamp and (timestamp - last_timestamp) > 300000:  # 5 minutes
                if len(current_sequence) >= 2:
                    sequences.append(current_sequence)
                current_sequence = []
            
            current_sequence.append(event)
            last_timestamp = timestamp
        
        # Add final sequence
        if len(current_sequence) >= 2:
            sequences.append(current_sequence)
        
        return sequences
    
    def _parse_timestamp(self, timestamp: Any) -> int:
        """Parse timestamp from various formats."""
        if isinstance(timestamp, str):
            try:
                dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                return int(dt.timestamp() * 1000)
            except:
                return 0
        elif isinstance(timestamp, (int, float)):
            return int(timestamp)
        return 0
    
    def _identify_workflow_candidates(
        self,
        patterns: Dict[str, Any],
        sequences: List[List[Dict[str, Any]]]
    ) -> List[Dict[str, Any]]:
        """Identify potential workflow automation candidates."""
        
        candidates = []
        
        # Find frequently repeated sequences
        sequence_freq = Counter()
        for sequence in sequences:
            seq_key = self._sequence_to_key(sequence)
            sequence_freq[seq_key] += 1
        
        # Get top sequences (appear at least 3 times)
        top_sequences = [
            (seq_key, count)
            for seq_key, count in sequence_freq.items()
            if count >= 3
        ]
        top_sequences.sort(key=lambda x: x[1], reverse=True)
        
        for seq_key, frequency in top_sequences[:10]:  # Top 10
            # Find matching sequences
            matching_sequences = [
                seq for seq in sequences
                if self._sequence_to_key(seq) == seq_key
            ]
            
            if matching_sequences:
                candidate = {
                    'sequence_key': seq_key,
                    'frequency': frequency,
                    'steps': len(matching_sequences[0]),
                    'average_duration': self._calculate_average_duration(matching_sequences),
                    'confidence': min(frequency / 10.0, 1.0),  # Confidence based on frequency
                    'automation_potential': self._assess_automation_potential(matching_sequences[0]),
                }
                candidates.append(candidate)
        
        return candidates
    
    def _sequence_to_key(self, sequence: List[Dict[str, Any]]) -> str:
        """Convert sequence to a key for comparison."""
        keys = []
        for event in sequence:
            if event['type'] == 'interaction':
                interaction = event['data']
                key = f"i:{interaction.get('type', 'unknown')}:{interaction.get('overlay', {}).get('type', 'none')}"
            else:
                telemetry = event['data']
                key = f"t:{telemetry.get('eventType', 'unknown')}:{telemetry.get('appId', 'unknown')}"
            keys.append(key)
        return ' -> '.join(keys)
    
    def _calculate_average_duration(
        self,
        sequences: List[List[Dict[str, Any]]]
    ) -> float:
        """Calculate average duration of sequences."""
        durations = []
        for sequence in sequences:
            if len(sequence) >= 2:
                start = sequence[0]['timestamp']
                end = sequence[-1]['timestamp']
                durations.append(end - start)
        
        return sum(durations) / len(durations) if durations else 0
    
    def _assess_automation_potential(
        self,
        sequence: List[Dict[str, Any]]
    ) -> float:
        """Assess how automatable a sequence is (0.0-1.0)."""
        
        score = 0.0
        factors = 0
        
        # Check for repetitive patterns
        if len(sequence) >= 3:
            # Check if steps are similar
            step_types = [self._get_step_type(s) for s in sequence]
            if len(set(step_types)) < len(step_types) * 0.7:  # 70% similarity
                score += 0.3
            factors += 1
        
        # Check for predictable targets
        targets = []
        for event in sequence:
            if event['type'] == 'interaction':
                target = event['data'].get('target', {})
                target_id = target.get('id') or target.get('dataTestId')
                if target_id:
                    targets.append(target_id)
        
        if len(set(targets)) < len(targets) * 0.5:  # Repeating targets
            score += 0.3
        factors += 1
        
        # Check for timing patterns
        if len(sequence) >= 2:
            timings = []
            for i in range(len(sequence) - 1):
                timings.append(sequence[i+1]['timestamp'] - sequence[i]['timestamp'])
            
            # Check if timings are consistent (within 20% variance)
            if timings:
                avg_timing = sum(timings) / len(timings)
                variance = sum(abs(t - avg_timing) for t in timings) / len(timings)
                if variance < avg_timing * 0.2:
                    score += 0.4
            factors += 1
        
        return score / factors if factors > 0 else 0.0
    
    def _get_step_type(self, event: Dict[str, Any]) -> str:
        """Get step type from event."""
        if event['type'] == 'interaction':
            return event['data'].get('type', 'unknown')
        else:
            return event['data'].get('eventType', 'unknown')
    
    def _generate_automation_recommendations(
        self,
        workflow_candidates: List[Dict[str, Any]],
        patterns: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate automation recommendations from workflow candidates."""
        
        recommendations = []
        
        for candidate in workflow_candidates:
            if candidate['automation_potential'] > 0.5:  # High automation potential
                recommendation = {
                    'type': 'workflow_automation',
                    'title': f"Automate {candidate['steps']}-step workflow",
                    'description': f"This {candidate['steps']}-step sequence occurs {candidate['frequency']} times. Consider automating it.",
                    'confidence': candidate['confidence'],
                    'automation_potential': candidate['automation_potential'],
                    'estimated_time_saved': candidate['average_duration'] * candidate['frequency'] / 1000 / 60,  # minutes
                    'workflow': {
                        'sequence_key': candidate['sequence_key'],
                        'steps': candidate['steps'],
                    },
                    'integration_suggestions': self._suggest_integrations(candidate, patterns),
                }
                recommendations.append(recommendation)
        
        return recommendations
    
    def _suggest_integrations(
        self,
        candidate: Dict[str, Any],
        patterns: Dict[str, Any]
    ) -> List[str]:
        """Suggest integrations for automating a workflow."""
        
        suggestions = []
        
        # Check overlay types used
        interaction_patterns = patterns.get('interactions', {})
        overlay_usage = interaction_patterns.get('overlay_usage', {})
        
        if overlay_usage.get('modal', 0) > 0:
            suggestions.append('zapier')  # Zapier can automate modal interactions
        
        if overlay_usage.get('dropdown', 0) > 0:
            suggestions.append('mindstudio')  # MindStudio can automate dropdown selections
        
        # Check telemetry patterns
        telemetry_patterns = patterns.get('telemetry', {})
        app_usage = telemetry_patterns.get('app_usage', {})
        
        if 'tiktok' in str(app_usage).lower():
            suggestions.append('tiktok-ads')
        
        if 'meta' in str(app_usage).lower() or 'facebook' in str(app_usage).lower():
            suggestions.append('meta-ads')
        
        return list(set(suggestions))  # Remove duplicates


# Singleton instance
_workflow_model_builder: Optional[WorkflowModelBuilder] = None


def get_workflow_model_builder() -> WorkflowModelBuilder:
    """Get singleton workflow model builder instance."""
    global _workflow_model_builder
    if _workflow_model_builder is None:
        _workflow_model_builder = WorkflowModelBuilder()
    return _workflow_model_builder
