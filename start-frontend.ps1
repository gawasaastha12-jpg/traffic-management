# Refresh PATH to pick up newly installed global Node.js/npm
Write-Host "Refreshing PATH environment variables..." -ForegroundColor Cyan
$env:PATH = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Verify node is available
if ($null -eq (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is still not found in the path. Please ensure Node.js is installed."
    Exit
}

Write-Host "Running npm install..." -ForegroundColor Cyan
npm install

Write-Host "Starting Next.js frontend dev server..." -ForegroundColor Green
npm run dev
