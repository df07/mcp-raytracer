#!/usr/bin/env pwsh
# Raytracer benchmark script for comparing standard vs gl-matrix implementations

# Default parameters
param (
    [int]$width = 400,
    [int]$samples = 20,
    [int]$iterations = 1,
    [string]$outputDir = "benchmark_results"
)

# Ensure output directory exists
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
    Write-Host "Created output directory: $outputDir"
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logFile = Join-Path $outputDir "benchmark_${timestamp}.log"

# Run raytracer benchmark
$outputFile = Join-Path $outputDir "raytracing_${timestamp}.png"
Write-Host "`n====== Running raytracer benchmark ======"
Write-Host "Command: node dist/src/index.js --benchmark --width $width --samples $samples --iterations $iterations --output $outputFile"

$benchmarkOutput = & node dist/src/index.js --benchmark --width $width --samples $samples --iterations $iterations --output $outputFile 2>&1

# Log output to file
"`n====== GL-Matrix Raytracer Benchmark ======" | Out-File -FilePath $logFile -Append
$benchmarkOutput | Out-File -FilePath $logFile -Append

# Display and extract results
Write-Host "`nResults for raytracer:"
$benchmarkAvgTime = -1
foreach ($line in $benchmarkOutput) {
    if ($line -match "Average render time: (\d+\.\d+)ms") {
        $benchmarkAvgTime = [double]$Matches[1]
        Write-Host "  Average render time: $benchmarkAvgTime ms"
        break
    }
}

$glMatrixOutput = & node dist/src/index.js --benchmark --gl-matrix --width $width --samples $samples --iterations $iterations --output $glMatrixOutputFile 2>&1

# Log output to file
"`n====== GL-Matrix Implementation Benchmark ======" | Out-File -FilePath $logFile -Append
$glMatrixOutput | Out-File -FilePath $logFile -Append

# Display and extract results
Write-Host "`nResults for GL-Matrix implementation:"
# Log benchmark results
Write-Host "`n====== Benchmark Results Summary ======"
Write-Host "GL-Matrix implementation: $benchmarkAvgTime ms"
Write-Host "`nDetailed results saved to $logFile"
Write-Host "Image saved to $outputFile"
