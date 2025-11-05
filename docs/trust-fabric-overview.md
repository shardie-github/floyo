# Trust Fabric Overview

## What is Trust Fabric?

Trust Fabric is an adaptive AI system that learns your privacy preferences and adjusts Guardian's behavior accordingly. It builds a personalized model of your comfort zones and risk tolerance.

## How It Learns

Trust Fabric learns from:

1. **Your Decisions** - When you allow or deny data access
2. **Privacy Mode Toggles** - How often you enable/disable privacy modes
3. **Disabled Signals** - Which monitoring signals you turn off
4. **Risk Responses** - Your reactions to different risk levels

## Comfort Zones

Trust Fabric tracks your comfort level for each data class:

- **Telemetry** - Usage analytics
- **Location** - Geographic data
- **Audio/Video** - Media access
- **Credentials** - Authentication data
- **Payment** - Financial information
- **Health** - Medical data

## Recommendations

Trust Fabric provides personalized recommendations:

- **Tighter Defaults** - If you frequently deny access
- **Looser Defaults** - If you consistently allow low-risk operations
- **Trust Level** - Suggests optimal trust level (strict/balanced/permissive)

## Export/Import

Your Trust Fabric model is portable:

- **Export** - Download your model as JSON
- **Import** - Restore your model on another device
- **Privacy** - Model stays on your device unless explicitly exported

## Adaptive Risk Weights

Trust Fabric adjusts risk weights based on your behavior:

- Deny high-risk events → Increase weights
- Allow low-risk events → Decrease weights
- Creates personalized risk profile

## Viewing Your Model

Visit `/dashboard/trust` to see:
- Your comfort zones
- Adaptive risk weights
- Recommendations
- Model statistics
