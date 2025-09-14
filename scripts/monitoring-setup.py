#!/usr/bin/env python3
"""
PixelPrep Monitoring & Observability Setup Script
Configures monitoring dashboards, alerts, and health checks

Usage:
    python scripts/monitoring-setup.py --setup-all
    python scripts/monitoring-setup.py --setup-health-checks
    python scripts/monitoring-setup.py --setup-alerts
    python scripts/monitoring-setup.py --test-monitoring
"""

import os
import sys
import json
import argparse
import time
import requests
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
from dataclasses import dataclass, asdict
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class HealthCheckConfig:
    """Configuration for health check endpoints"""
    name: str
    url: str
    method: str = "GET"
    timeout: int = 10
    expected_status: int = 200
    expected_response_keys: List[str] = None
    critical: bool = True
    check_interval_seconds: int = 30

@dataclass
class AlertConfig:
    """Configuration for alerts"""
    name: str
    metric: str
    threshold: float
    comparison: str  # "greater_than", "less_than", "equals"
    duration_minutes: int
    severity: str  # "critical", "warning", "info"
    notification_channels: List[str]
    description: str

class MonitoringSetup:
    def __init__(self, api_url: str = None):
        self.api_url = api_url or os.getenv('PIXELPREP_API_URL', 'https://pixelprep.onrender.com')
        self.frontend_url = os.getenv('PIXELPREP_FRONTEND_URL', 'https://third-south-capital.github.io/pixelprep')

        # Health check configurations
        self.health_checks = [
            HealthCheckConfig(
                name="API Health",
                url=f"{self.api_url}/health",
                expected_response_keys=["healthy", "timestamp", "version"],
                critical=True,
                check_interval_seconds=30
            ),
            HealthCheckConfig(
                name="Auth Health",
                url=f"{self.api_url}/auth/health",
                expected_response_keys=["auth_required", "auth_enabled"],
                critical=False,
                check_interval_seconds=60
            ),
            HealthCheckConfig(
                name="Processors Endpoint",
                url=f"{self.api_url}/optimize/processors",
                expected_response_keys=["processors", "total_count"],
                critical=True,
                check_interval_seconds=120
            ),
            HealthCheckConfig(
                name="Frontend Availability",
                url=self.frontend_url,
                expected_status=200,
                critical=True,
                check_interval_seconds=60
            )
        ]

        # Alert configurations
        self.alerts = [
            AlertConfig(
                name="API High Error Rate",
                metric="error_rate",
                threshold=0.05,  # 5%
                comparison="greater_than",
                duration_minutes=5,
                severity="critical",
                notification_channels=["slack", "email"],
                description="API error rate exceeds 5% for 5 minutes"
            ),
            AlertConfig(
                name="API Response Time Degradation",
                metric="response_time_p95",
                threshold=10.0,  # 10 seconds
                comparison="greater_than",
                duration_minutes=10,
                severity="critical",
                notification_channels=["slack"],
                description="API P95 response time exceeds 10 seconds"
            ),
            AlertConfig(
                name="High Processing Time",
                metric="image_processing_time_p95",
                threshold=30.0,  # 30 seconds
                comparison="greater_than",
                duration_minutes=5,
                severity="warning",
                notification_channels=["slack"],
                description="Image processing P95 time exceeds 30 seconds"
            ),
            AlertConfig(
                name="Database Connection Issues",
                metric="database_connection_errors",
                threshold=5,
                comparison="greater_than",
                duration_minutes=2,
                severity="critical",
                notification_channels=["slack", "email"],
                description="Database connection errors detected"
            ),
            AlertConfig(
                name="Low Custom Preset Usage",
                metric="custom_preset_usage_rate",
                threshold=0.05,  # 5%
                comparison="less_than",
                duration_minutes=60,
                severity="info",
                notification_channels=["slack"],
                description="Custom preset usage below 5% for 1 hour"
            ),
            AlertConfig(
                name="Onboarding Completion Drop",
                metric="onboarding_completion_rate",
                threshold=0.4,  # 40%
                comparison="less_than",
                duration_minutes=30,
                severity="warning",
                notification_channels=["slack"],
                description="Onboarding completion rate below 40%"
            )
        ]

    def run_health_check(self, config: HealthCheckConfig) -> Dict[str, Any]:
        """Run a single health check"""
        result = {
            "name": config.name,
            "url": config.url,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "success": False,
            "response_time_ms": 0,
            "status_code": None,
            "error": None,
            "response_data": None
        }

        try:
            start_time = time.time()

            response = requests.request(
                method=config.method,
                url=config.url,
                timeout=config.timeout
            )

            end_time = time.time()
            result["response_time_ms"] = round((end_time - start_time) * 1000, 2)
            result["status_code"] = response.status_code

            # Check status code
            if response.status_code != config.expected_status:
                result["error"] = f"Expected status {config.expected_status}, got {response.status_code}"
                return result

            # Check response content if applicable
            if config.expected_response_keys:
                try:
                    response_json = response.json()
                    result["response_data"] = response_json

                    missing_keys = []
                    for key in config.expected_response_keys:
                        if key not in response_json:
                            missing_keys.append(key)

                    if missing_keys:
                        result["error"] = f"Missing response keys: {missing_keys}"
                        return result

                except json.JSONDecodeError as e:
                    result["error"] = f"Invalid JSON response: {e}"
                    return result

            result["success"] = True

        except requests.exceptions.Timeout:
            result["error"] = f"Request timeout ({config.timeout}s)"
        except requests.exceptions.ConnectionError:
            result["error"] = "Connection error"
        except requests.exceptions.RequestException as e:
            result["error"] = f"Request error: {str(e)}"
        except Exception as e:
            result["error"] = f"Unexpected error: {str(e)}"

        return result

    def run_all_health_checks(self) -> List[Dict[str, Any]]:
        """Run all configured health checks"""
        logger.info(f"Running {len(self.health_checks)} health checks...")

        results = []
        for config in self.health_checks:
            logger.info(f"Checking: {config.name}")
            result = self.run_health_check(config)
            results.append(result)

            if result["success"]:
                logger.info(f"✅ {config.name}: OK ({result['response_time_ms']}ms)")
            else:
                level = logging.ERROR if config.critical else logging.WARNING
                logger.log(level, f"❌ {config.name}: {result['error']}")

        return results

    def setup_health_check_monitoring(self) -> bool:
        """Setup continuous health check monitoring"""
        logger.info("Setting up health check monitoring...")

        # Create monitoring script
        monitoring_script = self._generate_monitoring_script()

        script_path = "/Users/Harrison/Library/CloudStorage/Dropbox/Development/PixelPrep/scripts/health-monitor.py"
        with open(script_path, 'w') as f:
            f.write(monitoring_script)

        os.chmod(script_path, 0o755)

        logger.info(f"✅ Health monitoring script created: {script_path}")
        logger.info("To run continuous monitoring:")
        logger.info(f"  python {script_path} --continuous")

        return True

    def _generate_monitoring_script(self) -> str:
        """Generate the health monitoring script"""
        return f'''#!/usr/bin/env python3
"""
PixelPrep Continuous Health Monitoring
Auto-generated by monitoring-setup.py
"""

import json
import time
import requests
from datetime import datetime, timezone
import argparse

HEALTH_CHECKS = {json.dumps([asdict(hc) for hc in self.health_checks], indent=2)}

def run_health_check(config):
    """Run a single health check"""
    result = {{
        "name": config["name"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "success": False,
        "response_time_ms": 0,
        "error": None
    }}

    try:
        start_time = time.time()
        response = requests.get(config["url"], timeout=config["timeout"])
        end_time = time.time()

        result["response_time_ms"] = round((end_time - start_time) * 1000, 2)
        result["status_code"] = response.status_code

        if response.status_code == config["expected_status"]:
            result["success"] = True
        else:
            result["error"] = f"Status {{response.status_code}} != {{config['expected_status']}}"

    except Exception as e:
        result["error"] = str(e)

    return result

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--continuous", action="store_true", help="Run continuously")
    parser.add_argument("--interval", type=int, default=30, help="Check interval in seconds")
    args = parser.parse_args()

    if args.continuous:
        print("🔍 Starting continuous health monitoring...")
        while True:
            for config in HEALTH_CHECKS:
                result = run_health_check(config)
                status = "✅" if result["success"] else "❌"
                print(f"{{status}} {{config['name']}}: {{result.get('response_time_ms', 0)}}ms")

                if not result["success"]:
                    print(f"   Error: {{result['error']}}")

            time.sleep(args.interval)
    else:
        for config in HEALTH_CHECKS:
            result = run_health_check(config)
            print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
'''

    def setup_alerts(self) -> bool:
        """Setup alerting configuration"""
        logger.info("Setting up alerting configuration...")

        # Generate alert configuration files
        alert_configs = {
            "version": "1.0",
            "generated": datetime.now(timezone.utc).isoformat(),
            "alerts": [asdict(alert) for alert in self.alerts]
        }

        # Save alert configurations
        config_path = "/Users/Harrison/Library/CloudStorage/Dropbox/Development/PixelPrep/monitoring/alert-config.json"
        os.makedirs(os.path.dirname(config_path), exist_ok=True)

        with open(config_path, 'w') as f:
            json.dump(alert_configs, f, indent=2)

        logger.info(f"✅ Alert configuration saved: {config_path}")

        # Generate Prometheus alerting rules (if using Prometheus)
        prometheus_rules = self._generate_prometheus_rules()
        rules_path = "/Users/Harrison/Library/CloudStorage/Dropbox/Development/PixelPrep/monitoring/prometheus-rules.yml"

        with open(rules_path, 'w') as f:
            f.write(prometheus_rules)

        logger.info(f"✅ Prometheus rules generated: {rules_path}")

        return True

    def _generate_prometheus_rules(self) -> str:
        """Generate Prometheus alerting rules"""
        rules = ["groups:", "- name: pixelprep", "  rules:"]

        for alert in self.alerts:
            rule = f'''
  - alert: {alert.name.replace(" ", "_")}
    expr: {self._metric_to_prometheus(alert)}
    for: {alert.duration_minutes}m
    labels:
      severity: {alert.severity}
    annotations:
      summary: "{alert.description}"
      description: "{{{{ $labels.instance }}}} - {alert.description}"'''
            rules.append(rule)

        return "\n".join(rules)

    def _metric_to_prometheus(self, alert: AlertConfig) -> str:
        """Convert alert config to Prometheus expression"""
        # This is a simplified mapping - would need to be customized based on actual metrics
        metric_mappings = {
            "error_rate": f"rate(pixelprep_errors_total[5m]) {alert.comparison.replace('_', ' ')} {alert.threshold}",
            "response_time_p95": f"histogram_quantile(0.95, rate(pixelprep_request_duration_seconds_bucket[5m])) {alert.comparison.replace('_', ' ')} {alert.threshold}",
            "image_processing_time_p95": f"histogram_quantile(0.95, rate(pixelprep_processing_duration_seconds_bucket[5m])) {alert.comparison.replace('_', ' ')} {alert.threshold}",
            "database_connection_errors": f"rate(pixelprep_db_errors_total[2m]) {alert.comparison.replace('_', ' ')} {alert.threshold}",
            "custom_preset_usage_rate": f"rate(pixelprep_custom_preset_total[1h]) / rate(pixelprep_optimizations_total[1h]) {alert.comparison.replace('_', ' ')} {alert.threshold}",
            "onboarding_completion_rate": f"rate(pixelprep_onboarding_completed_total[30m]) / rate(pixelprep_onboarding_started_total[30m]) {alert.comparison.replace('_', ' ')} {alert.threshold}"
        }

        return metric_mappings.get(alert.metric, f"{alert.metric} {alert.comparison.replace('_', ' ')} {alert.threshold}")

    def setup_dashboards(self) -> bool:
        """Setup monitoring dashboards configuration"""
        logger.info("Setting up monitoring dashboards...")

        dashboard_config = {
            "version": "1.0",
            "generated": datetime.now(timezone.utc).isoformat(),
            "dashboards": [
                {
                    "name": "PixelPrep System Health",
                    "panels": [
                        {
                            "title": "API Response Time",
                            "type": "graph",
                            "metrics": ["response_time_p50", "response_time_p95", "response_time_p99"],
                            "time_range": "1h"
                        },
                        {
                            "title": "Error Rate",
                            "type": "graph",
                            "metrics": ["error_rate_5m", "error_rate_1h"],
                            "time_range": "6h"
                        },
                        {
                            "title": "Throughput",
                            "type": "graph",
                            "metrics": ["requests_per_second", "optimizations_per_minute"],
                            "time_range": "1h"
                        },
                        {
                            "title": "System Resources",
                            "type": "graph",
                            "metrics": ["cpu_usage", "memory_usage", "disk_usage"],
                            "time_range": "2h"
                        }
                    ]
                },
                {
                    "name": "PixelPrep Feature Usage",
                    "panels": [
                        {
                            "title": "Preset Usage Distribution",
                            "type": "pie_chart",
                            "metrics": ["preset_usage_by_type"],
                            "time_range": "24h"
                        },
                        {
                            "title": "Custom Preset Adoption",
                            "type": "graph",
                            "metrics": ["custom_preset_creation_rate", "custom_preset_usage_rate"],
                            "time_range": "7d"
                        },
                        {
                            "title": "Onboarding Funnel",
                            "type": "funnel",
                            "metrics": ["onboarding_started", "onboarding_completed"],
                            "time_range": "24h"
                        },
                        {
                            "title": "Size Preview Accuracy",
                            "type": "graph",
                            "metrics": ["size_preview_accuracy", "size_preview_usage"],
                            "time_range": "24h"
                        }
                    ]
                },
                {
                    "name": "PixelPrep User Experience",
                    "panels": [
                        {
                            "title": "Page Load Times",
                            "type": "graph",
                            "metrics": ["frontend_load_time", "first_contentful_paint"],
                            "time_range": "2h"
                        },
                        {
                            "title": "JavaScript Errors",
                            "type": "graph",
                            "metrics": ["js_error_rate"],
                            "time_range": "6h"
                        },
                        {
                            "title": "User Flow Completion",
                            "type": "graph",
                            "metrics": ["upload_success_rate", "optimization_success_rate"],
                            "time_range": "24h"
                        }
                    ]
                }
            ]
        }

        config_path = "/Users/Harrison/Library/CloudStorage/Dropbox/Development/PixelPrep/monitoring/dashboard-config.json"
        with open(config_path, 'w') as f:
            json.dump(dashboard_config, f, indent=2)

        logger.info(f"✅ Dashboard configuration saved: {config_path}")
        return True

    def test_monitoring_setup(self) -> bool:
        """Test the monitoring setup"""
        logger.info("Testing monitoring setup...")

        # Test all health checks
        health_results = self.run_all_health_checks()

        # Calculate success rate
        successful_checks = sum(1 for result in health_results if result["success"])
        success_rate = successful_checks / len(health_results) * 100

        logger.info(f"Health check success rate: {success_rate:.1f}% ({successful_checks}/{len(health_results)})")

        # Test critical endpoints specifically
        critical_failures = []
        for i, config in enumerate(self.health_checks):
            if config.critical and not health_results[i]["success"]:
                critical_failures.append(config.name)

        if critical_failures:
            logger.error(f"❌ Critical health check failures: {critical_failures}")
            return False

        # Generate test report
        test_report = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "success_rate": success_rate,
            "total_checks": len(health_results),
            "successful_checks": successful_checks,
            "failed_checks": len(health_results) - successful_checks,
            "critical_failures": critical_failures,
            "results": health_results
        }

        report_path = "/Users/Harrison/Library/CloudStorage/Dropbox/Development/PixelPrep/monitoring/test-report.json"
        with open(report_path, 'w') as f:
            json.dump(test_report, f, indent=2)

        logger.info(f"✅ Test report saved: {report_path}")
        logger.info("✅ Monitoring setup test completed successfully!")

        return True

def main():
    parser = argparse.ArgumentParser(description="PixelPrep Monitoring Setup")
    parser.add_argument("--setup-all", action="store_true", help="Setup all monitoring components")
    parser.add_argument("--setup-health-checks", action="store_true", help="Setup health check monitoring")
    parser.add_argument("--setup-alerts", action="store_true", help="Setup alerting")
    parser.add_argument("--setup-dashboards", action="store_true", help="Setup dashboards")
    parser.add_argument("--test-monitoring", action="store_true", help="Test monitoring setup")
    parser.add_argument("--api-url", type=str, help="Override API URL")

    args = parser.parse_args()

    if not any([args.setup_all, args.setup_health_checks, args.setup_alerts,
                args.setup_dashboards, args.test_monitoring]):
        parser.error("Must specify at least one setup option")

    # Initialize monitoring setup
    monitor = MonitoringSetup(api_url=args.api_url)

    try:
        success = True

        if args.setup_all or args.setup_health_checks:
            success &= monitor.setup_health_check_monitoring()

        if args.setup_all or args.setup_alerts:
            success &= monitor.setup_alerts()

        if args.setup_all or args.setup_dashboards:
            success &= monitor.setup_dashboards()

        if args.setup_all or args.test_monitoring:
            success &= monitor.test_monitoring_setup()

        if success:
            logger.info("🎉 Monitoring setup completed successfully!")
        else:
            logger.error("❌ Some monitoring setup steps failed")
            sys.exit(1)

    except Exception as e:
        logger.error(f"❌ Monitoring setup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()