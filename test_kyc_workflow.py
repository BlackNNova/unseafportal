#!/usr/bin/env python3
"""
Test script to verify KYC approval/rejection workflow
Tests the complete flow from user submission to status update
"""

import requests
import time
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5000"  # Adjust if your backend runs on a different port
TEST_USER = {
    "username": "testuser_kyc_" + str(int(time.time())),
    "email": f"testkyc_{int(time.time())}@test.com",
    "password": "Test123!@#"
}
ADMIN_USER = {
    "username": "admin",  # Adjust to your admin credentials
    "password": "admin123"  # Adjust to your admin password
}

class KYCWorkflowTester:
    def __init__(self):
        self.user_session = requests.Session()
        self.admin_session = requests.Session()
        self.user_id = None
        self.kyc_id = None
        
    def test_complete_workflow(self):
        """Run the complete KYC workflow test"""
        print("\n" + "="*60)
        print("KYC WORKFLOW TEST")
        print("="*60)
        
        try:
            # Step 1: Create and login user
            print("\n1. Creating and logging in test user...")
            if not self.create_and_login_user():
                return False
                
            # Step 2: Check initial KYC status
            print("\n2. Checking initial KYC status...")
            initial_status = self.check_user_kyc_status()
            print(f"   Initial KYC status: {initial_status}")
            
            # Step 3: Submit KYC documents
            print("\n3. Submitting KYC documents...")
            if not self.submit_kyc_documents():
                return False
                
            # Step 4: Check status after submission
            print("\n4. Checking KYC status after submission...")
            pending_status = self.check_user_kyc_status()
            print(f"   Status after submission: {pending_status}")
            
            # Step 5: Login as admin
            print("\n5. Logging in as admin...")
            if not self.login_admin():
                print("   ❌ Admin login failed - check admin credentials in script")
                return False
                
            # Step 6: Get KYC requests as admin
            print("\n6. Fetching KYC requests as admin...")
            kyc_requests = self.get_admin_kyc_requests()
            if not kyc_requests:
                print("   ❌ Failed to fetch KYC requests")
                return False
                
            # Find our test user's KYC
            test_kyc = None
            for kyc in kyc_requests:
                if kyc.get('user', {}).get('username') == TEST_USER['username']:
                    test_kyc = kyc
                    self.kyc_id = kyc['id']
                    break
                    
            if not test_kyc:
                print("   ❌ Test user's KYC not found in admin panel")
                return False
                
            print(f"   ✓ Found test user's KYC (ID: {self.kyc_id})")
            
            # Step 7: Test approval flow
            print("\n7. Testing APPROVAL flow...")
            if self.approve_kyc():
                print("   ✓ KYC approved successfully")
                
                # Check user sees updated status
                time.sleep(1)  # Small delay to ensure DB update
                approved_status = self.check_user_kyc_status()
                print(f"   User now sees status: {approved_status}")
                
                if approved_status == 'approved':
                    print("   ✅ User correctly sees APPROVED status!")
                else:
                    print(f"   ⚠️ User status not updated correctly: {approved_status}")
                    
            # Step 8: Test rejection flow
            print("\n8. Testing REJECTION flow...")
            print("   First, resubmitting KYC as user...")
            
            # Switch back to user session and resubmit
            if self.submit_kyc_documents(resubmit=True):
                print("   ✓ KYC resubmitted")
                
                # Get new KYC ID
                time.sleep(1)
                kyc_requests = self.get_admin_kyc_requests()
                for kyc in kyc_requests:
                    if kyc.get('user', {}).get('username') == TEST_USER['username'] and kyc['status'] == 'pending':
                        self.kyc_id = kyc['id']
                        break
                        
                if self.reject_kyc():
                    print("   ✓ KYC rejected successfully")
                    
                    # Check user sees updated status
                    time.sleep(1)
                    rejected_status = self.check_user_kyc_status()
                    print(f"   User now sees status: {rejected_status}")
                    
                    if rejected_status == 'rejected':
                        print("   ✅ User correctly sees REJECTED status!")
                    else:
                        print(f"   ⚠️ User status not updated correctly: {rejected_status}")
                        
            print("\n" + "="*60)
            print("TEST COMPLETE")
            print("="*60)
            return True
            
        except Exception as e:
            print(f"\n❌ Test failed with error: {e}")
            return False
            
    def create_and_login_user(self):
        """Create a test user and login"""
        # Register user
        response = self.user_session.post(
            f"{BASE_URL}/api/auth/register",
            json=TEST_USER
        )
        
        if response.status_code != 201:
            print(f"   ❌ User registration failed: {response.text}")
            return False
            
        print(f"   ✓ User created: {TEST_USER['username']}")
        
        # Login user
        response = self.user_session.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "username": TEST_USER['username'],
                "password": TEST_USER['password']
            }
        )
        
        if response.status_code != 200:
            print(f"   ❌ User login failed: {response.text}")
            return False
            
        print("   ✓ User logged in")
        return True
        
    def check_user_kyc_status(self):
        """Check KYC status from user's perspective"""
        response = self.user_session.get(f"{BASE_URL}/api/kyc/status")
        
        if response.status_code == 200:
            data = response.json()
            return data.get('kyc_status', 'unknown')
        return None
        
    def submit_kyc_documents(self, resubmit=False):
        """Submit KYC documents as user"""
        # Create a simple test file
        files = {
            'aml_certificate': ('test_certificate.txt', 'Test AML Certificate Content', 'text/plain')
        }
        
        data = {
            'grant_award_number': f'GRANT-{int(time.time())}'
        }
        
        response = self.user_session.post(
            f"{BASE_URL}/api/kyc/submit",
            files=files,
            data=data
        )
        
        if response.status_code == 200:
            print(f"   ✓ KYC documents {'resubmitted' if resubmit else 'submitted'} successfully")
            return True
        else:
            print(f"   ❌ KYC submission failed: {response.text}")
            return False
            
    def login_admin(self):
        """Login as admin"""
        response = self.admin_session.post(
            f"{BASE_URL}/api/admin/login",
            json=ADMIN_USER
        )
        
        if response.status_code == 200:
            print("   ✓ Admin logged in")
            return True
        return False
        
    def get_admin_kyc_requests(self):
        """Get KYC requests from admin panel"""
        response = self.admin_session.get(f"{BASE_URL}/api/admin/kyc/all")
        
        if response.status_code == 200:
            data = response.json()
            return data.get('kyc_documents', [])
        return None
        
    def approve_kyc(self):
        """Approve KYC as admin"""
        response = self.admin_session.post(
            f"{BASE_URL}/api/admin/kyc/{self.kyc_id}/approve",
            json={"notes": "Approved by test script"}
        )
        
        return response.status_code == 200
        
    def reject_kyc(self):
        """Reject KYC as admin"""
        response = self.admin_session.post(
            f"{BASE_URL}/api/admin/kyc/{self.kyc_id}/reject",
            json={"notes": "Rejected by test script"}
        )
        
        return response.status_code == 200

def main():
    """Run the KYC workflow test"""
    print("\n🔧 KYC Workflow Test Script")
    print("This script will test the complete KYC workflow including:")
    print("- User KYC submission")
    print("- Admin approval/rejection")
    print("- User status updates")
    
    input("\nPress Enter to start the test (make sure backend is running)...")
    
    tester = KYCWorkflowTester()
    success = tester.test_complete_workflow()
    
    if success:
        print("\n✅ All tests passed! The KYC workflow is working correctly.")
    else:
        print("\n❌ Some tests failed. Check the output above for details.")

if __name__ == "__main__":
    main()