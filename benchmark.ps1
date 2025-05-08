#!/usr/bin/env pwsh
# Raytracer benchmark script for comparing standard vs gl-matrix implementations

# Default parameters
param (
    [int]$width = 800,
    [int]$samples = 100,
    [int]$iterations = 3,
    [string]$outputDir = "benchmark_results"
)

# Ensure output directory exists
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
    Write-Host "Created output directory: $outputDir"
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logFile = Join-Path $outputDir "benchmark_${timestamp}.log"

# Run standard implementation
$standardOutputFile = Join-Path $outputDir "standard_${timestamp}.png"
  Write-Host "`n====== Running Standard implementation benchmark ======"
Write-Host "Command: node dist/src/index.js --benchmark --width $width --samples $samples --iterations $iterations --output $standardOutputFile"

$standardOutput = & node dist/src/index.js --benchmark --width $width --samples $samples --iterations $iterations --output $standardOutputFile 2>&1

# Log output to file
"`n====== Standard Implementation Benchmark ======" | Out-File -FilePath $logFile -Append
$standardOutput | Out-File -FilePath $logFile -Append

# Display and extract results
Write-Host "`nResults for Standard implementation:"
$standardAvgTime = -1
foreach ($line in $standardOutput) {
    if ($line -match "Average render time: (\d+\.\d+)ms") {
        $standardAvgTime = [double]$Matches[1]
        Write-Host "  Average render time: $standardAvgTime ms"
        break
    }
}

# Run gl-matrix implementation
$glMatrixOutputFile = Join-Path $outputDir "glmatrix_${timestamp}.png"

Write-Host "`n====== Running GL-Matrix implementation benchmark ======"
Write-Host "Command: node dist/src/index.js --benchmark --gl-matrix --width $width --samples $samples --iterations $iterations --output $glMatrixOutputFile"

$glMatrixOutput = & node dist/src/index.js --benchmark --gl-matrix --width $width --samples $samples --iterations $iterations --output $glMatrixOutputFile 2>&1

# Log output to file
"`n====== GL-Matrix Implementation Benchmark ======" | Out-File -FilePath $logFile -Append
$glMatrixOutput | Out-File -FilePath $logFile -Append

# Display and extract results
Write-Host "`nResults for GL-Matrix implementation:"
$glMatrixAvgTime = -1
foreach ($line in $glMatrixOutput) {
    if ($line -match "Average render time: (\d+\.\d+)ms") {
        $glMatrixAvgTime = [double]$Matches[1]
        Write-Host "  Average render time: $glMatrixAvgTime ms"
        break
    }
}

# Calculate and display performance difference
if (($standardAvgTime -gt 0) -and ($glMatrixAvgTime -gt 0)) {
    $difference = $standardAvgTime - $glMatrixAvgTime
    $percentDifference = ($difference / $standardAvgTime) * 100
    
    Write-Host "`n====== Performance Comparison ======"
    Write-Host "Standard implementation: $standardAvgTime ms"
    Write-Host "GL-Matrix implementation: $glMatrixAvgTime ms"
    
    if ($difference -gt 0) {
        Write-Host "GL-Matrix is faster by: $([math]::Abs($difference).ToString("0.00")) ms ($([math]::Abs($percentDifference).ToString("0.00"))%)"
    } elseif ($difference -lt 0) {
        Write-Host "Standard is faster by: $([math]::Abs($difference).ToString("0.00")) ms ($([math]::Abs($percentDifference).ToString("0.00"))%)"
    } else {
        Write-Host "Both implementations performed equally"
    }
    
    # Log comparison to file
    "`n====== Performance Comparison ======" | Out-File -FilePath $logFile -Append
    "Standard implementation: $standardAvgTime ms" | Out-File -FilePath $logFile -Append
    "GL-Matrix implementation: $glMatrixAvgTime ms" | Out-File -FilePath $logFile -Append
    
    if ($difference -gt 0) {
        "GL-Matrix is faster by: $([math]::Abs($difference).ToString("0.00")) ms ($([math]::Abs($percentDifference).ToString("0.00"))%)" | Out-File -FilePath $logFile -Append
    } elseif ($difference -lt 0) {
        "Standard is faster by: $([math]::Abs($difference).ToString("0.00")) ms ($([math]::Abs($percentDifference).ToString("0.00"))%)" | Out-File -FilePath $logFile -Append
    } else {
        "Both implementations performed equally" | Out-File -FilePath $logFile -Append
    }
}

Write-Host "`nDetailed results saved to $logFile"
Write-Host "Images saved to $standardOutputFile and $glMatrixOutputFile"
