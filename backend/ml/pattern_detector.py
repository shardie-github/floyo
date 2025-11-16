"""
Advanced Pattern Detection

Enhanced pattern detection algorithms for workflow automation.
"""

from typing import List, Dict, Any, Tuple
from collections import defaultdict, Counter
from datetime import datetime, timedelta
import statistics


class AdvancedPatternDetector:
    """Advanced pattern detection for workflow automation."""
    
    def detect_repetitive_patterns(
        self,
        sequences: List[List[Dict[str, Any]]],
        min_frequency: int = 3
    ) -> List[Dict[str, Any]]:
        """Detect repetitive patterns in sequences."""
        
        # Count sequence frequencies
        sequence_freq = Counter()
        for sequence in sequences:
            seq_key = self._sequence_to_key(sequence)
            sequence_freq[seq_key] += 1
        
        # Find frequent patterns
        patterns = []
        for seq_key, frequency in sequence_freq.items():
            if frequency >= min_frequency:
                # Find matching sequences
                matching_sequences = [
                    seq for seq in sequences
                    if self._sequence_to_key(seq) == seq_key
                ]
                
                if matching_sequences:
                    pattern = {
                        'sequence_key': seq_key,
                        'frequency': frequency,
                        'sequences': matching_sequences,
                        'steps': len(matching_sequences[0]),
                        'consistency_score': self._calculate_consistency(matching_sequences),
                        'temporal_pattern': self._detect_temporal_pattern(matching_sequences),
                    }
                    patterns.append(pattern)
        
        return sorted(patterns, key=lambda p: p['frequency'], reverse=True)
    
    def detect_temporal_patterns(
        self,
        interactions: List[Dict[str, Any]],
        telemetry_events: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Detect temporal patterns in interactions and events."""
        
        # Group by hour of day
        hourly_interactions = defaultdict(list)
        hourly_telemetry = defaultdict(list)
        
        for interaction in interactions:
            timestamp = interaction.get('timestamp', 0)
            if timestamp > 0:
                hour = datetime.fromtimestamp(timestamp / 1000).hour
                hourly_interactions[hour].append(interaction)
        
        for event in telemetry_events:
            timestamp = self._parse_timestamp(event.get('timestamp'))
            if timestamp > 0:
                hour = datetime.fromtimestamp(timestamp / 1000).hour
                hourly_telemetry[hour].append(event)
        
        # Find peak hours
        peak_interaction_hour = max(hourly_interactions.items(), key=lambda x: len(x[1]))[0] if hourly_interactions else None
        peak_telemetry_hour = max(hourly_telemetry.items(), key=lambda x: len(x[1]))[0] if hourly_telemetry else None
        
        # Detect day-of-week patterns
        day_interactions = defaultdict(list)
        day_telemetry = defaultdict(list)
        
        for interaction in interactions:
            timestamp = interaction.get('timestamp', 0)
            if timestamp > 0:
                day = datetime.fromtimestamp(timestamp / 1000).strftime('%A')
                day_interactions[day].append(interaction)
        
        for event in telemetry_events:
            timestamp = self._parse_timestamp(event.get('timestamp'))
            if timestamp > 0:
                day = datetime.fromtimestamp(timestamp / 1000).strftime('%A')
                day_telemetry[day].append(event)
        
        peak_day = max(day_interactions.items(), key=lambda x: len(x[1]))[0] if day_interactions else None
        
        return {
            'peak_hours': {
                'interactions': peak_interaction_hour,
                'telemetry': peak_telemetry_hour,
            },
            'peak_days': {
                'interactions': peak_day,
            },
            'hourly_distribution': {
                hour: len(events) for hour, events in hourly_interactions.items()
            },
            'daily_distribution': {
                day: len(events) for day, events in day_interactions.items()
            },
        }
    
    def detect_contextual_patterns(
        self,
        interactions: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Detect contextual patterns (overlay, page, user context)."""
        
        # Patterns by overlay type
        overlay_patterns = defaultdict(list)
        for interaction in interactions:
            overlay = interaction.get('overlay', {})
            overlay_type = overlay.get('type', 'none')
            overlay_patterns[overlay_type].append(interaction)
        
        # Patterns by page
        page_patterns = defaultdict(list)
        for interaction in interactions:
            session = interaction.get('session', {})
            page_url = session.get('pageUrl', 'unknown')
            page_patterns[page_url].append(interaction)
        
        # Patterns by target type
        target_patterns = defaultdict(list)
        for interaction in interactions:
            target = interaction.get('target', {})
            target_type = f"{target.get('tagName', 'unknown')}:{target.get('role', 'none')}"
            target_patterns[target_type].append(interaction)
        
        return {
            'by_overlay': {
                overlay_type: {
                    'count': len(interactions),
                    'interaction_types': Counter(i.get('type') for i in interactions),
                }
                for overlay_type, interactions in overlay_patterns.items()
            },
            'by_page': {
                page: {
                    'count': len(interactions),
                    'overlay_types': Counter(
                        i.get('overlay', {}).get('type', 'none')
                        for i in interactions
                    ),
                }
                for page, interactions in page_patterns.items()
            },
            'by_target': {
                target_type: len(interactions)
                for target_type, interactions in target_patterns.items()
            },
        }
    
    def detect_correlation_patterns(
        self,
        interactions: List[Dict[str, Any]],
        telemetry_events: List[Dict[str, Any]],
        cookie_data: Dict[str, Any]
    ) -> Dict[str, float]:
        """Detect correlation patterns between data sources."""
        
        correlations = {}
        
        # Correlation: Overlay interactions and telemetry events
        overlay_interaction_count = sum(
            1 for i in interactions
            if i.get('overlay', {}).get('type', 'none') != 'none'
        )
        telemetry_count = len(telemetry_events)
        
        if overlay_interaction_count > 0 and telemetry_count > 0:
            correlations['overlay_telemetry'] = min(
                overlay_interaction_count / max(telemetry_count, 1),
                1.0
            )
        
        # Correlation: Cookie domains and interactions
        cookie_count = len(cookie_data.get('cookies', []))
        interaction_count = len(interactions)
        
        if cookie_count > 0 and interaction_count > 0:
            correlations['cookie_interaction'] = min(
                cookie_count / max(interaction_count, 1),
                1.0
            )
        
        # Correlation: UTM parameters and behavior
        utm_params = cookie_data.get('utm_params', {})
        if utm_params:
            # Check if UTM params correlate with specific interaction types
            utm_source = utm_params.get('utm_source', '')
            if utm_source:
                source_interactions = [
                    i for i in interactions
                    if utm_source.lower() in i.get('session', {}).get('referrer', '').lower()
                ]
                if source_interactions:
                    correlations['utm_behavior'] = len(source_interactions) / max(interaction_count, 1)
        
        return correlations
    
    def _sequence_to_key(self, sequence: List[Dict[str, Any]]) -> str:
        """Convert sequence to key for comparison."""
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
                    # Handle direct interaction/telemetry dicts
                    if 'overlay' in event:
                        key = f"i:{event.get('type', 'unknown')}:{event.get('overlay', {}).get('type', 'none')}"
                    elif 'eventType' in event:
                        key = f"t:{event.get('eventType', 'unknown')}:{event.get('appId', 'unknown')}"
                    else:
                        key = "unknown"
                keys.append(key)
        return ' -> '.join(keys) if keys else 'empty'
    
    def _calculate_consistency(
        self,
        sequences: List[List[Dict[str, Any]]]
    ) -> float:
        """Calculate consistency score for sequences."""
        
        if len(sequences) < 2:
            return 1.0
        
        # Check step count consistency
        step_counts = [len(seq) for seq in sequences]
        if len(set(step_counts)) == 1:
            step_consistency = 1.0
        else:
            step_consistency = 1.0 - (statistics.stdev(step_counts) / statistics.mean(step_counts))
        
        # Check timing consistency
        timings = []
        for sequence in sequences:
            if len(sequence) >= 2:
                duration = sequence[-1].get('timestamp', 0) - sequence[0].get('timestamp', 0)
                timings.append(duration)
        
        if timings and len(timings) > 1:
            timing_consistency = 1.0 - (statistics.stdev(timings) / max(statistics.mean(timings), 1))
        else:
            timing_consistency = 1.0
        
        return (step_consistency + timing_consistency) / 2.0
    
    def _detect_temporal_pattern(
        self,
        sequences: List[List[Dict[str, Any]]]
    ) -> Dict[str, Any]:
        """Detect temporal patterns in sequences."""
        
        if not sequences:
            return {}
        
        # Extract timestamps
        timestamps = []
        for sequence in sequences:
            if sequence:
                timestamps.append(sequence[0].get('timestamp', 0))
        
        if not timestamps:
            return {}
        
        # Group by hour
        hours = [
            datetime.fromtimestamp(ts / 1000).hour
            for ts in timestamps if ts > 0
        ]
        
        if not hours:
            return {}
        
        hour_counts = Counter(hours)
        peak_hour = max(hour_counts.items(), key=lambda x: x[1])[0] if hour_counts else None
        
        return {
            'peak_hour': peak_hour,
            'hour_distribution': dict(hour_counts),
            'total_occurrences': len(sequences),
        }
    
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
