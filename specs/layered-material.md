# Spec: Layered Material (Dielectric Over Inner Layer)

**Related Specs:** `specs/material.md`, `specs/dielectric.md`, `specs/mixed-material.md`

**Goal:** Implement a material that simulates a dielectric outer layer (like clear coat, glass, or thin film) over an inner material layer.

**Motivation:** Many real-world materials have layered structures: clear-coated automotive paint, glass over metal, varnished wood, or thin transparent films over colored substrates. This creates complex optical effects where light first interacts with the transparent outer layer, then the inner material.

## 1. Design Approach

### Physical Model
1. **Outer Layer**: Dielectric material (glass-like) that can reflect or refract incoming rays
2. **Inner Layer**: Any material (Lambertian, Metal, etc.) that the refracted ray interacts with
3. **Simplified Exit**: Ignore refraction on the way out for now (future enhancement)
4. **Attenuation**: Use inner material's attenuation since outer dielectric is clear

### Ray Interaction Process
1. Ray hits the layered surface
2. **Outer dielectric**: Determines if ray reflects (specular) or refracts (transmits)
3. **If reflected**: Return specular reflection with dielectric properties
4. **If refracted**: Ray passes through and hits inner material
5. **Inner material**: Scatters according to its properties (diffuse, specular, etc.)
6. **Result**: Return scattered result from inner material with its attenuation

## 2. Implementation: LayeredMaterial Class

* **Class:** `LayeredMaterial extends DefaultMaterial`
* **Properties:**
  * `outerIOR: number` - Index of refraction for outer dielectric layer
  * `innerMaterial: Material` - The material underneath the dielectric layer

* **Constructor:** `constructor(outerIOR: number, innerMaterial: Material)`

* **Scatter Method:**
  1. Calculate dielectric reflection/refraction probabilities using Schlick's approximation
  2. **Reflection path**: Return specular reflection (white attenuation, scattered ray)
  3. **Refraction path**: 
     - Calculate refracted ray direction into the material
     - Let inner material scatter the refracted ray
     - Return inner material's scatter result (preserving its attenuation and PDF/ray)

## 3. Pseudo-code Implementation

```typescript
scatter(rIn: Ray, rec: HitRecord): ScatterResult | null {
  // Calculate refraction ratio (assuming ray enters material)
  const refractionRatio = 1.0 / this.outerIOR;
  const unitDirection = rIn.direction.unitVector();
  const cosTheta = Math.min(unitDirection.negate().dot(rec.normal), 1.0);
  const sinTheta = Math.sqrt(1.0 - cosTheta * cosTheta);
  
  // Check for total internal reflection
  const cannotRefract = refractionRatio * sinTheta > 1.0;
  
  // Calculate reflection probability
  const reflectance = this.schlickReflectance(cosTheta, refractionRatio);
  
  if (cannotRefract || reflectance > Math.random()) {
    // Reflect off outer surface
    const reflected = unitDirection.reflect(rec.normal);
    return {
      attenuation: new Color(1.0, 1.0, 1.0), // Clear dielectric
      scattered: new Ray(rec.p, reflected)
    };
  } else {
    // Refract into material and interact with inner layer
    const refracted = unitDirection.refract(rec.normal, refractionRatio);
    const refractedRay = new Ray(rec.p, refracted);
    
    // Let inner material handle the refracted ray
    const innerResult = this.innerMaterial.scatter(refractedRay, rec);
    
    // Return inner material's result (it handles its own attenuation)
    return innerResult;
  }
}
```

## 4. Usage Examples

```typescript
// Clear-coated red paint (automotive finish)
const clearCoatedPaint = new LayeredMaterial(
  1.5, // Clear coat IOR (like automotive clear coat)
  new Lambertian(new Color(0.8, 0.2, 0.2)) // Red paint underneath
);

// Glass over brushed metal
const glassOverMetal = new LayeredMaterial(
  1.5, // Glass IOR
  new Metal(new Color(0.8, 0.8, 0.9), 0.1) // Slightly rough metal
);

// Varnished wood
const varnishedWood = new LayeredMaterial(
  1.4, // Varnish IOR
  new MixedMaterial(
    new Color(0.6, 0.4, 0.2), // Wood diffuse
    new Color(0.3, 0.2, 0.1), // Wood specular
    0.1, // Mostly diffuse
    0.3  // Some roughness
  )
);

// Thin film over white substrate
const thinFilm = new LayeredMaterial(
  1.3, // Thin film IOR
  new Lambertian(new Color(0.9, 0.9, 0.9)) // White substrate
);
```

## 5. Implementation Notes

- Use Schlick's approximation for dielectric reflection probability
- Outer layer uses standard dielectric physics (reflection/refraction)
- Inner material can be any existing material type
- Simplified model ignores exit refraction (enhancement opportunity)
- Maintains energy conservation through proper probability weighting
- Compatible with existing PDF/ray-based material system

## 6. Visual Effects Achieved

- **Clear coat**: Glossy reflection over matte base color
- **Glass over materials**: Transparent overlay with Fresnel effects
- **Thin films**: Subtle surface reflections over substrate
- **Depth illusion**: Appearance of materials "under glass"
- **Realistic layering**: Similar to real-world layered materials

## 7. Future Enhancements

- Handle exit refraction for more physical accuracy
- Support colored/tinted outer layers with attenuation
- Multiple layer support (stack of materials)
- Thickness-dependent effects for thin films
- Interference patterns for very thin layers

## 8. Testing Strategy

- Test pure reflection case (total internal reflection)
- Test pure refraction case (straight transmission)
- Test mixed behavior at different angles
- Verify inner material properties are preserved
- Test with different inner material types (Lambertian, Metal, Mixed)
- Verify energy conservation and proper attenuation 