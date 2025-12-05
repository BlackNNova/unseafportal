# Execute Withdrawal Transaction Trigger via Supabase Management API
# Date: 2025-10-08
# LogID: L0074

$ErrorActionPreference = "Stop"

# Supabase details from PROJECT_LOG.md
$SUPABASE_PROJECT_REF = "qghsyyyompjuxjtbqiuk"
$SUPABASE_ACCESS_TOKEN = "sbp_7abffd8ecc76a3bdad1c69db8c6e2a70aa3202c5"

Write-Host "Starting trigger execution via Supabase Management API..." -ForegroundColor Cyan
Write-Host ""

# Read SQL file
$sqlFile = "create_withdrawal_transaction_trigger.sql"
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
    Write-Host "SUCCESS! Withdrawal transaction triggers installed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Verify trigger installation in Supabase Dashboard" -ForegroundColor White
    Write-Host "   2. Create a test withdrawal through the app" -ForegroundColor White
    Write-Host "   3. Check transactions table for corresponding debit record" -ForegroundColor White
    
} catch {
    Write-Host "Error executing SQL:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Fallback: Execute manually via Supabase Dashboard" -ForegroundColor Yellow
    Write-Host "   1. Go to: https://supabase.com/dashboard/project/$SUPABASE_PROJECT_REF/sql/new" -ForegroundColor White
    Write-Host "   2. Open: database/create_withdrawal_transaction_trigger.sql" -ForegroundColor White
    Write-Host "   3. Copy entire contents and paste into SQL Editor" -ForegroundColor White
    Write-Host "   4. Click RUN" -ForegroundColor White
    Write-Host ""
    Write-Host "   See: database/EXECUTE_TRIGGER_GUIDE.md for detailed instructions" -ForegroundColor Gray
    exit 1
}
