# Camera Class Specification

**Reference:** [Ray Tracing in One Weekend - Defocus Blur](https://raytracing.github.io/books/RayTracingInOneWeekend.html#defocusblur)  
**Related Specs:** `specs/vec3.md`, `specs/ray.md`, `specs/hittable.md`, `specs/interval.md`, `specs/material.md`

## Goal

Define a `Camera` class that renders 3D scenes with realistic camera effects including defocus blur (depth of field), anti-aliasing, adaptive sampling, and Russian Roulette ray termination for optimal image quality and performance.

## Motivation

Encapsulate modern camera rendering capabilities in a single class, supporting real-world camera effects like depth of field while maintaining high performance through adaptive sampling, importance sampling techniques, and probabilistic ray termination.

## Requirements

### 1. Camera Configuration
- **Image dimensions:** `imageWidth`, `imageHeight` with configurable aspect ratio
- **Camera positioning:** `vfov`, `lookFrom`, `lookAt`, `vUp` for camera placement
- **Defocus blur:** `aperture` and `focusDistance` parameters for depth of field effects
- **Sampling quality:** `samples`, `adaptiveTolerance`, `adaptiveBatchSize` for image quality control
- **Importance sampling:** Support for `lights` array to improve rendering efficiency
- **Russian Roulette:** `russianRouletteDepth` and `russianRouletteEnabled` for probabilistic ray termination
- **Background colors:** `backgroundTop` and `backgroundBottom` for customizable background gradients (default: white-to-blue sky gradient)

### 2. Russian Roulette Ray Termination
- **Purpose:** Probabilistically terminate rays early while maintaining unbiased results
- **Throughput-based termination:** Use cumulative ray energy (throughput) to make termination decisions
- **Depth threshold:** Only apply Russian Roulette after a minimum number of bounces (default: 3)
- **Maximum probability:** Cap continuation probability at 95% to avoid infinite rays
- **Energy compensation:** Divide surviving ray throughput by continuation probability
- **Performance benefit:** Reduce computation for rays that contribute little to final image
- **Stable variance:** Throughput approach reduces fireflies compared to per-bounce methods

#### Implementation Strategy
- **Throughput tracking:** Pass cumulative ray energy through recursive rayColor calls
- **Early termination:** Apply Russian Roulette based on throughput magnitude before material interaction
- **Cumulative attenuation:** Multiply throughput by material attenuation at each bounce
- **Global termination:** Use `max(throughput.rgb)` for continuation probability across entire ray path
- **Energy conservation:** Compensate surviving rays by dividing throughput by continuation probability
- **Recursive propagation:** Pass updated throughput to child ray calls
- **Background/emission scaling:** Apply throughput to background and emitted light contributions

### 3. Defocus Blur (Depth of Field)
- **Aperture control:** Size of camera aperture (0 = no blur, larger = more blur)
- **Focus distance:** Distance to the plane that appears perfectly sharp
- **Disk sampling:** Generate rays from random points across the camera aperture
- **Realistic blur:** Objects closer or farther than focus distance appear progressively blurred

### 4. Core Methods

#### `getRay(i: number, j: number): Ray`
- Generate camera rays through pixel coordinates
- Apply anti-aliasing jitter when using multiple samples
- Apply defocus blur by sampling ray origins from aperture disk
- Target rays through focus plane for correct depth of field

#### `rayColor(r: Ray, stats?: { bounces: number }): Color`
- Trace rays with recursive bouncing up to maximum depth
- Apply Russian Roulette termination after minimum bounce threshold
- Use importance sampling with material and light PDFs
- Return custom background gradient when no intersection occurs
- Support emissive materials and global illumination

#### `renderRegion()` and `render()`
- Render image regions with adaptive sampling
- Track rendering statistics (min/max/average samples per pixel)
- Use vector pooling for memory efficiency
- Apply gamma correction and tone mapping for final output

### 5. Adaptive Sampling
- **Statistical convergence:** Use confidence interval testing per pixel
- **Batch processing:** Sample pixels in configurable batch sizes
- **Early termination:** Stop sampling when pixel converges or reaches maximum
- **Quality control:** Balance between image quality and render time

### 6. Performance Features
- **Vector pooling:** Reuse Vec3 objects to reduce memory allocations
- **Region rendering:** Support rendering specific image regions
- **Statistics tracking:** Monitor sampling efficiency and convergence rates
- **Memory efficiency:** Direct buffer writing without intermediate allocations
- **Russian Roulette:** Probabilistic ray termination for performance optimization

### 7. Integration Points
- **World rendering:** Accept any `Hittable` object as the scene
- **Material system:** Work with existing material and PDF classes
- **Light sources:** Support `PDFHittable` objects for importance sampling
- **Output formats:** Write to standard `Uint8ClampedArray` pixel buffers

## Configuration Guidelines

### Aperture Settings
- `0` - No blur (pinhole camera)
- `0.1` - Subtle depth of field
- `2.0` - Strong blur effect
- `5.0+` - Extreme artistic blur

### Quality Levels
- **Preview:** 50-100 samples, tolerance 0.1, Russian Roulette enabled
- **Production:** 500-1000 samples, tolerance 0.01, Russian Roulette enabled
- **Final:** 1000+ samples, tolerance 0.005, Russian Roulette enabled

### Russian Roulette Settings
- **Minimum depth:** 3-5 bounces before applying termination
- **Maximum probability:** 0.95 to prevent infinite ray paths
- **Energy threshold:** Use maximum RGB component of attenuation
- **Performance impact:** 20-50% reduction in deep ray computations

### Focus Distance
- Auto-calculate from camera-to-target distance
- Manual override for artistic control
- Affects which objects appear sharp vs blurred

### Background Colors
- **Default:** White top, blue bottom (sky-like gradient)
- **Cornell box:** Black top and bottom (no ambient light)
- **Custom:** Any color combination for artistic effects

## Implementation Notes

### Defocus Blur Algorithm
- Sample random points on unit disk using rejection sampling
- Transform disk samples to camera aperture coordinate system
- Offset ray origins by aperture samples
- Maintain ray targeting through focus plane

### Adaptive Sampling
- Use illuminance-based convergence testing
- Apply 95% confidence interval formula
- Skip convergence checks for constant-color pixels
- Balance batch size vs convergence check frequency

### Russian Roulette Algorithm
```typescript
// Throughput-based Russian Roulette
rayColor(ray: Ray, throughput: Color, stats: Stats): Color {
    // Apply Russian Roulette after minimum depth
    if (stats.bounces >= this.russianRouletteDepth) {
        const maxComponent = Math.max(throughput.x, throughput.y, throughput.z);
        const continueProbability = Math.min(maxComponent, 0.95);
        
        if (Math.random() > continueProbability) {
            return Color.BLACK; // Terminate ray
        }
        
        // Compensate throughput for surviving rays
        throughput = throughput.divide(continueProbability);
    }
    
    // ... material interaction ...
    
    // Update throughput and recurse
    const newThroughput = throughput.multiplyVec(materialAttenuation);
    return rayColor(scatteredRay, newThroughput, stats);
}
```
