# Spec: Mixed Material (Material Combination)

**Related Specs:** `specs/material.md`, `specs/pdf-sampling.md`

**Goal:** Implement a material that probabilistically combines two arbitrary materials based on a weighting parameter.

**Motivation:** Real-world surfaces often exhibit behaviors that can be modeled as combinations of different material types. This flexible approach allows mixing any two materials (e.g., Lambertian + Metal, Metal + Dielectric, etc.) to create more complex surface properties.

## 1. Design Approach

### Weighted Random Selection
Uses probabilistic sampling to choose between two materials at scatter time:
- `weight`: Controls mix (0.0 = always material2, 1.0 = always material1)
- During scattering, randomly choose which material handles the ray
- Maintains proper Monte Carlo sampling by delegating to existing material implementations
- Flexible composition allows any material combination

## 2. Implementation: MixedMaterial Class

* **Class:** `MixedMaterial extends DefaultMaterial`
* **Properties:**
  * `material1: Material` - First material option
  * `material2: Material` - Second material option
  * `weight: number` - Probability of choosing material1 (0.0-1.0)

* **Constructor:** `constructor(material1: Material, material2: Material, weight: number)`

* **Scatter Method:**
  1. Use `Math.random() < weight` to choose material
  2. Delegate to chosen material's `scatter()` method
  3. Return the chosen material's `ScatterResult` directly

* **Emitted Method:**
  1. Combine emissions from both materials weighted by their probabilities
  2. `emission1 * weight + emission2 * (1 - weight)`

## 3. Implementation

```typescript
scatter(rIn: Ray, rec: HitRecord): ScatterResult | null {
  // Probabilistically choose between the two materials
  if (Math.random() < this.weight) {
    return this.material1.scatter(rIn, rec);
  } else {
    return this.material2.scatter(rIn, rec);
  }
}

emitted(rec: HitRecord): Color {
  // Combine emissions from both materials weighted by their probabilities
  const emission1 = this.material1.emitted(rec).multiply(this.weight);
  const emission2 = this.material2.emitted(rec).multiply(1.0 - this.weight);
  return emission1.add(emission2);
}
```

## 4. Usage Examples

```typescript
// Classic diffuse + specular combination
const diffuseMetal = new MixedMaterial(
  new Lambertian(new Color(0.7, 0.3, 0.3)),  // Diffuse red
  new Metal(new Color(0.9, 0.9, 0.9), 0.1),  // Specular white
  0.3  // 30% diffuse, 70% specular
);

// Glass + metal combination (interesting refractive effects)
const glassMetal = new MixedMaterial(
  new Dielectric(1.5),                        // Glass
  new Metal(new Color(0.8, 0.8, 0.9), 0.0),  // Mirror
  0.6  // 60% glass, 40% mirror
);

// Layered + simple material combination
const complexSurface = new MixedMaterial(
  new LayeredMaterial(glass, paint),          // Layered material
  new Lambertian(new Color(0.2, 0.2, 0.2)),  // Dark diffuse
  0.8  // Mostly layered, some pure diffuse
);
```

## 5. Advantages of This Approach

- **Flexible:** Can combine any two materials, not just diffuse/specular
- **Composable:** Mixed materials can themselves be mixed with other materials
- **Simple:** Delegates complexity to existing material implementations
- **Extensible:** Easy to add new material combinations
- **Correct:** Maintains proper Monte Carlo sampling by reusing existing logic

## 6. Testing Strategy

- Test pure cases: `weight = 0.0` should behave like material2, `weight = 1.0` like material1
- Test weight clamping to [0, 1] range
- Test statistical distribution matches expected weighting over many samples
- Test with different material type combinations (Lambertian+Metal, Dielectric+Lambertian, etc.)
- Test emission combination for emissive materials
- Test null handling when constituent materials return null 