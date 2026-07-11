Write-Host "Installing @talocode/contextlane..."

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  Write-Host "Error: Node.js is required. Install from https://nodejs.org"
  exit 1
}

npm install -g @talocode/contextlane

Write-Host ""
Write-Host "ContextLane installed!"
Write-Host "Run: contextlane demo"
