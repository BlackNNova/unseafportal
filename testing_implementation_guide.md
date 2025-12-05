# TESTING IMPLEMENTATION GUIDE

## Quick Start Testing Setup

### Backend Testing Setup (Python/Flask)

#### 1. Install Testing Dependencies
```bash
cd backend
pip install pytest pytest-flask pytest-cov flask-testing python-dotenv faker
```

#### 2. Create Test Configuration
Create `backend/config_test.py`:
```python
import os
import tempfile

class TestConfig:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SECRET_KEY = 'test-secret-key-only-for-testing'
    WTF_CSRF_ENABLED = False
    PRESERVE_CONTEXT_ON_EXCEPTION = False
```

#### 3. Create Test Directory Structure
```
backend/
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── unit/
│   │   ├── __init__.py
│   │   ├── test_models.py
│   │   ├── test_auth.py
│   │   └── test_transactions.py
│   ├── integration/
│   │   ├── __init__.py
│   │   └── test_api_endpoints.py
│   └── fixtures/
│       └── test_data.py
```

#### 4. Create Base Test Fixtures
Create `backend/tests/conftest.py`:
```python
import pytest
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.main import app as flask_app
from src.models.user import db, User, Admin

@pytest.fixture
def app():
    flask_app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "SECRET_KEY": "test-secret-key",
        "WTF_CSRF_ENABLED": False
    })
    
    with flask_app.app_context():
        db.create_all()
        yield flask_app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def runner(app):
    return app.test_cli_runner()

@pytest.fixture
def test_user(app):
    user = User(
        username="testuser",
        email="test@example.com",
        password="Test@123!"
    )
    db.session.add(user)
    db.session.commit()
    return user

@pytest.fixture
def authenticated_client(client, test_user):
    client.post('/api/auth/login', json={
        'username': 'testuser',
        'password': 'Test@123!'
    })
    return client
```

#### 5. Sample Unit Tests
Create `backend/tests/unit/test_auth.py`:
```python
import pytest
from src.models.user import User, db

def test_user_registration_success(client):
    """Test successful user registration"""
    response = client.post('/api/auth/register', json={
        'username': 'newuser',
        'email': 'new@example.com',
        'password': 'SecurePass123!',
        'first_name': 'John',
        'last_name': 'Doe'
    })
    
    assert response.status_code == 201
    data = response.get_json()
    assert data['message'] == 'User registered successfully'
    assert data['user']['username'] == 'newuser'

def test_user_registration_duplicate_username(client, test_user):
    """Test registration with existing username"""
    response = client.post('/api/auth/register', json={
        'username': 'testuser',  # Already exists
        'email': 'another@example.com',
        'password': 'SecurePass123!'
    })
    
    assert response.status_code == 400
    assert 'Username already exists' in response.get_json()['error']

def test_login_valid_credentials(client, test_user):
    """Test login with valid credentials"""
    response = client.post('/api/auth/login', json={
        'username': 'testuser',
        'password': 'Test@123!'
    })
    
    assert response.status_code == 200
    assert 'Login successful' in response.get_json()['message']

def test_login_invalid_credentials(client, test_user):
    """Test login with invalid credentials"""
    response = client.post('/api/auth/login', json={
        'username': 'testuser',
        'password': 'WrongPassword'
    })
    
    assert response.status_code == 401
    assert 'Invalid username or password' in response.get_json()['error']

def test_logout(authenticated_client):
    """Test logout functionality"""
    response = authenticated_client.post('/api/auth/logout')
    assert response.status_code == 200
    
    # Verify session is cleared
    response = authenticated_client.get('/api/auth/me')
    assert response.status_code == 401
```

Create `backend/tests/unit/test_models.py`:
```python
import pytest
from src.models.user import User, Transaction, Transfer

def test_user_model_creation(app):
    """Test User model creation and methods"""
    user = User(
        username="modeltest",
        email="model@test.com",
        password="TestPass123!"
    )
    
    assert user.username == "modeltest"
    assert user.email == "model@test.com"
    assert user.check_password("TestPass123!")
    assert not user.check_password("WrongPassword")
    assert len(user.account_number) == 12
    assert user.balance == 0.00

def test_transaction_id_generation(app, test_user):
    """Test unique transaction ID generation"""
    transaction = Transaction(
        user_id=test_user.id,
        type="credit",
        amount=100.00,
        description="Test deposit"
    )
    
    assert transaction.transaction_id.startswith('TRX')
    assert len(transaction.transaction_id) == 13

def test_referral_link_generation(test_user):
    """Test referral link generation"""
    link = test_user.get_referral_link()
    assert f"reference={test_user.username}" in link
```

#### 6. Integration Tests
Create `backend/tests/integration/test_api_endpoints.py`:
```python
import pytest
import json

def test_complete_user_flow(client):
    """Test complete user registration, login, and profile update flow"""
    
    # Register new user
    register_response = client.post('/api/auth/register', json={
        'username': 'integrationtest',
        'email': 'integration@test.com',
        'password': 'IntegrationTest123!'
    })
    assert register_response.status_code == 201
    
    # Login
    login_response = client.post('/api/auth/login', json={
        'username': 'integrationtest',
        'password': 'IntegrationTest123!'
    })
    assert login_response.status_code == 200
    
    # Get user profile
    profile_response = client.get('/api/auth/me')
    assert profile_response.status_code == 200
    user_data = profile_response.get_json()
    assert user_data['username'] == 'integrationtest'
    
    # Change password
    password_response = client.post('/api/auth/change-password', json={
        'current_password': 'IntegrationTest123!',
        'new_password': 'NewPassword456!'
    })
    assert password_response.status_code == 200
    
    # Logout and verify new password
    client.post('/api/auth/logout')
    
    new_login_response = client.post('/api/auth/login', json={
        'username': 'integrationtest',
        'password': 'NewPassword456!'
    })
    assert new_login_response.status_code == 200
```

### Frontend Testing Setup (React/Vite)

#### 1. Install Testing Dependencies
```bash
cd frontend
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

#### 2. Configure Vitest
Create `frontend/vite.config.js`:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true
  }
})
```

Create `frontend/src/test/setup.js`:
```javascript
import '@testing-library/jest-dom'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Clean up after each test
afterEach(() => {
  cleanup()
})
```

#### 3. Sample Component Tests
Create `frontend/src/components/__tests__/LoginPage.test.jsx`:
```javascript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import LoginPage from '../LoginPage'

// Mock fetch API
global.fetch = vi.fn()

const MockedLoginPage = () => (
  <BrowserRouter>
    <LoginPage />
  </BrowserRouter>
)

describe('LoginPage', () => {
  beforeEach(() => {
    fetch.mockClear()
  })

  it('renders login form', () => {
    render(<MockedLoginPage />)
    
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('shows error on empty form submission', async () => {
    render(<MockedLoginPage />)
    
    const loginButton = screen.getByRole('button', { name: /login/i })
    fireEvent.click(loginButton)
    
    expect(await screen.findByText(/username and password are required/i)).toBeInTheDocument()
  })

  it('calls API on valid form submission', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Login successful', user: { id: 1, username: 'testuser' } })
    })

    render(<MockedLoginPage />)
    const user = userEvent.setup()
    
    await user.type(screen.getByLabelText(/username/i), 'testuser')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /login/i }))
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testuser', password: 'password123' })
      })
    })
  })

  it('displays error message on login failure', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' })
    })

    render(<MockedLoginPage />)
    const user = userEvent.setup()
    
    await user.type(screen.getByLabelText(/username/i), 'wronguser')
    await user.type(screen.getByLabelText(/password/i), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /login/i }))
    
    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument()
  })
})
```

### End-to-End Testing Setup (Playwright)

#### 1. Install Playwright
```bash
npm install --save-dev @playwright/test
npx playwright install
```

#### 2. Configure Playwright
Create `playwright.config.js`:
```javascript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5000',
    reuseExistingServer: !process.env.CI,
  },
})
```

#### 3. Sample E2E Tests
Create `e2e/auth.spec.js`:
```javascript
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('complete registration and login flow', async ({ page }) => {
    // Go to registration page
    await page.goto('/register')
    
    // Fill registration form
    await page.fill('input[name="username"]', 'e2euser')
    await page.fill('input[name="email"]', 'e2e@test.com')
    await page.fill('input[name="password"]', 'E2ETest123!')
    await page.fill('input[name="confirmPassword"]', 'E2ETest123!')
    
    // Submit registration
    await page.click('button[type="submit"]')
    
    // Should redirect to login
    await expect(page).toHaveURL('/login')
    
    // Login with new account
    await page.fill('input[name="username"]', 'e2euser')
    await page.fill('input[name="password"]', 'E2ETest123!')
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    
    // Verify user is logged in
    await expect(page.locator('text=Welcome, e2euser')).toBeVisible()
  })

  test('prevents access to protected routes', async ({ page }) => {
    // Try to access dashboard without login
    await page.goto('/dashboard')
    
    // Should redirect to login
    await expect(page).toHaveURL('/login')
  })
})
```

### Performance Testing Setup (Locust)

#### 1. Install Locust
```bash
pip install locust
```

#### 2. Create Load Test
Create `performance/locustfile.py`:
```python
from locust import HttpUser, task, between
import json

class WebsiteUser(HttpUser):
    wait_time = between(1, 5)
    
    def on_start(self):
        # Register and login once
        self.client.post("/api/auth/register", json={
            "username": f"perftest{id(self)}",
            "email": f"perf{id(self)}.com",
            "password": "PerfTest123!"
        })
        
        response = self.client.post("/api/auth/login", json={
            "username": f"perftest{id(self)}",
            "password": "PerfTest123!"
        })
        
    @task(3)
    def view_dashboard(self):
        self.client.get("/api/dashboard")
    
    @task(2)
    def view_transactions(self):
        self.client.get("/api/transactions")
    
    @task(1)
    def check_balance(self):
        self.client.get("/api/auth/me")
```

#### 3. Run Load Test
```bash
# Start Locust web UI
locust -f performance/locustfile.py --host=http://localhost:5000

# Or run headless
locust -f performance/locustfile.py --host=http://localhost:5000 --users 100 --spawn-rate 10 --time 60s
```

### Security Testing Automation

Create `security/test_security.py`:
```python
import pytest
import requests
from time import time

def test_sql_injection_attempts():
    """Test for SQL injection vulnerabilities"""
    payloads = [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "admin' --",
        "' UNION SELECT * FROM users --"
    ]
    
    for payload in payloads:
        response = requests.post('http://localhost:5000/api/auth/login', json={
            'username': payload,
            'password': 'test'
        })
        # Should not return 500 (SQL error)
        assert response.status_code != 500
        # Should not expose database structure
        assert 'syntax error' not in response.text.lower()
        assert 'sql' not in response.text.lower()

def test_rate_limiting():
    """Test if rate limiting is implemented"""
    start_time = time()
    responses = []
    
    for i in range(100):
        response = requests.post('http://localhost:5000/api/auth/login', json={
            'username': 'test',
            'password': 'wrong'
        })
        responses.append(response.status_code)
    
    # Should see rate limiting (429) after many requests
    assert 429 in responses, "No rate limiting detected!"
    
def test_security_headers():
    """Test for security headers"""
    response = requests.get('http://localhost:5000')
    headers = response.headers
    
    assert 'X-Frame-Options' in headers
    assert 'X-Content-Type-Options' in headers
    assert 'X-XSS-Protection' in headers
    assert 'Strict-Transport-Security' in headers
```

### Continuous Integration Setup

Create `.github/workflows/test.yml`:
```yaml
name: Run Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: '3.9'
    
    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
        pip install pytest pytest-cov
    
    - name: Run tests
      run: |
        cd backend
        pytest tests/ --cov=src --cov-report=xml
    
    - name: Upload coverage
      uses: codecov/codecov-action@v2

  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Run tests
      run: |
        cd frontend
        npm run test:coverage
    
    - name: Run E2E tests
      run: |
        cd frontend
        npx playwright test
```

## Running the Test Suite

### Backend Tests
```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/unit/test_auth.py

# Run with verbose output
pytest -v

# Run only marked tests
pytest -m "unit"
```

### Frontend Tests
```bash
cd frontend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e
```

### Generate Test Reports
```bash
# Backend coverage report
cd backend
pytest --cov=src --cov-report=html
open htmlcov/index.html

# Frontend coverage report
cd frontend
npm run test:coverage
open coverage/index.html
```

## Test Coverage Goals

### Minimum Coverage Requirements
- **Unit Tests:** 80% code coverage
- **Integration Tests:** All API endpoints tested
- **E2E Tests:** Critical user flows covered
- **Security Tests:** OWASP Top 10 covered

### Priority Testing Areas
1. Authentication and authorization
2. Financial transactions
3. Data validation
4. Security vulnerabilities
5. Performance bottlenecks

---

**Note:** This testing implementation should be completed BEFORE deploying to production. All critical security issues must be resolved first.