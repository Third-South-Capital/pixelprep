#!/usr/bin/env python3
"""
PixelPrep Feature Flag Management Script
Manages feature flags for gradual rollout and emergency rollback

Usage:
    python scripts/feature-flag-manager.py --phase 1  # Phase 1 deployment
    python scripts/feature-flag-manager.py --phase 2 --canary-percent 25  # Phase 2 with canary
    python scripts/feature-flag-manager.py --rollback  # Emergency rollback
    python scripts/feature-flag-manager.py --status  # Check current flags
"""

import os
import sys
import json
import argparse
import time
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import requests
from dataclasses import dataclass

@dataclass
class DeploymentPhase:
    """Configuration for each deployment phase"""
    phase: int
    name: str
    features: Dict[str, bool]
    canary_percent: int = 0
    monitoring_duration_minutes: int = 30
    rollback_trigger_error_rate: float = 0.05  # 5% error rate triggers rollback

# Deployment phases configuration
DEPLOYMENT_PHASES = {
    1: DeploymentPhase(
        phase=1,
        name="UX Improvements Only (Phase 1)",
        features={
            "CUSTOM_PRESETS_ENABLED": False,          # Defer custom presets
            "ONBOARDING_ENABLED": True,               # Deploy UX improvements
            "SIZE_PREVIEW_ENABLED": True,             # For existing presets only
            "IMAGE_ANALYSIS_ENABLED": False,          # Defer (custom preset dependency)
            "PROGRESS_INDICATORS_ENABLED": True,      # Deploy UX improvements
            "AUTH_REQUIRED": False,
        },
        monitoring_duration_minutes=30
    ),
    2: DeploymentPhase(
        phase=2,
        name="Custom Presets Beta (Phase 2 - Future)",
        features={
            "CUSTOM_PRESETS_ENABLED": True,           # Enable when issues resolved
            "ONBOARDING_ENABLED": True,
            "SIZE_PREVIEW_ENABLED": True,
            "IMAGE_ANALYSIS_ENABLED": True,           # Enable with custom presets
            "PROGRESS_INDICATORS_ENABLED": True,
            "AUTH_REQUIRED": False,
        },
        canary_percent=5,
        monitoring_duration_minutes=30
    ),
    3: DeploymentPhase(
        phase=3,
        name="Custom Presets Gradual Rollout (Future)",
        features={
            "CUSTOM_PRESETS_ENABLED": True,           # After Phase 2 issues resolved
            "ONBOARDING_ENABLED": True,
            "SIZE_PREVIEW_ENABLED": True,
            "IMAGE_ANALYSIS_ENABLED": True,
            "PROGRESS_INDICATORS_ENABLED": True,
            "AUTH_REQUIRED": False,
        },
        canary_percent=25,
        monitoring_duration_minutes=60
    ),
    4: DeploymentPhase(
        phase=4,
        name="Full v2.1.0 Deployment (Future)",
        features={
            "CUSTOM_PRESETS_ENABLED": True,           # Complete feature set
            "ONBOARDING_ENABLED": True,
            "SIZE_PREVIEW_ENABLED": True,
            "IMAGE_ANALYSIS_ENABLED": True,
            "PROGRESS_INDICATORS_ENABLED": True,
            "AUTH_REQUIRED": False,
        },
        canary_percent=100,
        monitoring_duration_minutes=120
    )
}

ROLLBACK_PHASE = DeploymentPhase(
    phase=0,
    name="Emergency Rollback",
    features={
        "CUSTOM_PRESETS_ENABLED": False,
        "ONBOARDING_ENABLED": False,
        "SIZE_PREVIEW_ENABLED": False,
        "IMAGE_ANALYSIS_ENABLED": False,
        "AUTH_REQUIRED": False,
    },
    canary_percent=0
)

class FeatureFlagManager:
    def __init__(self, render_service_name: str = None, render_api_key: str = None):
        self.render_service_name = render_service_name or os.getenv('RENDER_SERVICE_NAME')
        self.render_api_key = render_api_key or os.getenv('RENDER_API_KEY')
        self.api_url = os.getenv('PIXELPREP_API_URL', 'https://pixelprep.onrender.com')

    def update_render_env_vars(self, env_vars: Dict[str, str]) -> bool:
        """Update environment variables on Render.com"""
        if not self.render_service_name or not self.render_api_key:
            print("⚠️  Render API credentials not configured. Please set manually.")
            self._print_env_vars(env_vars)
            return True

        try:
            headers = {
                'Authorization': f'Bearer {self.render_api_key}',
                'Content-Type': 'application/json'
            }

            # Get current service configuration
            service_url = f"https://api.render.com/v1/services/{self.render_service_name}"
            response = requests.get(service_url, headers=headers)
            response.raise_for_status()

            service_config = response.json()
            current_env_vars = service_config.get('envVars', [])

            # Update environment variables
            for key, value in env_vars.items():
                # Find existing variable or create new one
                existing_var = next((var for var in current_env_vars if var['key'] == key), None)
                if existing_var:
                    existing_var['value'] = value
                else:
                    current_env_vars.append({'key': key, 'value': value})

            # Update service with new environment variables
            update_data = {
                'envVars': current_env_vars
            }

            response = requests.patch(service_url, headers=headers, json=update_data)
            response.raise_for_status()

            print(f"✅ Environment variables updated on Render service: {self.render_service_name}")
            return True

        except requests.RequestException as e:
            print(f"❌ Failed to update Render environment variables: {e}")
            print("Please update manually:")
            self._print_env_vars(env_vars)
            return False

    def _print_env_vars(self, env_vars: Dict[str, str]):
        """Print environment variables for manual configuration"""
        print("\n📋 Environment Variables to Set:")
        print("-" * 50)
        for key, value in env_vars.items():
            print(f"{key}={value}")
        print("-" * 50)

    def check_api_health(self) -> Dict[str, Any]:
        """Check API health and current feature flag status"""
        try:
            response = requests.get(f"{self.api_url}/health", timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            return {"error": str(e), "healthy": False}

    def monitor_deployment(self, phase: DeploymentPhase, duration_minutes: int = None) -> bool:
        """Monitor deployment for specified duration and check for issues"""
        duration = duration_minutes or phase.monitoring_duration_minutes
        print(f"🔍 Monitoring deployment for {duration} minutes...")

        start_time = time.time()
        end_time = start_time + (duration * 60)

        error_count = 0
        total_checks = 0

        while time.time() < end_time:
            health_data = self.check_api_health()
            total_checks += 1

            if not health_data.get("healthy", False):
                error_count += 1
                print(f"⚠️  Health check failed: {health_data.get('error', 'Unknown error')}")

            # Calculate error rate
            error_rate = error_count / total_checks if total_checks > 0 else 0

            # Check if we need to trigger rollback
            if error_rate > phase.rollback_trigger_error_rate and total_checks > 10:
                print(f"🚨 Error rate ({error_rate:.2%}) exceeds threshold ({phase.rollback_trigger_error_rate:.2%})")
                print("Triggering automatic rollback...")
                return False

            print(f"✅ Health check passed. Error rate: {error_rate:.2%} ({error_count}/{total_checks})")
            time.sleep(30)  # Check every 30 seconds

        final_error_rate = error_count / total_checks if total_checks > 0 else 0
        print(f"📊 Monitoring completed. Final error rate: {final_error_rate:.2%}")

        return final_error_rate <= phase.rollback_trigger_error_rate

    def deploy_phase(self, phase_num: int, canary_percent: Optional[int] = None) -> bool:
        """Deploy a specific phase"""
        if phase_num not in DEPLOYMENT_PHASES:
            print(f"❌ Invalid phase: {phase_num}")
            return False

        phase = DEPLOYMENT_PHASES[phase_num]
        if canary_percent is not None:
            phase.canary_percent = canary_percent

        print(f"🚀 Starting Phase {phase.phase}: {phase.name}")
        print(f"📊 Canary percentage: {phase.canary_percent}%")

        # Prepare environment variables
        env_vars = {}
        for key, value in phase.features.items():
            env_vars[key] = str(value).lower()

        # Add canary configuration
        if phase.canary_percent > 0:
            env_vars["CANARY_PERCENT"] = str(phase.canary_percent)
            env_vars["CANARY_ENABLED"] = "true"
        else:
            env_vars["CANARY_ENABLED"] = "false"

        # Add deployment metadata
        env_vars["DEPLOYMENT_PHASE"] = str(phase.phase)
        env_vars["DEPLOYMENT_TIMESTAMP"] = datetime.now(timezone.utc).isoformat()

        # Update environment variables
        if not self.update_render_env_vars(env_vars):
            return False

        # Wait for deployment to complete
        print("⏳ Waiting for deployment to complete...")
        time.sleep(60)  # Give Render time to restart with new config

        # Monitor deployment
        if not self.monitor_deployment(phase):
            print("❌ Deployment monitoring failed. Consider rollback.")
            return False

        print(f"✅ Phase {phase.phase} deployed successfully!")
        return True

    def rollback(self) -> bool:
        """Emergency rollback to safe state"""
        print("🚨 Initiating emergency rollback...")

        env_vars = {}
        for key, value in ROLLBACK_PHASE.features.items():
            env_vars[key] = str(value).lower()

        env_vars["CANARY_ENABLED"] = "false"
        env_vars["DEPLOYMENT_PHASE"] = "0"
        env_vars["ROLLBACK_TIMESTAMP"] = datetime.now(timezone.utc).isoformat()

        if not self.update_render_env_vars(env_vars):
            return False

        print("⏳ Waiting for rollback to complete...")
        time.sleep(60)

        # Verify rollback
        health_data = self.check_api_health()
        if health_data.get("healthy", False):
            print("✅ Rollback completed successfully!")
            return True
        else:
            print(f"❌ Rollback verification failed: {health_data}")
            return False

    def get_status(self) -> Dict[str, Any]:
        """Get current deployment status"""
        health_data = self.check_api_health()

        status = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "api_healthy": health_data.get("healthy", False),
            "api_response": health_data
        }

        # Try to determine current phase based on feature flags
        if "features" in health_data:
            features = health_data["features"]
            for phase_num, phase in DEPLOYMENT_PHASES.items():
                if all(features.get(key) == value for key, value in phase.features.items()):
                    status["current_phase"] = phase_num
                    status["phase_name"] = phase.name
                    break
            else:
                if all(features.get(key) == value for key, value in ROLLBACK_PHASE.features.items()):
                    status["current_phase"] = 0
                    status["phase_name"] = "Rollback State"
                else:
                    status["current_phase"] = "unknown"
                    status["phase_name"] = "Unknown State"

        return status

def main():
    parser = argparse.ArgumentParser(description="PixelPrep Feature Flag Manager")
    parser.add_argument("--phase", type=int, choices=[1, 2, 3, 4],
                       help="Deploy specific phase")
    parser.add_argument("--canary-percent", type=int, default=None,
                       help="Override canary percentage for phase")
    parser.add_argument("--rollback", action="store_true",
                       help="Execute emergency rollback")
    parser.add_argument("--status", action="store_true",
                       help="Check current deployment status")
    parser.add_argument("--render-service", type=str,
                       help="Render service name (or set RENDER_SERVICE_NAME env var)")
    parser.add_argument("--render-api-key", type=str,
                       help="Render API key (or set RENDER_API_KEY env var)")

    args = parser.parse_args()

    # Validate arguments
    if not any([args.phase, args.rollback, args.status]):
        parser.error("Must specify --phase, --rollback, or --status")

    if args.phase and args.rollback:
        parser.error("Cannot specify both --phase and --rollback")

    # Initialize manager
    manager = FeatureFlagManager(
        render_service_name=args.render_service,
        render_api_key=args.render_api_key
    )

    try:
        if args.status:
            status = manager.get_status()
            print(json.dumps(status, indent=2))

        elif args.rollback:
            success = manager.rollback()
            sys.exit(0 if success else 1)

        elif args.phase:
            success = manager.deploy_phase(args.phase, args.canary_percent)
            sys.exit(0 if success else 1)

    except KeyboardInterrupt:
        print("\n⚠️  Operation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()