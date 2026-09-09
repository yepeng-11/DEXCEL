# Auth flow e2e check (dev only; ASCII-only for Windows PowerShell 5.1 compatibility)
$ErrorActionPreference = 'Stop'

function Post($uri, $body, $session) {
    Invoke-WebRequest -Uri $uri -Method Post -Body ($body | ConvertTo-Json) `
        -ContentType 'application/json' -WebSession $session -UseBasicParsing
}

$base = 'http://localhost:3000'
$pass = 0; $fail = 0

function Check($name, $condition, $detail = '') {
    if ($condition) { $script:pass++; Write-Output "PASS  $name" }
    else { $script:fail++; Write-Output "FAIL  $name  $detail" }
}

# 1. admin logs in as admin
$s1 = New-Object Microsoft.PowerShell.Commands.WebRequestSession
try {
    $r = Post "$base/api/auth/login" @{ username = 'admin'; password = '123456'; role = 'admin' } $s1
    $ok = ($r.StatusCode -eq 200) -and (($r.Content | ConvertFrom-Json).user.role -eq 'admin')
    Check 'admin login as admin' $ok $r.Content
} catch { Check 'admin login as admin' $false $_.Exception.Message }

# 2. admin with wrong role is rejected
$s2 = New-Object Microsoft.PowerShell.Commands.WebRequestSession
try {
    Post "$base/api/auth/login" @{ username = 'admin'; password = '123456'; role = 'user' } $s2 | Out-Null
    Check 'admin wrong role rejected' $false ' unexpectedly succeeded'
} catch {
    Check 'admin wrong role rejected' ($_.Exception.Response.StatusCode.value__ -eq 401) $_.ErrorDetails.Message
}

# 3. user logs in as user
$s3 = New-Object Microsoft.PowerShell.Commands.WebRequestSession
try {
    $r = Post "$base/api/auth/login" @{ username = 'user'; password = '123456'; role = 'user' } $s3
    $ok = ($r.StatusCode -eq 200) -and (($r.Content | ConvertFrom-Json).user.role -eq 'user')
    Check 'user login as user' $ok $r.Content
} catch { Check 'user login as user' $false $_.Exception.Message }

# 4. wrong password rejected
$s4 = New-Object Microsoft.PowerShell.Commands.WebRequestSession
try {
    Post "$base/api/auth/login" @{ username = 'admin'; password = 'wrong'; role = 'admin' } $s4 | Out-Null
    Check 'wrong password rejected' $false ' unexpectedly succeeded'
} catch {
    Check 'wrong password rejected' ($_.Exception.Response.StatusCode.value__ -eq 401) $_.ErrorDetails.Message
}

# 5. me returns current user with session
try {
    $r = Invoke-WebRequest -Uri "$base/api/auth/me" -WebSession $s1 -UseBasicParsing
    $name = ($r.Content | ConvertFrom-Json).user.username
    Check 'me returns current user' ($name -eq 'admin') $r.Content
} catch { Check 'me returns current user' $false $_.Exception.Message }

# 6. me without session returns 401
try {
    Invoke-WebRequest -Uri "$base/api/auth/me" -UseBasicParsing | Out-Null
    Check 'me without session returns 401' $false ' unexpectedly succeeded'
} catch {
    Check 'me without session returns 401' ($_.Exception.Response.StatusCode.value__ -eq 401) ''
}

# 7. me invalid after logout
try {
    Post "$base/api/auth/logout" @{} $s1 | Out-Null
    Invoke-WebRequest -Uri "$base/api/auth/me" -WebSession $s1 -UseBasicParsing | Out-Null
    Check 'me invalid after logout' $false ' unexpectedly succeeded'
} catch {
    Check 'me invalid after logout' ($_.Exception.Response.StatusCode.value__ -eq 401) ''
}

Write-Output "----"
Write-Output "pass=$pass fail=$fail"
