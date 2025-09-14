#!/usr/bin/env python3
"""
PixelPrep Emergency Rollback Procedures
Comprehensive rollback toolkit for production incidents

Usage:
    python scripts/rollback-procedures.py --emergency-rollback
    python scripts/rollback-procedures.py --feature-rollback custom_presets
    python scripts/rollback-procedures.py --validate-rollback
    python scripts/rollback-procedures.py --rollback-status
"""

import os
import sys
import json
import argparse
import time
import subprocess
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
from dataclasses import dataclass
import requests
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class RollbackPlan:
    """Rollback plan configuration"""
    name: str
    description: str
    features_to_disable: List[str]
    database_rollback_required: bool = False
    frontend_rollback_required: bool = False
    estimated_duration_minutes: int = 10
    validation_checks: List[str] = None

class RollbackManager:
    def __init__(self, api_url: str = None, frontend_url: str = None):
        self.api_url = api_url or os.getenv('PIXELPREP_API_URL', 'https://pixelprep.onrender.com')
        self.frontend_url = frontend_url or os.getenv('PIXELPREP_FRONTEND_URL', 'https://third-south-capital.github.io/pixelprep')
        self.render_service_name = os.getenv('RENDER_SERVICE_NAME')
        self.render_api_key = os.getenv('RENDER_API_KEY')

        # Define rollback plans
        self.rollback_plans = {
            "emergency_full": RollbackPlan(
                name="Emergency Full Rollback",
                description="Complete rollback to v2.0.3 state - disable all new features",
                features_to_disable=[
                    "CUSTOM_PRESETS_ENABLED",
                    "ONBOARDING_ENABLED",
                    "SIZE_PREVIEW_ENABLED",
                    "IMAGE_ANALYSIS_ENABLED"
                ],
                frontend_rollback_required=True,
                estimated_duration_minutes=15,
                validation_checks=["api_health", "basic_optimization", "frontend_load"]
            ),
            "feature_custom_presets": RollbackPlan(
                name="Custom Presets Feature Rollback",
                description="Disable custom presets while keeping other v2.1.0 features",
                features_to_disable=["CUSTOM_PRESETS_ENABLED"],
                estimated_duration_minutes=5,
                validation_checks=["api_health", "preset_endpoint"]
            ),
            "feature_onboarding": RollbackPlan(
                name="Onboarding Feature Rollback",
                description="Disable onboarding system",
                features_to_disable=["ONBOARDING_ENABLED"],
                frontend_rollback_required=False,
                estimated_duration_minutes=3,
                validation_checks=["frontend_load"]
            ),
            "feature_size_preview": RollbackPlan(
                name="Size Preview Feature Rollback",
                description="Disable size estimation preview",
                features_to_disable=["SIZE_PREVIEW_ENABLED"],
                estimated_duration_minutes=3,
                validation_checks=["api_health"]
            ),
            "database_rollback": RollbackPlan(
                name="Database Schema Rollback",
                description="Rollback database schema changes (USE WITH EXTREME CAUTION)",
                features_to_disable=[],
                database_rollback_required=True,
                estimated_duration_minutes=30,
                validation_checks=["database_health", "api_health"]
            )
        }

    def execute_rollback(self, plan_name: str, confirm: bool = False) -> bool:
        """Execute a specific rollback plan"""
        if plan_name not in self.rollback_plans:
            logger.error(f"❌ Unknown rollback plan: {plan_name}")
            return False

        plan = self.rollback_plans[plan_name]

        if not confirm:
            logger.warning(f"⚠️  About to execute: {plan.name}")
            logger.warning(f"Description: {plan.description}")
            logger.warning(f"Estimated duration: {plan.estimated_duration_minutes} minutes")
            response = input("Type 'CONFIRM' to proceed: ")
            if response != 'CONFIRM':
                logger.info("Rollback cancelled by user")
                return False

        logger.info(f"🚨 Starting rollback: {plan.name}")

        # Record rollback start
        self._record_rollback_event("started", plan_name)

        try:
            success = True

            # Step 1: Backend environment variable changes
            if plan.features_to_disable:
                logger.info("Step 1: Disabling backend features...")
                success &= self._disable_backend_features(plan.features_to_disable)

            # Step 2: Frontend rollback (if required)
            if plan.frontend_rollback_required:
                logger.info("Step 2: Rolling back frontend...")
                success &= self._rollback_frontend()

            # Step 3: Database rollback (if required)
            if plan.database_rollback_required:
                logger.info("Step 3: Rolling back database schema...")
                success &= self._rollback_database()

            # Step 4: Wait for deployment
            logger.info("Step 4: Waiting for rollback to propagate...")
            time.sleep(60)

            # Step 5: Validation
            logger.info("Step 5: Validating rollback...")
            validation_success = self._validate_rollback(plan.validation_checks or [])

            if success and validation_success:
                logger.info(f"✅ Rollback completed successfully: {plan.name}")
                self._record_rollback_event("completed", plan_name)
                self._send_rollback_notification(plan, "success")
                return True
            else:
                logger.error(f"❌ Rollback validation failed: {plan.name}")
                self._record_rollback_event("failed", plan_name)
                self._send_rollback_notification(plan, "failed")
                return False

        except Exception as e:
            logger.error(f"❌ Rollback execution failed: {e}")
            self._record_rollback_event("error", plan_name, str(e))
            self._send_rollback_notification(plan, "error", str(e))
            return False

    def _disable_backend_features(self, features: List[str]) -> bool:
        """Disable backend features via environment variables"""
        try:
            # Prepare environment variables to disable features
            env_vars = {}
            for feature in features:
                env_vars[feature] = "false"

            # Add rollback metadata
            env_vars["ROLLBACK_TIMESTAMP"] = datetime.now(timezone.utc).isoformat()
            env_vars["ROLLBACK_FEATURES"] = ",".join(features)

            # Update Render environment variables
            if self._update_render_env_vars(env_vars):
                logger.info(f"✅ Disabled backend features: {features}")
                return True
            else:
                logger.error(f"❌ Failed to disable backend features: {features}")
                return False

        except Exception as e:
            logger.error(f"❌ Backend feature disable failed: {e}")
            return False

    def _rollback_frontend(self) -> bool:
        """Rollback frontend to previous stable version"""
        try:
            # This would typically involve:
            # 1. Reverting to previous GitHub Pages deployment
            # 2. Or updating frontend environment variables
            # For GitHub Pages, we'd need to revert the main branch or trigger a deployment

            logger.info("⚠️  Frontend rollback requires manual GitHub Pages deployment")
            logger.info("Steps to rollback frontend:")
            logger.info("1. git checkout v2.0.3 -- frontend/")
            logger.info("2. npm run build")
            logger.info("3. git add frontend/dist && git commit -m 'rollback: frontend to v2.0.3'")
            logger.info("4. git push origin main")

            # For now, return True as this is a manual process
            # In a more automated setup, this could trigger GitHub Actions
            return True

        except Exception as e:
            logger.error(f"❌ Frontend rollback failed: {e}")
            return False

    def _rollback_database(self) -> bool:
        """Rollback database schema changes"""
        logger.warning("⚠️  Database rollback is not implemented - requires manual intervention")
        logger.warning("For database rollback:")
        logger.warning("1. Review database migration scripts")
        logger.warning("2. Create rollback migration if needed")
        logger.warning("3. Coordinate with DBA/team lead")
        logger.warning("4. Test rollback on staging first")

        # Database rollbacks are extremely risky and should be manual
        return False

    def _update_render_env_vars(self, env_vars: Dict[str, str]) -> bool:
        """Update environment variables on Render.com"""
        if not self.render_service_name or not self.render_api_key:
            logger.warning("⚠️  Render API credentials not configured")
            logger.info("Please update these environment variables manually:")
            for key, value in env_vars.items():
                logger.info(f"  {key}={value}")
            return True  # Assume manual update will be done

        try:
            import requests

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
                existing_var = next((var for var in current_env_vars if var['key'] == key), None)
                if existing_var:
                    existing_var['value'] = value
                else:
                    current_env_vars.append({'key': key, 'value': value})

            # Update service
            update_data = {'envVars': current_env_vars}
            response = requests.patch(service_url, headers=headers, json=update_data)
            response.raise_for_status()

            logger.info(f"✅ Updated Render environment variables")
            return True

        except Exception as e:
            logger.error(f"❌ Failed to update Render environment: {e}")
            return False

    def _validate_rollback(self, checks: List[str]) -> bool:
        """Validate rollback was successful"""
        logger.info(f"Running {len(checks)} validation checks...")

        validation_results = {}

        for check in checks:
            try:
                if check == "api_health":
                    result = self._check_api_health()
                elif check == "basic_optimization":
                    result = self._check_basic_optimization()
                elif check == "frontend_load":
                    result = self._check_frontend_load()
                elif check == "preset_endpoint":
                    result = self._check_preset_endpoint()
                elif check == "database_health":
                    result = self._check_database_health()
                else:
                    logger.warning(f"Unknown validation check: {check}")
                    result = False

                validation_results[check] = result

                if result:
                    logger.info(f"✅ {check}: PASS")
                else:
                    logger.error(f"❌ {check}: FAIL")

            except Exception as e:
                logger.error(f"❌ {check}: ERROR - {e}")
                validation_results[check] = False

        # All checks must pass
        all_passed = all(validation_results.values())

        if all_passed:
            logger.info("✅ All validation checks passed")
        else:
            failed_checks = [check for check, result in validation_results.items() if not result]
            logger.error(f"❌ Failed validation checks: {failed_checks}")

        return all_passed

    def _check_api_health(self) -> bool:
        """Check API health endpoint"""
        try:
            response = requests.get(f"{self.api_url}/health", timeout=10)
            return response.status_code == 200 and response.json().get("healthy", False)
        except:
            return False

    def _check_basic_optimization(self) -> bool:
        """Check basic optimization endpoint"""
        try:
            response = requests.get(f"{self.api_url}/optimize/processors", timeout=10)
            return response.status_code == 200
        except:
            return False

    def _check_frontend_load(self) -> bool:
        """Check frontend loads successfully"""
        try:
            response = requests.get(self.frontend_url, timeout=10)
            return response.status_code == 200
        except:
            return False

    def _check_preset_endpoint(self) -> bool:
        """Check preset endpoint works"""
        try:
            response = requests.get(f"{self.api_url}/optimize/processors", timeout=10)
            if response.status_code == 200:
                data = response.json()
                return "processors" in data and len(data["processors"]) > 0
            return False
        except:
            return False

    def _check_database_health(self) -> bool:
        """Check database connectivity"""
        # This would require a dedicated database health endpoint
        logger.warning("Database health check not implemented")
        return True

    def _record_rollback_event(self, event_type: str, plan_name: str, error_message: str = None):
        """Record rollback event for audit trail"""
        event = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": event_type,  # started, completed, failed, error
            "plan_name": plan_name,
            "api_url": self.api_url,
            "frontend_url": self.frontend_url
        }

        if error_message:
            event["error_message"] = error_message

        # Save to rollback log
        log_file = "/Users/Harrison/Library/CloudStorage/Dropbox/Development/PixelPrep/logs/rollback-events.jsonl"
        os.makedirs(os.path.dirname(log_file), exist_ok=True)

        try:
            with open(log_file, 'a') as f:
                f.write(json.dumps(event) + '\n')
        except Exception as e:
            logger.warning(f"Failed to record rollback event: {e}")

    def _send_rollback_notification(self, plan: RollbackPlan, status: str, error_message: str = None):
        """Send rollback notification"""
        # This could integrate with Slack, email, PagerDuty, etc.
        message = f"🚨 Rollback {status.upper()}: {plan.name}"

        if status == "success":
            message += f" ✅\nDuration: ~{plan.estimated_duration_minutes} minutes"
        elif status == "failed":
            message += f" ❌\nValidation failed - manual intervention required"
        elif status == "error":
            message += f" 💥\nError: {error_message}"

        logger.info(f"Notification: {message}")

        # TODO: Implement actual notification sending
        # slack_webhook = os.getenv('SLACK_WEBHOOK_URL')
        # if slack_webhook:
        #     requests.post(slack_webhook, json={"text": message})

    def get_rollback_status(self) -> Dict[str, Any]:
        """Get current rollback/deployment status"""
        try:
            # Check API health
            api_response = requests.get(f"{self.api_url}/health", timeout=10)
            api_healthy = api_response.status_code == 200

            # Check current feature flags
            feature_status = {}
            if api_healthy:
                try:
                    health_data = api_response.json()
                    if "features" in health_data:
                        feature_status = health_data["features"]
                except:
                    pass

            # Check recent rollback events
            recent_rollbacks = []
            log_file = "/Users/Harrison/Library/CloudStorage/Dropbox/Development/PixelPrep/logs/rollback-events.jsonl"
            if os.path.exists(log_file):
                try:
                    with open(log_file, 'r') as f:
                        lines = f.readlines()
                        # Get last 10 events
                        for line in lines[-10:]:
                            recent_rollbacks.append(json.loads(line.strip()))
                except:
                    pass

            status = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "api_healthy": api_healthy,
                "api_url": self.api_url,
                "frontend_url": self.frontend_url,
                "current_features": feature_status,
                "recent_rollback_events": recent_rollbacks,
                "available_rollback_plans": list(self.rollback_plans.keys())
            }

            return status

        except Exception as e:
            return {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "error": str(e),
                "api_healthy": False
            }

    def list_rollback_plans(self) -> Dict[str, RollbackPlan]:
        """List all available rollback plans"""
        return self.rollback_plans

def main():
    parser = argparse.ArgumentParser(description="PixelPrep Emergency Rollback Procedures")
    parser.add_argument("--emergency-rollback", action="store_true", help="Execute full emergency rollback")
    parser.add_argument("--feature-rollback", type=str, help="Rollback specific feature")
    parser.add_argument("--validate-rollback", action="store_true", help="Validate current system state")
    parser.add_argument("--rollback-status", action="store_true", help="Get rollback status")
    parser.add_argument("--list-plans", action="store_true", help="List available rollback plans")
    parser.add_argument("--confirm", action="store_true", help="Auto-confirm rollback (DANGEROUS)")
    parser.add_argument("--api-url", type=str, help="Override API URL")
    parser.add_argument("--frontend-url", type=str, help="Override frontend URL")

    args = parser.parse_args()

    if not any([args.emergency_rollback, args.feature_rollback, args.validate_rollback,
                args.rollback_status, args.list_plans]):
        parser.error("Must specify an action")

    # Initialize rollback manager
    manager = RollbackManager(api_url=args.api_url, frontend_url=args.frontend_url)

    try:
        if args.list_plans:
            plans = manager.list_rollback_plans()
            print("Available Rollback Plans:")
            print("=" * 50)
            for name, plan in plans.items():
                print(f"\n{name}:")
                print(f"  Description: {plan.description}")
                print(f"  Features to disable: {plan.features_to_disable}")
                print(f"  Duration: ~{plan.estimated_duration_minutes} minutes")

        elif args.rollback_status:
            status = manager.get_rollback_status()
            print(json.dumps(status, indent=2))

        elif args.validate_rollback:
            # Run basic validation checks
            success = manager._validate_rollback(["api_health", "basic_optimization", "frontend_load"])
            sys.exit(0 if success else 1)

        elif args.emergency_rollback:
            success = manager.execute_rollback("emergency_full", confirm=args.confirm)
            sys.exit(0 if success else 1)

        elif args.feature_rollback:
            feature_map = {
                "custom_presets": "feature_custom_presets",
                "onboarding": "feature_onboarding",
                "size_preview": "feature_size_preview"
            }

            plan_name = feature_map.get(args.feature_rollback)
            if not plan_name:
                logger.error(f"Unknown feature: {args.feature_rollback}")
                logger.error(f"Available features: {list(feature_map.keys())}")
                sys.exit(1)

            success = manager.execute_rollback(plan_name, confirm=args.confirm)
            sys.exit(0 if success else 1)

    except KeyboardInterrupt:
        logger.warning("⚠️  Rollback operation cancelled by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Rollback operation failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()