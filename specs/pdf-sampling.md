# Spec: PDF-Based Sampling for Light Sources

**Reference:** [Ray Tracing: The Rest of Your Life](https://raytracing.github.io/books/RayTracingTheRestOfYourLife.html)

**Related Specs:** `specs/material.md`, `specs/light-emissive.md`, `specs/camera.md`

**Goal:** Implement PDF (Probability Density Function) based sampling to improve light calculations and reduce noise without requiring as many samples.

**Motivation:** The current Monte Carlo path tracer uses uniform random sampling for scattering rays, which is inefficient for scenes with small light sources. By preferentially sampling towards light sources, we can significantly reduce noise and improve convergence rates.

## Overview

Monte Carlo integration estimates integrals by sampling randomly. The current implementation samples directions uniformly, but we can improve efficiency by sampling more frequently in directions that contribute more to the final image. The basic idea is:

1. Define PDFs that represent the probability of sampling in certain directions
2. Sample rays according to these PDFs
3. Weight contributions by dividing by the PDF value to ensure unbiased results

## Implementation Plan

We'll implement PDF-based sampling in incremental steps to ensure working code at each stage. Each phase builds on the previous one and includes tests to verify functionality before moving to the next phase.

### Phase 1: Core Infrastructure

1. **Supporting Classes**
   * `ONBasis` (`src/geometry/onbasis.ts`) - Local coordinate system for PDFs
   * `PDF` interface and `CosinePDF` (`src/pdf/pdf.ts`)
   * `MixturePDF` (can be in same file as PDF)
   * `Vec3` additions: `randomCosineDirection()`

2. **Tests**
   * Unit tests for ONB and PDF classes
   * Test that CosinePDF follows proper cosine distribution

### Phase 2: Material Integration

1. **ScatterResult Interface**
   * Interface defining what a scatter event returns
   * Contains attenuation and either ray (for specular) or PDF (for diffuse)

2. **Material Interface Update**
   * Update interface to use ScatterResult pattern
   * Update all materials to return appropriate ScatterResult:
     * Lambertian: Returns attenuation + PDF
     * Metal: Returns attenuation + ray
     * Dielectric: Returns attenuation + ray
     * DiffuseLight: Returns null (no scattering)
   * The transition is straightforward as all materials currently return {attenuation, scattered},
     which can be directly mapped to a valid ScatterResult by setting the ray field to scattered.
     We only need to update the Lambertian material to return a PDF instead.

3. **Tests**
   * Unit tests for each material's scatter method
   * Verify correct behavior for specular vs. diffuse cases
   * Test with simple scene setups

### Phase 3: Hittable Sampling

1. **Hittable Interface Update**
   * Add `pdfValue()` and `random()` methods to Hittable interface
   * Implement for all geometry objects (Sphere, etc.)
   * Implement for HittableList to handle collections

2. **HittablePDF Implementation**
   * Create HittablePDF class that samples towards hittable objects
   * Light registry will be implemented as a list of emissive objects passed to the camera render function

3. **Tests**
   * Tests for sampling towards different shapes
   * Tests for proper PDF value calculations

### Phase 4: Path Tracer Integration

1. **Camera Update**
   * Rewrite `rayColor` to use PDF-based sampling
   * Handle specular vs. non-specular materials appropriately
   * Mix light sampling and BRDF sampling for optimal results
   * IMPORTANT: Ensure proper handling of the cosine term in the BRDF calculation:
     * For diffuse materials, BRDF = albedo/π * cos(θ)
     * The cos(θ) term is crucial as it accounts for Lambert's law (light hitting surfaces at angles contributes less)
     * When using cosine-weighted PDFs, the cos(θ) term in BRDF numerator cancels with cos(θ) in PDF denominator
     * This cancellation must be properly handled to avoid washed-out images and excess light accumulation

2. **Scene Setup**
   * Update scene creation to pass lights list to camera
   * Create test scenes that demonstrate improvements

3. **Optimization** (if needed)
   * Add Multiple Importance Sampling for better weight distribution
   * Keep using fixed max bounce depth for now (can improve later)

4. **Final Tests**
   * Comparison with previous implementation
   * Basic correctness tests

## Detailed Technical Specifications

### 1. ONBasis and PDF Classes

```typescript
/**
 * Orthonormal Basis - Creates a local coordinate system around a given normal vector.
 */
export class ONBasis {
  private u: Vec3;
  private v: Vec3;
  private w_vec: Vec3;
  
  constructor(n: Vec3) {
    this.w_vec = n.unitVector();
    
    // Create orthonormal basis from w
    const a = Math.abs(this.w_vec.x) > 0.9 ? new Vec3(0, 1, 0) : new Vec3(1, 0, 0);
    this.v = this.w_vec.cross(a).unitVector();
    this.u = this.w_vec.cross(this.v);
  }
  
  u(): Vec3 { return this.u; }
  v(): Vec3 { return this.v; }
  w(): Vec3 { return this.w_vec; }
  
  // Transform from ONB local coordinates to world coordinates
  local(a: Vec3): Vec3 {
    return this.u.multiply(a.x)
      .add(this.v.multiply(a.y))
      .add(this.w_vec.multiply(a.z));
  }
}

/**
 * In Vec3 class: Add randomCosineDirection method
 */
static randomCosineDirection(): Vec3 {
  const r1 = Math.random();
  const r2 = Math.random();
  
  const phi = 2 * Math.PI * r1;
  const sqrtR2 = Math.sqrt(r2);
  
  const x = Math.cos(phi) * sqrtR2;
  const y = Math.sin(phi) * sqrtR2;
  const z = Math.sqrt(1 - r2);
  
  return new Vec3(x, y, z);
}

/**
 * PDF interface and implementations
 */
export interface PDF {
  value(direction: Vec3): number;
  generate(): Vec3;
}

export class CosinePDF implements PDF {
  private readonly uvw: ONBasis;
  
  constructor(w: Vec3) {
    this.uvw = new ONBasis(w);
  }
  
  value(direction: Vec3): number {
    const cosine = direction.unitVector().dot(this.uvw.w());
    return cosine <= 0 ? 0 : cosine / Math.PI;
  }
  
  generate(): Vec3 {
    return this.uvw.local(Vec3.randomCosineDirection());
  }
}

export class MixturePDF extends DefaultPDF {
  private readonly pdfs: PDF[];
  private readonly weights: number[];
  private readonly totalWeight: number;
  
  constructor(pdfs: PDF[], weights?: number[]) {
    super();
    this.pdfs = pdfs;
    
    // Use equal weights if not specified
    this.weights = weights || pdfs.map(() => 1.0 / pdfs.length);
    
    // Calculate total weight
    this.totalWeight = this.weights.reduce((sum, w) => sum + w, 0);
  }
  
  value(direction: Vec3): number {
    let sum = 0;
    for (let i = 0; i < this.pdfs.length; i++) {
      sum += this.weights[i] * this.pdfs[i].value(direction);
    }
    return sum / this.totalWeight;
  }
  
  generate(): Vec3 {
    // Choose a PDF based on weights
    const rand = Math.random() * this.totalWeight;
    let partialSum = 0;
    
    for (let i = 0; i < this.pdfs.length; i++) {
      partialSum += this.weights[i];
      if (rand < partialSum) {
        return this.pdfs[i].generate();
      }
    }
    
    // Fallback to last PDF
    return this.pdfs[this.pdfs.length - 1].generate();
  }
}
```

### 2. ScatterResult and Material Updates

```typescript
/**
 * Result of a ray scatter event.
 */
export interface ScatterResult {
  attenuation: Color;
  pdf?: PDF | null;
  ray?: Ray | null;
}

export interface Material {
  /**
   * Determines how a ray scatters when hitting the material.
   */
  scatter(rIn: Ray, rec: HitRecord): ScatterResult | null;
  
  /**
   * Determines the light emitted by the material.
   */
  emitted(rec: HitRecord): Color;
}
```

### 3. Hittable Interface Update and HittablePDF

```typescript
export interface Hittable {
  // Existing methods
  hit(r: Ray, tRange: Interval): HitRecord | null;
  boundingBox(): AABB;
  
  // New methods for PDF sampling
  pdfValue(origin: Point3, direction: Vec3): number;
  random(origin: Point3): Vec3;
}

export class HittablePDF extends DefaultPDF {
  private readonly origin: Point3;
  private readonly hittable: Hittable;
  
  constructor(object: Hittable, origin: Point3) {
    super();
    this.hittable = object;
    this.origin = origin;
  }
  
  value(direction: Vec3): number {
    return this.hittable.pdfValue(this.origin, direction);
  }
  
  generate(): Vec3 {
    return this.hittable.random(this.origin);
  }
}
```

### 4. Camera Update

```typescript
/**
 * Camera Update
 */
export class Camera {
    // ...existing methods...

    rayColor(r: Ray, depth: number = this.maxDepth, lights: Hittable[] = []): Color {
        // Exit condition
        if (depth <= 0) return Color.BLACK;
        
        // Check if ray hits anything
        const rec = this.world.hit(r, new Interval(0.001, Infinity));
        if (rec === null) {
            // Return background
            // ...existing background code...
        }
        
        // Get emitted light from hit point
        const emitted = rec.material.emitted(rec);
        
        // Get scatter result from material
        const scatterResult = rec.material.scatter(r, rec);
        if (!scatterResult) {
            return emitted; // Ray was absorbed
        }
        
        // Check if this is a specular scatter (direct ray provided)
        if (scatterResult.ray) {
            // For specular materials, use the provided ray directly
            return emitted.add(
                scatterResult.attenuation.multiplyVec(
                    this.rayColor(scatterResult.ray, depth - 1, lights)
                )
            );
        }
        
        // For non-specular materials, use PDF sampling
        
        // Material must provide a PDF
        if (!scatterResult.pdf) {
            return emitted;
        }
        
        // Create light PDF for sampling if lights are available
        const lightPdf = lights.length > 0
            ? new HittablePDF(new HittableList(lights), rec.p)
            : null;
        
        // Create the final PDF for sampling (mixture or material only)
        const pdf = lightPdf
            ? new MixturePDF([lightPdf, scatterResult.pdf])
            : scatterResult.pdf;
        
        // Generate ray direction using the PDF
        const direction = pdf.generate();
        const scattered = new Ray(rec.p, direction);
        
        // Get the PDF value for this direction
        const pdfValue = pdf.value(direction);
        
        // Use an epsilon to avoid division by very small values
        const EPSILON = 0.0001;
        if (pdfValue <= EPSILON) {
            return emitted;
        }

        // For diffuse materials, BRDF = albedo/π * cos(θ)
        // For Lambertian surfaces, pdf = cos(θ) / π, so we use the pdf value directly
        // We keep this explicit for clarity and to support other PDFs in the future.
        const scatterPdfValue = pdfValue;
        const brdfOverPdf = scatterResult.attenuation.multiply(scatterPdfValue / pdfValue);
        
        // Trace the scattered ray and calculate contribution
        const incomingLight = this.rayColor(scattered, depth - 1, lights);
        
        // Final contribution is emitted light plus incoming light weighted by BRDF/PDF
        return emitted.add(brdfOverPdf.multiplyVec(incomingLight));
    }
}
```

## Performance Considerations

1. **Vector Pooling**: Continue using the vector pool for all vector operations
2. **PDF Caching**: Consider caching PDF values for directions that are sampled frequently
3. **Optimized ONB**: Implement an efficient ONB (Orthonormal Basis) calculation

## Testing Strategy

1. **Unit Tests**:
   * Test each PDF class independently
   * Verify conservation of energy
   * Check for proper importance sampling

2. **Integration Tests**:
   * Test the complete render pipeline
   * Verify correct handling of direct illumination

## Future Extensions

1. **Advanced PDFs**:
   * Add specific PDFs for other material types
   * Support anisotropic materials
   * Add PDF for environment light sampling

2. **Path Termination**:
   * Implement Russian Roulette for optimal path termination
   * Adaptive termination based on contribution

## Future Considerations

1. **Continuous Media Support**:
   * Extend the PDF framework to handle participating media (fog, smoke, clouds)
   * Implement volume scattering with phase functions (Henyey-Greenstein)
   * Sample points along ray paths through volumes
   * Apply importance sampling to efficiently render atmospheric effects 