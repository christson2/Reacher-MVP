/**
 * End-to-End Auth Flow Test Script
 * Tests: Signup → Login → Token Verification → Protected Route Access
 * 
 * Run with: node test-auth-flow.js
 */

const http = require('http');

const GATEWAY_URL = 'http://localhost:5000';
const AUTH_SERVICE_URL = 'http://localhost:5001';

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

/**
 * Utility: Make HTTP request
 */
function makeRequest(url, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null,
          });
        } catch (err) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * Test: Health Check
 */
async function testHealthCheck() {
  console.log('\n📋 Test 1: Gateway Health Check');
  try {
    const response = await makeRequest(`${GATEWAY_URL}/api/health`);
    if (response.status === 200 && response.body.status === 'ok') {
      console.log('✅ PASS: Gateway health check successful');
      testResults.passed++;
      testResults.tests.push({ name: 'Gateway Health Check', status: 'PASS' });
    } else {
      console.log('❌ FAIL: Gateway health check failed');
      testResults.failed++;
      testResults.tests.push({ name: 'Gateway Health Check', status: 'FAIL' });
    }
  } catch (err) {
    console.log(`❌ FAIL: ${err.message}`);
    testResults.failed++;
    testResults.tests.push({ name: 'Gateway Health Check', status: 'FAIL', error: err.message });
  }
}

/**
 * Test: Auth Service Health
 */
async function testAuthServiceHealth() {
  console.log('\n📋 Test 2: Auth Service Health Check');
  try {
    const response = await makeRequest(`${AUTH_SERVICE_URL}/health`);
    if (response.status === 200 && response.body.status === 'ok') {
      console.log('✅ PASS: Auth service health check successful');
      testResults.passed++;
      testResults.tests.push({ name: 'Auth Service Health', status: 'PASS' });
    } else {
      console.log('❌ FAIL: Auth service health check failed');
      testResults.failed++;
      testResults.tests.push({ name: 'Auth Service Health', status: 'FAIL' });
    }
  } catch (err) {
    console.log(`❌ FAIL: ${err.message}`);
    testResults.failed++;
    testResults.tests.push({ name: 'Auth Service Health', status: 'FAIL', error: err.message });
  }
}

/**
 * Test: Signup - Success
 */
async function testSignupSuccess() {
  console.log('\n📋 Test 3: Signup - New User');
  const timestamp = Date.now();
  const userData = {
    name: `Test User ${timestamp}`,
    email: `testuser${timestamp}@reacher.app`,
    password: 'TestPassword123',
    phone: '+1234567890',
  };

  try {
    const response = await makeRequest(`${GATEWAY_URL}/api/auth/signup`, 'POST', userData);
    if (response.status === 201 && response.body.success && response.body.token) {
      console.log(`✅ PASS: Signup successful`);
      console.log(`   User ID: ${response.body.user.id}`);
      console.log(`   Email: ${response.body.user.email}`);
      console.log(`   Token: ${response.body.token.substring(0, 20)}...`);
      testResults.passed++;
      testResults.tests.push({ name: 'Signup Success', status: 'PASS', token: response.body.token, userId: response.body.user.id });
      return { success: true, token: response.body.token, userId: response.body.user.id, email: userData.email, password: userData.password };
    } else {
      console.log(`❌ FAIL: Signup failed - ${response.body.error || 'Unknown error'}`);
      testResults.failed++;
      testResults.tests.push({ name: 'Signup Success', status: 'FAIL', error: response.body.error });
      return { success: false };
    }
  } catch (err) {
    console.log(`❌ FAIL: ${err.message}`);
    testResults.failed++;
    testResults.tests.push({ name: 'Signup Success', status: 'FAIL', error: err.message });
    return { success: false };
  }
}

/**
 * Test: Signup - Duplicate Email
 */
async function testSignupDuplicate() {
  console.log('\n📋 Test 4: Signup - Duplicate Email');
  const userData = {
    name: 'Duplicate Test',
    email: 'duplicate@reacher.app',
    password: 'TestPassword123',
  };

  try {
    // First signup
    await makeRequest(`${GATEWAY_URL}/api/auth/signup`, 'POST', userData);

    // Second signup with same email
    const response = await makeRequest(`${GATEWAY_URL}/api/auth/signup`, 'POST', userData);
    if (response.status === 409) {
      console.log(`✅ PASS: Duplicate email correctly rejected`);
      testResults.passed++;
      testResults.tests.push({ name: 'Signup Duplicate', status: 'PASS' });
    } else {
      console.log(`❌ FAIL: Expected 409, got ${response.status}`);
      testResults.failed++;
      testResults.tests.push({ name: 'Signup Duplicate', status: 'FAIL' });
    }
  } catch (err) {
    console.log(`❌ FAIL: ${err.message}`);
    testResults.failed++;
    testResults.tests.push({ name: 'Signup Duplicate', status: 'FAIL', error: err.message });
  }
}

/**
 * Test: Signup - Invalid Email
 */
async function testSignupInvalidEmail() {
  console.log('\n📋 Test 5: Signup - Invalid Email');
  const userData = {
    name: 'Invalid Email Test',
    email: 'not-an-email',
    password: 'TestPassword123',
  };

  try {
    const response = await makeRequest(`${GATEWAY_URL}/api/auth/signup`, 'POST', userData);
    if (response.status === 400) {
      console.log(`✅ PASS: Invalid email correctly rejected`);
      testResults.passed++;
      testResults.tests.push({ name: 'Signup Invalid Email', status: 'PASS' });
    } else {
      console.log(`❌ FAIL: Expected 400, got ${response.status}`);
      testResults.failed++;
      testResults.tests.push({ name: 'Signup Invalid Email', status: 'FAIL' });
    }
  } catch (err) {
    console.log(`❌ FAIL: ${err.message}`);
    testResults.failed++;
    testResults.tests.push({ name: 'Signup Invalid Email', status: 'FAIL', error: err.message });
  }
}

/**
 * Test: Signup - Password Too Short
 */
async function testSignupShortPassword() {
  console.log('\n📋 Test 6: Signup - Password Too Short');
  const userData = {
    name: 'Short Password Test',
    email: 'short@reacher.app',
    password: 'short',
  };

  try {
    const response = await makeRequest(`${GATEWAY_URL}/api/auth/signup`, 'POST', userData);
    if (response.status === 400) {
      console.log(`✅ PASS: Short password correctly rejected`);
      testResults.passed++;
      testResults.tests.push({ name: 'Signup Short Password', status: 'PASS' });
    } else {
      console.log(`❌ FAIL: Expected 400, got ${response.status}`);
      testResults.failed++;
      testResults.tests.push({ name: 'Signup Short Password', status: 'FAIL' });
    }
  } catch (err) {
    console.log(`❌ FAIL: ${err.message}`);
    testResults.failed++;
    testResults.tests.push({ name: 'Signup Short Password', status: 'FAIL', error: err.message });
  }
}

/**
 * Test: Login - Success
 */
async function testLoginSuccess(credentials) {
  console.log('\n📋 Test 7: Login - Valid Credentials');
  try {
    const response = await makeRequest(`${GATEWAY_URL}/api/auth/login`, 'POST', {
      email: credentials.email,
      password: credentials.password,
    });

    if (response.status === 200 && response.body.success && response.body.token) {
      console.log(`✅ PASS: Login successful`);
      console.log(`   User ID: ${response.body.user.id}`);
      console.log(`   Token: ${response.body.token.substring(0, 20)}...`);
      testResults.passed++;
      testResults.tests.push({ name: 'Login Success', status: 'PASS', token: response.body.token });
      return { success: true, token: response.body.token };
    } else {
      console.log(`❌ FAIL: Login failed - ${response.body.error}`);
      testResults.failed++;
      testResults.tests.push({ name: 'Login Success', status: 'FAIL' });
      return { success: false };
    }
  } catch (err) {
    console.log(`❌ FAIL: ${err.message}`);
    testResults.failed++;
    testResults.tests.push({ name: 'Login Success', status: 'FAIL', error: err.message });
    return { success: false };
  }
}

/**
 * Test: Login - Invalid Password
 */
async function testLoginInvalidPassword() {
  console.log('\n📋 Test 8: Login - Invalid Password');
  try {
    const response = await makeRequest(`${GATEWAY_URL}/api/auth/login`, 'POST', {
      email: 'testuser@reacher.app',
      password: 'WrongPassword123',
    });

    if (response.status === 401) {
      console.log(`✅ PASS: Invalid password correctly rejected`);
      testResults.passed++;
      testResults.tests.push({ name: 'Login Invalid Password', status: 'PASS' });
    } else {
      console.log(`❌ FAIL: Expected 401, got ${response.status}`);
      testResults.failed++;
      testResults.tests.push({ name: 'Login Invalid Password', status: 'FAIL' });
    }
  } catch (err) {
    console.log(`❌ FAIL: ${err.message}`);
    testResults.failed++;
    testResults.tests.push({ name: 'Login Invalid Password', status: 'FAIL', error: err.message });
  }
}

/**
 * Test: Token Verification - Valid Token
 */
async function testTokenVerificationValid(token) {
  console.log('\n📋 Test 9: Token Verification - Valid Token');
  try {
    const response = await makeRequest(
      `${GATEWAY_URL}/api/auth/verify`,
      'POST',
      null,
      { Authorization: `Bearer ${token}` }
    );

    if (response.status === 200 && response.body.success && response.body.user) {
      console.log(`✅ PASS: Token verification successful`);
      console.log(`   User ID: ${response.body.user.userId}`);
      testResults.passed++;
      testResults.tests.push({ name: 'Token Verification Valid', status: 'PASS' });
    } else {
      console.log(`❌ FAIL: Token verification failed`);
      testResults.failed++;
      testResults.tests.push({ name: 'Token Verification Valid', status: 'FAIL' });
    }
  } catch (err) {
    console.log(`❌ FAIL: ${err.message}`);
    testResults.failed++;
    testResults.tests.push({ name: 'Token Verification Valid', status: 'FAIL', error: err.message });
  }
}

/**
 * Test: Token Verification - Invalid Token
 */
async function testTokenVerificationInvalid() {
  console.log('\n📋 Test 10: Token Verification - Invalid Token');
  try {
    const response = await makeRequest(
      `${GATEWAY_URL}/api/auth/verify`,
      'POST',
      null,
      { Authorization: 'Bearer invalid.token.here' }
    );

    if (response.status === 403) {
      console.log(`✅ PASS: Invalid token correctly rejected`);
      testResults.passed++;
      testResults.tests.push({ name: 'Token Verification Invalid', status: 'PASS' });
    } else {
      console.log(`❌ FAIL: Expected 403, got ${response.status}`);
      testResults.failed++;
      testResults.tests.push({ name: 'Token Verification Invalid', status: 'FAIL' });
    }
  } catch (err) {
    console.log(`❌ FAIL: ${err.message}`);
    testResults.failed++;
    testResults.tests.push({ name: 'Token Verification Invalid', status: 'FAIL', error: err.message });
  }
}

/**
 * Test: Token Verification - No Token
 */
async function testTokenVerificationNoToken() {
  console.log('\n📋 Test 11: Token Verification - No Token');
  try {
    const response = await makeRequest(`${GATEWAY_URL}/api/auth/verify`, 'POST');

    if (response.status === 401) {
      console.log(`✅ PASS: Missing token correctly rejected`);
      testResults.passed++;
      testResults.tests.push({ name: 'Token Verification No Token', status: 'PASS' });
    } else {
      console.log(`❌ FAIL: Expected 401, got ${response.status}`);
      testResults.failed++;
      testResults.tests.push({ name: 'Token Verification No Token', status: 'FAIL' });
    }
  } catch (err) {
    console.log(`❌ FAIL: ${err.message}`);
    testResults.failed++;
    testResults.tests.push({ name: 'Token Verification No Token', status: 'FAIL', error: err.message });
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('════════════════════════════════════════════════════');
  console.log('  Reacher Auth Flow - End-to-End Test Suite');
  console.log('════════════════════════════════════════════════════');

  // Health checks
  await testHealthCheck();
  await testAuthServiceHealth();

  // Signup tests
  const signupResult = await testSignupSuccess();
  await testSignupDuplicate();
  await testSignupInvalidEmail();
  await testSignupShortPassword();

  // Login tests
  let loginToken = null;
  if (signupResult.success) {
    const loginResult = await testLoginSuccess(signupResult);
    if (loginResult.success) {
      loginToken = loginResult.token;
    }
  }
  await testLoginInvalidPassword();

  // Token verification tests
  if (loginToken) {
    await testTokenVerificationValid(loginToken);
  }
  await testTokenVerificationInvalid();
  await testTokenVerificationNoToken();

  // Summary
  console.log('\n════════════════════════════════════════════════════');
  console.log('  Test Summary');
  console.log('════════════════════════════════════════════════════');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Total:  ${testResults.passed + testResults.failed}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
  console.log('════════════════════════════════════════════════════\n');

  // Detailed results
  console.log('Test Results:');
  testResults.tests.forEach((test, index) => {
    const icon = test.status === 'PASS' ? '✅' : '❌';
    console.log(`${index + 1}. ${icon} ${test.name}`);
    if (test.error) {
      console.log(`   Error: ${test.error}`);
    }
  });
}

// Run all tests
runTests().catch(console.error);
