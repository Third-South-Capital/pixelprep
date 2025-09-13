#!/usr/bin/env python3
"""
Comprehensive Phase 2 Validation Script

This script validates all aspects of the Phase 2 Supabase integration:
1. Environment validation
2. Database connectivity  
3. Authentication system
4. Dual-mode operation (anonymous + authenticated)
5. Image processing workflows
6. Storage integration
7. API endpoint coverage
"""

import io
import os
from datetime import datetime

import requests
from dotenv import load_dotenv
from PIL import Image

# Load environment variables
load_dotenv()

BASE_URL = "http://localhost:8000"

class Phase2Validator:
    def __init__(self):
        self.test_results = []
        self.passed = 0
        self.failed = 0

    def log_test(self, test_name, passed, message=""):
        status = "✅ PASS" if passed else "❌ FAIL"
        result = f"{status}: {test_name}"
        if message:
            result += f" - {message}"

        self.test_results.append(result)
        if passed:
            self.passed += 1
        else:
            self.failed += 1
        print(result)

    def create_test_image(self):
        """Create a simple test image for upload testing"""
        img = Image.new('RGB', (800, 600), color='blue')
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='JPEG', quality=90)
        img_buffer.seek(0)
        return img_buffer

    def test_environment_validation(self):
        """Test environment variable validation"""
        print("\n🔍 Testing Environment Validation...")

        required_vars = [
            'SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'SUPABASE_ANON_KEY',
            'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'JWT_SECRET_KEY'
        ]

        missing_vars = []
        for var in required_vars:
            if not os.getenv(var):
                missing_vars.append(var)

        self.log_test(
            "Environment Variables",
            len(missing_vars) == 0,
            f"Missing: {missing_vars}" if missing_vars else "All required vars present"
        )

    def test_api_health(self):
        """Test basic API health endpoints"""
        print("\n🔍 Testing API Health...")

        # Main health endpoint
        try:
            response = requests.get(f"{BASE_URL}/health", timeout=5)
            self.log_test("Main Health Endpoint", response.status_code == 200)
        except Exception as e:
            self.log_test("Main Health Endpoint", False, str(e))

        # Auth health endpoint
        try:
            response = requests.get(f"{BASE_URL}/auth/health", timeout=5)
            if response.status_code == 200:
                health = response.json()
                github_ok = health.get('github_oauth', False)
                jwt_ok = health.get('jwt_configured', False)
                supabase_ok = health.get('supabase_connected', False)

                self.log_test("GitHub OAuth Configuration", github_ok)
                self.log_test("JWT Configuration", jwt_ok)
                self.log_test("Supabase Connection", supabase_ok)
            else:
                self.log_test("Auth Health Endpoint", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Auth Health Endpoint", False, str(e))

    def test_anonymous_operations(self):
        """Test anonymous user operations"""
        print("\n🔍 Testing Anonymous Operations...")

        # Test anonymous image upload
        try:
            test_image = self.create_test_image()
            files = {'file': ('test.jpg', test_image, 'image/jpeg')}
            data = {'preset': 'instagram_square'}

            response = requests.post(f"{BASE_URL}/optimize", files=files, data=data, timeout=10)
            self.log_test("Anonymous Image Upload", response.status_code == 200)

            if response.status_code == 200:
                # Verify we got a ZIP file
                content_type = response.headers.get('content-type', '')
                self.log_test("Anonymous Upload Returns ZIP", 'application/zip' in content_type)

        except Exception as e:
            self.log_test("Anonymous Image Upload", False, str(e))

        # Test presets endpoint
        try:
            response = requests.get(f"{BASE_URL}/presets", timeout=5)
            self.log_test("Presets Endpoint", response.status_code == 200)
        except Exception as e:
            self.log_test("Presets Endpoint", False, str(e))

    def test_authentication_protection(self):
        """Test that protected endpoints require authentication"""
        print("\n🔍 Testing Authentication Protection...")

        protected_endpoints = [
            "/optimize/images",
            "/auth/me",
            "/optimize/images/test/optimizations"
        ]

        for endpoint in protected_endpoints:
            try:
                # Test without auth (should fail)
                response = requests.get(f"{BASE_URL}{endpoint}", timeout=5)
                expected_codes = [401, 403]
                auth_protected = response.status_code in expected_codes
                self.log_test(f"Protected: {endpoint}", auth_protected, f"Status: {response.status_code}")

                # Test with invalid token (should fail)
                headers = {"Authorization": "Bearer invalid_token"}
                response = requests.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=5)
                token_validation = response.status_code == 401
                self.log_test(f"Token Validation: {endpoint}", token_validation, f"Status: {response.status_code}")

            except Exception as e:
                self.log_test(f"Protected: {endpoint}", False, str(e))

    def test_github_oauth_setup(self):
        """Test GitHub OAuth configuration"""
        print("\n🔍 Testing GitHub OAuth Setup...")

        try:
            response = requests.get(f"{BASE_URL}/auth/github/login", timeout=5)
            if response.status_code == 200:
                auth_data = response.json()
                has_auth_url = 'auth_url' in auth_data
                has_state = 'state' in auth_data

                self.log_test("GitHub Login Endpoint", has_auth_url and has_state)

                if has_auth_url:
                    auth_url = auth_data['auth_url']
                    github_configured = 'github.com' in auth_url and 'client_id' in auth_url
                    self.log_test("GitHub OAuth URL Format", github_configured)
            else:
                self.log_test("GitHub Login Endpoint", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("GitHub Login Endpoint", False, str(e))

    def test_database_schema_compatibility(self):
        """Test database schema compatibility"""
        print("\n🔍 Testing Database Schema Compatibility...")

        # This would require a valid token, so we'll test the code structure instead
        try:
            from backend.src.storage.persistent import PersistentStorage
            from backend.src.storage.supabase_client import get_supabase_client

            # Test that we can import without errors
            self.log_test("Import PersistentStorage", True)

            # Test that Supabase client can be created
            client = get_supabase_client()
            self.log_test("Supabase Client Creation", client is not None)

            # Test PersistentStorage initialization
            storage = PersistentStorage("test_user_id")
            self.log_test("PersistentStorage Initialization", storage is not None)

        except Exception as e:
            self.log_test("Database Schema Compatibility", False, str(e))

    def test_processor_availability(self):
        """Test all image processors are available"""
        print("\n🔍 Testing Processor Availability...")

        try:
            response = requests.get(f"{BASE_URL}/optimize/processors", timeout=5)
            if response.status_code == 200:
                processors = response.json()
                expected_presets = [
                    'instagram_square', 'jury_submission', 'web_display',
                    'email_newsletter', 'quick_compress'
                ]

                # Processors are nested under 'processors' key
                processor_data = processors.get('processors', {})
                available_presets = list(processor_data.keys()) if isinstance(processor_data, dict) else []

                for preset in expected_presets:
                    available = preset in available_presets
                    self.log_test(f"Processor: {preset}", available)

            else:
                self.log_test("Processors Endpoint", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Processors Endpoint", False, str(e))

    def run_all_tests(self):
        """Run all validation tests"""
        print("🚀 PixelPrep Phase 2 Validation Suite")
        print("=" * 50)

        self.test_environment_validation()
        self.test_api_health()
        self.test_anonymous_operations()
        self.test_authentication_protection()
        self.test_github_oauth_setup()
        self.test_database_schema_compatibility()
        self.test_processor_availability()

        print("\n" + "=" * 50)
        print("🎯 VALIDATION SUMMARY")
        print("=" * 50)

        total_tests = self.passed + self.failed
        success_rate = (self.passed / total_tests * 100) if total_tests > 0 else 0

        print(f"Total Tests: {total_tests}")
        print(f"Passed: {self.passed}")
        print(f"Failed: {self.failed}")
        print(f"Success Rate: {success_rate:.1f}%")

        if self.failed == 0:
            print("\n🎉 ALL TESTS PASSED! Phase 2 is ready for frontend development.")
        else:
            print(f"\n⚠️  {self.failed} tests failed. Please review before proceeding.")

        # Show instructions for manual testing
        print("\n💡 MANUAL TESTING INSTRUCTIONS:")
        print("1. Visit: http://localhost:8000/auth/github/login")
        print("2. Complete GitHub OAuth flow")
        print("3. Use JWT token to test authenticated endpoints")
        print("4. Upload images as authenticated user")
        print("5. Verify persistent storage and image gallery")

        return self.failed == 0

def main():
    validator = Phase2Validator()
    success = validator.run_all_tests()

    # Save results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_file = f"phase2_validation_report_{timestamp}.txt"

    with open(report_file, 'w') as f:
        f.write("PixelPrep Phase 2 Validation Report\n")
        f.write("=" * 40 + "\n\n")
        for result in validator.test_results:
            f.write(result + "\n")
        f.write(f"\nTotal: {validator.passed + validator.failed}, Passed: {validator.passed}, Failed: {validator.failed}\n")

    print(f"\n📄 Detailed report saved to: {report_file}")

    return success

if __name__ == "__main__":
    main()
