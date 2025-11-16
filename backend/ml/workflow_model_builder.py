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

from backend.ml.pattern_detector import AdvancedPatternDetector

logger = logging.getLogger(__name__)


class WorkflowModelBuilder:
    """
    Builds workflow models from user interactions, telemetry, and behaviors.
    """
    
    def __init__(self):
        self.patterns: Dict[str, Any] = {}
        self.sequences: List[List[Dict[str, Any]]] = []
        self.frequencies: Dict[str, int] = defaultdict(int)
        self.pattern_detector = AdvancedPatternDetector()
        
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
        
        # Advanced pattern detection
        repetitive_patterns = self.pattern_detector.detect_repetitive_patterns(sequences)
        temporal_patterns = self.pattern_detector.detect_temporal_patterns(interactions, telemetry_events)
        contextual_patterns = self.pattern_detector.detect_contextual_patterns(interactions)
        correlation_patterns = self.pattern_detector.detect_correlation_patterns(
            interactions,
            telemetry_events,
            cookie_data if cookie_data else {}
        )
        
        # Identify workflow candidates
        workflow_candidates = self._identify_workflow_candidates(combined_patterns, sequences)
        
        # Enhance candidates with advanced patterns
        workflow_candidates = self._enhance_candidates_with_patterns(
            workflow_candidates,
            repetitive_patterns,
            temporal_patterns,
            contextual_patterns
        )
        
        # Generate automation recommendations using advanced engine
        from backend.ml.recommendation_engine import get_recommendation_engine
        recommendation_engine = get_recommendation_engine()
        recommendations = recommendation_engine.generate_recommendations(
            workflow_candidates,
            combined_patterns,
            user_preferences=None  # Would come from user profile in production
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
            },
            'advanced_patterns': {
                'repetitive': repetitive_patterns,
                'temporal': temporal_patterns,
                'contextual': contextual_patterns,
                'correlations': correlation_patterns,
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
        """Combine patterns from all sources with advanced merging logic."""
        
        # Merge interaction and telemetry event frequencies
        combined_frequencies = {}
        
        # Add interaction types
        for event_type, count in interaction_patterns.get('interaction_types', {}).items():
            combined_frequencies[f'interaction_{event_type}'] = count
        
        # Add telemetry event types
        for event_type, count in telemetry_patterns.get('event_types', {}).items():
            combined_frequencies[f'telemetry_{event_type}'] = count
        
        # Cross-reference patterns
        cross_references = self._create_cross_references(
            interaction_patterns,
            telemetry_patterns,
            cookie_patterns
        )
        
        # Calculate correlation scores
        correlations = self._calculate_correlations(
            interaction_patterns,
            telemetry_patterns,
            cookie_patterns
        )
        
        return {
            'interactions': interaction_patterns,
            'telemetry': telemetry_patterns,
            'cookies': cookie_patterns,
            'combined_frequencies': combined_frequencies,
            'cross_references': cross_references,
            'correlations': correlations,
            'merged_insights': self._generate_merged_insights(
                interaction_patterns,
                telemetry_patterns,
                cookie_patterns
            ),
        }
    
    def _create_cross_references(
        self,
        interaction_patterns: Dict[str, Any],
        telemetry_patterns: Dict[str, Any],
        cookie_patterns: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create cross-references between different data sources."""
        
        cross_refs = {
            'overlay_to_app': {},
            'interaction_to_file': {},
            'cookie_to_interaction': {},
            'utm_to_behavior': {},
        }
        
        # Map overlay usage to app usage
        overlay_usage = interaction_patterns.get('overlay_usage', {})
        app_usage = telemetry_patterns.get('app_usage', {})
        
        # If modal interactions correlate with specific apps
        if overlay_usage.get('modal', 0) > 0:
            for app, count in app_usage.items():
                if count > 0:
                    cross_refs['overlay_to_app'][f'modal_{app}'] = {
                        'overlay_type': 'modal',
                        'app': app,
                        'correlation_score': min(count / max(overlay_usage.get('modal', 1), 1), 1.0),
                    }
        
        # Map interaction types to file patterns
        interaction_types = interaction_patterns.get('interaction_types', {})
        file_patterns = telemetry_patterns.get('file_patterns', {})
        
        for interaction_type, interaction_count in interaction_types.items():
            for file_ext, file_count in file_patterns.items():
                if interaction_count > 0 and file_count > 0:
                    cross_refs['interaction_to_file'][f'{interaction_type}_{file_ext}'] = {
                        'interaction_type': interaction_type,
                        'file_extension': file_ext,
                        'correlation_score': min(file_count / max(interaction_count, 1), 1.0),
                    }
        
        # Map cookies to interactions
        cookie_domains = cookie_patterns.get('cookie_domains', {})
        for domain, cookie_count in cookie_domains.items():
            if cookie_count > 0:
                total_interactions = sum(interaction_types.values())
                if total_interactions > 0:
                    cross_refs['cookie_to_interaction'][domain] = {
                        'domain': domain,
                        'cookie_count': cookie_count,
                        'interaction_ratio': cookie_count / max(total_interactions, 1),
                    }
        
        # Map UTM params to behaviors
        utm_params = cookie_patterns.get('utm_patterns', {})
        if utm_params:
            cross_refs['utm_to_behavior'] = {
                'utm_params': utm_params,
                'total_interactions': sum(interaction_types.values()),
                'total_telemetry': sum(telemetry_patterns.get('event_types', {}).values()),
            }
        
        return cross_refs
    
    def _calculate_correlations(
        self,
        interaction_patterns: Dict[str, Any],
        telemetry_patterns: Dict[str, Any],
        cookie_patterns: Dict[str, Any]
    ) -> Dict[str, float]:
        """Calculate correlation scores between data sources."""
        
        correlations = {}
        
        # Correlation between overlay usage and app usage
        overlay_count = sum(interaction_patterns.get('overlay_usage', {}).values())
        app_count = sum(telemetry_patterns.get('app_usage', {}).values())
        
        if overlay_count > 0 and app_count > 0:
            correlations['overlay_app'] = min(overlay_count / max(app_count, 1), 1.0)
        
        # Correlation between interaction types and file patterns
        interaction_count = sum(interaction_patterns.get('interaction_types', {}).values())
        file_count = sum(telemetry_patterns.get('file_patterns', {}).values())
        
        if interaction_count > 0 and file_count > 0:
            correlations['interaction_file'] = min(file_count / max(interaction_count, 1), 1.0)
        
        # Correlation between cookies and interactions
        cookie_count = sum(cookie_patterns.get('cookie_domains', {}).values())
        if interaction_count > 0 and cookie_count > 0:
            correlations['cookie_interaction'] = min(cookie_count / max(interaction_count, 1), 1.0)
        
        # Temporal correlation (if data available)
        temporal_interactions = interaction_patterns.get('temporal_patterns', {})
        if temporal_interactions:
            # Check if interactions cluster in specific hours
            hour_counts = [len(events) for events in temporal_interactions.values()]
            if hour_counts:
                max_hour_count = max(hour_counts)
                total_interactions = sum(hour_counts)
                if total_interactions > 0:
                    correlations['temporal_clustering'] = max_hour_count / total_interactions
        
        return correlations
    
    def _generate_merged_insights(
        self,
        interaction_patterns: Dict[str, Any],
        telemetry_patterns: Dict[str, Any],
        cookie_patterns: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate insights from merged patterns."""
        
        insights = []
        
        # Insight: High modal usage
        overlay_usage = interaction_patterns.get('overlay_usage', {})
        if overlay_usage.get('modal', 0) > 10:
            insights.append({
                'type': 'high_modal_usage',
                'severity': 'medium',
                'message': f"High modal usage detected ({overlay_usage.get('modal', 0)} interactions). Consider workflow automation.",
                'recommendation': 'Automate modal interactions with Zapier or MindStudio',
            })
        
        # Insight: File pattern correlation
        file_patterns = telemetry_patterns.get('file_patterns', {})
        if file_patterns:
            top_file = max(file_patterns.items(), key=lambda x: x[1])
            if top_file[1] > 20:
                insights.append({
                    'type': 'file_pattern',
                    'severity': 'low',
                    'message': f"Frequent use of {top_file[0]} files ({top_file[1]} occurrences).",
                    'recommendation': f"Consider tools optimized for {top_file[0]} files",
                })
        
        # Insight: Cookie domain patterns
        cookie_domains = cookie_patterns.get('cookie_domains', {})
        if cookie_domains:
            top_domain = max(cookie_domains.items(), key=lambda x: x[1])
            if top_domain[1] > 5:
                insights.append({
                    'type': 'cookie_domain',
                    'severity': 'low',
                    'message': f"Frequent interactions with {top_domain[0]} ({top_domain[1]} cookies).",
                    'recommendation': f"Consider integration with {top_domain[0]}",
                })
        
        # Insight: Temporal patterns
        temporal_patterns = interaction_patterns.get('temporal_patterns', {})
        if temporal_patterns:
            hour_counts = {h: len(events) for h, events in temporal_patterns.items()}
            if hour_counts:
                peak_hour = max(hour_counts.items(), key=lambda x: x[1])
                if peak_hour[1] > 50:
                    insights.append({
                        'type': 'temporal_pattern',
                        'severity': 'low',
                        'message': f"Peak activity at hour {peak_hour[0]} ({peak_hour[1]} interactions).",
                        'recommendation': f"Schedule automations around hour {peak_hour[0]}",
                    })
        
        return insights
    
    def _build_sequences(
        self,
        interactions: List[Dict[str, Any]],
        telemetry_events: List[Dict[str, Any]]
    ) -> List[List[Dict[str, Any]]]:
        """Build workflow sequences from interactions and events with advanced pattern detection."""
        
        sequences = []
        
        # Combine and sort by timestamp
        all_events = []
        for interaction in interactions:
            if interaction and isinstance(interaction, dict):
                timestamp = interaction.get('timestamp', 0)
                if timestamp > 0:
                    all_events.append({
                        'type': 'interaction',
                        'data': interaction,
                        'timestamp': timestamp,
                    })
        
        for event in telemetry_events:
            if event and isinstance(event, dict):
                timestamp = self._parse_timestamp(event.get('timestamp'))
                if timestamp > 0:
                    all_events.append({
                        'type': 'telemetry',
                        'data': event,
                        'timestamp': timestamp,
                    })
        
        # Sort by timestamp
        all_events.sort(key=lambda x: x['timestamp'])
        
        if not all_events:
            return sequences
        
        # Extract sequences with multiple strategies
        # Strategy 1: Time-based grouping (5 minute windows)
        time_based_sequences = self._extract_time_based_sequences(all_events)
        sequences.extend(time_based_sequences)
        
        # Strategy 2: Context-based grouping (same overlay/app context)
        context_based_sequences = self._extract_context_based_sequences(all_events)
        sequences.extend(context_based_sequences)
        
        # Strategy 3: Pattern-based grouping (repeated patterns)
        pattern_based_sequences = self._extract_pattern_based_sequences(all_events)
        sequences.extend(pattern_based_sequences)
        
        # Remove duplicates and short sequences
        unique_sequences = self._deduplicate_sequences(sequences)
        filtered_sequences = [seq for seq in unique_sequences if len(seq) >= 2]
        
        return filtered_sequences
    
    def _extract_time_based_sequences(self, all_events: List[Dict[str, Any]]) -> List[List[Dict[str, Any]]]:
        """Extract sequences based on time windows."""
        sequences = []
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
    
    def _extract_context_based_sequences(self, all_events: List[Dict[str, Any]]) -> List[List[Dict[str, Any]]]:
        """Extract sequences based on context (overlay/app)."""
        sequences = []
        current_sequence = []
        current_context = None
        
        for event in all_events:
            context = self._get_event_context(event)
            
            # If context changes significantly, start new sequence
            if current_context and context != current_context:
                if len(current_sequence) >= 2:
                    sequences.append(current_sequence)
                current_sequence = []
            
            current_sequence.append(event)
            current_context = context
        
        # Add final sequence
        if len(current_sequence) >= 2:
            sequences.append(current_sequence)
        
        return sequences
    
    def _extract_pattern_based_sequences(self, all_events: List[Dict[str, Any]]) -> List[List[Dict[str, Any]]]:
        """Extract sequences based on repeated patterns."""
        sequences = []
        
        # Look for repeated patterns of length 3-5
        for pattern_length in [3, 4, 5]:
            for i in range(len(all_events) - pattern_length + 1):
                pattern = all_events[i:i + pattern_length]
                
                # Check if this pattern repeats later
                pattern_key = self._sequence_to_key([e for e in pattern])
                
                for j in range(i + pattern_length, len(all_events) - pattern_length + 1):
                    candidate = all_events[j:j + pattern_length]
                    candidate_key = self._sequence_to_key([e for e in candidate])
                    
                    if pattern_key == candidate_key:
                        # Found a repeated pattern
                        sequences.append(pattern)
                        break
        
        return sequences
    
    def _get_event_context(self, event: Dict[str, Any]) -> str:
        """Get context identifier for an event."""
        if event['type'] == 'interaction':
            overlay = event['data'].get('overlay', {})
            return f"overlay_{overlay.get('type', 'none')}"
        else:
            telemetry = event['data']
            return f"app_{telemetry.get('appId', 'unknown')}"
    
    def _deduplicate_sequences(self, sequences: List[List[Dict[str, Any]]]) -> List[List[Dict[str, Any]]]:
        """Remove duplicate sequences."""
        seen = set()
        unique = []
        
        for sequence in sequences:
            seq_key = self._sequence_to_key(sequence)
            if seq_key not in seen:
                seen.add(seq_key)
                unique.append(sequence)
        
        return unique
    
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
            if isinstance(event, dict):
                if event.get('type') == 'interaction':
                    interaction = event.get('data', {})
                    if isinstance(interaction, dict):
                        key = f"i:{interaction.get('type', 'unknown')}:{interaction.get('overlay', {}).get('type', 'none')}"
                    else:
                        key = "i:unknown:none"
                elif event.get('type') == 'telemetry':
                    telemetry = event.get('data', {})
                    if isinstance(telemetry, dict):
                        key = f"t:{telemetry.get('eventType', 'unknown')}:{telemetry.get('appId', 'unknown')}"
                    else:
                        key = "t:unknown:unknown"
                else:
                    # Handle direct interaction/telemetry dicts (for pattern detector)
                    if 'overlay' in event:
                        key = f"i:{event.get('type', 'unknown')}:{event.get('overlay', {}).get('type', 'none')}"
                    elif 'eventType' in event:
                        key = f"t:{event.get('eventType', 'unknown')}:{event.get('appId', 'unknown')}"
                    else:
                        key = "unknown"
                keys.append(key)
        return ' -> '.join(keys) if keys else 'empty'
    
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
        """Assess how automatable a sequence is (0.0-1.0) with advanced scoring."""
        
        score = 0.0
        factors = 0
        weights = []
        
        # Factor 1: Repetitive patterns (weight: 0.25)
        if len(sequence) >= 3:
            step_types = [self._get_step_type(s) for s in sequence]
            uniqueness_ratio = len(set(step_types)) / len(step_types)
            pattern_score = (1.0 - uniqueness_ratio) * 0.25  # Lower uniqueness = higher score
            score += pattern_score
            weights.append(0.25)
            factors += 1
        
        # Factor 2: Predictable targets (weight: 0.25)
        targets = []
        for event in sequence:
            if event['type'] == 'interaction':
                target = event['data'].get('target', {})
                target_id = target.get('id') or target.get('dataTestId') or target.get('ariaLabel')
                if target_id:
                    targets.append(target_id)
        
        if targets:
            target_uniqueness = len(set(targets)) / len(targets)
            target_score = (1.0 - target_uniqueness) * 0.25
            score += target_score
            weights.append(0.25)
            factors += 1
        
        # Factor 3: Timing consistency (weight: 0.20)
        if len(sequence) >= 2:
            timings = []
            for i in range(len(sequence) - 1):
                timings.append(sequence[i+1]['timestamp'] - sequence[i]['timestamp'])
            
            if timings and all(t > 0 for t in timings):
                avg_timing = sum(timings) / len(timings)
                variance = sum(abs(t - avg_timing) for t in timings) / len(timings)
                consistency_score = max(0, 1.0 - (variance / max(avg_timing, 1))) * 0.20
                score += consistency_score
                weights.append(0.20)
                factors += 1
        
        # Factor 4: Overlay context consistency (weight: 0.15)
        overlay_types = []
        for event in sequence:
            if event['type'] == 'interaction':
                overlay = event['data'].get('overlay', {})
                overlay_types.append(overlay.get('type', 'none'))
        
        if overlay_types:
            overlay_consistency = len(set(overlay_types)) / len(overlay_types)
            overlay_score = (1.0 - overlay_consistency) * 0.15
            score += overlay_score
            weights.append(0.15)
            factors += 1
        
        # Factor 5: Action predictability (weight: 0.15)
        action_types = []
        for event in sequence:
            if event['type'] == 'interaction':
                action_types.append(event['data'].get('type', 'unknown'))
            else:
                action_types.append(event['data'].get('eventType', 'unknown'))
        
        if action_types:
            action_predictability = 1.0 - (len(set(action_types)) / len(action_types))
            action_score = action_predictability * 0.15
            score += action_score
            weights.append(0.15)
            factors += 1
        
        # Normalize by total weight
        total_weight = sum(weights) if weights else 1.0
        normalized_score = score / total_weight if total_weight > 0 else 0.0
        
        # Boost score for longer sequences (if they meet other criteria)
        if len(sequence) >= 5 and normalized_score > 0.5:
            normalized_score = min(1.0, normalized_score * 1.1)
        
        return min(1.0, max(0.0, normalized_score))
    
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
    
    def _enhance_candidates_with_patterns(
        self,
        candidates: List[Dict[str, Any]],
        repetitive_patterns: List[Dict[str, Any]],
        temporal_patterns: Dict[str, Any],
        contextual_patterns: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Enhance workflow candidates with advanced pattern information."""
        
        enhanced_candidates = []
        
        for candidate in candidates:
            enhanced = candidate.copy()
            
            # Add repetitive pattern info
            seq_key = candidate.get('sequence_key', '')
            matching_pattern = next(
                (p for p in repetitive_patterns if p.get('sequence_key') == seq_key),
                None
            )
            
            if matching_pattern:
                enhanced['consistency_score'] = matching_pattern.get('consistency_score', 0)
                enhanced['temporal_info'] = matching_pattern.get('temporal_pattern', {})
            
            # Add temporal pattern info
            peak_hour = temporal_patterns.get('peak_hours', {}).get('interactions')
            if peak_hour is not None:
                enhanced['peak_hour'] = peak_hour
            
            # Add contextual pattern info
            overlay_patterns = contextual_patterns.get('by_overlay', {})
            if overlay_patterns:
                enhanced['overlay_context'] = overlay_patterns
            
            enhanced_candidates.append(enhanced)
        
        return enhanced_candidates
    
    def _suggest_integrations(
        self,
        candidate: Dict[str, Any],
        patterns: Dict[str, Any]
    ) -> List[str]:
        """Suggest integrations for automating a workflow with enhanced logic."""
        
        suggestions = []
        scores = {}  # Integration scores
        
        # Check overlay types used
        interaction_patterns = patterns.get('interactions', {})
        overlay_usage = interaction_patterns.get('overlay_usage', {})
        
        # Zapier scoring
        zapier_score = 0
        if overlay_usage.get('modal', 0) > 0:
            zapier_score += 0.4
        if overlay_usage.get('dropdown', 0) > 0:
            zapier_score += 0.3
        if overlay_usage.get('tooltip', 0) > 0:
            zapier_score += 0.1
        scores['zapier'] = zapier_score
        
        # MindStudio scoring
        mindstudio_score = 0
        if overlay_usage.get('dropdown', 0) > 0:
            mindstudio_score += 0.5
        if overlay_usage.get('modal', 0) > 0:
            mindstudio_score += 0.3
        # Check for complex patterns
        if candidate.get('steps', 0) > 5:
            mindstudio_score += 0.2
        scores['mindstudio'] = mindstudio_score
        
        # Check telemetry patterns
        telemetry_patterns = patterns.get('telemetry', {})
        app_usage = telemetry_patterns.get('app_usage', {})
        
        # TikTok Ads scoring
        tiktok_score = 0
        app_usage_str = str(app_usage).lower()
        if 'tiktok' in app_usage_str:
            tiktok_score += 0.8
        if 'ads' in app_usage_str:
            tiktok_score += 0.2
        scores['tiktok-ads'] = tiktok_score
        
        # Meta Ads scoring
        meta_score = 0
        if 'meta' in app_usage_str or 'facebook' in app_usage_str:
            meta_score += 0.8
        if 'instagram' in app_usage_str:
            meta_score += 0.5
        if 'ads' in app_usage_str:
            meta_score += 0.2
        scores['meta-ads'] = meta_score
        
        # Select top integrations (score > 0.3)
        for integration, score in scores.items():
            if score > 0.3:
                suggestions.append(integration)
        
        # Sort by score
        suggestions.sort(key=lambda x: scores.get(x, 0), reverse=True)
        
        # Default to Zapier if no suggestions
        if not suggestions and zapier_score > 0:
            suggestions.append('zapier')
        
        return suggestions


# Singleton instance
_workflow_model_builder: Optional[WorkflowModelBuilder] = None


def get_workflow_model_builder() -> WorkflowModelBuilder:
    """Get singleton workflow model builder instance."""
    global _workflow_model_builder
    if _workflow_model_builder is None:
        _workflow_model_builder = WorkflowModelBuilder()
    return _workflow_model_builder
