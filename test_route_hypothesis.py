#!/usr/bin/env python3
"""
Test different route paths to identify correct API endpoints
"""

import requests

BASE_URL = "http://localhost:5000"

def test_routes():
    session = requests.Session()
    
    # Login first
    print("Logging in...")
    response = session.post(f"{BASE_URL}/api/auth/login", json={"username": "testuser", "password": "password123"})
    if response.status_code != 200:
        print("Login failed")
        return
    print("Login successful\n")
    
    # Test different route possibilities
    routes_to_test = [
        "/api/dashboard/balance",
        "/api/balance",
        "/api/dashboard/api/balance",
        "/balance",
        "/dashboard/balance"
    ]
    
    print("Testing Balance Endpoints:")
    print("-" * 40)
    for route in routes_to_test:
        response = session.get(f"{BASE_URL}{route}")
        content_type = response.headers.get('content-type', '')
        is_json = 'application/json' in content_type
        print(f"{route}")
        print(f"  Status: {response.status_code}")
        print(f"  Content-Type: {content_type}")
        print(f"  Is JSON: {is_json}")
        if is_json and response.status_code == 200:
            print(f"  ✓ SUCCESS - Valid JSON endpoint found!")
            print(f"  Response: {response.text[:100]}")
        print()
    
    # Test transaction routes
    transaction_routes = [
        "/api/dashboard/transactions/recent",
        "/api/transactions/recent", 
        "/api/dashboard/api/transactions/recent",
        "/transactions/recent",
        "/dashboard/transactions/recent"
    ]
    
    print("\nTesting Transaction Endpoints:")
    print("-" * 40)
    for route in transaction_routes:
        response = session.get(f"{BASE_URL}{route}")
        content_type = response.headers.get('content-type', '')
        is_json = 'application/json' in content_type
        print(f"{route}")
        print(f"  Status: {response.status_code}")
        print(f"  Content-Type: {content_type}")
        print(f"  Is JSON: {is_json}")
        if is_json and response.status_code == 200:
            print(f"  ✓ SUCCESS - Valid JSON endpoint found!")
            print(f"  Response: {response.text[:100]}")
        print()

if __name__ == "__main__":
    test_routes()