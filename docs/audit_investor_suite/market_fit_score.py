#!/usr/bin/env python3
"""
Market Fit Score Calculator
Calculates product-market fit score based on multiple dimensions.
"""

import json
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path


class MarketFitCalculator:
    """Calculate product-market fit score (0-100)."""
    
    def __init__(self):
        self.weights = {
            'retention': 0.25,      # User retention is critical
            'growth': 0.20,        # Growth rate indicates market demand
            'engagement': 0.15,    # Active usage shows value
            'cac_ltv': 0.15,       # Unit economics sustainability
            'conversion': 0.10,    # Funnel efficiency
            'nps': 0.10,           # Customer satisfaction
            'viral_coefficient': 0.05  # Organic growth
        }
    
    def calculate_retention_score(self, data: Dict) -> float:
        """Calculate retention score (0-100).
        
        Benchmarks:
        - Excellent: D7 > 40%, D30 > 20%, D90 > 10%
        - Good: D7 > 25%, D30 > 15%, D90 > 8%
        - Poor: D7 < 20%, D30 < 10%, D90 < 5%
        """
        d7 = data.get('d7_retention', 0)
        d30 = data.get('d30_retention', 0)
        d90 = data.get('d90_retention', 0)
        
        if d7 == 0 and d30 == 0 and d90 == 0:
            return 0  # No data
        
        # Weighted average
        score = (d7 * 0.4 + d30 * 0.4 + d90 * 0.2) * 100
        
        # Cap at 100
        return min(100, score)
    
    def calculate_growth_score(self, data: Dict) -> float:
        """Calculate growth score (0-100).
        
        Benchmarks (MoM growth):
        - Excellent: > 15% MoM
        - Good: 5-15% MoM
        - Poor: < 5% MoM
        """
        mom_growth = data.get('mom_growth', 0)  # Monthly growth rate
        
        if mom_growth == 0:
            return 0
        
        # Scale: 15% MoM = 100 points
        if mom_growth >= 0.15:
            return 100
        elif mom_growth >= 0.05:
            # Linear scale from 5% to 15%
            return 50 + ((mom_growth - 0.05) / 0.10) * 50
        else:
            # Linear scale from 0% to 5%
            return (mom_growth / 0.05) * 50
    
    def calculate_engagement_score(self, data: Dict) -> float:
        """Calculate engagement score (0-100).
        
        Metrics:
        - DAU/MAU ratio (stickiness)
        - Weekly active users
        - Feature adoption rate
        """
        dau_mau = data.get('dau_mau_ratio', 0)  # Daily active / Monthly active
        feature_adoption = data.get('feature_adoption_rate', 0)
        
        if dau_mau == 0 and feature_adoption == 0:
            return 0
        
        # DAU/MAU benchmark: 20% = excellent (100 points)
        dau_score = min(100, (dau_mau / 0.20) * 100) if dau_mau > 0 else 0
        
        # Feature adoption: 50% = excellent
        adoption_score = min(100, (feature_adoption / 0.50) * 100) if feature_adoption > 0 else 0
        
        # Average if both available, otherwise use available one
        if dau_score > 0 and adoption_score > 0:
            return (dau_score * 0.6 + adoption_score * 0.4)
        else:
            return dau_score or adoption_score
    
    def calculate_cac_ltv_score(self, data: Dict) -> float:
        """Calculate CAC:LTV score (0-100).
        
        Benchmarks:
        - Excellent: LTV:CAC > 3:1
        - Good: LTV:CAC 2-3:1
        - Poor: LTV:CAC < 2:1
        - Critical: LTV:CAC < 1:1
        """
        ltv_cac_ratio = data.get('ltv_cac_ratio', 0)
        
        if ltv_cac_ratio == 0:
            return 0
        
        if ltv_cac_ratio >= 3.0:
            return 100
        elif ltv_cac_ratio >= 2.0:
            # Linear from 2:1 to 3:1
            return 60 + ((ltv_cac_ratio - 2.0) / 1.0) * 40
        elif ltv_cac_ratio >= 1.0:
            # Linear from 1:1 to 2:1
            return ((ltv_cac_ratio - 1.0) / 1.0) * 60
        else:
            # Below 1:1 is critical
            return max(0, ltv_cac_ratio * 20)
    
    def calculate_conversion_score(self, data: Dict) -> float:
        """Calculate conversion funnel score (0-100).
        
        Metrics:
        - Signup → Activation rate
        - Activation → Paid conversion (if applicable)
        """
        signup_activation = data.get('signup_to_activation_rate', 0)
        activation_paid = data.get('activation_to_paid_rate', 0)
        
        if signup_activation == 0:
            return 0
        
        # Signup → Activation: 40% = excellent
        activation_score = min(100, (signup_activation / 0.40) * 100)
        
        # Activation → Paid: 10% = excellent (if applicable)
        if activation_paid > 0:
            paid_score = min(100, (activation_paid / 0.10) * 100)
            return (activation_score * 0.6 + paid_score * 0.4)
        
        return activation_score
    
    def calculate_nps_score(self, data: Dict) -> float:
        """Calculate NPS score (0-100).
        
        Benchmarks:
        - Excellent: NPS > 50
        - Good: NPS 30-50
        - Poor: NPS < 30
        """
        nps = data.get('nps', 0)
        
        if nps == 0:
            return 0
        
        # Scale: 50 NPS = 100 points
        if nps >= 50:
            return 100
        elif nps >= 30:
            return 50 + ((nps - 30) / 20) * 50
        else:
            return max(0, (nps / 30) * 50)
    
    def calculate_viral_coefficient_score(self, data: Dict) -> float:
        """Calculate viral coefficient score (0-100).
        
        Benchmarks:
        - Excellent: K > 1.0 (viral)
        - Good: K 0.5-1.0
        - Poor: K < 0.5
        """
        viral_k = data.get('viral_coefficient', 0)
        
        if viral_k == 0:
            return 0
        
        if viral_k >= 1.0:
            return 100
        elif viral_k >= 0.5:
            return 50 + ((viral_k - 0.5) / 0.5) * 50
        else:
            return (viral_k / 0.5) * 50
    
    def calculate_overall_score(self, metrics: Dict) -> Dict[str, Any]:
        """Calculate overall market fit score."""
        scores = {
            'retention': self.calculate_retention_score(metrics),
            'growth': self.calculate_growth_score(metrics),
            'engagement': self.calculate_engagement_score(metrics),
            'cac_ltv': self.calculate_cac_ltv_score(metrics),
            'conversion': self.calculate_conversion_score(metrics),
            'nps': self.calculate_nps_score(metrics),
            'viral_coefficient': self.calculate_viral_coefficient_score(metrics)
        }
        
        # Calculate weighted average
        overall_score = sum(
            scores[dim] * self.weights[dim]
            for dim in scores
        )
        
        return {
            'overall_score': round(overall_score, 2),
            'dimension_scores': scores,
            'weights': self.weights,
            'timestamp': datetime.utcnow().isoformat(),
            'metrics_used': metrics
        }
    
    def estimate_from_benchmarks(self, industry: str = 'saas_middleware') -> Dict:
        """Estimate metrics based on industry benchmarks when actual data unavailable."""
        benchmarks = {
            'saas_middleware': {
                'd7_retention': 0.25,      # 25% D7 retention
                'd30_retention': 0.15,     # 15% D30 retention
                'd90_retention': 0.08,     # 8% D90 retention
                'mom_growth': 0.08,       # 8% MoM growth
                'dau_mau_ratio': 0.15,      # 15% DAU/MAU
                'feature_adoption_rate': 0.30,  # 30% feature adoption
                'ltv_cac_ratio': 2.5,      # 2.5:1 LTV:CAC
                'signup_to_activation_rate': 0.35,  # 35% activation
                'activation_to_paid_rate': 0.08,   # 8% paid conversion
                'nps': 35,                 # 35 NPS
                'viral_coefficient': 0.3   # 0.3 viral coefficient
            }
        }
        
        return benchmarks.get(industry, benchmarks['saas_middleware'])


def main():
    """Calculate market fit score."""
    calculator = MarketFitCalculator()
    
    # Try to load actual metrics, otherwise use benchmarks
    metrics_file = Path('docs/audit_investor_suite/market_fit_metrics.json')
    
    if metrics_file.exists():
        with open(metrics_file, 'r') as f:
            metrics = json.load(f)
    else:
        # Use benchmark estimates
        metrics = calculator.estimate_from_benchmarks()
        print("⚠️  No actual metrics found. Using industry benchmarks.")
        print("   Create market_fit_metrics.json with actual data for accurate scoring.\n")
    
    # Calculate score
    result = calculator.calculate_overall_score(metrics)
    
    # Print results
    print("=" * 60)
    print("MARKET FIT SCORE CALCULATION")
    print("=" * 60)
    print(f"\nOverall Market Fit Score: {result['overall_score']}/100")
    print(f"\nDimension Scores:")
    for dim, score in result['dimension_scores'].items():
        print(f"  {dim.capitalize():20s}: {score:6.2f}/100 (weight: {result['weights'][dim]*100:.0f}%)")
    
    print(f"\nGrade: ", end="")
    if result['overall_score'] >= 90:
        print("A+ (Excellent - Strong Product-Market Fit)")
    elif result['overall_score'] >= 75:
        print("A (Good - Approaching Product-Market Fit)")
    elif result['overall_score'] >= 60:
        print("B (Fair - Needs Improvement)")
    elif result['overall_score'] >= 40:
        print("C (Poor - Significant Gaps)")
    else:
        print("D (Critical - No Market Fit)")
    
    # Save results
    output_file = Path('docs/audit_investor_suite/MARKET_FIT_SCORE.json')
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_file, 'w') as f:
        json.dump(result, f, indent=2)
    
    print(f"\n✅ Results saved to: {output_file}")
    
    return result


if __name__ == '__main__':
    main()
