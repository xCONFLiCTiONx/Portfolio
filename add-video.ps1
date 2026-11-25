<#
.SYNOPSIS
    Quickly adds a YouTube project video to portfolio.config.json (auto-fetching title via YouTube oEmbed).

.EXAMPLE
    .\add-video.ps1 "https://youtu.be/VIDEO_ID"
.EXAMPLE
    .\add-video.ps1 "https://youtu.be/VIDEO_ID" -Description "My app showcase" -Tags "Windows","C#"
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$YoutubeUrl,

    [string]$Title = "",
    [string]$Description = "",
    [string[]]$Tags = @("Windows", "xSoftware"),
    [string]$Id = ""
)

$ErrorActionPreference = "Stop"
$configPath = Join-Path $PSScriptRoot "portfolio.config.json"

# Extract 11-char YouTube ID
$ytId = ""
if ($YoutubeUrl -match '^[a-zA-Z0-9_-]{11}$') {
    $ytId = $YoutubeUrl
} elseif ($YoutubeUrl -match '(?:youtu\.be/|v=|embed/|shorts/)([a-zA-Z0-9_-]{11})') {
    $ytId = $Matches[1]
} else {
    throw "Could not extract a YouTube video ID from: $YoutubeUrl"
}

$cleanUrl = "https://youtu.be/$ytId"

# Auto-fetch video title from YouTube oEmbed if not provided
if ([string]::IsNullOrWhiteSpace($Title)) {
    try {
        $oembed = Invoke-RestMethod -Uri "https://www.youtube.com/oembed?url=$cleanUrl&format=json" -TimeoutSec 8
        $Title = $oembed.title
        Write-Host "Fetched title: $Title" -ForegroundColor Cyan
    } catch {
        $Title = Read-Host "Enter video title"
    }
}

if ([string]::IsNullOrWhiteSpace($Description)) {
    $Description = Read-Host "Enter short description (press Enter to skip)"
}

if ([string]::IsNullOrWhiteSpace($Id)) {
    $Id = ($Title.ToLower() -replace '[^a-z0-9]+', '-').Trim('-')
}

$cfg = Get-Content -Path $configPath -Raw -Encoding UTF8 | ConvertFrom-Json
if (-not $cfg.videos) {
    $cfg | Add-Member -NotePropertyName videos -NotePropertyValue @()
}

$entry = [ordered]@{
    id          = $Id
    title       = $Title
    youtubeUrl  = $cleanUrl
    description = $Description
    tags        = @($Tags)
    date        = (Get-Date -Format "yyyy")
    enabled     = $true
}

$existing = @($cfg.videos | Where-Object { $_.id -ne $Id })
$cfg.videos = @($entry) + $existing

$json = $cfg | ConvertTo-Json -Depth 10
Set-Content -Path $configPath -Value $json -Encoding UTF8

Write-Host "[OK] Added '$Title' ($cleanUrl) to portfolio.config.json" -ForegroundColor Green
Write-Host "     Deep link: https://xconflictionx.cc/videos/?project=$Id" -ForegroundColor DarkGray
