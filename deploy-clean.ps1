$ErrorActionPreference = "Continue"
$RepoUrl  = "https://github.com/GlitchedDuck/vehicle-health-check.git"
$Branch   = "main"
$ZipPath  = "$env:USERPROFILE\Downloads\drivewell-platform-v4-clean.zip"
$Root     = "$env:TEMP\drivewell-v4-clean-deploy"
$BuildDir = Join-Path $Root "build"
$RepoDir  = Join-Path $Root "repo"

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " DriveWell v4 - CLEAN GitHub Deployment" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Git is not installed or not available in PATH." -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $ZipPath)) {
    Write-Host "ERROR: Cannot find $ZipPath" -ForegroundColor Red
    Write-Host "Download drivewell-platform-v4-clean.zip into Downloads first."
    exit 1
}

Write-Host "[1/7] Creating fresh temporary workspace..." -ForegroundColor Yellow
if (Test-Path $Root) { Remove-Item $Root -Recurse -Force -ErrorAction SilentlyContinue }
New-Item -ItemType Directory -Path $BuildDir -Force | Out-Null

Write-Host "[2/7] Extracting DriveWell v4..." -ForegroundColor Yellow
try { Expand-Archive -Path $ZipPath -DestinationPath $BuildDir -Force }
catch { Write-Host $_.Exception.Message -ForegroundColor Red; exit 1 }

$Required = @("index.html","app.js","styles.css","README.md",".nojekyll","assets\lowpoly_generic_suv.glb")
foreach ($Relative in $Required) {
    if (-not (Test-Path (Join-Path $BuildDir $Relative))) {
        Write-Host "ERROR: Build missing $Relative" -ForegroundColor Red
        exit 1
    }
}

Write-Host "[3/7] Cloning GitHub repository..." -ForegroundColor Yellow
git clone --branch $Branch $RepoUrl $RepoDir
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: Clone failed." -ForegroundColor Red; exit 1 }

Write-Host "[4/7] Deleting old GitHub working tree..." -ForegroundColor Yellow
Get-ChildItem -LiteralPath $RepoDir -Force | Where-Object { $_.Name -ne ".git" } | Remove-Item -Recurse -Force
$Remaining = Get-ChildItem -LiteralPath $RepoDir -Force | Where-Object { $_.Name -ne ".git" }
if ($Remaining) { Write-Host "ERROR: Old files remain." -ForegroundColor Red; exit 1 }
Write-Host "      Old working tree completely removed." -ForegroundColor Green

Write-Host "[5/7] Copying clean v4 snapshot..." -ForegroundColor Yellow
Get-ChildItem -LiteralPath $BuildDir -Force | ForEach-Object { Copy-Item $_.FullName -Destination $RepoDir -Recurse -Force }

Set-Location $RepoDir
Write-Host "[6/7] Staging clean replacement..." -ForegroundColor Yellow
git add -A
git status --short
if (-not (git diff --cached --name-only)) { Write-Host "No changes detected." -ForegroundColor Yellow; exit 0 }

Write-Host "[7/7] Committing and pushing..." -ForegroundColor Yellow
git commit -m "Clean rebuild: DriveWell premium v4"
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: Commit failed." -ForegroundColor Red; exit 1 }
git push origin $Branch
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: Push failed. Local commit remains at $RepoDir" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "====================================================" -ForegroundColor Green
Write-Host " DRIVEWELL V4 DEPLOYED" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""
Write-Host "https://glitchedduck.github.io/vehicle-health-check/?drivewell=v4"
Write-Host ""
Write-Host "GitHub was cleanly replaced: everything except .git was deleted first."
