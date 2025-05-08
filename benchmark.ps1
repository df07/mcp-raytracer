#!/usr/bin/env pwsh
# Raytracer benchmark script for comparing standard vs gl-matrix implementations

# Default parameters
param (
    [int]$width = 400,
    [int]$samples = 20,
    [int]$iterations = 1,
    [string]$outputDir = "benchmark_results",
    [switch]$profile = $false # Parameter for enabling Node.js profiling (automatically processes the output)
)

# Ensure output directory exists
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
    Write-Host "Created output directory: $outputDir"
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logFile = Join-Path $outputDir "benchmark_${timestamp}.log"

# Prepare node command with or without profiling
$nodeCmd = "node"
if ($profile) {
    $nodeCmd = "node --prof"
    Write-Host "`n====== Running with Node.js profiler enabled ======"
}

# Run raytracer benchmark
$outputFile = Join-Path $outputDir "raytracing_${timestamp}.png"
Write-Host "`n====== Running raytracer benchmark ======"
Write-Host "Command: $nodeCmd dist/src/index.js --benchmark --width $width --samples $samples --iterations $iterations --output $outputFile"

$benchmarkOutput = & Invoke-Expression "$nodeCmd dist/src/index.js --benchmark --width $width --samples $samples --iterations $iterations --output $outputFile 2>&1"

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

# Prepare node command for GL-Matrix implementation
$glMatrixNodeCmd = "node"
if ($profile) {
    $glMatrixNodeCmd = "node --prof"
}

$glMatrixOutputFile = Join-Path $outputDir "gl_matrix_raytracing_${timestamp}.png"
$glMatrixOutput = & Invoke-Expression "$glMatrixNodeCmd dist/src/index.js --benchmark --gl-matrix --width $width --samples $samples --iterations $iterations --output $glMatrixOutputFile 2>&1"

# Log output to file
"`n====== GL-Matrix Implementation Benchmark ======" | Out-File -FilePath $logFile -Append
$glMatrixOutput | Out-File -FilePath $logFile -Append

# Display and extract results
Write-Host "`nResults for GL-Matrix implementation:"
# Log benchmark results
Write-Host "`n====== Benchmark Results Summary ======"
Write-Host "Standard implementation: $benchmarkAvgTime ms"
Write-Host "`nDetailed results saved to $logFile"
Write-Host "Image saved to $outputFile"

# Process profiler output if profiling was enabled
if ($profile) {
    Write-Host "`n====== Processing Node.js profiler output ======"
    
    # Find the latest isolate file
    $isolateFiles = Get-ChildItem -Path . -Filter "isolate-*.log"
    
    if ($isolateFiles.Count -gt 0) {
        # Get the most recent isolate file
        $latestIsolateFile = $isolateFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        $profileOutputFile = Join-Path $outputDir "profile_${timestamp}.txt"
        
        Write-Host "Processing profile data from $($latestIsolateFile.Name)"
        
        # Process the isolate file using --prof-process
        & node --prof-process $latestIsolateFile.FullName > $profileOutputFile
        
        Write-Host "Profile analysis saved to $profileOutputFile"
        
        # Move the isolate file to the output directory to keep it organized
        $isolateDestination = Join-Path $outputDir $latestIsolateFile.Name
        Move-Item -Path $latestIsolateFile.FullName -Destination $isolateDestination
        Write-Host "Moved isolate file to $isolateDestination for reference"
    } else {
        Write-Host "No profiler output files (isolate-*.log) found. Make sure profiling was enabled correctly."
    }
}
