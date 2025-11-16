"""
Architecture Validation Tests

Validates the complete diagnostic workflow automation architecture end-to-end.
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Any

from backend.ml.workflow_model_builder import get_workflow_model_builder
from backend.ml.automation_generator import get_automation_generator


class ArchitectureValidator:
    """Validates the complete workflow automation architecture."""
    
    def __init__(self):
        self.model_builder = get_workflow_model_builder()
        self.automation_generator = get_automation_generator()
        self.gaps_found = []
    
    def validate_data_flow(self):
        """Validate end-to-end data flow."""
        print("Validating data flow...")
        
        # Step 1: Generate test data
        interactions = self._generate_test_interactions(100)
        telemetry = self._generate_test_telemetry(50)
        cookies = self._generate_test_cookies(20)
        
        # Step 2: Build model
        try:
            workflow_model = self.model_builder.analyze_interactions(
                interactions,
                telemetry,
                cookies
            )
            
            assert workflow_model is not None, "Workflow model should be created"
            assert 'patterns' in workflow_model, "Model should have patterns"
            assert 'sequences' in workflow_model, "Model should have sequences"
            assert 'workflow_candidates' in workflow_model, "Model should have candidates"
            assert 'recommendations' in workflow_model, "Model should have recommendations"
            
            print("✅ Data flow validation passed")
            return workflow_model
            
        except Exception as e:
            self.gaps_found.append({
                'component': 'data_flow',
                'issue': f'Failed to build workflow model: {str(e)}',
                'severity': 'high',
            })
            raise
    
    def validate_pattern_detection(self, workflow_model: Dict[str, Any]):
        """Validate pattern detection."""
        print("Validating pattern detection...")
        
        patterns = workflow_model.get('patterns', {})
        
        # Check interaction patterns
        if 'interactions' not in patterns:
            self.gaps_found.append({
                'component': 'pattern_detection',
                'issue': 'Missing interaction patterns',
                'severity': 'high',
            })
        
        # Check telemetry patterns
        if 'telemetry' not in patterns:
            self.gaps_found.append({
                'component': 'pattern_detection',
                'issue': 'Missing telemetry patterns',
                'severity': 'high',
            })
        
        # Check cookie patterns
        if 'cookies' not in patterns:
            self.gaps_found.append({
                'component': 'pattern_detection',
                'issue': 'Missing cookie patterns',
                'severity': 'medium',
            })
        
        # Check merged insights
        if 'merged_insights' not in patterns:
            self.gaps_found.append({
                'component': 'pattern_detection',
                'issue': 'Missing merged insights',
                'severity': 'medium',
            })
        
        # Check cross-references
        if 'cross_references' not in patterns:
            self.gaps_found.append({
                'component': 'pattern_detection',
                'issue': 'Missing cross-references',
                'severity': 'low',
            })
        
        # Check correlations
        if 'correlations' not in patterns:
            self.gaps_found.append({
                'component': 'pattern_detection',
                'issue': 'Missing correlations',
                'severity': 'low',
            })
        
        if not self.gaps_found:
            print("✅ Pattern detection validation passed")
    
    def validate_sequence_building(self, workflow_model: Dict[str, Any]):
        """Validate sequence building."""
        print("Validating sequence building...")
        
        sequences = workflow_model.get('sequences', [])
        
        if not sequences:
            self.gaps_found.append({
                'component': 'sequence_building',
                'issue': 'No sequences generated',
                'severity': 'medium',
            })
            return
        
        # Validate sequence structure
        for i, sequence in enumerate(sequences):
            if not isinstance(sequence, list):
                self.gaps_found.append({
                    'component': 'sequence_building',
                    'issue': f'Sequence {i} is not a list',
                    'severity': 'high',
                })
                continue
            
            if len(sequence) < 2:
                self.gaps_found.append({
                    'component': 'sequence_building',
                    'issue': f'Sequence {i} has less than 2 events',
                    'severity': 'medium',
                })
                continue
            
            # Validate sequence events
            for j, event in enumerate(sequence):
                if 'type' not in event:
                    self.gaps_found.append({
                        'component': 'sequence_building',
                        'issue': f'Sequence {i}, event {j} missing type',
                        'severity': 'high',
                    })
                
                if 'data' not in event:
                    self.gaps_found.append({
                        'component': 'sequence_building',
                        'issue': f'Sequence {i}, event {j} missing data',
                        'severity': 'high',
                    })
                
                if 'timestamp' not in event:
                    self.gaps_found.append({
                        'component': 'sequence_building',
                        'issue': f'Sequence {i}, event {j} missing timestamp',
                        'severity': 'medium',
                    })
        
        if not any(g['component'] == 'sequence_building' for g in self.gaps_found):
            print("✅ Sequence building validation passed")
    
    def validate_workflow_candidates(self, workflow_model: Dict[str, Any]):
        """Validate workflow candidate identification."""
        print("Validating workflow candidates...")
        
        candidates = workflow_model.get('workflow_candidates', [])
        
        if not candidates:
            self.gaps_found.append({
                'component': 'workflow_candidates',
                'issue': 'No workflow candidates identified',
                'severity': 'low',  # May be normal if no patterns found
            })
            return
        
        # Validate candidate structure
        required_fields = ['sequence_key', 'frequency', 'steps', 'confidence', 'automation_potential']
        
        for i, candidate in enumerate(candidates):
            for field in required_fields:
                if field not in candidate:
                    self.gaps_found.append({
                        'component': 'workflow_candidates',
                        'issue': f'Candidate {i} missing field: {field}',
                        'severity': 'high',
                    })
            
            # Validate field types and ranges
            if 'frequency' in candidate and not isinstance(candidate['frequency'], int):
                self.gaps_found.append({
                    'component': 'workflow_candidates',
                    'issue': f'Candidate {i} frequency is not an integer',
                    'severity': 'high',
                })
            
            if 'confidence' in candidate:
                conf = candidate['confidence']
                if not isinstance(conf, (int, float)) or conf < 0 or conf > 1:
                    self.gaps_found.append({
                        'component': 'workflow_candidates',
                        'issue': f'Candidate {i} confidence out of range [0, 1]',
                        'severity': 'high',
                    })
            
            if 'automation_potential' in candidate:
                pot = candidate['automation_potential']
                if not isinstance(pot, (int, float)) or pot < 0 or pot > 1:
                    self.gaps_found.append({
                        'component': 'workflow_candidates',
                        'issue': f'Candidate {i} automation_potential out of range [0, 1]',
                        'severity': 'high',
                    })
        
        if not any(g['component'] == 'workflow_candidates' for g in self.gaps_found):
            print("✅ Workflow candidates validation passed")
    
    def validate_automation_generation(self, workflow_model: Dict[str, Any]):
        """Validate automation workflow generation."""
        print("Validating automation generation...")
        
        candidates = workflow_model.get('workflow_candidates', [])
        
        if not candidates:
            print("⚠️  No candidates available for automation generation test")
            return
        
        # Test generation for top candidate
        top_candidate = max(
            candidates,
            key=lambda c: c.get('automation_potential', 0) * c.get('confidence', 0)
        )
        
        try:
            result = self.automation_generator.generate_workflow(
                workflow_model=workflow_model,
                user_id='test_user',
                integration_preferences=['zapier', 'mindstudio']
            )
            
            if 'workflow' not in result:
                self.gaps_found.append({
                    'component': 'automation_generation',
                    'issue': 'Workflow generation did not return workflow',
                    'severity': 'high',
                })
                return
            
            workflow = result['workflow']
            
            # Validate workflow structure
            required_fields = ['id', 'name', 'description', 'definition', 'confidence', 'automation_potential']
            for field in required_fields:
                if field not in workflow:
                    self.gaps_found.append({
                        'component': 'automation_generation',
                        'issue': f'Workflow missing field: {field}',
                        'severity': 'high',
                    })
            
            # Validate workflow definition
            definition = workflow.get('definition', {})
            required_def_fields = ['version', 'integration', 'triggers', 'steps', 'conditions', 'error_handling']
            for field in required_def_fields:
                if field not in definition:
                    self.gaps_found.append({
                        'component': 'automation_generation',
                        'issue': f'Workflow definition missing field: {field}',
                        'severity': 'high',
                    })
            
            # Validate triggers
            triggers = definition.get('triggers', [])
            if not isinstance(triggers, list):
                self.gaps_found.append({
                    'component': 'automation_generation',
                    'issue': 'Triggers is not a list',
                    'severity': 'high',
                })
            
            # Validate steps
            steps = definition.get('steps', [])
            if not isinstance(steps, list):
                self.gaps_found.append({
                    'component': 'automation_generation',
                    'issue': 'Steps is not a list',
                    'severity': 'high',
                })
            
            if not self.gaps_found:
                print("✅ Automation generation validation passed")
                
        except Exception as e:
            self.gaps_found.append({
                'component': 'automation_generation',
                'issue': f'Workflow generation failed: {str(e)}',
                'severity': 'high',
            })
    
    def validate_recommendations(self, workflow_model: Dict[str, Any]):
        """Validate automation recommendations."""
        print("Validating recommendations...")
        
        recommendations = workflow_model.get('recommendations', [])
        
        if not recommendations:
            # This is okay if no high-potential candidates
            print("⚠️  No recommendations generated (may be normal)")
            return
        
        # Validate recommendation structure
        for i, rec in enumerate(recommendations):
            required_fields = ['type', 'title', 'description', 'confidence', 'automation_potential']
            for field in required_fields:
                if field not in rec:
                    self.gaps_found.append({
                        'component': 'recommendations',
                        'issue': f'Recommendation {i} missing field: {field}',
                        'severity': 'medium',
                    })
            
            # Validate confidence and automation_potential
            if 'confidence' in rec:
                conf = rec['confidence']
                if not isinstance(conf, (int, float)) or conf < 0 or conf > 1:
                    self.gaps_found.append({
                        'component': 'recommendations',
                        'issue': f'Recommendation {i} confidence out of range',
                        'severity': 'medium',
                    })
        
        if not any(g['component'] == 'recommendations' for g in self.gaps_found):
            print("✅ Recommendations validation passed")
    
    def validate_integration_support(self):
        """Validate integration support."""
        print("Validating integration support...")
        
        integrations = ['zapier', 'mindstudio', 'tiktok-ads', 'meta-ads']
        
        # Test that integration suggestions work
        test_candidate = {
            'sequence_key': 'test_sequence',
            'frequency': 5,
            'steps': 3,
            'confidence': 0.8,
            'automation_potential': 0.7,
        }
        
        test_patterns = {
            'interactions': {
                'overlay_usage': {'modal': 10, 'dropdown': 5},
            },
            'telemetry': {
                'app_usage': {'tiktok': 5, 'meta': 3},
            },
        }
        
        try:
            recommendations = self.model_builder._generate_automation_recommendations(
                [test_candidate],
                test_patterns
            )
            
            if recommendations:
                for rec in recommendations:
                    suggestions = rec.get('integration_suggestions', [])
                    if suggestions:
                        # Check that suggested integrations are valid
                        for suggestion in suggestions:
                            if suggestion not in integrations:
                                self.gaps_found.append({
                                    'component': 'integration_support',
                                    'issue': f'Unknown integration suggested: {suggestion}',
                                    'severity': 'low',
                                })
            
            print("✅ Integration support validation passed")
            
        except Exception as e:
            self.gaps_found.append({
                'component': 'integration_support',
                'issue': f'Integration support validation failed: {str(e)}',
                'severity': 'medium',
            })
    
    def _generate_test_interactions(self, count: int) -> List[Dict[str, Any]]:
        """Generate test interaction data."""
        interactions = []
        for i in range(count):
            interactions.append({
                'type': 'click' if i % 2 == 0 else 'hover',
                'target': {
                    'tagName': 'button',
                    'id': f'btn_{i % 10}',
                },
                'overlay': {
                    'type': 'modal' if i % 3 == 0 else 'none',
                    'id': f'modal_{i % 5}',
                    'visible': True,
                },
                'timestamp': int((datetime.now() - timedelta(minutes=i)).timestamp() * 1000),
                'session': {
                    'sessionId': 'test_session',
                    'userId': 'test_user',
                    'pageUrl': 'https://example.com/test',
                },
            })
        return interactions
    
    def _generate_test_telemetry(self, count: int) -> List[Dict[str, Any]]:
        """Generate test telemetry data."""
        events = []
        for i in range(count):
            events.append({
                'eventType': 'file_created',
                'appId': 'vscode',
                'timestamp': (datetime.now() - timedelta(minutes=i)).isoformat(),
                'metadataRedactedJson': {
                    'filePath': f'/test/file_{i}.ts',
                },
            })
        return events
    
    def _generate_test_cookies(self, count: int) -> Dict[str, Any]:
        """Generate test cookie data."""
        return {
            'cookies': [
                {
                    'name': f'cookie_{i}',
                    'value': f'value_{i}',
                    'domain': 'example.com',
                    'path': '/',
                    'secure': True,
                }
                for i in range(count)
            ],
            'referrers': [],
            'utm_params': {'utm_source': 'test'},
        }
    
    def run_full_validation(self):
        """Run complete architecture validation."""
        print("=" * 60)
        print("ARCHITECTURE VALIDATION")
        print("=" * 60)
        
        try:
            # Validate data flow
            workflow_model = self.validate_data_flow()
            print()
            
            # Validate pattern detection
            self.validate_pattern_detection(workflow_model)
            print()
            
            # Validate sequence building
            self.validate_sequence_building(workflow_model)
            print()
            
            # Validate workflow candidates
            self.validate_workflow_candidates(workflow_model)
            print()
            
            # Validate automation generation
            self.validate_automation_generation(workflow_model)
            print()
            
            # Validate recommendations
            self.validate_recommendations(workflow_model)
            print()
            
            # Validate integration support
            self.validate_integration_support()
            print()
            
            # Report gaps
            if self.gaps_found:
                print("=" * 60)
                print("GAPS FOUND:")
                print("=" * 60)
                for gap in self.gaps_found:
                    severity_icon = '🔴' if gap['severity'] == 'high' else '🟡' if gap['severity'] == 'medium' else '🟢'
                    print(f"{severity_icon} [{gap['severity'].upper()}] {gap['component']}: {gap['issue']}")
                print()
            else:
                print("=" * 60)
                print("✅ NO GAPS FOUND - ARCHITECTURE VALID")
                print("=" * 60)
            
            return self.gaps_found
            
        except Exception as e:
            print("=" * 60)
            print(f"❌ VALIDATION FAILED: {e}")
            print("=" * 60)
            raise


if __name__ == '__main__':
    validator = ArchitectureValidator()
    gaps = validator.run_full_validation()
