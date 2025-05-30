#!/usr/bin/env pwsh
# Raytracer benchmark script for comparing standard vs gl-matrix implementations

# Default parameters
param (
    [int]$width = 400,
    [int]$samples = 20,
    [int]$iterations = 0,
    [string]$outputDir = "benchmark_results",
    [int]$spheres = 0,
    [int]$rain = 0,
    [string]$cornell = "", # Cornell box variant: "spheres" or "empty"
    [int]$seed = 0,
    [double]$at = 0, # Default to 0 = disabled (will use Camera's default if > 0)
    [double]$ab = 0, # Default to 0 = disabled (will use Camera's default if > 0)
    [switch]$parallel = $false, # Use parallel rendering with worker threads
    [int]$threads = 0, # Number of threads to use for parallel rendering
    [string]$mode = 'default', # Render mode (default, bounces, samples)
    [switch]$profile = $false # Parameter for enabling Node.js profiling (automatically processes the output)
)

# Ensure output directory exists
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
    Write-Host "Created output directory: $outputDir"
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# Create descriptive filename base with key parameters
$sceneType = if ($cornell -ne "") { "cornell" } elseif ($rain -gt 0) { "rain" } elseif ($spheres -gt 0) { "spheres" } else { "default" }
$fileBase = "${sceneType}_${timestamp}_w${width}_s${samples}"
if ($spheres -gt 0) { $fileBase += "_c${spheres}" }  # c for count of spheres
if ($cornell -ne "") { $fileBase += "_${cornell}" }  # Cornell variant
if ($seed -gt 0) { $fileBase += "_sd${seed}" }
if ($ab -gt 0) { $fileBase += "_ab${ab}" }
if ($at -gt 0) { $fileBase += "_at${at}" }
# Don't include parallel or threads in the filename, they don't change the results

# Prepare node command with or without profiling
$nodeCmd = "node"
if ($profile) {
    $nodeCmd = "node --prof"
    Write-Host "`n====== Running with Node.js profiler enabled ======"
}

# Build the command with scene parameters
$cmd = "$nodeCmd dist/src/index.js --benchmark --width $width --samples $samples"

# Add scene parameters if specified
if ($iterations -gt 0) {
    $cmd += " --iterations $iterations"
}
if ($spheres -gt 0) {
    $cmd += " --spheres $spheres"
}
if ($rain -gt 0) {
    $cmd += " --rain $rain"
}
if ($cornell -ne "") {
    if ($cornell -ne "spheres" -and $cornell -ne "empty") {
        Write-Host "Error: Cornell variant must be 'spheres' or 'empty'"
        exit 1
    }
    $cmd += " --cornell $cornell"
}
if ($seed -gt 0) {
    $cmd += " --seed $seed"
}
if ($at -gt 0) {
    $cmd += " --at $at"
}
if ($ab -gt 0) {
    $cmd += " --ab $ab"
}
if ($parallel) {
    $cmd += " -p"
}
if ($threads -gt 0) {
    $cmd += " -t $threads"
}
if ($mode -ne 'default') {
    $cmd += " -m $mode"
    $fileBase += "_${mode}"
}

# Set output and log filenames with the same base
$outputFile = Join-Path $outputDir "${fileBase}.png"
$logFile = Join-Path $outputDir "${fileBase}.log"

# Add output file
$cmd += " --output $outputFile"

# Run raytracer benchmark
Write-Host "`n====== Running raytracer benchmark ======"
Write-Host "Command: $cmd"

$benchmarkOutput = & Invoke-Expression "$cmd 2>&1"

# Log output to file
"`n====== Raytracer Benchmark ======" | Out-File -FilePath $logFile -Append
$benchmarkOutput | Out-File -FilePath $logFile -Append

# Display and extract results
Write-Host "`nResults for raytracer:"
$benchmarkAvgTime = -1
$iteration = 1;
foreach ($line in $benchmarkOutput) {
    if ($line -match "^  Render time: ([\d\.]+)ms") {
        $renderTime = [double]$Matches[1]
        Write-Host "  Render time (iteration $iteration): $renderTime ms"
        $iteration++
    }
    if ($line -match "Average render time: ([\d\.]+)ms") {
        $benchmarkAvgTime = [double]$Matches[1]
        Write-Host "  Average render time: $benchmarkAvgTime ms"
    }
}

# Log benchmark results
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
        $profileOutputFile = Join-Path $outputDir "${fileBase}_profile.txt"
        
        Write-Host "Processing profile data from $($latestIsolateFile.Name)"
        
        # Process the isolate file using --prof-process
        & node --prof-process $latestIsolateFile.FullName > $profileOutputFile
        
        Write-Host "Profile analysis saved to $profileOutputFile"
        
        # Remove the isolate file as it's no longer needed
        Remove-Item -Path $latestIsolateFile.FullName
    } else {
        Write-Host "No profiler output files (isolate-*.log) found. Make sure profiling was enabled correctly."
    }
}
