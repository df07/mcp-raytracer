# Camera Class Specification

**Reference:** [Ray Tracing in One Weekend - Defocus Blur](https://raytracing.github.io/books/RayTracingInOneWeekend.html#defocusblur)  
**Related Specs:** `specs/vec3.md`, `specs/ray.md`, `specs/hittable.md`, `specs/interval.md`, `specs/material.md`

## Goal

Define a `Camera` class that renders 3D scenes with realistic camera effects including defocus blur (depth of field), anti-aliasing, and adaptive sampling for optimal image quality and performance.

## Motivation

Encapsulate modern camera rendering capabilities in a single class, supporting real-world camera effects like depth of field while maintaining high performance through adaptive sampling and importance sampling techniques.

## Requirements

### 1. Camera Configuration
- **Image dimensions:** `imageWidth`, `imageHeight` with configurable aspect ratio
- **Camera positioning:** `vfov`, `lookFrom`, `lookAt`, `vUp` for camera placement
- **Defocus blur:** `aperture` and `focusDistance` parameters for depth of field effects
- **Sampling quality:** `samples`, `adaptiveTolerance`, `adaptiveBatchSize` for image quality control
- **Importance sampling:** Support for `lights` array to improve rendering efficiency

### 2. Defocus Blur (Depth of Field)
- **Aperture control:** Size of camera aperture (0 = no blur, larger = more blur)
- **Focus distance:** Distance to the plane that appears perfectly sharp
- **Disk sampling:** Generate rays from random points across the camera aperture
- **Realistic blur:** Objects closer or farther than focus distance appear progressively blurred

### 3. Core Methods

#### `getRay(i: number, j: number): Ray`
- Generate camera rays through pixel coordinates
- Apply anti-aliasing jitter when using multiple samples
- Apply defocus blur by sampling ray origins from aperture disk
- Target rays through focus plane for correct depth of field

#### `rayColor(r: Ray, depth: number): Color`
- Trace rays with recursive bouncing up to maximum depth
- Use importance sampling with material and light PDFs
- Return background gradient when no intersection occurs
- Support emissive materials and global illumination

#### `renderRegion()` and `render()`
- Render image regions with adaptive sampling
- Track rendering statistics (min/max/average samples per pixel)
- Use vector pooling for memory efficiency
- Apply gamma correction and tone mapping for final output

### 4. Adaptive Sampling
- **Statistical convergence:** Use confidence interval testing per pixel
- **Batch processing:** Sample pixels in configurable batch sizes
- **Early termination:** Stop sampling when pixel converges or reaches maximum
- **Quality control:** Balance between image quality and render time

### 5. Performance Features
- **Vector pooling:** Reuse Vec3 objects to reduce memory allocations
- **Region rendering:** Support rendering specific image regions
- **Statistics tracking:** Monitor sampling efficiency and convergence rates
- **Memory efficiency:** Direct buffer writing without intermediate allocations

### 6. Integration Points
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
- **Preview:** 50-100 samples, tolerance 0.1
- **Production:** 500-1000 samples, tolerance 0.01  
- **Final:** 1000+ samples, tolerance 0.005

### Focus Distance
- Auto-calculate from camera-to-target distance
- Manual override for artistic control
- Affects which objects appear sharp vs blurred

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
