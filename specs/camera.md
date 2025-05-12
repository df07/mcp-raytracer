# Spec: Camera Class

**Reference:** ["Ray Tracing in One Weekend"](https://raytracing.github.io/books/RayTracingInOneWeekend.html)
**Related Specs:** `specs/vec3.md`, `specs/ray.md`, `specs/hittable.md`, `specs/interval.md`, `specs/material.md`

## Goal

Define a `Camera` class that manages view parameters, generates camera rays, calculates ray colors, and renders the 3D scene to a 2D image with support for anti-aliasing and adaptive sampling.

## Motivation

Encapsulate camera and rendering logic in one place, making the main application simpler and allowing for easier adjustments to camera parameters.

## Requirements

1.  **File Location:** `src/camera.ts`
2.  **Class Name:** `Camera`
3.  **Key Properties:** 
    * Image dimensions (`imageWidth`, `imageHeight`) 
    * Camera position (`center`) and orientation vectors (`u`, `v`, `w`)
    * Pixel mapping information (`pixel00Loc`, `pixelDeltaU`, `pixelDeltaV`)
    * Scene reference (`world`)
    * Sampling parameters (`maxSamplesPerPixel`, `adaptiveSampling`, `samplesPerBatch`, `maxTolerance`)
    * Rendering configuration (`maxSamplesPerPixel`, `maxDepth`)
    * Adaptive sampling parameters (`adaptiveSampling`, `samplesPerBatch`, `maxTolerance`)

4.  **Core Methods:**
    * `getRay(i: number, j: number): Ray` - Creates a camera ray through pixel (i,j), with jitter for anti-aliasing
    * `rayColor(r: Ray, depth: number = maxDepth): Color` - Traces a ray and returns its color
    * `render(pixelData: Uint8ClampedArray, verbose: boolean = false, sampleCountBuffer?: Uint32Array): void` - Renders scene to buffer

5.  **Adaptive Sampling:**
    * Calculations from https://cs184.eecs.berkeley.edu/sp21/docs/proj3-1-part-5
    * Statistical convergence test based on pixel color variance
    * Sample pixels in batches until convergence or maximum count reached
    * Confidence interval formula: `I = 1.96 * σ/√n` (95% confidence)
    * Convergence criteria: `I ≤ maxTolerance * μ` where μ is mean illuminance

6.  **Output Processing:**
    * Apply gamma correction (gamma=2) with square root of RGB components
    * Scale from [0,1] to [0,255] for final pixel values

## Implementation Guidance

* Use `Vec3` class methods extensively for vector operations
* Use `Point3` and `Color` type aliases for clarity
* Use vector pooling for memory efficiency during rendering
* Use `illuminance()` on `Vec3` for adaptive sampling brightness calculation (0.299R + 0.587G + 0.114B)
* Skip convergence checks when variance is zero (constant color)
* Use unified render loop for both adaptive and non-adaptive sampling
