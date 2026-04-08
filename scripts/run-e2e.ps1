<#
  Automated setup + E2E test run for TraceMap Expo Web + Playwright
  - Installs dependencies
  - Installs Playwright browsers
  - Starts Expo Web in a separate process
  - Runs Playwright E2E test against the Expo Web app
  - Outputs test results to the console
#>

$ErrorActionPreference = 'Stop'

Write-Host 'Starting setup for E2E tests...'

Write-Host 'Installing dependencies...'
npm install

Write-Host 'Installing Playwright Test package...'
npm install @playwright/test

Write-Host 'Installing Playwright browsers...'
npx playwright install

Write-Host 'Launching Expo Web in background...'
Start-Process -FilePath 'cmd' -ArgumentList '/c', 'npm run start:web' -WorkingDirectory (Get-Location) -WindowStyle Hidden

Write-Host 'Waiting for Expo Web to be ready...'
Start-Sleep -Seconds 25

Write-Host 'Running Playwright E2E tests...'
npx playwright test tests/e2e/feed-e2e.spec.ts --config=playwright.config.ts --reporter list

Write-Host 'E2E test run finished.'
