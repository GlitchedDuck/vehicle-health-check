# ==============================================================
# DriveWell v3 - CLEAN GitHub Deployment
# Deletes the existing repository working tree before copying v3.
# Preserves ONLY the .git folder.
# ==============================================================

$ErrorActionPreference = "Continue"

$RepoUrl  = "https://github.com/GlitchedDuck/vehicle-health-check.git"
$Branch   = "main"
$ZipPath  = "$env:USERPROFILE\Downloads\drivewell-platform-v3-clean.zip"
$Root     = "$env:TEMP\drivewell-v3-clean-deploy"
$BuildDir = Join-Path $Root "build"
$RepoDir  = Join-Path $Root "repo"

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " DriveWell v3 - Clean GitHub Deployment" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Git is not installed or not in PATH." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $ZipPath)) {
    Write-Host "ERROR: Could not find:" -ForegroundColor Red
    Write-Host "  $ZipPath"
    Write-Host ""
    Write-Host "Download drivewell-platform-v3-clean.zip into your Downloads folder first."
    exit 1
}

Write-Host "[1/7] Preparing a fresh deployment workspace..." -ForegroundColor Yellow
if (Test-Path $Root) {
    Remove-Item $Root -Recurse -Force -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Path $BuildDir -Force | Out-Null

Write-Host "[2/7] Extracting DriveWell v3..." -ForegroundColor Yellow
try {
    Expand-Archive -Path $ZipPath -DestinationPath $BuildDir -Force
}
catch {
    Write-Host "ERROR extracting ZIP:" -ForegroundColor Red
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

Write-Host "[3/7] Cloning the current GitHub repository..." -ForegroundColor Yellow
git clone --branch $Branch $RepoUrl $RepoDir
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: git clone failed." -ForegroundColor Red
    exit 1
}

Write-Host "[4/7] Removing ALL existing repository files..." -ForegroundColor Yellow
Write-Host "      (.git is preserved so this remains the same repository)" -ForegroundColor DarkGray

Get-ChildItem -LiteralPath $RepoDir -Force |
    Where-Object { $_.Name -ne ".git" } |
    Remove-Item -Recurse -Force

$Remaining = Get-ChildItem -LiteralPath $RepoDir -Force |
    Where-Object { $_.Name -ne ".git" }

if ($Remaining) {
    Write-Host "ERROR: The old working tree was not fully removed." -ForegroundColor Red
    $Remaining | ForEach-Object { Write-Host "  $($_.FullName)" }
    exit 1
}

Write-Host "      Old GitHub working tree cleared." -ForegroundColor Green

Write-Host "[5/7] Copying the clean DriveWell v3 build..." -ForegroundColor Yellow
Get-ChildItem -LiteralPath $BuildDir -Force | ForEach-Object {
    Copy-Item $_.FullName -Destination $RepoDir -Recurse -Force
}

Set-Location $RepoDir

Write-Host "[6/7] Staging the clean snapshot..." -ForegroundColor Yellow
git add -A

Write-Host ""
Write-Host "Git changes:" -ForegroundColor Cyan
git status --short
Write-Host ""

$Pending = git diff --cached --name-only
if (-not $Pending) {
    Write-Host "No Git changes were detected." -ForegroundColor Yellow
    exit 0
}

Write-Host "[7/7] Committing and pushing DriveWell v3..." -ForegroundColor Yellow
git commit -m "Clean rebuild: DriveWell premium v3"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Commit failed." -ForegroundColor Red
    exit 1
}

git push origin $Branch
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Push failed. The commit still exists locally at:" -ForegroundColor Red
    Write-Host "  $RepoDir"
    exit 1
}

Write-Host ""
Write-Host "====================================================" -ForegroundColor Green
Write-Host " DRIVEWELL V3 DEPLOYED" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Repository:"
Write-Host "https://github.com/GlitchedDuck/vehicle-health-check"
Write-Host ""
Write-Host "Live site:"
Write-Host "https://glitchedduck.github.io/vehicle-health-check/?drivewell=v3"
Write-Host ""
Write-Host "This deployment was a CLEAN replacement of the repository working tree."
Write-Host ""
