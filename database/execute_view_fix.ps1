# Execute Admin Withdrawals View Fix
# Date: 2025-10-08
# LogID: L0076

$ErrorActionPreference = "Stop"

# Supabase details from PROJECT_LOG.md
$SUPABASE_PROJECT_REF = "qghsyyyompjuxjtbqiuk"
$SUPABASE_ACCESS_TOKEN = "sbp_7abffd8ecc76a3bdad1c69db8c6e2a70aa3202c5"

Write-Host "Starting admin withdrawals view fix via Supabase Management API..." -ForegroundColor Cyan
Write-Host ""

# Read SQL file
$sqlFile = "fix_admin_withdrawals_view_user_name.sql"
Write-Host "Reading SQL file: $sqlFile" -ForegroundColor Yellow
$sqlContent = Get-Content $sqlFile -Raw

# Clean up SQL - remove comments and extra whitespace
$cleanSql = $sqlContent -replace '(?m)^--.*$', '' -replace '(?ms)/\*.*?\*/', ''

Write-Host "SQL file loaded" -ForegroundColor Green
Write-Host ""

# Execute via Supabase Management API
$apiUrl = "https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_REF/database/query"

$headers = @{
    "Authorization" = "Bearer $SUPABASE_ACCESS_TOKEN"
    "Content-Type" = "application/json"
}

$body = @{
    query = $cleanSql
} | ConvertTo-Json

Write-Host "Executing SQL via Supabase Management API..." -ForegroundColor Yellow
Write-Host "   Project: $SUPABASE_PROJECT_REF" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Headers $headers -Body $body
    
    Write-Host "SQL executed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 5
    
    Write-Host ""
    Write-Host "SUCCESS! Admin withdrawals view updated with client names!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Log in to admin panel" -ForegroundColor White
    Write-Host "   2. Navigate to Withdrawals page" -ForegroundColor White
    Write-Host "   3. Click on any withdrawal to view details" -ForegroundColor White
    Write-Host "   4. Verify client name appears in User Information section" -ForegroundColor White
    
} catch {
    Write-Host "Error executing SQL:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Fallback: Execute manually via Supabase Dashboard" -ForegroundColor Yellow
    Write-Host "   1. Go to: https://supabase.com/dashboard/project/$SUPABASE_PROJECT_REF/sql/new" -ForegroundColor White
    Write-Host "   2. Open: database/fix_admin_withdrawals_view_user_name.sql" -ForegroundColor White
    Write-Host "   3. Copy entire contents and paste into SQL Editor" -ForegroundColor White
    Write-Host "   4. Click RUN" -ForegroundColor White
    exit 1
}
