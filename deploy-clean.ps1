$ErrorActionPreference = "Continue"

$RepoUrl  = "https://github.com/GlitchedDuck/vehicle-health-check.git"
$Branch   = "main"
$ZipPath  = "$env:USERPROFILE\Downloads\drivewell-platform-v5-clean.zip"
$Root     = "$env:TEMP\drivewell-v5-clean-deploy"
$BuildDir = Join-Path $Root "build"
$RepoDir  = Join-Path $Root "repo"

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " DriveWell v5 - CLEAN GitHub Deployment" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Git is not installed or unavailable in PATH." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $ZipPath)) {
    Write-Host "ERROR: Cannot find:" -ForegroundColor Red
    Write-Host "  $ZipPath"
    Write-Host "Download drivewell-platform-v5-clean.zip into Downloads first."
    exit 1
}

Write-Host "[1/7] Creating fresh temporary workspace..." -ForegroundColor Yellow
if (Test-Path $Root) {
    Remove-Item $Root -Recurse -Force -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Path $BuildDir -Force | Out-Null

Write-Host "[2/7] Extracting DriveWell v5..." -ForegroundColor Yellow
try {
    Expand-Archive -Path $ZipPath -DestinationPath $BuildDir -Force
}
catch {
    Write-Host "ERROR extracting build:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

$Required = @(
    "index.html",
    "app.js",
    "styles.css",
    "README.md",
    ".nojekyll",
    "assets\lowpoly_generic_suv.glb"
)

foreach ($Relative in $Required) {
    if (-not (Test-Path (Join-Path $BuildDir $Relative))) {
        Write-Host "ERROR: Build is missing $Relative" -ForegroundColor Red
        exit 1
    }
}

Write-Host "[3/7] Cloning GitHub repository..." -ForegroundColor Yellow
git clone --branch $Branch $RepoUrl $RepoDir
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: git clone failed." -ForegroundColor Red
    exit 1
}

Write-Host "[4/7] Removing ALL old application files..." -ForegroundColor Yellow
Write-Host "      Preserving .git only." -ForegroundColor DarkGray

Get-ChildItem -LiteralPath $RepoDir -Force |
    Where-Object { $_.Name -ne ".git" } |
    Remove-Item -Recurse -Force

$Remaining = Get-ChildItem -LiteralPath $RepoDir -Force |
    Where-Object { $_.Name -ne ".git" }

if ($Remaining) {
    Write-Host "ERROR: Old working tree was not fully removed." -ForegroundColor Red
    $Remaining | ForEach-Object { Write-Host "  $($_.FullName)" }
    exit 1
}

Write-Host "      Old repository working tree cleared." -ForegroundColor Green

Write-Host "[5/7] Copying clean DriveWell v5 snapshot..." -ForegroundColor Yellow
Get-ChildItem -LiteralPath $BuildDir -Force | ForEach-Object {
    Copy-Item $_.FullName -Destination $RepoDir -Recurse -Force
}

Set-Location $RepoDir

Write-Host "[6/7] Staging replacement..." -ForegroundColor Yellow
git add -A
git status --short

$Pending = git diff --cached --name-only
if (-not $Pending) {
    Write-Host "No Git changes detected." -ForegroundColor Yellow
    exit 0
}

Write-Host "[7/7] Committing and pushing..." -ForegroundColor Yellow
git commit -m "Clean rebuild: DriveWell premium v5"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Commit failed." -ForegroundColor Red
    exit 1
}

git push origin $Branch
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Push failed." -ForegroundColor Red
    Write-Host "Local commit remains at:"
    Write-Host "  $RepoDir"
    exit 1
}

Write-Host ""
Write-Host "====================================================" -ForegroundColor Green
Write-Host " DRIVEWELL V5 DEPLOYED" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Live site:"
Write-Host "https://glitchedduck.github.io/vehicle-health-check/?drivewell=v5"
Write-Host ""
Write-Host "This was a clean repository replacement; all old app files were deleted first."
Write-Host ""
