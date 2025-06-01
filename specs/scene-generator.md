# Scene Generator Specification

## Goal

Refactor the scene generation system to separate scene data generation from camera construction, enabling flexible scene composition and external scene definition (e.g., JSON files, MCP server).

## Motivation

The current scene generators are tightly coupled to camera construction, making it difficult to:
- Define scenes externally (JSON files, MCP server)
- Reuse scene data with different camera configurations
- Compose scenes programmatically
- Test scene generation independently of camera setup

## Requirements

### 1. Scene Data Structure

Define a plain object structure that represents a complete scene using serializable data:

```typescript
// Type alias for 3D vectors/points/colors
type Vec3Array = [number, number, number];

interface SceneData {
  // Camera configuration (positioning and visual settings)
  camera: CameraData;
  
  // Render quality settings
  render?: RenderData;
  
  // Scene objects and materials as arrays
  objects: SceneObject[];
  materials?: MaterialObject[];  // Optional array of named materials
  
  // Optional metadata
  metadata?: {
    name?: string;
    description?: string;
    author?: string;
    version?: string;
  };
}

interface CameraData {
  vfov?: number;
  from?: Vec3Array;      // lookFrom position
  at?: Vec3Array;        // lookAt target
  up?: Vec3Array;        // vUp direction
  aperture?: number;
  focus?: number;        // focusDistance
  background?: BackgroundData;
}

interface RenderData {
  width?: number;        // imageWidth
  aspect?: number;       // aspectRatio
  samples?: number;
  depth?: number;        // maxDepth
  adaptTol?: number;     // adaptiveTolerance
  adaptBatch?: number;   // adaptiveBatchSize
  roulette?: boolean;    // russianRouletteEnabled
  rouletteDepth?: number; // russianRouletteDepth
  mode?: string;         // renderMode
}

// Background configuration
type BackgroundData = GradientBackground;  // More types can be added later

interface GradientBackground {
  type: 'gradient';
  top: Vec3Array;      // Top color
  bottom: Vec3Array;   // Bottom color
}

// Future background types could include:
// interface SkyBackground { type: 'sky'; turbidity: number; ... }
// interface ImageBackground { type: 'image'; url: string; ... }
// interface SolidBackground { type: 'solid'; color: Vec3Array; }

// Plain data representation of scene objects
type SceneObject = SphereData | PlaneData | QuadData;

interface BaseObjectData {
  id?: string;           // Optional unique identifier
  type: string;
  material: string | MaterialData;  // Material ID reference or inline definition
  light?: boolean;       // Mark this object as a light source
}

interface SphereData extends BaseObjectData {
  type: 'sphere';
  pos: Vec3Array;        // center position
  r: number;             // radius
}

interface PlaneData extends BaseObjectData {
  type: 'plane';
  pos: Vec3Array;         // point on plane
  u: Vec3Array;          // U direction vector
  v: Vec3Array;          // V direction vector
}

interface QuadData extends BaseObjectData {
  type: 'quad';
  pos: Vec3Array;          // corner point
  u: Vec3Array;          // U edge vector
  v: Vec3Array;          // V edge vector
}

// Plain data representation of materials
type MaterialData = LambertianData | MetalData | DielectricData | LightData | MixedData | LayeredData;

interface LambertianData {
  type: 'lambert';
  color: Vec3Array;      // albedo color
}

interface MetalData {
  type: 'metal';
  color: Vec3Array;      // albedo color
  fuzz: number;
}

interface DielectricData {
  type: 'glass';
  ior: number;           // refractionIndex
}

interface LightData {
  type: 'light';
  emit: Vec3Array;       // emission color
}

interface MixedData {
  type: 'mixed';
  diff: string | MaterialData;  // diffuse material
  spec: string | MaterialData;  // specular material
  weight: number;               // diffuseWeight
}

interface LayeredData {
  type: 'layered';
  base: string | MaterialData;     // base material
  coat: string | MaterialData;     // coating material
  thick: number;                   // coatingThickness
}

// Material with ID
interface MaterialObject {
  id: string;           // Material identifier for referencing
  material: MaterialData;  // The actual material definition
}
```

### 2. Split Camera Options

Split the existing CameraOptions into separate concerns:

```typescript
// Camera positioning and visual settings
interface CameraOptions {
  vfov?: number;
  lookFrom?: Point3;
  lookAt?: Point3;
  vUp?: Vec3;
  aperture?: number;
  focusDistance?: number;
  backgroundTop?: Color;
  backgroundBottom?: Color;
  lights?: PDFHittable[];
}

// Render quality and performance settings
interface RenderOptions {
  imageWidth?: number;
  aspectRatio?: number;
  samples?: number;
  maxDepth?: number;
  adaptiveTolerance?: number;
  adaptiveBatchSize?: number;
  russianRouletteEnabled?: boolean;
  russianRouletteDepth?: number;
  renderMode?: RenderMode;
}

// Combined options for backward compatibility
interface FullCameraOptions extends CameraOptions, RenderOptions {}
```

### 3. Scene Object Factory

Create a factory function to convert plain data to Hittable objects:

```typescript
function createSceneObject(
  objectData: SceneObject, 
  materials: Record<string, MaterialData>
): Hittable {
  const material = createMaterial(objectData.material, materials);
  
  switch (objectData.type) {
    case 'sphere':
      return new Sphere(
        Vec3.create(...objectData.pos),
        objectData.r,
        material
      );
    case 'plane':
      return new Plane(
        Vec3.create(...objectData.pos),
        Vec3.create(...objectData.u),
        Vec3.create(...objectData.v),
        material
      );
    case 'quad':
      return new Quad(
        Vec3.create(...objectData.pos),
        Vec3.create(...objectData.u),
        Vec3.create(...objectData.v),
        material
      );
    default:
      throw new Error(`Unknown object type: ${(objectData as any).type}`);
  }
}

function createMaterial(
  materialRef: string | MaterialData, 
  materials: Record<string, MaterialData>
): Material {
  // Resolve material reference
  const materialData = typeof materialRef === 'string' 
    ? materials[materialRef] 
    : materialRef;
    
  if (!materialData) {
    throw new Error(`Material not found: ${materialRef}`);
  }
  
  switch (materialData.type) {
    case 'lambert':
      return new Lambertian(Color.create(...materialData.color));
    case 'metal':
      return new Metal(Color.create(...materialData.color), materialData.fuzz);
    case 'glass':
      return new Dielectric(materialData.ior);
    case 'light':
      return new DiffuseLight(Color.create(...materialData.emit));
    case 'mixed':
      return new MixedMaterial(
        createMaterial(materialData.diff, materials),
        createMaterial(materialData.spec, materials),
        materialData.weight
      );
    case 'layered':
      return new LayeredMaterial(
        createMaterial(materialData.base, materials),
        createMaterial(materialData.coat, materials),
        materialData.thick
      );
    default:
      throw new Error(`Unknown material type: ${(materialData as any).type}`);
  }
}
```

### 4. Refactored Scene Generators

Transform existing scene generators to return `SceneData` instead of `Scene`:

```typescript
// New scene data generators
function generateDefaultSceneData(): SceneData
function generateSpheresSceneData(options?: SpheresSceneOptions): SceneData
function generateRainSceneData(options?: RainSceneOptions): SceneData
function generateCornellSceneData(options?: CornellSceneOptions): SceneData
```

### 5. Scene Construction Function

Create a new function to construct a complete scene from scene data and render options:

```typescript
function createScene(sceneData: SceneData, renderOptions?: RenderOptions): Scene {
  // Convert materials array to lookup map
  const materials: Record<string, MaterialData> = {};
  sceneData.materials?.forEach(({ id, material }) => {
    materials[id] = material;
  });
  
  // Convert scene objects to Hittables
  const objects = sceneData.objects.map(obj => createSceneObject(obj, materials));
  
  // Create world from objects
  const world = BVHNode.fromList(objects);
  
  // Extract light objects for importance sampling
  const lights: PDFHittable[] = [];
  sceneData.objects.forEach((objData, index) => {
    if (objData.light) {
      const obj = objects[index];
      if ('pdf' in obj) {
        lights.push(obj as PDFHittable);
      }
    }
  });
  
  // Convert scene data to camera options
  const cameraOptions: CameraOptions = {
    vfov: sceneData.camera.vfov,
    lookFrom: sceneData.camera.from ? Vec3.create(...sceneData.camera.from) : undefined,
    lookAt: sceneData.camera.at ? Vec3.create(...sceneData.camera.at) : undefined,
    vUp: sceneData.camera.up ? Vec3.create(...sceneData.camera.up) : undefined,
    aperture: sceneData.camera.aperture,
    focusDistance: sceneData.camera.focus,
    backgroundTop: sceneData.camera.background?.type === 'gradient' 
      ? Color.create(...sceneData.camera.background.top)
      : undefined,
    backgroundBottom: sceneData.camera.background?.type === 'gradient'
      ? Color.create(...sceneData.camera.background.bottom)
      : undefined,
    lights
  };
  
  // Convert scene render data to render options
  const sceneRenderOptions: RenderOptions = {
    imageWidth: sceneData.render?.width,
    aspectRatio: sceneData.render?.aspect,
    samples: sceneData.render?.samples,
    maxDepth: sceneData.render?.depth,
    adaptiveTolerance: sceneData.render?.adaptTol,
    adaptiveBatchSize: sceneData.render?.adaptBatch,
    russianRouletteEnabled: sceneData.render?.roulette,
    russianRouletteDepth: sceneData.render?.rouletteDepth,
    renderMode: sceneData.render?.mode as RenderMode
  };
  
  // Merge with provided render options (provided options take precedence)
  const finalRenderOptions: RenderOptions = {
    ...sceneRenderOptions,
    ...renderOptions
  };
  
  // Create camera with separate camera and render options
  const camera = new Camera(world, cameraOptions, finalRenderOptions);
  
  return {
    camera,
    world,
    _objects: objects
  };
}
```

### 6. Updated Scene Configuration

Modify the scene configuration to support the new approach:

```typescript
type SceneConfig = 
  | { type: 'default', render?: RenderOptions }
  | { type: 'spheres', render?: RenderOptions, options?: SpheresSceneOptions }
  | { type: 'rain', render?: RenderOptions, options?: RainSceneOptions }
  | { type: 'cornell', render?: RenderOptions, options?: CornellSceneOptions }
  | { type: 'custom', data: SceneData, render?: RenderOptions };

function generateScene(sceneConfig: SceneConfig): Scene {
  let sceneData: SceneData;
  
  // Generate scene data based on type
  switch (sceneConfig.type) {
    case 'spheres':
      sceneData = generateSpheresSceneData(sceneConfig.options);
      break;
    case 'rain':
      sceneData = generateRainSceneData(sceneConfig.options);
      break;
    case 'cornell':
      sceneData = generateCornellSceneData(sceneConfig.options);
      break;
    case 'custom':
      sceneData = sceneConfig.data;
      break;
    default:
      sceneData = generateDefaultSceneData();
  }
  
  // Create scene from data and render options
  return createScene(sceneData, sceneConfig.render);
}
```

## Implementation Plan

### Phase 1: Define Data Structures
1. **Create type definitions:**
   - `Vec3Array`, `SceneData`, `CameraData`, `RenderData` interfaces
   - Split `CameraOptions` into `CameraOptions` and `RenderOptions`
   - Object factory functions (`createSceneObject`, `createMaterial`)

### Phase 2: Refactor Scene Generators
1. **Update existing generators:**
   - Convert to return `SceneData` instead of `Scene`
   - Use plain data structures with short property names
   - Extract camera and render configurations to scene data

### Phase 3: Update Scene Construction
1. **Implement `createScene` function:**
   - Convert scene data to Hittable objects
   - Handle material resolution and reuse
   - Identify light objects automatically
   - Merge camera and render options

2. **Update `generateScene` function:**
   - Use new scene data generators
   - Support custom scene data input

### Phase 4: Update All Consumers
1. **Update raytracer.ts, benchmark.ts, tests:**
   - Remove old scene generator imports
   - Use new `generateScene` function
   - Update Camera constructor calls to use split options

### Phase 5: Enable External Scene Definition
1. **JSON scene loader:**
   ```typescript
   function loadSceneFromJSON(jsonPath: string): SceneData
   function saveSceneToJSON(sceneData: SceneData, jsonPath: string): void
   ```

2. **Scene validation:**
   ```typescript
   function validateSceneData(sceneData: unknown): SceneData
   ```

## Benefits

### 1. External Definition Support
- JSON scene files can be loaded and saved
- MCP server can accept/return scene data
- Scene data is fully serializable

### 2. Material Reuse
- Define materials once and reference by name
- Inline material definitions for one-off materials
- Cleaner scene data with less duplication

### 3. Automatic Light Detection
- Objects marked with `light: true` are automatically added to importance sampling
- No need to manage separate light arrays
- Simpler scene definition

### 4. Clear Type Signatures
- `Vec3Array` type makes 3D data obvious
- Short property names reduce verbosity
- Split camera/render options clarify responsibilities

## Example Usage

### Scene Generation
```typescript
const sceneData = generateSpheresSceneData({ count: 50, seed: 12345 });
const scene = createScene(sceneData, { width: 800, samples: 500 });
```

### Custom Scene with Material Reuse
```typescript
const customSceneData: SceneData = {
  camera: {
    vfov: 45,
    from: [0, 2, 5],
    at: [0, 0, 0],
    background: {
      type: 'gradient',
      top: [1, 1, 1],
      bottom: [0.5, 0.7, 1.0]
    }
  },
  materials: [
    {
      id: 'red',
      material: { type: 'lambert', color: [0.7, 0.3, 0.3] }
    },
    {
      id: 'metal',
      material: { type: 'metal', color: [0.8, 0.8, 0.9], fuzz: 0.1 }
    },
    {
      id: 'ground',
      material: { type: 'lambert', color: [0.5, 0.5, 0.5] }
    }
  ],
  objects: [
    {
      type: 'sphere',
      pos: [0, 0, 0],
      r: 1,
      material: 'red'  // Reference to material ID
    },
    {
      type: 'sphere',
      pos: [2, 0, 0],
      r: 0.5,
      material: 'metal'  // Reference to material ID
    },
    {
      type: 'plane',
      pos: [0, -1, 0],
      u: [1, 0, 0],
      v: [0, 0, 1],
      material: 'ground'  // Reference to material ID
    },
    {
      type: 'sphere',
      pos: [0, 5, 0],
      r: 1,
      material: { type: 'light', emit: [10, 10, 10] },  // Inline material
      light: true  // Mark as light source
    }
  ]
};

const scene = createScene(customSceneData, { width: 1200, samples: 1000 });
```

### JSON Scene Loading
```typescript
const sceneData = loadSceneFromJSON('scenes/my-scene.json');
const scene = createScene(sceneData, { width: 800, samples: 500 });
```

### Scene Data Manipulation
```typescript
// Load base scene
const sceneData = generateCornellSceneData({ variant: 'empty' });

// Add custom materials
sceneData.materials = {
  ...sceneData.materials,
  chrome: { type: 'metal', color: [0.9, 0.9, 0.9], fuzz: 0.0 }
};

// Add custom objects
sceneData.objects.push({
  type: 'sphere',
  pos: [0, 0, 0],
  r: 0.5,
  material: 'chrome'
});

// Render with custom settings
const scene = createScene(sceneData, { samples: 1000, depth: 50 });
```

### Cornell Box Example
```typescript
const cornellSceneData: SceneData = {
  camera: {
    vfov: 40,
    from: [0, 0, 8],
    at: [0, 0, 0],
    background: {
      type: 'gradient',
      top: [0, 0, 0],
      bottom: [0, 0, 0]
    }
  },
  materials: [
    {
      id: 'red-wall',
      material: { type: 'lambert', color: [0.65, 0.05, 0.05] }
    },
    {
      id: 'white-wall',
      material: { type: 'lambert', color: [0.73, 0.73, 0.73] }
    },
    {
      id: 'green-wall',
      material: { type: 'lambert', color: [0.12, 0.45, 0.15] }
    },
    {
      id: 'light',
      material: { type: 'light', emit: [15, 15, 15] }
    }
  ],
  objects: [
    {
      type: 'quad',
      pos: [555, 0, 0],
      u: [0, 555, 0],
      v: [0, 0, 555],
      material: 'red-wall'
    },
    {
      type: 'quad',
      pos: [0, 0, 0],
      u: [0, 555, 0],
      v: [0, 0, 555],
      material: 'green-wall'
    },
    {
      type: 'quad',
      pos: [343, 554, 332],
      u: [-130, 0, 0],
      v: [0, 0, -105],
      material: 'light',
      light: true
    }
    // ... more objects ...
  ]
}; 