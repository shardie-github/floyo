"""Sample data generation for onboarding and testing."""

import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List
from uuid import UUID
from sqlalchemy.orm import Session
import random

from database.models import (
    User, Event, Pattern, Suggestion, Workflow, FileRelationship,
    TemporalPattern
)

logger = logging.getLogger(__name__)


class SampleDataGenerator:
    """Generate sample data for new users."""
    
    @staticmethod
    def generate_sample_events(
        db: Session,
        user_id: UUID,
        count: int = 20
    ) -> List[Event]:
        """Generate sample events."""
        event_types = [
            "file_opened", "file_created", "file_modified", "file_deleted",
            "script_executed", "command_run", "tool_used"
        ]
        
        file_extensions = [".py", ".js", ".ts", ".json", ".md", ".txt", ".csv", ".sql"]
        tools = ["vscode", "vim", "pycharm", "git", "npm", "python", "node"]
        operations = ["read", "write", "execute", "delete"]
        
        events = []
        base_time = datetime.utcnow() - timedelta(days=7)
        
        for i in range(count):
            event_type = random.choice(event_types)
            file_ext = random.choice(file_extensions)
            tool = random.choice(tools)
            operation = random.choice(operations)
            
            event = Event(
                user_id=user_id,
                event_type=event_type,
                file_path=f"/project/src/example{file_ext}",
                tool=tool,
                operation=operation,
                details={
                    "file_size": random.randint(100, 10000),
                    "line_count": random.randint(10, 500) if file_ext in [".py", ".js", ".ts"] else None
                },
                timestamp=base_time + timedelta(hours=i * 2)
            )
            events.append(event)
            db.add(event)
        
        db.commit()
        logger.info(f"Generated {count} sample events for user {user_id}")
        return events
    
    @staticmethod
    def generate_sample_patterns(
        db: Session,
        user_id: UUID,
        events: List[Event]
    ) -> List[Pattern]:
        """Generate sample patterns from events."""
        # Group events by file extension
        pattern_data = {}
        
        for event in events:
            if event.file_path:
                ext = event.file_path.split('.')[-1] if '.' in event.file_path else None
                if ext:
                    if ext not in pattern_data:
                        pattern_data[ext] = {
                            "count": 0,
                            "tools": set(),
                            "last_used": event.timestamp
                        }
                    pattern_data[ext]["count"] += 1
                    if event.tool:
                        pattern_data[ext]["tools"].add(event.tool)
                    if event.timestamp and (not pattern_data[ext]["last_used"] or event.timestamp > pattern_data[ext]["last_used"]):
                        pattern_data[ext]["last_used"] = event.timestamp
        
        patterns = []
        for ext, data in pattern_data.items():
            pattern = Pattern(
                user_id=user_id,
                file_extension=f".{ext}",
                count=data["count"],
                tools=list(data["tools"]),
                last_used=data["last_used"],
                metadata={"generated": True}
            )
            patterns.append(pattern)
            db.add(pattern)
        
        db.commit()
        logger.info(f"Generated {len(patterns)} sample patterns for user {user_id}")
        return patterns
    
    @staticmethod
    def generate_sample_suggestions(
        db: Session,
        user_id: UUID,
        count: int = 5
    ) -> List[Suggestion]:
        """Generate sample integration suggestions."""
        suggestions_data = [
            {
                "trigger": "Python files (.py) opened frequently",
                "tools_involved": ["vscode", "python"],
                "suggested_integration": "GitHub API integration",
                "sample_code": "import requests\n\ndef push_to_github(file_path):\n    # GitHub API integration code\n    pass",
                "reasoning": "You frequently work with Python files. Consider integrating with GitHub for version control automation.",
                "confidence": 0.75
            },
            {
                "trigger": "JSON files created and modified",
                "tools_involved": ["vscode"],
                "suggested_integration": "JSON validation webhook",
                "sample_code": "import json\nfrom flask import Flask\n\napp = Flask(__name__)\n\n@app.route('/validate', methods=['POST'])\n    # JSON validation code\n    pass",
                "reasoning": "You work with JSON files. A validation webhook could help catch errors early.",
                "confidence": 0.65
            },
            {
                "trigger": "Multiple file types in same workflow",
                "tools_involved": ["git", "python", "npm"],
                "suggested_integration": "CI/CD pipeline automation",
                "sample_code": "# GitHub Actions workflow\nname: Auto-deploy\non:\n  push:\n    branches: [main]",
                "reasoning": "Your workflow involves multiple tools. Consider automating with CI/CD.",
                "confidence": 0.70
            },
            {
                "trigger": "Database files (.sql) accessed",
                "tools_involved": ["vscode"],
                "suggested_integration": "Database backup automation",
                "sample_code": "import psycopg2\n\ndef backup_database():\n    # Database backup code\n    pass",
                "reasoning": "You work with SQL files. Automated backups could protect your data.",
                "confidence": 0.80
            },
            {
                "trigger": "Markdown files created",
                "tools_involved": ["vscode"],
                "suggested_integration": "Documentation site generator",
                "sample_code": "import mkdocs\n\n# Generate documentation site\nmkdocs.build()",
                "reasoning": "You create documentation. A documentation site generator could help share it.",
                "confidence": 0.60
            }
        ]
        
        suggestions = []
        for i, data in enumerate(suggestions_data[:count]):
            suggestion = Suggestion(
                user_id=user_id,
                trigger=data["trigger"],
                tools_involved=data.get("tools_involved", []),
                suggested_integration=data["suggested_integration"],
                sample_code=data.get("sample_code"),
                reasoning=data.get("reasoning"),
                confidence=data.get("confidence", 0.5),
                is_dismissed=False,
                is_applied=False
            )
            suggestions.append(suggestion)
            db.add(suggestion)
        
        db.commit()
        logger.info(f"Generated {len(suggestions)} sample suggestions for user {user_id}")
        return suggestions
    
    @staticmethod
    def generate_sample_workflow(
        db: Session,
        user_id: UUID
    ) -> Workflow:
        """Generate a sample workflow."""
        workflow = Workflow(
            user_id=user_id,
            name="Sample: Auto-process JSON files",
            description="Automatically validate and process JSON files when created",
            trigger_config={
                "type": "file_created",
                "file_pattern": "*.json"
            },
            steps=[
                {
                    "type": "validate_json",
                    "action": "validate_file"
                },
                {
                    "type": "notify",
                    "action": "send_notification",
                    "message": "JSON file processed"
                }
            ],
            is_active=False,
            metadata={"generated": True, "sample": True}
        )
        db.add(workflow)
        db.commit()
        logger.info(f"Generated sample workflow for user {user_id}")
        return workflow
    
    @staticmethod
    def generate_all_sample_data(
        db: Session,
        user_id: UUID,
        events_count: int = 20,
        suggestions_count: int = 5
    ) -> Dict[str, Any]:
        """Generate all sample data for a user."""
        try:
            # Generate events
            events = SampleDataGenerator.generate_sample_events(db, user_id, events_count)
            
            # Generate patterns from events
            patterns = SampleDataGenerator.generate_sample_patterns(db, user_id, events)
            
            # Generate suggestions
            suggestions = SampleDataGenerator.generate_sample_suggestions(db, user_id, suggestions_count)
            
            # Generate sample workflow
            workflow = SampleDataGenerator.generate_sample_workflow(db, user_id)
            
            return {
                "success": True,
                "events_generated": len(events),
                "patterns_generated": len(patterns),
                "suggestions_generated": len(suggestions),
                "workflows_generated": 1,
                "message": "Sample data generated successfully"
            }
        except Exception as e:
            logger.error(f"Error generating sample data: {e}")
            db.rollback()
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to generate sample data"
            }
