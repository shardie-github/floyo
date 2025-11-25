"""A/B testing framework for experiments."""

import hashlib
import json
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from database.models import User, Event


class ExperimentFramework:
    """Simple A/B testing framework."""
    
    @staticmethod
    def assign_variant(user_id: str, experiment_name: str, variants: list[str]) -> str:
        """
        Assign user to a variant based on consistent hashing.
        
        Args:
            user_id: User ID
            experiment_name: Name of experiment
            variants: List of variant names (e.g., ['control', 'variant_a'])
        
        Returns:
            Variant name assigned to user
        """
        # Create consistent hash from user_id + experiment_name
        hash_input = f"{user_id}:{experiment_name}"
        hash_value = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)
        
        # Assign to variant based on hash
        variant_index = hash_value % len(variants)
        return variants[variant_index]
    
    @staticmethod
    def track_experiment_event(
        db: Session,
        user_id: str,
        experiment_name: str,
        variant: str,
        event_type: str,
        properties: Optional[Dict[str, Any]] = None
    ):
        """Track an experiment event."""
        event = Event(
            user_id=user_id,
            event_type=f"experiment:{experiment_name}:{variant}:{event_type}",
            properties={
                "experiment_name": experiment_name,
                "variant": variant,
                "event_type": event_type,
                **(properties or {})
            },
            timestamp=datetime.utcnow()
        )
        db.add(event)
        db.commit()
    
    @staticmethod
    def get_experiment_results(
        db: Session,
        experiment_name: str,
        variants: list[str],
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get experiment results.
        
        Returns:
            Dictionary with results for each variant
        """
        start_date = datetime.utcnow() - timedelta(days=days)
        
        results = {}
        for variant in variants:
            # Count users in variant
            users_in_variant = db.query(func.count(func.distinct(Event.user_id))).filter(
                and_(
                    Event.timestamp >= start_date,
                    Event.event_type.like(f"experiment:{experiment_name}:{variant}:%")
                )
            ).scalar() or 0
            
            # Count conversion events
            conversions = db.query(func.count(Event.id)).filter(
                and_(
                    Event.timestamp >= start_date,
                    Event.event_type == f"experiment:{experiment_name}:{variant}:conversion"
                )
            ).scalar() or 0
            
            conversion_rate = (conversions / users_in_variant * 100) if users_in_variant > 0 else 0
            
            results[variant] = {
                "users": users_in_variant,
                "conversions": conversions,
                "conversion_rate": round(conversion_rate, 2)
            }
        
        return {
            "experiment_name": experiment_name,
            "variants": results,
            "period_days": days
        }


# Predefined experiments
EXPERIMENTS = {
    "invite_cta_copy": {
        "name": "Invite CTA Copy Test",
        "variants": ["control", "variant_a"],
        "control": "Invite Friends",
        "variant_a": "Get 1 Month Free",
        "metric": "click_rate"
    },
    "onboarding_flow": {
        "name": "Onboarding Flow Length",
        "variants": ["control", "variant_a"],
        "control": "5 steps",
        "variant_a": "3 steps",
        "metric": "completion_rate"
    },
    "pricing_page": {
        "name": "Pricing Page Badge",
        "variants": ["control", "variant_a"],
        "control": "No badge",
        "variant_a": "Most Popular badge on Pro",
        "metric": "pro_signup_rate"
    }
}


def get_active_experiments() -> list[Dict[str, Any]]:
    """Get list of active experiments."""
    return [
        {
            "name": exp["name"],
            "status": "active",
            "variants": exp["variants"]
        }
        for exp in EXPERIMENTS.values()
    ]
