# Test Auth Service endpoints

Write-Host "=== Testing Auth Service ===" -ForegroundColor Green
Write-Host ""

# Test Health Endpoint
Write-Host "1. Testing Health Endpoint..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5001/health" -Method GET
    Write-Host "✓ Health: $($health | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "✗ Health endpoint failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test Signup
Write-Host "2. Testing Signup Endpoint..." -ForegroundColor Cyan
try {
    $body = @{
        name = "John Doe"
        email = "john@reacher.app"
        password = "password123"
    } | ConvertTo-Json

    $signup = Invoke-RestMethod -Uri "http://localhost:5001/auth/signup" -Method POST `
        -Headers @{"Content-Type" = "application/json"} -Body $body
    
    Write-Host "✓ Signup Response:" -ForegroundColor Green
    Write-Host ($signup | ConvertTo-Json -Depth 10) -ForegroundColor Green
    
    $userId = $signup.user.id
    $token = $signup.token
} catch {
    Write-Host "✗ Signup failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test Login
Write-Host "3. Testing Login Endpoint..." -ForegroundColor Cyan
try {
    $body = @{
        email = "john@reacher.app"
        password = "password123"
    } | ConvertTo-Json

    $login = Invoke-RestMethod -Uri "http://localhost:5001/auth/login" -Method POST `
        -Headers @{"Content-Type" = "application/json"} -Body $body
    
    Write-Host "✓ Login Response:" -ForegroundColor Green
    Write-Host ($login | ConvertTo-Json -Depth 10) -ForegroundColor Green
    
    $loginToken = $login.token
} catch {
    Write-Host "✗ Login failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test Token Verification
Write-Host "4. Testing Token Verification..." -ForegroundColor Cyan
try {
    if ($token) {
        $verify = Invoke-RestMethod -Uri "http://localhost:5001/auth/verify" -Method POST `
            -Headers @{"Authorization" = "Bearer $token"}
        
        Write-Host "✓ Token Verification Response:" -ForegroundColor Green
        Write-Host ($verify | ConvertTo-Json -Depth 10) -ForegroundColor Green
    } else {
        Write-Host "⚠ No token available from signup" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Token verification failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Tests Complete ===" -ForegroundColor Green
