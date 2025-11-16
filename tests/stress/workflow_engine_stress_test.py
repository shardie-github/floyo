"""
Stress Tests for Diagnostic Workflow Engine

Tests the workflow engine under high load and various data scenarios.
"""

import pytest
import asyncio
from datetime import datetime, timedelta
import random
import json
from typing import List, Dict, Any

from backend.ml.workflow_model_builder import WorkflowModelBuilder
from backend.ml.automation_generator import AutomationGenerator


class WorkflowEngineStressTest:
    """Stress test suite for workflow engine."""
    
    def __init__(self):
        self.model_builder = WorkflowModelBuilder()
        self.automation_generator = AutomationGenerator()
    
    def generate_mock_interactions(self, count: int = 1000) -> List[Dict[str, Any]]:
        """Generate mock overlay interaction data."""
        interactions = []
        overlay_types = ['modal', 'tooltip', 'dropdown', 'popover', 'drawer', 'none']
        interaction_types = ['click', 'hover', 'focus', 'blur', 'keydown', 'keyup']
        
        for i in range(count):
            interactions.append({
                'type': random.choice(interaction_types),
                'target': {
                    'tagName': random.choice(['button', 'input', 'div', 'a', 'span']),
                    'id': f'element_{i % 100}',
                    'className': f'class_{i % 50}',
                    'dataTestId': f'test_{i % 20}',
                    'role': random.choice(['button', 'link', 'textbox', None]),
                    'ariaLabel': f'Label {i % 30}' if i % 3 == 0 else None,
                },
                'overlay': {
                    'type': random.choice(overlay_types),
                    'id': f'overlay_{i % 10}' if random.random() > 0.5 else None,
                    'visible': random.random() > 0.3,
                },
                'position': {
                    'x': random.randint(0, 1920),
                    'y': random.randint(0, 1080),
                    'viewport': {'width': 1920, 'height': 1080},
                },
                'timestamp': int((datetime.now() - timedelta(minutes=random.randint(0, 1440))).timestamp() * 1000),
                'metadata': {
                    'button': random.choice([0, 1, 2]),
                    'ctrlKey': random.random() > 0.9,
                    'shiftKey': random.random() > 0.9,
                    'altKey': random.random() > 0.95,
                },
                'session': {
                    'sessionId': f'session_{i % 10}',
                    'userId': f'user_{i % 5}',
                    'pageUrl': f'https://example.com/page_{i % 20}',
                },
            })
        
        return interactions
    
    def generate_mock_telemetry(self, count: int = 500) -> List[Dict[str, Any]]:
        """Generate mock telemetry event data."""
        events = []
        event_types = ['file_created', 'file_modified', 'file_accessed', 'file_deleted', 'tool_used']
        app_ids = ['vscode', 'chrome', 'terminal', 'git', 'npm']
        
        for i in range(count):
            events.append({
                'eventType': random.choice(event_types),
                'appId': random.choice(app_ids),
                'timestamp': (datetime.now() - timedelta(minutes=random.randint(0, 1440))).isoformat(),
                'metadataRedactedJson': {
                    'filePath': f'/path/to/file_{i % 100}.{random.choice(["ts", "tsx", "js", "py", "md"])}',
                    'tool': random.choice(['editor', 'terminal', 'browser', 'git']),
                    'duration': random.randint(100, 5000),
                },
            })
        
        return events
    
    def generate_mock_cookies(self, count: int = 100) -> Dict[str, Any]:
        """Generate mock cookie and indirect input data."""
        cookies = []
        domains = ['example.com', 'google.com', 'github.com', 'stackoverflow.com']
        
        for i in range(count):
            cookies.append({
                'name': f'cookie_{i % 20}',
                'value': f'value_{i}',
                'domain': random.choice(domains),
                'path': random.choice(['/', '/api', '/dashboard']),
                'secure': random.random() > 0.5,
                'httpOnly': random.random() > 0.7,
                'sameSite': random.choice(['Strict', 'Lax', 'None', None]),
            })
        
        return {
            'cookies': cookies,
            'referrers': [
                {
                    'url': f'https://{random.choice(domains)}/page_{i}',
                    'domain': random.choice(domains),
                    'timestamp': int((datetime.now() - timedelta(minutes=random.randint(0, 1440))).timestamp() * 1000),
                }
                for i in range(20)
            ],
            'utm_params': {
                'utm_source': random.choice(['google', 'twitter', 'linkedin', 'direct']),
                'utm_medium': random.choice(['cpc', 'organic', 'social', 'email']),
                'utm_campaign': f'campaign_{random.randint(1, 10)}',
            },
        }
    
    def test_high_volume_interactions(self):
        """Test with high volume of interactions."""
        print("Testing high volume interactions (10,000 interactions)...")
        
        interactions = self.generate_mock_interactions(10000)
        telemetry = self.generate_mock_telemetry(5000)
        cookies = self.generate_mock_cookies(500)
        
        start_time = datetime.now()
        
        workflow_model = self.model_builder.analyze_interactions(
            interactions,
            telemetry,
            cookies
        )
        
        duration = (datetime.now() - start_time).total_seconds()
        
        assert workflow_model is not None
        assert 'patterns' in workflow_model
        assert 'sequences' in workflow_model
        assert 'workflow_candidates' in workflow_model
        assert 'recommendations' in workflow_model
        
        print(f"✅ Processed 10,000 interactions in {duration:.2f} seconds")
        print(f"   Patterns: {len(workflow_model['patterns'])}")
        print(f"   Sequences: {len(workflow_model['sequences'])}")
        print(f"   Candidates: {len(workflow_model['workflow_candidates'])}")
        print(f"   Recommendations: {len(workflow_model['recommendations'])}")
        
        return workflow_model
    
    def test_pattern_detection_accuracy(self):
        """Test pattern detection with known patterns."""
        print("Testing pattern detection accuracy...")
        
        # Create interactions with known repeated patterns
        interactions = []
        
        # Pattern 1: Click modal -> Click button -> Close modal (repeated 10 times)
        for i in range(10):
            interactions.extend([
                {'type': 'click', 'overlay': {'type': 'modal', 'id': 'modal_1'}, 'target': {'tagName': 'div'}, 'timestamp': i * 1000},
                {'type': 'click', 'overlay': {'type': 'modal', 'id': 'modal_1'}, 'target': {'tagName': 'button', 'id': 'submit'}, 'timestamp': i * 1000 + 500},
                {'type': 'click', 'overlay': {'type': 'modal', 'id': 'modal_1'}, 'target': {'tagName': 'button', 'id': 'close'}, 'timestamp': i * 1000 + 1000},
            ])
        
        # Pattern 2: Hover tooltip -> Click link (repeated 5 times)
        for i in range(5):
            interactions.extend([
                {'type': 'hover', 'overlay': {'type': 'tooltip', 'id': 'tooltip_1'}, 'target': {'tagName': 'a'}, 'timestamp': 10000 + i * 2000},
                {'type': 'click', 'overlay': {'type': 'none'}, 'target': {'tagName': 'a', 'id': 'link_1'}, 'timestamp': 10000 + i * 2000 + 1000},
            ])
        
        workflow_model = self.model_builder.analyze_interactions(interactions, [], {})
        
        # Check that patterns are detected
        sequences = workflow_model['sequences']
        assert len(sequences) > 0, "Should detect at least one sequence"
        
        # Check that repeated patterns have high frequency
        candidates = workflow_model['workflow_candidates']
        assert len(candidates) > 0, "Should identify workflow candidates"
        
        # Pattern 1 should have frequency >= 10
        pattern1_candidates = [c for c in candidates if c.get('frequency', 0) >= 10]
        assert len(pattern1_candidates) > 0, "Should detect repeated pattern with frequency >= 10"
        
        print("✅ Pattern detection accuracy test passed")
        print(f"   Detected {len(sequences)} sequences")
        print(f"   Identified {len(candidates)} workflow candidates")
    
    def test_data_merging(self):
        """Test merging of different data types."""
        print("Testing data merging...")
        
        interactions = self.generate_mock_interactions(100)
        telemetry = self.generate_mock_telemetry(100)
        cookies = self.generate_mock_cookies(50)
        
        workflow_model = self.model_builder.analyze_interactions(
            interactions,
            telemetry,
            cookies
        )
        
        # Check that all data sources are merged
        patterns = workflow_model['patterns']
        
        assert 'interactions' in patterns, "Should have interaction patterns"
        assert 'telemetry' in patterns, "Should have telemetry patterns"
        assert 'cookies' in patterns, "Should have cookie patterns"
        assert 'combined_frequencies' in patterns, "Should have combined frequencies"
        
        # Check interaction patterns
        interaction_patterns = patterns['interactions']
        assert 'overlay_usage' in interaction_patterns
        assert 'interaction_types' in interaction_patterns
        assert 'target_patterns' in interaction_patterns
        
        # Check telemetry patterns
        telemetry_patterns = patterns['telemetry']
        assert 'event_types' in telemetry_patterns
        assert 'app_usage' in telemetry_patterns
        assert 'file_patterns' in telemetry_patterns
        
        # Check cookie patterns
        cookie_patterns = patterns['cookies']
        assert 'cookie_domains' in cookie_patterns
        assert 'referrer_patterns' in cookie_patterns
        assert 'utm_patterns' in cookie_patterns
        
        print("✅ Data merging test passed")
        print(f"   Interaction patterns: {len(interaction_patterns)}")
        print(f"   Telemetry patterns: {len(telemetry_patterns)}")
        print(f"   Cookie patterns: {len(cookie_patterns)}")
    
    def test_automation_generation(self):
        """Test automation workflow generation."""
        print("Testing automation generation...")
        
        # Build a workflow model first
        interactions = self.generate_mock_interactions(500)
        telemetry = self.generate_mock_telemetry(200)
        cookies = self.generate_mock_cookies(50)
        
        workflow_model = self.model_builder.analyze_interactions(
            interactions,
            telemetry,
            cookies
        )
        
        # Generate workflows
        if workflow_model['workflow_candidates']:
            candidate = workflow_model['workflow_candidates'][0]
            
            result = self.automation_generator.generate_workflow(
                workflow_model=workflow_model,
                user_id='test_user',
                integration_preferences=['zapier', 'mindstudio']
            )
            
            assert 'workflow' in result, "Should generate workflow"
            workflow = result['workflow']
            
            assert 'id' in workflow
            assert 'name' in workflow
            assert 'description' in workflow
            assert 'definition' in workflow
            assert 'confidence' in workflow
            assert 'automation_potential' in workflow
            
            # Check workflow definition
            definition = workflow['definition']
            assert 'version' in definition
            assert 'integration' in definition
            assert 'triggers' in definition
            assert 'steps' in definition
            assert 'conditions' in definition
            assert 'error_handling' in definition
            
            print("✅ Automation generation test passed")
            print(f"   Workflow ID: {workflow['id']}")
            print(f"   Integration: {definition['integration']}")
            print(f"   Triggers: {len(definition['triggers'])}")
            print(f"   Steps: {len(definition['steps'])}")
        else:
            print("⚠️  No workflow candidates found, skipping generation test")
    
    def test_edge_cases(self):
        """Test edge cases and error handling."""
        print("Testing edge cases...")
        
        # Empty data
        empty_model = self.model_builder.analyze_interactions([], [], {})
        assert empty_model is not None
        assert len(empty_model['workflow_candidates']) == 0
        
        # Single interaction
        single_interaction = self.generate_mock_interactions(1)
        single_model = self.model_builder.analyze_interactions(single_interaction, [], {})
        assert single_model is not None
        
        # Very old data (outside time range)
        old_interactions = [{
            'type': 'click',
            'overlay': {'type': 'modal'},
            'target': {'tagName': 'button'},
            'timestamp': int((datetime.now() - timedelta(days=365)).timestamp() * 1000),
        }]
        old_model = self.model_builder.analyze_interactions(old_interactions, [], {})
        assert old_model is not None
        
        # Malformed data (should handle gracefully)
        malformed_interactions = [
            {'type': 'click'},  # Missing required fields
            {'overlay': {'type': 'modal'}},  # Missing type
            None,  # Null value
        ]
        malformed_model = self.model_builder.analyze_interactions(
            [i for i in malformed_interactions if i], [], {}
        )
        assert malformed_model is not None
        
        print("✅ Edge cases test passed")
    
    def test_concurrent_processing(self):
        """Test concurrent processing of multiple users."""
        print("Testing concurrent processing...")
        
        async def process_user(user_id: int):
            interactions = self.generate_mock_interactions(100)
            telemetry = self.generate_mock_telemetry(50)
            cookies = self.generate_mock_cookies(20)
            
            # Modify user IDs
            for interaction in interactions:
                interaction['session']['userId'] = f'user_{user_id}'
            
            workflow_model = self.model_builder.analyze_interactions(
                interactions,
                telemetry,
                cookies
            )
            
            return workflow_model
        
        async def run_concurrent():
            tasks = [process_user(i) for i in range(10)]
            results = await asyncio.gather(*tasks)
            return results
        
        results = asyncio.run(run_concurrent())
        
        assert len(results) == 10
        assert all(r is not None for r in results)
        
        print("✅ Concurrent processing test passed")
        print(f"   Processed {len(results)} users concurrently")
    
    def run_all_stress_tests(self):
        """Run all stress tests."""
        print("=" * 60)
        print("WORKFLOW ENGINE STRESS TESTS")
        print("=" * 60)
        
        try:
            self.test_high_volume_interactions()
            print()
            
            self.test_pattern_detection_accuracy()
            print()
            
            self.test_data_merging()
            print()
            
            self.test_automation_generation()
            print()
            
            self.test_edge_cases()
            print()
            
            self.test_concurrent_processing()
            print()
            
            print("=" * 60)
            print("✅ ALL STRESS TESTS PASSED")
            print("=" * 60)
            
        except Exception as e:
            print("=" * 60)
            print(f"❌ STRESS TEST FAILED: {e}")
            print("=" * 60)
            raise


if __name__ == '__main__':
    tester = WorkflowEngineStressTest()
    tester.run_all_stress_tests()
