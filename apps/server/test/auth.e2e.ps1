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

# 2. admin can also enter user view (role rule updated)
$s2 = New-Object Microsoft.PowerShell.Commands.WebRequestSession
try {
    $r = Post "$base/api/auth/login" @{ username = 'admin'; password = '123456'; role = 'user' } $s2
    Check 'admin login as user view' ($r.StatusCode -eq 200) $r.Content
} catch { Check 'admin login as user view' $false $_.Exception.Message }

# 3. user logs in as user
$s3 = New-Object Microsoft.PowerShell.Commands.WebRequestSession
try {
    $r = Post "$base/api/auth/login" @{ username = 'user'; password = '123456'; role = 'user' } $s3
    $ok = ($r.StatusCode -eq 200) -and (($r.Content | ConvertFrom-Json).user.role -eq 'user')
    Check 'user login as user' $ok $r.Content
} catch { Check 'user login as user' $false $_.Exception.Message }

# 4. user cannot enter admin view
$s4 = New-Object Microsoft.PowerShell.Commands.WebRequestSession
try {
    Post "$base/api/auth/login" @{ username = 'user'; password = '123456'; role = 'admin' } $s4 | Out-Null
    Check 'user cannot enter admin view' $false ' unexpectedly succeeded'
} catch {
    Check 'user cannot enter admin view' ($_.Exception.Response.StatusCode.value__ -eq 401) $_.ErrorDetails.Message
}

# 5. wrong password rejected
$s5 = New-Object Microsoft.PowerShell.Commands.WebRequestSession
try {
    Post "$base/api/auth/login" @{ username = 'admin'; password = 'wrong'; role = 'admin' } $s5 | Out-Null
    Check 'wrong password rejected' $false ' unexpectedly succeeded'
} catch {
    Check 'wrong password rejected' ($_.Exception.Response.StatusCode.value__ -eq 401) $_.ErrorDetails.Message
}

# 6. register a new user, session works
$s6 = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$stamp = Get-Date -Format 'yyyyMMddHHmmss'
$newUser = "t$stamp"
try {
    $r = Post "$base/api/auth/register" @{ username = $newUser; password = 'abc12345'; displayName = 'TempUser' } $s6
    $body = $r.Content | ConvertFrom-Json
    $ok = ($r.StatusCode -eq 200) -and ($body.user.role -eq 'user') -and ($body.user.username -eq $newUser)
    Check 'register creates user + session' $ok $r.Content
} catch { Check 'register creates user + session' $false $_.Exception.Message }

# 7. registered user session via me
try {
    $r = Invoke-WebRequest -Uri "$base/api/auth/me" -WebSession $s6 -UseBasicParsing
    $body = $r.Content | ConvertFrom-Json
    Check 'registered session me works' (($body.user.username -eq $newUser) -and ($body.user.displayName -eq 'TempUser')) $r.Content
} catch { Check 'registered session me works' $false $_.Exception.Message }

# 8. duplicate register rejected
try {
    Post "$base/api/auth/register" @{ username = $newUser; password = 'abc12345' } (New-Object Microsoft.PowerShell.Commands.WebRequestSession) | Out-Null
    Check 'duplicate register rejected' $false ' unexpectedly succeeded'
} catch {
    Check 'duplicate register rejected' ($_.Exception.Response.StatusCode.value__ -eq 401) $_.ErrorDetails.Message
}

# 9. short password rejected
try {
    Post "$base/api/auth/register" @{ username = "s$stamp"; password = '123' } (New-Object Microsoft.PowerShell.Commands.WebRequestSession) | Out-Null
    Check 'short password rejected' $false ' unexpectedly succeeded'
} catch {
    Check 'short password rejected' ($_.Exception.Response.StatusCode.value__ -eq 401) $_.ErrorDetails.Message
}

# 10. me without session returns 401
try {
    Invoke-WebRequest -Uri "$base/api/auth/me" -UseBasicParsing | Out-Null
    Check 'me without session returns 401' $false ' unexpectedly succeeded'
} catch {
    Check 'me without session returns 401' ($_.Exception.Response.StatusCode.value__ -eq 401) ''
}

# 11. me invalid after logout
try {
    Post "$base/api/auth/logout" @{} $s1 | Out-Null
    Invoke-WebRequest -Uri "$base/api/auth/me" -WebSession $s1 -UseBasicParsing | Out-Null
    Check 'me invalid after logout' $false ' unexpectedly succeeded'
} catch {
    Check 'me invalid after logout' ($_.Exception.Response.StatusCode.value__ -eq 401) ''
}

Write-Output "----"
Write-Output "pass=$pass fail=$fail"
