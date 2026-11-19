# deploy.ps1 - Automated Cloudflare Wrangler Deployment Script

$ErrorActionPreference = "Stop"

try {
    Write-Host "Starting Cloudflare Worker deployment..." -ForegroundColor Cyan

    # Optional: Set environment variables if needed for authentication
    # $env:CLOUDFLARE_API_TOKEN = "your_api_token_here"
    # $env:CLOUDFLARE_ACCOUNT_ID = "your_account_id_here"

    # Check if node_modules exists or install dependencies if package.json is present
    if (Test-Path "package.json") {
        Write-Host "Installing dependencies..." -ForegroundColor Yellow
        npm install
    }

    # Run the wrangler deploy command via npx
    Write-Host "Deploying worker via Wrangler..." -ForegroundColor Green
    npx wrangler deploy

    Write-Host "Deployment completed successfully!" -ForegroundColor Cyan
}
catch {
    Write-Host "Deployment failed: $_" -ForegroundColor Red
}
finally {
    Write-Host ""
    Write-Host "Press any key to close this window..." -ForegroundColor DarkGray
    $null = $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
